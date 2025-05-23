import React, { createContext, useContext, useState, useEffect } from 'react';
import { Customer, AuthContextType, UserRole } from '../types';
// import { getLocalStorageData, updateLocalStorageData } from '../utils/localStorage';
import { getLocalStorageData, updateLocalStorageData } from '../services/compatibleStorageService';
import { getCurrentDate } from '../utils/dateUtils';

// Create Auth Context
const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  userRole: null,
  login: () => false,
  logout: () => {},
  register: () => false
});

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Auth Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<Customer | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);

  // Check for saved auth on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('curryPointUser');
    if (savedUser) {
      const user = JSON.parse(savedUser) as Customer;
      setCurrentUser(user);
      setUserRole(user.phone === '+91 9999999999' ? 'admin' : 'customer');
    }
  }, []);

  // Login function
  const login = (phone: string, password: string): boolean => {
    const customers = getLocalStorageData<Customer[]>('customers');
    const user = customers.find(
      (c) => c.phone === phone && c.password === password && c.isActive
    );

    if (user) {
      // Update last visit
      const updatedUser = { ...user, lastVisit: getCurrentDate() };
      const updatedCustomers = customers.map((c) => 
        c.id === user.id ? updatedUser : c
      );
      updateLocalStorageData('customers', updatedCustomers);
      
      // Set current user
      setCurrentUser(updatedUser);
      setUserRole(phone === '+91 9999999999' ? 'admin' : 'customer');
      
      // Save to localStorage
      localStorage.setItem('curryPointUser', JSON.stringify(updatedUser));
      
      return true;
    }
    
    return false;
  };

  // Logout function
  const logout = () => {
    setCurrentUser(null);
    setUserRole(null);
    localStorage.removeItem('curryPointUser');
  };

  // Register function
  const register = (newCustomer: Partial<Customer>): boolean => {
    const customers = getLocalStorageData<Customer[]>('customers');
    const settings = getLocalStorageData('settings');
    
    // Check if phone number already exists
    const existingUser = customers.find((c) => c.phone === newCustomer.phone);
    if (existingUser) {
      return false;
    }
    
    // Create new customer
    const customer: Customer = {
      id: Math.max(0, ...customers.map((c) => c.id)) + 1,
      name: newCustomer.name || '',
      phone: newCustomer.phone || '',
      email: newCustomer.email || '',
      points: settings.welcomeBonusPoints, // Welcome bonus
      totalSpent: 0,
      isActive: true,
      createdAt: getCurrentDate(),
      lastVisit: getCurrentDate(),
      password: newCustomer.password || '',
      isVip: false
    };
    
    // Add to customers list
    const updatedCustomers = [...customers, customer];
    updateLocalStorageData('customers', updatedCustomers);
    
    // Auto login
    setCurrentUser(customer);
    setUserRole('customer');
    localStorage.setItem('curryPointUser', JSON.stringify(customer));
    
    return true;
  };

  const value = {
    currentUser,
    userRole,
    login,
    logout,
    register
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};