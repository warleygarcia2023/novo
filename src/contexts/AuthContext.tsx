import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Parse from 'parse';
import parseConfig from '../config/parseConfig';

interface AuthContextType {
  currentUser: Parse.User | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

let inactivityTimeout: NodeJS.Timeout;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<Parse.User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const resetInactivityTimer = () => {
    if (inactivityTimeout) {
      clearTimeout(inactivityTimeout);
    }
    inactivityTimeout = setTimeout(() => {
      if (currentUser) {
        logout();
      }
    }, 30 * 60 * 1000); // 30 minutes
  };

  useEffect(() => {
    const initializeUser = async () => {
      try {
        parseConfig.initializeParse();
        const user = await Parse.User.current();
        setCurrentUser(user);
      } catch (error) {
        console.error('Error initializing user:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeUser();

    // Set up event listeners for user activity
    window.addEventListener('mousemove', resetInactivityTimer);
    window.addEventListener('keypress', resetInactivityTimer);

    return () => {
      window.removeEventListener('mousemove', resetInactivityTimer);
      window.removeEventListener('keypress', resetInactivityTimer);
      if (inactivityTimeout) {
        clearTimeout(inactivityTimeout);
      }
    };
  }, []);

  useEffect(() => {
    if (currentUser && location.pathname === '/login') {
      navigate('/');
    }
  }, [currentUser, location, navigate]);

  const login = async (username: string, password: string) => {
    const user = await Parse.User.logIn(username, password);
    setCurrentUser(user);
    resetInactivityTimer();
    navigate('/');
  };

  const register = async (username: string, password: string) => {
    const user = new Parse.User();
    user.set('username', username);
    user.set('password', password);
    await user.signUp();
    setCurrentUser(user);
    resetInactivityTimer();
    navigate('/');
  };

  const logout = async () => {
    await Parse.User.logOut();
    setCurrentUser(null);
    if (inactivityTimeout) {
      clearTimeout(inactivityTimeout);
    }
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}