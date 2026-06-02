import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';
import { mockUsers } from '../../data/mockData';

interface AuthContextType {
  user: User | null;
  login: (email: string, password?: string) => Promise<void>;
  register: (userData: Partial<User>) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is stored in localStorage
    const storedUser = localStorage.getItem('mejengas_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string) => {
    setIsLoading(true);
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        // Find user in localStorage db first, then mockUsers
        const localUsersStr = localStorage.getItem('mejengas_db_users');
        const localUsers: User[] = localUsersStr ? JSON.parse(localUsersStr) : [];
        
        const foundUser = localUsers.find(u => u.email === email) || mockUsers.find(u => u.email === email);

        if (foundUser) {
          setUser(foundUser);
          localStorage.setItem('mejengas_user', JSON.stringify(foundUser));
          resolve();
        } else {
          reject(new Error('Usuario no encontrado'));
        }
        setIsLoading(false);
      }, 1000);
    });
  };

  const register = async (userData: Partial<User>) => {
    setIsLoading(true);
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const newUser: User = {
          id: `u_${Date.now()}`,
          name: userData.name || '',
          email: userData.email || '',
          age: userData.age,
          position: userData.position || 'No especificada',
          secondaryPosition: userData.secondaryPosition,
          location: userData.location,
          modality: userData.modality,
          matchesPlayed: 0,
          rating: 0,
          rank: { tier: 'Bronce', division: 4, points: 0 },
          isFreeAgent: true,
        };

        // Save to fake DB in localStorage
        const localUsersStr = localStorage.getItem('mejengas_db_users');
        const localUsers: User[] = localUsersStr ? JSON.parse(localUsersStr) : [];
        localUsers.push(newUser);
        localStorage.setItem('mejengas_db_users', JSON.stringify(localUsers));

        // Auto login
        setUser(newUser);
        localStorage.setItem('mejengas_user', JSON.stringify(newUser));
        setIsLoading(false);
        resolve();
      }, 1000);
    });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('mejengas_user');
  };

  const updateProfile = async (updates: Partial<User>) => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        if (!user) return resolve();
        
        const updatedUser = { ...user, ...updates };
        setUser(updatedUser);
        localStorage.setItem('mejengas_user', JSON.stringify(updatedUser));
        
        const localUsersStr = localStorage.getItem('mejengas_db_users');
        if (localUsersStr) {
          const localUsers: User[] = JSON.parse(localUsersStr);
          const index = localUsers.findIndex(u => u.id === user.id);
          if (index !== -1) {
            localUsers[index] = updatedUser;
            localStorage.setItem('mejengas_db_users', JSON.stringify(localUsers));
          }
        }
        resolve();
      }, 500);
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateProfile, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
