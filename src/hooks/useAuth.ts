
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services/apiClient';
import { toast } from '@/components/ui/use-toast';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'Admin' | 'Moderator';
}

interface LoginCredentials {
  email: string;
  password: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  
  // Safely get navigate function
  let navigate;
  try {
    navigate = useNavigate();
  } catch (error) {
    // If useNavigate fails (not in Router context), we'll handle navigation differently
    navigate = null;
  }

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem('token');
        const storedUserData = localStorage.getItem('user');
        
        console.log('Stored token:', storedToken);
        console.log('Stored user data:', storedUserData);

        if (storedToken && storedUserData && storedUserData !== 'undefined') {
          try {
            const parsedUser = JSON.parse(storedUserData);
            setToken(storedToken);
            setUser(parsedUser);
            
            // Verify token is still valid by fetching current user
            try {
              const response = await api.getCurrentUser();
              if (response) {
                setUser(response);
                localStorage.setItem('user', JSON.stringify(response));
              }
            } catch (error) {
              console.log('Token validation failed, clearing auth state');
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              setToken(null);
              setUser(null);
            }
          } catch (parseError) {
            console.error('Error parsing stored user data:', parseError);
            localStorage.removeItem('user');
            localStorage.removeItem('token');
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      setIsLoggingIn(true);
      const response = await api.login(credentials);
      
      if (response.token) {
        const authToken = response.token;
        setToken(authToken);
        localStorage.setItem('token', authToken);
        
        // Fetch user details after successful login
        try {
          const userResponse = await api.getCurrentUser();
          if (userResponse) {
            setUser(userResponse);
            localStorage.setItem('user', JSON.stringify(userResponse));
            
            toast({
              title: "Success",
              description: "Login successful!",
            });
            
            // Navigate based on user role - only if navigate is available
            if (navigate) {
              if (userResponse.role === 'Admin') {
                navigate('/dashboard');
              } else {
                navigate('/orders');
              }
            } else {
              // Fallback: redirect using window.location if navigate is not available
              if (userResponse.role === 'Admin') {
                window.location.href = '/dashboard';
              } else {
                window.location.href = '/orders';
              }
            }
          }
        } catch (userError) {
          console.error('Error fetching user details:', userError);
          toast({
            title: "Error",
            description: "Login successful but failed to fetch user details",
            variant: "destructive",
          });
        }
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Login failed",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoggingIn(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Navigate to home - only if navigate is available
    if (navigate) {
      navigate('/');
    } else {
      // Fallback: redirect using window.location
      window.location.href = '/';
    }
    
    toast({
      title: "Success",
      description: "Logged out successfully",
    });
  };

  const isAuthenticated = !!user && !!token;

  return {
    user,
    token,
    isLoading,
    isLoggingIn,
    isAuthenticated,
    login,
    logout,
  };
};
