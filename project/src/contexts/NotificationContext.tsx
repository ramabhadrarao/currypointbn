import React, { createContext, useContext, useState, useEffect } from 'react';
import { Notification, NotificationContextType } from '../types';

// Create Notification Context
const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  addNotification: () => {},
  removeNotification: () => {}
});

// Custom hook to use the notification context
export const useNotification = () => useContext(NotificationContext);

// Notification Provider component
export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Add notification
  const addNotification = (message: string, type: Notification['type'] = 'info') => {
    const newNotification: Notification = {
      id: Date.now(),
      message,
      type
    };
    
    setNotifications((prev) => [...prev, newNotification]);
  };

  // Remove notification
  const removeNotification = (id: number) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  };

  // Auto-remove notifications after 5 seconds
  useEffect(() => {
    if (notifications.length > 0) {
      const timer = setTimeout(() => {
        setNotifications((prev) => prev.slice(1));
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [notifications]);

  const value = {
    notifications,
    addNotification,
    removeNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};