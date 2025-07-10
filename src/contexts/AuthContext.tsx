
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth as useAuthHook } from '@/hooks/useAuth';

interface AuthContextType {
  user: any;
  isAuthenticated: boolean;
  login: (email: string, password: string) => void;
  logout: () => void;
  isLoading: boolean;
  isLoggingIn: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useAuthHook();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Check for existing token and user data on mount
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        console.log('Existing session found:', { user, token: !!token });
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
      }
    }
    
    setIsInitialized(true);
  }, []);

  // Create a wrapper function that matches the expected interface
  const loginWrapper = (email: string, password: string) => {
    console.log('Login attempt for:', email);
    auth.login({ email, password });
  };

  const logoutWrapper = () => {
    console.log('Logout initiated');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    auth.logout();
  };

  const contextValue: AuthContextType = {
    user: auth.user,
    isAuthenticated: auth.isAuthenticated,
    login: loginWrapper,
    logout: logoutWrapper,
    isLoading: auth.isLoading || !isInitialized,
    isLoggingIn: auth.isLoggingIn,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
