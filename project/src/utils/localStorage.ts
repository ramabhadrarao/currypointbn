import { Customer, Transaction, PaymentSlab, Coupon, Settings } from '../types';

// Initial data for the app
const initialData = {
  customers: [
    {
      id: 1,
      name: 'John Doe',
      phone: '+91 9876543210',
      email: 'john@example.com',
      points: 125,
      totalSpent: 2850,
      isActive: true,
      createdAt: '2025-01-15',
      lastVisit: '2025-05-22',
      password: '1234', // In a real app, we'd use hashed passwords
      isVip: false
    },
    {
      id: 2,
      name: 'Admin User',
      phone: '+91 9999999999',
      email: 'admin@currypoint.com',
      points: 0,
      totalSpent: 0,
      isActive: true,
      createdAt: '2025-01-01',
      lastVisit: '2025-05-22',
      password: 'admin',
      isVip: true
    }
  ] as Customer[],
  
  transactions: [
    {
      id: 1,
      customerId: 1,
      amount: 550,
      pointsEarned: 30,
      pointsRedeemed: 0,
      date: '2025-05-22T14:30:45',
      type: 'payment'
    },
    {
      id: 2,
      customerId: 1,
      amount: 800,
      pointsEarned: 60,
      pointsRedeemed: 0,
      date: '2025-05-20T19:15:22',
      type: 'payment'
    },
    {
      id: 3,
      customerId: 1,
      amount: 1500,
      pointsEarned: 100,
      pointsRedeemed: 0,
      date: '2025-05-15T12:45:33',
      type: 'payment'
    },
    {
      id: 4,
      customerId: 1,
      amount: 200,
      pointsEarned: 0,
      pointsRedeemed: 40,
      date: '2025-05-10T20:30:15',
      type: 'redemption'
    }
  ] as Transaction[],
  
  paymentSlabs: [
    {
      id: 1,
      minAmount: 0,
      maxAmount: 100,
      points: 5
    },
    {
      id: 2,
      minAmount: 101,
      maxAmount: 300,
      points: 15
    },
    {
      id: 3,
      minAmount: 301,
      maxAmount: 500,
      points: 30
    },
    {
      id: 4,
      minAmount: 501,
      maxAmount: 1000,
      points: 60
    },
    {
      id: 5,
      minAmount: 1001,
      maxAmount: 99999,
      points: 100
    }
  ] as PaymentSlab[],
  
  coupons: [
    {
      id: 1,
      code: 'WELCOME10',
      title: '10% Off Your First Order',
      description: 'Get 10% off on your first order above ₹300',
      discountType: 'percentage',
      discountValue: 10,
      minOrderValue: 300,
      maxDiscount: 100,
      isActive: true,
      expiryDate: '2025-12-31',
      usageLimit: 1,
      usageCount: 0,
      forVipOnly: false
    },
    {
      id: 2,
      code: 'FLAT50',
      title: 'Flat ₹50 Off',
      description: 'Get flat ₹50 off on orders above ₹500',
      discountType: 'fixed',
      discountValue: 50,
      minOrderValue: 500,
      isActive: true,
      expiryDate: '2025-07-31',
      usageLimit: 2,
      usageCount: 0,
      forVipOnly: false
    },
    {
      id: 3,
      code: 'VIPSPECIAL',
      title: 'VIP Special: 15% Off',
      description: 'Exclusive 15% off for our VIP customers',
      discountType: 'percentage',
      discountValue: 15,
      minOrderValue: 200,
      maxDiscount: 200,
      isActive: true,
      expiryDate: '2025-12-31',
      usageLimit: 5,
      usageCount: 0,
      forVipOnly: true
    }
  ] as Coupon[],
  
  settings: {
    businessName: 'Curry Point',
    upiId: 'currypoint@upi',
    pointsToRupeeRatio: 0.5, // 1 point = ₹0.5
    welcomeBonusPoints: 50,
    minRedemptionPoints: 100,
    vipThreshold: 3000, // Total spent to become VIP
    vipPointsMultiplier: 1.2 // VIP customers get 20% more points
  } as Settings
};

// Initialize localStorage with default data if it doesn't exist
export const initializeLocalStorage = () => {
  if (!localStorage.getItem('curryPoint')) {
    localStorage.setItem('curryPoint', JSON.stringify(initialData));
  }
};

// Generic function to get data from localStorage
export const getLocalStorageData = <T>(key: keyof typeof initialData): T => {
  const data = localStorage.getItem('curryPoint');
  if (data) {
    return JSON.parse(data)[key] as T;
  }
  return [] as unknown as T;
};

// Generic function to update data in localStorage
export const updateLocalStorageData = <T>(key: keyof typeof initialData, data: T): void => {
  const curryPointData = localStorage.getItem('curryPoint');
  if (curryPointData) {
    const parsedData = JSON.parse(curryPointData);
    parsedData[key] = data;
    localStorage.setItem('curryPoint', JSON.stringify(parsedData));
  }
};

// Function to reset localStorage to initial data
export const resetLocalStorage = () => {
  localStorage.setItem('curryPoint', JSON.stringify(initialData));
};

// Function to export data from localStorage
export const exportData = (): string => {
  const data = localStorage.getItem('curryPoint');
  return data || JSON.stringify(initialData);
};

// Function to import data to localStorage
export const importData = (data: string): boolean => {
  try {
    const parsedData = JSON.parse(data);
    // Validate data structure
    if (
      parsedData.customers &&
      parsedData.transactions &&
      parsedData.paymentSlabs &&
      parsedData.coupons &&
      parsedData.settings
    ) {
      localStorage.setItem('curryPoint', data);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Invalid data format', error);
    return false;
  }
};