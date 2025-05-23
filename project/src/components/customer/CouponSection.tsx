import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../common/Card';
import { getLocalStorageData } from '../../utils/localStorage';
import { Coupon } from '../../types';
import { Tag, Calendar, DollarSign, AlertCircle } from 'lucide-react';

const CouponSection: React.FC = () => {
  const { currentUser } = useAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'vip'>('active');

  // Load coupons from localStorage
  useEffect(() => {
    const loadData = () => {
      const allCoupons = getLocalStorageData<Coupon[]>('coupons');
      setCoupons(allCoupons);
    };

    loadData();

    // Setup listener for localStorage changes
    const handleStorageChange = () => {
      loadData();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Filter coupons based on selected filter
  const filteredCoupons = coupons.filter((coupon) => {
    const isActive = coupon.isActive && new Date(coupon.expiryDate) > new Date();
    
    if (filter === 'all') {
      return true;
    } else if (filter === 'active') {
      return isActive;
    } else if (filter === 'vip') {
      return isActive && coupon.forVipOnly;
    }
    
    return false;
  });

  // Check if coupon is available for the current user
  const isCouponAvailable = (coupon: Coupon): boolean => {
    if (!coupon.isActive) return false;
    if (new Date(coupon.expiryDate) <= new Date()) return false;
    if (coupon.forVipOnly && !currentUser?.isVip) return false;
    return true;
  };

  // Format discount text
  const formatDiscount = (coupon: Coupon): string => {
    if (coupon.discountType === 'percentage') {
      return `${coupon.discountValue}% off`;
    } else if (coupon.discountType === 'fixed') {
      return `₹${coupon.discountValue} off`;
    } else {
      return 'Free item';
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Available Coupons</h1>
        
        {/* Filter Tabs */}
        <div className="flex rounded-md overflow-hidden border border-gray-300">
          <button
            className={`px-3 py-1 text-sm ${
              filter === 'active'
                ? 'bg-amber-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
            onClick={() => setFilter('active')}
          >
            Active
          </button>
          <button
            className={`px-3 py-1 text-sm ${
              filter === 'vip'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
            onClick={() => setFilter('vip')}
          >
            VIP Only
          </button>
          <button
            className={`px-3 py-1 text-sm ${
              filter === 'all'
                ? 'bg-gray-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
        </div>
      </div>

      {/* VIP Banner */}
      {!currentUser?.isVip && (
        <Card className="mb-6 bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <h2 className="text-xl font-bold mb-2">Unlock VIP Coupons!</h2>
              <p className="text-purple-100">
                Spend more to unlock exclusive VIP coupons with bigger discounts and better offers.
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <div className="bg-white text-purple-600 rounded-lg px-4 py-2 text-center">
                <p className="text-xs uppercase">Total Spent</p>
                <p className="text-xl font-bold">₹{currentUser?.totalSpent || 0}</p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Coupons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCoupons.map((coupon) => (
          <Card
            key={coupon.id}
            className={`${
              !isCouponAvailable(coupon) ? 'opacity-70' : ''
            }`}
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="flex items-center mb-1">
                  <Tag size={16} className="text-amber-600 mr-2" />
                  <span className="font-mono text-sm bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                    {coupon.code}
                  </span>
                  {coupon.forVipOnly && (
                    <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                      VIP Only
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-medium text-gray-900">{coupon.title}</h3>
              </div>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  isCouponAvailable(coupon)
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {!coupon.isActive
                  ? 'Inactive'
                  : new Date(coupon.expiryDate) <= new Date()
                  ? 'Expired'
                  : 'Active'}
              </span>
            </div>
            
            <p className="text-sm text-gray-600 mb-3">{coupon.description}</p>
            
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Discount:</span>
                <span className="font-medium text-green-600">{formatDiscount(coupon)}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Min Order:</span>
                <span className="font-medium flex items-center">
                  <DollarSign size={14} className="mr-1" />
                  ₹{coupon.minOrderValue}
                </span>
              </div>
              
              {coupon.discountType === 'percentage' && coupon.maxDiscount && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Max Discount:</span>
                  <span className="font-medium">₹{coupon.maxDiscount}</span>
                </div>
              )}
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Usage Limit:</span>
                <span className="font-medium">
                  {coupon.usageLimit} time{coupon.usageLimit !== 1 ? 's' : ''}
                </span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Expires:</span>
                <span className="font-medium flex items-center">
                  <Calendar size={14} className="mr-1" />
                  {new Date(coupon.expiryDate).toLocaleDateString()}
                </span>
              </div>
            </div>
            
            {coupon.forVipOnly && !currentUser?.isVip && (
              <div className="mt-3 p-2 bg-purple-50 rounded border border-purple-200 flex items-start">
                <AlertCircle size={16} className="text-purple-500 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-purple-800">
                  This coupon is for VIP customers only. Continue spending to reach VIP status.
                </p>
              </div>
            )}
          </Card>
        ))}
        
        {filteredCoupons.length === 0 && (
          <div className="col-span-full text-center py-8 text-gray-500">
            <AlertCircle size={40} className="mx-auto mb-2" />
            <p className="text-lg">No coupons found</p>
            <p className="text-sm mt-1">
              {filter === 'vip' && !currentUser?.isVip
                ? 'Spend more to become a VIP and unlock exclusive coupons!'
                : 'Check back later for new offers!'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CouponSection;