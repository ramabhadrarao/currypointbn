import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../common/Card';
import { getLocalStorageData } from '../../utils/localStorage';
import { Transaction, Coupon, Settings } from '../../types';
import { CreditCard, Award, Ticket, Clock } from 'lucide-react';
import { formatDateTime } from '../../utils/dateUtils';
import { calculatePointsValue } from '../../utils/pointsCalculator';

const CustomerDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [stats, setStats] = useState({
    totalSpent: 0,
    totalTransactions: 0,
    availableCoupons: 0,
    pointsValue: 0
  });

  // Load data from localStorage
  useEffect(() => {
    if (!currentUser) return;

    const loadData = () => {
      const allTransactions = getLocalStorageData<Transaction[]>('transactions');
      const allCoupons = getLocalStorageData<Coupon[]>('coupons');
      const settings = getLocalStorageData<Settings>('settings');
      
      // Filter transactions for current user
      const userTransactions = allTransactions.filter(
        (t) => t.customerId === currentUser.id
      );
      
      // Filter available coupons (active, not expired, not VIP only or user is VIP)
      const today = new Date();
      const availableCoupons = allCoupons.filter(
        (c) => 
          c.isActive && 
          new Date(c.expiryDate) > today && 
          (!c.forVipOnly || currentUser.isVip)
      );
      
      setTransactions(userTransactions);
      setCoupons(availableCoupons);
      setSettings(settings);
    };

    loadData();

    // Setup listener for localStorage changes
    const handleStorageChange = () => {
      loadData();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [currentUser]);

  // Calculate statistics
  useEffect(() => {
    if (!currentUser || !settings) return;
    
    setStats({
      totalSpent: currentUser.totalSpent,
      totalTransactions: transactions.length,
      availableCoupons: coupons.length,
      pointsValue: calculatePointsValue(currentUser.points)
    });
  }, [currentUser, transactions, coupons, settings]);

  // Recent transactions
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Customer Dashboard</h1>
      
      {/* Welcome Card */}
      <Card className="mb-6 bg-gradient-to-r from-amber-500 to-amber-600 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div>
            <h2 className="text-xl font-bold mb-2">Welcome back, {currentUser?.name}!</h2>
            <p className="text-amber-100">
              You have <span className="font-bold">{currentUser?.points} points</span> available to redeem.
              {currentUser?.isVip && (
                <span className="ml-2 bg-white text-amber-600 px-2 py-0.5 rounded-full text-xs">
                  VIP Status
                </span>
              )}
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <div className="bg-white text-amber-600 rounded-lg px-4 py-3 text-center">
              <p className="text-xs text-amber-500 uppercase">Points Value</p>
              <p className="text-2xl font-bold">₹{stats.pointsValue}</p>
            </div>
          </div>
        </div>
      </Card>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-500 text-white mr-4">
              <CreditCard size={24} />
            </div>
            <div>
              <p className="text-sm text-green-800">Total Spent</p>
              <p className="text-2xl font-bold text-green-900">₹{stats.totalSpent}</p>
            </div>
          </div>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-500 text-white mr-4">
              <Award size={24} />
            </div>
            <div>
              <p className="text-sm text-purple-800">Points Balance</p>
              <p className="text-2xl font-bold text-purple-900">{currentUser?.points}</p>
            </div>
          </div>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-500 text-white mr-4">
              <Ticket size={24} />
            </div>
            <div>
              <p className="text-sm text-blue-800">Available Coupons</p>
              <p className="text-2xl font-bold text-blue-900">{stats.availableCoupons}</p>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Recent Transactions */}
      <Card title="Recent Transactions" className="mb-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Points
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentTransactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="flex items-center">
                      <Clock size={14} className="text-gray-400 mr-1" />
                      <span className="text-sm text-gray-900">{formatDateTime(transaction.date)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">₹{transaction.amount}</span>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <span className={`text-sm font-medium ${
                      transaction.type === 'payment' ? 'text-green-600' : 'text-blue-600'
                    }`}>
                      {transaction.type === 'payment'
                        ? `+${transaction.pointsEarned}`
                        : `-${transaction.pointsRedeemed}`}
                    </span>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        transaction.type === 'payment'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {transaction.type === 'payment' ? 'Payment' : 'Redemption'}
                    </span>
                  </td>
                </tr>
              ))}
              {recentTransactions.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-2 text-center text-gray-500">
                    No transactions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
      
      {/* Available Coupons */}
      <Card title="Available Coupons">
        <div className="space-y-4">
          {coupons.slice(0, 3).map((coupon) => (
            <div key={coupon.id} className="border border-gray-200 rounded-md p-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-mono text-sm bg-amber-100 text-amber-800 px-2 py-0.5 rounded inline-block mb-1">
                    {coupon.code}
                  </p>
                  <h3 className="font-medium">{coupon.title}</h3>
                </div>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                  Expires: {new Date(coupon.expiryDate).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">{coupon.description}</p>
            </div>
          ))}
          {coupons.length === 0 && (
            <p className="text-center text-gray-500 py-4">No coupons available</p>
          )}
          {coupons.length > 3 && (
            <p className="text-center text-sm text-amber-600 mt-2">
              + {coupons.length - 3} more coupons available
            </p>
          )}
        </div>
      </Card>
    </div>
  );
};

export default CustomerDashboard;