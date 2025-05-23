import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Home, 
  Users, 
  ShoppingBag, 
  CreditCard, 
  Settings, 
  Tag, 
  FileText,
  User,
  History
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  role: 'admin' | 'customer' | 'both';
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, activeTab, onTabChange }) => {
  const { userRole } = useAuth();

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <Home size={20} />,
      role: 'both'
    },
    {
      id: 'customers',
      label: 'Customers',
      icon: <Users size={20} />,
      role: 'admin'
    },
    {
      id: 'payment',
      label: 'Payment',
      icon: <CreditCard size={20} />,
      role: 'customer'
    },
    {
      id: 'coupons',
      label: 'Coupons',
      icon: <Tag size={20} />,
      role: 'both'
    },
    {
      id: 'transactions',
      label: 'Transactions',
      icon: <History size={20} />,
      role: 'both'
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: <User size={20} />,
      role: 'customer'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings size={20} />,
      role: 'admin'
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: <FileText size={20} />,
      role: 'admin'
    }
  ];

  // Filter nav items based on user role
  const filteredNavItems = navItems.filter(
    item => item.role === 'both' || item.role === userRole
  );

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-20 bg-amber-800 text-white w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
    >
      <div className="h-16 flex items-center justify-center border-b border-amber-700">
        <h2 className="text-xl font-bold">Curry Point</h2>
      </div>
      
      <nav className="mt-4">
        <ul>
          {filteredNavItems.map((item) => (
            <li key={item.id}>
              <button
                className={`
                  flex items-center w-full px-4 py-3 text-left
                  ${activeTab === item.id ? 'bg-amber-700' : 'hover:bg-amber-700'}
                `}
                onClick={() => onTabChange(item.id)}
              >
                <span className="mr-3">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="absolute bottom-0 w-full p-4 border-t border-amber-700">
        <p className="text-sm text-amber-300">
          {userRole === 'admin' ? 'Admin Panel' : 'Customer Portal'} v1.0
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;