import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Menu, User, LogOut, ChevronDown } from 'lucide-react';
import Button from '../common/Button';

interface HeaderProps {
  toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const { currentUser, userRole, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="bg-amber-600 text-white sticky top-0 z-10 shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Menu Button */}
          <div className="flex items-center">
            <button
              className="p-1 mr-4 rounded-md hover:bg-amber-700 lg:hidden"
              onClick={toggleSidebar}
            >
              <Menu size={24} />
            </button>
            
            <div className="flex items-center">
              <span className="text-xl font-bold">Curry Point</span>
              {userRole && (
                <span className="ml-2 text-xs bg-amber-700 px-2 py-0.5 rounded-full uppercase">
                  {userRole}
                </span>
              )}
            </div>
          </div>

          {/* User Menu */}
          {currentUser ? (
            <div className="relative">
              <button
                className="flex items-center space-x-2 p-2 rounded-md hover:bg-amber-700"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <div className="w-8 h-8 rounded-full bg-amber-800 flex items-center justify-center">
                  <User size={18} />
                </div>
                <span className="hidden md:block">{currentUser.name}</span>
                <ChevronDown size={16} />
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20">
                  <div className="px-4 py-2 text-gray-800 border-b border-gray-200">
                    <p className="font-medium">{currentUser.name}</p>
                    <p className="text-sm text-gray-500 truncate">{currentUser.phone}</p>
                  </div>
                  
                  <button
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => {
                      logout();
                      setDropdownOpen(false);
                    }}
                  >
                    <LogOut size={16} className="mr-2" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-x-2">
              <Button size="sm" variant="secondary">Login</Button>
              <Button size="sm" variant="primary">Register</Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;