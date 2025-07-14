import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  avatar?: string;
  location?: string;
  joinedDate: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored user data
    const storedUser = localStorage.getItem('ecotrade_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; message: string }> => {
    setIsLoading(true);
    try {
      const data = await authAPI.login(email, password);
      const user = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
        avatar: data.user.avatar,
        location: data.user.location,
        joinedDate: data.user.joinedDate
      };
      setUser(user);
      localStorage.setItem('ecotrade_user', JSON.stringify(user));
      setIsLoading(false);
      return { success: true, message: 'Login successful! Welcome back!' };
    } catch (error: any) {
      setIsLoading(false);
      const errorMessage = error.message || 'Invalid credentials. Please try again.';
      return { success: false, message: errorMessage };
    }
  };

  const signup = async (name: string, email: string, password: string): Promise<{ success: boolean; message: string }> => {
    setIsLoading(true);
    try {
      const data = await authAPI.register(name, email, password);
      const user = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
        avatar: data.user.avatar,
        location: data.user.location,
        joinedDate: data.user.joinedDate
      };
      setUser(user);
      localStorage.setItem('ecotrade_user', JSON.stringify(user));
      setIsLoading(false);
      return { success: true, message: 'Account created successfully! Welcome to EcoTrade!' };
    } catch (error: any) {
      setIsLoading(false);
      const errorMessage = error.message || 'Registration failed. Please try again.';
      return { success: false, message: errorMessage };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('ecotrade_user');
  };

  const refreshUser = async () => {
    setIsLoading(true);
    try {
      const data = await authAPI.getCurrentUser();
      const user = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
        avatar: data.user.avatar,
        location: data.user.location,
        joinedDate: data.user.joinedDate
      };
      setUser(user);
      localStorage.setItem('ecotrade_user', JSON.stringify(user));
    } catch (error) {
      // Optionally handle error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isLoading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};