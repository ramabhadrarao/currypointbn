import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import Button from '../common/Button';
import Input from '../common/Input';
import { User, Lock } from 'lucide-react';

interface LoginFormProps {
  onToggleForm: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onToggleForm }) => {
  const { login } = useAuth();
  const { addNotification } = useNotification();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validate form
    if (!phone || !password) {
      addNotification('Please enter both phone number and password', 'error');
      setIsLoading(false);
      return;
    }

    // Attempt login
    const success = login(phone, password);
    
    if (success) {
      addNotification('Login successful!', 'success');
    } else {
      addNotification('Invalid phone number or password', 'error');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-amber-600">Welcome to Curry Point</h1>
        <p className="text-gray-600 mt-1">Login to access your account</p>
      </div>
      
      <form onSubmit={handleSubmit}>
        <Input
          id="phone"
          label="Phone Number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+91 9876543210"
          required
          icon={<User size={18} />}
        />
        
        <Input
          id="password"
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          required
          icon={<Lock size={18} />}
        />
        
        <div className="text-sm text-gray-600 mt-2 mb-4">
          <p>
            Demo Accounts:
          </p>
          <p className="mt-1">
            <strong>Admin:</strong> +91 9999999999 / admin
          </p>
          <p>
            <strong>Customer:</strong> +91 9876543210 / 1234
          </p>
        </div>
        
        <Button
          type="submit"
          variant="primary"
          fullWidth
          disabled={isLoading}
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </Button>
      </form>
      
      <div className="mt-4 text-center">
        <p className="text-gray-600">
          Don't have an account?{' '}
          <button
            type="button"
            className="text-amber-600 font-medium hover:underline"
            onClick={onToggleForm}
          >
            Register
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;