import { PaymentSlab, Customer, Settings } from '../types';
import { getLocalStorageData } from './localStorage';

// Calculate points earned based on payment amount and slabs
export const calculatePoints = (amount: number, customerId?: number): number => {
  const paymentSlabs = getLocalStorageData<PaymentSlab[]>('paymentSlabs');
  const settings = getLocalStorageData<Settings>('settings');
  
  // Find applicable slab
  const slab = paymentSlabs.find(
    (slab) => amount >= slab.minAmount && amount <= slab.maxAmount
  );
  
  if (!slab) return 0;
  
  let points = slab.points;
  
  // Apply VIP multiplier if customer is VIP
  if (customerId) {
    const customers = getLocalStorageData<Customer[]>('customers');
    const customer = customers.find((c) => c.id === customerId);
    
    if (customer?.isVip) {
      points = Math.round(points * settings.vipPointsMultiplier);
    }
  }
  
  return points;
};

// Check if a customer is eligible for VIP status
export const checkVipEligibility = (customer: Customer): boolean => {
  const settings = getLocalStorageData<Settings>('settings');
  return customer.totalSpent >= settings.vipThreshold;
};

// Calculate the rupee value of points
export const calculatePointsValue = (points: number): number => {
  const settings = getLocalStorageData<Settings>('settings');
  return points * settings.pointsToRupeeRatio;
};

// Check if points can be redeemed
export const canRedeemPoints = (points: number): boolean => {
  const settings = getLocalStorageData<Settings>('settings');
  return points >= settings.minRedemptionPoints;
};

// Calculate remaining points after redemption
export const calculateRemainingPoints = (
  points: number,
  amountToRedeem: number
): number => {
  const settings = getLocalStorageData<Settings>('settings');
  const pointsNeeded = Math.ceil(amountToRedeem / settings.pointsToRupeeRatio);
  return points - pointsNeeded;
};

// Calculate maximum amount that can be redeemed with given points
export const calculateMaxRedemption = (points: number): number => {
  const settings = getLocalStorageData<Settings>('settings');
  return Math.floor(points * settings.pointsToRupeeRatio);
};