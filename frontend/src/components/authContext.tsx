import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';


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

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [loggedIn, setLoggedIn] = useState(!!Cookies.get('token'));
    const [user, setUser] = useState<User | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
      const token = Cookies.get('token');
      if (token) {
          setLoggedIn(true); // Set loggedIn to true since token exists
          // You may also want to fetch user data using this token and setUser
          setUser(user);
      }
  }, []);

    const login = async (email: string, password: string): Promise<void> => {
        try {
            const response = await axios.post('/api/login', { email, password });
            const { token, user } = response.data;
            Cookies.set('token', token, { expires: 7 });
            Cookies.set('user_id', user.user_id, { expires: 7 });
            Cookies.set('username', user.username, { expires: 7 });
            Cookies.set('email', user.email, { expires: 7 });
            setLoggedIn(true);
            setUser(user);
            toast.success('Welcome!! ');
            navigate('/');
        } catch (error) {
            console.error('Error logging in: ', error);
            toast.error(error?.response.data);
            // Handle error
        }
    };

    const logout = (): void => {
        Cookies.remove('token');
        Cookies.remove('user_id');
        Cookies.remove('username');
        Cookies.remove('email');
        setLoggedIn(false);
        setUser(null);
        toast.success('User Log Out');
        navigate('/login');
    };

    const value: AuthContextType = {
        loggedIn,
        user,
        login,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
