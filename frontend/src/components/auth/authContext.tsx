
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { auth } from "../../firebase";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
} from "firebase/auth";
import axios from "axios";
import Cookies from "js-cookie";

// API base URL from environment
const API_URL = import.meta.env.VITE_API_URL;

// User interface for context
interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
}

// Auth context type definition
interface AuthContextType {
  loggedIn: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => void;
}

// Create the AuthContext
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider component to wrap the app
export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  // Sync user with backend database after Firebase authentication
  const syncUserWithDatabase = async (firebaseUser: any) => {
    try {
      // Create or update user in PostgreSQL DB
      const response = await axios.post(`${API_URL}/api/users/sync`, {
        user_id: firebaseUser.uid,
        username: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || "Chef",
        email: firebaseUser.email,
        provider: firebaseUser.providerData[0]?.providerId || 'firebase'
      });
      console.log("User synced with database:", response.data);
      return response.data.user;
    } catch (error: any) {
      console.error("Error syncing user with database:", error);
      // Handle email conflict (409 Conflict)
      if (error.response && error.response.status === 409) {
        console.log("Email is already associated with another account");
        toast.warning("This email is already registered with a different login method");
      }
      // Allow user to proceed for other errors
      return null;
    }
  };

  useEffect(() => {
    // Listen for Firebase Auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setLoggedIn(true);
        // Set user state with Firebase user info
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
        });

        // Get Firebase ID token and set cookies for API authentication
        try {
          const token = await firebaseUser.getIdToken();
          const username = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || "Chef";

          Cookies.set("token", token, { expires: 1 }); // Expires in 1 day
          Cookies.set("user_id", firebaseUser.uid, { expires: 1 });
          Cookies.set("username", username, { expires: 1 });

          // Optionally sync user with backend
          await syncUserWithDatabase(firebaseUser);
        } catch (error) {
          console.error("Error getting Firebase token:", error);
        }
      } else {
        setLoggedIn(false);
        setUser(null);
        // Clear cookies on logout
        Cookies.remove("token");
        Cookies.remove("user_id");
        Cookies.remove("username");
      }
    });
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Login with email and password
  const login = async (email: string, password: string): Promise<void> => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  // Register a new user
  const register = async (username: string, email: string, password: string): Promise<void> => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    if (userCredential.user) {
      await updateProfile(userCredential.user, { displayName: username });
      // Optionally sync user with backend
      await syncUserWithDatabase(userCredential.user);
    }
  };

  // Login with Google provider
  const loginWithGoogle = async (): Promise<void> => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    if (result.user) {
      await syncUserWithDatabase(result.user);
    }
  };

  // Reset password via email
  const resetPassword = async (email: string): Promise<void> => {
    await sendPasswordResetEmail(auth, email);
  };

  // Logout the user
  const logout = (): void => {
    signOut(auth);
    setLoggedIn(false);
    setUser(null);
    // Clear cookies
    Cookies.remove("token");
    Cookies.remove("user_id");
    Cookies.remove("username");
    navigate("/login");
  };

  // Provide context value to children
  return (
    <AuthContext.Provider
      value={{ loggedIn, user, login, register, loginWithGoogle, resetPassword, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use AuthContext
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
