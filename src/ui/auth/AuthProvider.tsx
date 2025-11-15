/**
 * Auth Provider Component
 * Manages authentication state and provides auth context
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  userId: string;
  twitterUsername: string;
  displayName: string;
  profileImageUrl?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  authenticated: boolean;
  login: () => void;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include', // Include cookies for session
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } else if (response.status === 401) {
        // 401 is expected when user is not authenticated (e.g., during onboarding)
        // This is not an error, just means user needs to log in
        setUser(null);
      } else {
        // Other errors (500, etc.) - log but don't treat as critical
        console.warn('Auth check returned status:', response.status);
        setUser(null);
      }
    } catch (error) {
      // Network errors or other issues - don't log as error during onboarding
      // Only log if it's not a simple "not authenticated" case
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        // Network error - might be CORS or connection issue
        console.warn('Auth check failed (network):', error.message);
      } else {
        console.error('Error checking auth:', error);
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = () => {
    // Redirect to Twitter OAuth
    window.location.href = '/api/auth/twitter';
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      window.location.href = '/';
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const refreshAuth = async () => {
    await checkAuth();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        authenticated: !!user,
        login,
        logout,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

