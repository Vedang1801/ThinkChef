import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

interface User {
  user_id: string;
  username: string;
  email: string;
  profile_details: string;
  // Add other user details here
}

interface AuthContextType {
  loggedIn: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [loggedIn, setLoggedIn] = useState(!!Cookies.get("token"));
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  // Setup axios interceptor for authentication
  useEffect(() => {
    // Add a request interceptor to include token in all requests
    const interceptor = axios.interceptors.request.use(
      (config) => {
        const token = Cookies.get("token");
        if (token) {
          config.headers["Authorization"] = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add a response interceptor to handle token expiration
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // If we get a 401 unauthorized, clear the auth state
          // This could be due to token expiration
          if (Cookies.get("token")) {
            toast.error("Your session has expired. Please log in again.");
            logout();
            navigate("/login");
          }
        }
        return Promise.reject(error);
      }
    );

    // Clean up the interceptors when the component unmounts
    return () => {
      axios.interceptors.request.eject(interceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [navigate]);

  useEffect(() => {
    const token = Cookies.get("token");
    if (token) {
      setLoggedIn(true);
      // Try to load user data from cookies if available
      try {
        const userId = Cookies.get("user_id");
        const username = Cookies.get("username");
        const email = Cookies.get("email");

        if (userId && username && email) {
          setUser({
            user_id: userId,
            username,
            email,
            profile_details: "", // Default empty string if not available
          });
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      }
    }
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      const response = await axios.post("/api/login", { email, password });
      const { token, user } = response.data;
      Cookies.set("token", token, { expires: 7 });
      Cookies.set("user_id", user.user_id, { expires: 7 });
      Cookies.set("username", user.username, { expires: 7 });
      Cookies.set("email", user.email, { expires: 7 });
      setLoggedIn(true);
      setUser(user);
      toast.success(`Welcome, ${user.username}!`);
      navigate("/");
    } catch (error) {
      console.error("Error logging in: ", error);
      // Properly type check for axios error
      if (axios.isAxiosError(error)) {
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          toast.error(error.response.data || "Invalid email or password");
        } else if (error.request) {
          // The request was made but no response was received
          toast.error("No response from server. Please try again.");
        } else {
          // Something happened in setting up the request that triggered an Error
          toast.error("Error logging in. Please try again.");
        }
      } else {
        toast.error("An unexpected error occurred");
      }
      throw error; // Re-throw the error to be handled by the component
    }
  };

  const logout = (): void => {
    Cookies.remove("token");
    Cookies.remove("user_id");
    Cookies.remove("username");
    Cookies.remove("email");
    setLoggedIn(false);
    setUser(null);
    toast.success("User Log Out");
    navigate("/login");
  };

  const value: AuthContextType = {
    loggedIn,
    user,
    login,
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
