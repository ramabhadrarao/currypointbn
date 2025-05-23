import React, { useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Notification from './components/common/Notification';
import { initializeLocalStorage } from './utils/localStorage';
import StorageStatus from './components/common/StorageStatus';


// Main App Content Component
const AppContent: React.FC = () => {
  const { currentUser } = useAuth();

  return currentUser ? <Dashboard /> : <Login />;
};

// App Component
const App: React.FC = () => {
  // Initialize localStorage on app start
  useEffect(() => {
    initializeLocalStorage();
  }, []);

  return (
    <AuthProvider>
      <NotificationProvider>
        <AppContent />
        <Notification />
        <StorageStatus />
      </NotificationProvider>
    </AuthProvider>
  );
};

export default App;