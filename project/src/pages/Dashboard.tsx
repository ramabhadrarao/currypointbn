// src/pages/Dashboard.tsx - Updated to include MongoDB Status
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import AdminDashboard from '../components/admin/Dashboard';
import CustomerDashboard from '../components/customer/Dashboard';
import CustomerManagement from '../components/admin/CustomerManagement';
import CouponManagement from '../components/admin/CouponManagement';
import MongoSyncStatus from '../components/admin/MongoSyncStatus';  // Add this import
import PaymentSection from '../components/customer/PaymentSection';
import CouponSection from '../components/customer/CouponSection';
import { initializeLocalStorage } from '../utils/localStorage';

const Dashboard: React.FC = () => {
  const { userRole } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Initialize localStorage if needed
  useEffect(() => {
    initializeLocalStorage();
  }, []);

  // Close sidebar when changing tabs on mobile
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  }, [activeTab]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Render tab content based on active tab and user role
  const renderTabContent = () => {
    if (userRole === 'admin') {
      switch (activeTab) {
        case 'dashboard':
          return <AdminDashboard />;
        case 'customers':
          return <CustomerManagement />;
        case 'coupons':
          return <CouponManagement />;
        case 'mongo-status':  // Add this case
          return <MongoSyncStatus />;
        default:
          return <AdminDashboard />;
      }
    } else {
      switch (activeTab) {
        case 'dashboard':
          return <CustomerDashboard />;
        case 'payment':
          return <PaymentSection />;
        case 'coupons':
          return <CouponSection />;
        default:
          return <CustomerDashboard />;
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header toggleSidebar={toggleSidebar} />
      
      <div className="flex">
        {/* Sidebar */}
        <Sidebar
          isOpen={isSidebarOpen}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        
        {/* Main Content */}
        <div className="flex-1 lg:ml-64 transition-all duration-300">
          {renderTabContent()}
        </div>
      </div>
      
      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-10 lg:hidden"
          onClick={toggleSidebar}
        ></div>
      )}
    </div>
  );
};

export default Dashboard;