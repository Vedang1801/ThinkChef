import Cookies from "js-cookie";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { auth } from "../firebase"; 
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

interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
}

interface AuthContextType {
  loggedIn: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>; // New function
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  // Add a function to create or update user in your database after Firebase auth
  const syncUserWithDatabase = async (firebaseUser: any) => {
    try {
      // Check if user exists in your PostgreSQL DB or create them
      const response = await axios.post('/api/users/sync', {
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
        
        // We can still continue, as Firebase auth succeeded
        // The user can still use the app, even though their database entry
        // might have a different user_id than their Firebase uid
        toast.warning("This email is already registered with a different login method");
      }
      
      // For other errors, still allow the user to proceed
      // Firebase auth succeeded, so they're authenticated
      return null;
    }
  };

  useEffect(() => {
    // Listen for Firebase Auth state changes
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setLoggedIn(true);
        // Use Firebase displayName or email as username if displayName is null
        const displayName = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || "Chef";
        
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: displayName,
        });
        
        // Store user info in cookies for components that expect it
        const uid = firebaseUser.uid || "";
        Cookies.set("user_id", uid, { expires: 7 });
        Cookies.set("username", displayName, { expires: 7 });
        Cookies.set("email", firebaseUser.email || "", { expires: 7 });
        Cookies.set("created_at", new Date().toISOString(), { expires: 7 });
        
        // Sync with your database
        syncUserWithDatabase(firebaseUser);
      } else {
        setLoggedIn(false);
        setUser(null);
        // Clear cookies on logout
        Cookies.remove("user_id");
        Cookies.remove("username");
        Cookies.remove("email");
        Cookies.remove("created_at");
      }
    });
    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Welcome!");
      navigate("/");
    } catch (error: any) {
      // Don't display raw Firebase errors in toast messages
      console.error("Login error:", error);
      
      // Don't define errorMessage if we're not using it
      // Let the Login component handle the error UI
      throw error;
    }
  };

  const register = async (username: string, email: string, password: string): Promise<void> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Set displayName
      if (userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: username
        });
      }
      
      toast.success("Account created successfully!");
      navigate("/");
    } catch (error: any) {
      console.error("Registration error:", error);
      
      let errorMessage = "Failed to create account";
      
      // Handle common Firebase auth errors
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "This email is already in use";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "Password should be at least 6 characters";
      }
      
      toast.error(errorMessage);
      throw error;
    }
  };

  const loginWithGoogle = async (): Promise<void> => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      toast.success("Signed in with Google!");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Google sign-in failed");
      throw error;
    }
  };

  // Add password reset functionality
  const resetPassword = async (email: string): Promise<void> => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success("Password reset email sent. Check your inbox.");
    } catch (error: any) {
      console.error("Password reset error:", error);
      
      let errorMessage = "Failed to send password reset email";
      
      switch(error.code) {
        case 'auth/user-not-found':
          errorMessage = "No account found with this email address";
          break;
        case 'auth/invalid-email':
          errorMessage = "The email address is not valid";
          break;
        case 'auth/missing-email':
          errorMessage = "Please enter an email address";
          break;
        default:
          errorMessage = "Failed to send password reset email";
      }
      
      toast.error(errorMessage);
      throw error;
    }
  };

  const logout = (): void => {
    signOut(auth);
    setLoggedIn(false);
    setUser(null);
    toast.success("User Log Out");
    navigate("/login");
  };

  const value: AuthContextType = {
    loggedIn,
    user,
    login,
    register,
    loginWithGoogle,
    resetPassword, // Add to context
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
