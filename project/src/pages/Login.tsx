import React, { useState } from 'react';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';
import { Award, CreditCard, Tag } from 'lucide-react';

const Login: React.FC = () => {
  const [isLoginForm, setIsLoginForm] = useState(true);

  const toggleForm = () => {
    setIsLoginForm(!isLoginForm);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-amber-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          {/* Left Side - Form */}
          <div className="w-full lg:w-1/2 flex justify-center order-2 lg:order-1">
            {isLoginForm ? (
              <LoginForm onToggleForm={toggleForm} />
            ) : (
              <RegisterForm onToggleForm={toggleForm} />
            )}
          </div>
          
          {/* Right Side - Features */}
          <div className="w-full lg:w-1/2 order-1 lg:order-2">
            <div className="text-center lg:text-left mb-8">
              <h1 className="text-3xl lg:text-4xl font-bold text-amber-800">Curry Point</h1>
              <p className="text-xl text-amber-600 mt-2">Loyalty & Payment System</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-lg shadow-md transform transition-transform hover:scale-105">
                <div className="flex items-center mb-3">
                  <div className="p-2 rounded-full bg-amber-100 text-amber-600">
                    <Award size={24} />
                  </div>
                  <h2 className="text-lg font-semibold ml-3">Loyalty Points</h2>
                </div>
                <p className="text-gray-600">
                  Earn points with every purchase and redeem them for discounts on future orders.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md transform transition-transform hover:scale-105">
                <div className="flex items-center mb-3">
                  <div className="p-2 rounded-full bg-amber-100 text-amber-600">
                    <Tag size={24} />
                  </div>
                  <h2 className="text-lg font-semibold ml-3">Exclusive Coupons</h2>
                </div>
                <p className="text-gray-600">
                  Access special discounts and offers available only to registered customers.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md transform transition-transform hover:scale-105">
                <div className="flex items-center mb-3">
                  <div className="p-2 rounded-full bg-amber-100 text-amber-600">
                    <CreditCard size={24} />
                  </div>
                  <h2 className="text-lg font-semibold ml-3">Easy Payments</h2>
                </div>
                <p className="text-gray-600">
                  Quick and secure UPI payments with instant points crediting to your account.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md transform transition-transform hover:scale-105">
                <div className="flex items-center mb-3">
                  <div className="p-2 rounded-full bg-purple-100 text-purple-600">
                    <Award size={24} />
                  </div>
                  <h2 className="text-lg font-semibold ml-3">VIP Benefits</h2>
                </div>
                <p className="text-gray-600">
                  Become a VIP customer by spending more and unlock premium benefits and higher rewards.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;