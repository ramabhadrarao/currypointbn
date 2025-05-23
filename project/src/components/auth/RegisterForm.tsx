import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import Button from '../common/Button';
import Input from '../common/Input';
import { User, Phone, Mail, Lock, Award } from 'lucide-react';
import { getLocalStorageData } from '../../utils/localStorage';

interface RegisterFormProps {
  onToggleForm: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onToggleForm }) => {
  const { register } = useAuth();
  const { addNotification } = useNotification();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  // Get welcome bonus points
  const settings = getLocalStorageData('settings');
  const welcomeBonus = settings.welcomeBonusPoints;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validate form
    if (!formData.name || !formData.phone || !formData.email || !formData.password) {
      addNotification('Please fill all required fields', 'error');
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      addNotification('Passwords do not match', 'error');
      setIsLoading(false);
      return;
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      addNotification('Please enter a valid email address', 'error');
      setIsLoading(false);
      return;
    }

    // Simple phone number validation
    const phoneRegex = /^\+?[0-9\s]{10,15}$/;
    if (!phoneRegex.test(formData.phone)) {
      addNotification('Please enter a valid phone number', 'error');
      setIsLoading(false);
      return;
    }

    // Attempt registration
    const success = register({
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      password: formData.password,
    });
    
    if (success) {
      addNotification(`Registration successful! You received ${welcomeBonus} welcome bonus points.`, 'success');
    } else {
      addNotification('Registration failed. Phone number may already be registered.', 'error');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-amber-600">Join Curry Point</h1>
        <p className="text-gray-600 mt-1">Create a new account</p>
      </div>
      
      <form onSubmit={handleSubmit}>
        <Input
          id="name"
          label="Full Name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Enter your full name"
          required
          icon={<User size={18} />}
        />
        
        <Input
          id="phone"
          label="Phone Number"
          value={formData.phone}
          onChange={handleChange}
          placeholder="+91 9876543210"
          required
          icon={<Phone size={18} />}
        />
        
        <Input
          id="email"
          label="Email Address"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="your@email.com"
          required
          icon={<Mail size={18} />}
        />
        
        <Input
          id="password"
          label="Password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Create a password"
          required
          icon={<Lock size={18} />}
        />
        
        <Input
          id="confirmPassword"
          label="Confirm Password"
          type="password"
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder="Confirm your password"
          required
          icon={<Lock size={18} />}
        />
        
        <div className="flex items-center mt-3 mb-4 p-3 bg-amber-50 rounded border border-amber-200">
          <Award size={20} className="text-amber-600 mr-2" />
          <p className="text-sm text-amber-700">
            Register now and get <span className="font-bold">{welcomeBonus} bonus points</span>!
          </p>
        </div>
        
        <Button
          type="submit"
          variant="primary"
          fullWidth
          disabled={isLoading}
        >
          {isLoading ? 'Creating Account...' : 'Register'}
        </Button>
      </form>
      
      <div className="mt-4 text-center">
        <p className="text-gray-600">
          Already have an account?{' '}
          <button
            type="button"
            className="text-amber-600 font-medium hover:underline"
            onClick={onToggleForm}
          >
            Login
          </button>
        </p>
      </div>
    </div>
  );
};

export default RegisterForm;