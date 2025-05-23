// Customer type definition
export interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string;
  points: number;
  totalSpent: number;
  isActive: boolean;
  createdAt: string;
  lastVisit: string;
  password: string; // In a real app, we'd use hashed passwords
  isVip: boolean;
}

// Transaction type definition
export interface Transaction {
  id: number;
  customerId: number;
  amount: number;
  pointsEarned: number;
  pointsRedeemed: number;
  date: string;
  type: 'payment' | 'redemption';
  couponUsed?: string;
}

// Payment slab type definition
export interface PaymentSlab {
  id: number;
  minAmount: number;
  maxAmount: number;
  points: number;
}

// Coupon type definition
export interface Coupon {
  id: number;
  code: string;
  title: string;
  description: string;
  discountType: 'percentage' | 'fixed' | 'freeItem';
  discountValue: number;
  minOrderValue: number;
  maxDiscount?: number;
  isActive: boolean;
  expiryDate: string;
  usageLimit: number;
  usageCount: number;
  forVipOnly: boolean;
}

// Settings type definition
export interface Settings {
  businessName: string;
  upiId: string;
  pointsToRupeeRatio: number;
  welcomeBonusPoints: number;
  minRedemptionPoints: number;
  vipThreshold: number;
  vipPointsMultiplier: number;
}

// User role type
export type UserRole = 'admin' | 'customer' | null;

// Authentication context type
export interface AuthContextType {
  currentUser: Customer | null;
  userRole: UserRole;
  login: (phone: string, password: string) => boolean;
  logout: () => void;
  register: (customer: Partial<Customer>) => boolean;
}

// Notification type
export interface Notification {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

// Notification context type
export interface NotificationContextType {
  notifications: Notification[];
  addNotification: (message: string, type: Notification['type']) => void;
  removeNotification: (id: number) => void;
}