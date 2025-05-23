import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import Card from '../common/Card';
import Button from '../common/Button';
import Input from '../common/Input';
import Modal from '../common/Modal';
import { getLocalStorageData, updateLocalStorageData } from '../../utils/localStorage';
import { Customer, PaymentSlab, Transaction, Coupon, Settings } from '../../types';
import { calculatePoints, calculatePointsValue, canRedeemPoints, calculateMaxRedemption } from '../../utils/pointsCalculator';
import { generateUpiQRCode } from '../../utils/upiGenerator';
import { getCurrentDate } from '../../utils/dateUtils';
import { CreditCard, Check, AlertCircle, Tag, RefreshCw } from 'lucide-react';

const PaymentSection: React.FC = () => {
  const { currentUser } = useAuth();
  const { addNotification } = useNotification();
  const [amount, setAmount] = useState<number>(0);
  const [pointsToEarn, setPointsToEarn] = useState<number>(0);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [paymentSlabs, setPaymentSlabs] = useState<PaymentSlab[]>([]);
  const [isRedeemModalOpen, setIsRedeemModalOpen] = useState(false);
  const [redeemAmount, setRedeemAmount] = useState<number>(0);
  const [maxRedeemableAmount, setMaxRedeemableAmount] = useState<number>(0);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);
  const [finalAmount, setFinalAmount] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);

  // Load payment slabs and settings from localStorage
  useEffect(() => {
    const slabs = getLocalStorageData<PaymentSlab[]>('paymentSlabs');
    const settings = getLocalStorageData<Settings>('settings');
    setPaymentSlabs(slabs);
    setSettings(settings);
    
    // Calculate max redeemable amount
    if (currentUser) {
      setMaxRedeemableAmount(calculateMaxRedemption(currentUser.points));
    }
    
    // Load available coupons
    loadAvailableCoupons();
    
    // Setup listener for localStorage changes
    const handleStorageChange = () => {
      const slabs = getLocalStorageData<PaymentSlab[]>('paymentSlabs');
      const settings = getLocalStorageData<Settings>('settings');
      setPaymentSlabs(slabs);
      setSettings(settings);
      
      // Reload coupons
      loadAvailableCoupons();
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [currentUser]);

  // Load available coupons
  const loadAvailableCoupons = () => {
    if (!currentUser) return;
    
    const allCoupons = getLocalStorageData<Coupon[]>('coupons');
    const today = new Date();
    
    // Filter for active coupons that aren't expired and are available to the user
    const available = allCoupons.filter(
      (c) => 
        c.isActive && 
        new Date(c.expiryDate) > today && 
        (!c.forVipOnly || currentUser.isVip)
    );
    
    setAvailableCoupons(available);
  };

  // Calculate points to earn when amount changes
  useEffect(() => {
    if (amount > 0) {
      const pointsEarned = calculatePoints(amount, currentUser?.id);
      setPointsToEarn(pointsEarned);
    } else {
      setPointsToEarn(0);
    }
    
    // Calculate final amount
    calculateFinalAmount();
  }, [amount, currentUser]);

  // Calculate final amount after coupon discount
  const calculateFinalAmount = () => {
    let final = amount;
    let disc = 0;
    
    if (selectedCoupon && amount >= selectedCoupon.minOrderValue) {
      if (selectedCoupon.discountType === 'percentage') {
        disc = (amount * selectedCoupon.discountValue) / 100;
        if (selectedCoupon.maxDiscount && disc > selectedCoupon.maxDiscount) {
          disc = selectedCoupon.maxDiscount;
        }
      } else if (selectedCoupon.discountType === 'fixed') {
        disc = selectedCoupon.discountValue;
      }
      
      final = Math.max(0, amount - disc);
    }
    
    setFinalAmount(final);
    setDiscount(disc);
  };

  // Recalculate when coupon changes
  useEffect(() => {
    calculateFinalAmount();
  }, [selectedCoupon]);

  // Handle amount change
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    setAmount(value);
  };

  // Handle generate QR button click
  const handleGenerateQR = () => {
    if (amount <= 0) {
      addNotification('Please enter a valid amount', 'error');
      return;
    }
    
    // Generate QR code for payment
    const qrUrl = generateUpiQRCode(finalAmount);
    setQrCodeUrl(qrUrl);
    setIsQRModalOpen(true);
  };

  // Handle payment success
  const handlePaymentSuccess = () => {
    if (!currentUser || !settings) return;
    
    // Update customer
    const customers = getLocalStorageData<Customer[]>('customers');
    const updatedCustomers = customers.map((c) => {
      if (c.id === currentUser.id) {
        // Add points and update total spent
        const updatedTotalSpent = c.totalSpent + finalAmount;
        const wasVip = c.isVip;
        const isVip = updatedTotalSpent >= settings.vipThreshold;
        
        // Check if customer just became VIP
        if (!wasVip && isVip) {
          addNotification('Congratulations! You are now a VIP customer!', 'success');
        }
        
        return {
          ...c,
          points: c.points + pointsToEarn,
          totalSpent: updatedTotalSpent,
          lastVisit: getCurrentDate(),
          isVip: isVip
        };
      }
      return c;
    });
    updateLocalStorageData('customers', updatedCustomers);
    
    // Add transaction
    const transactions = getLocalStorageData<Transaction[]>('transactions');
    const newTransaction: Transaction = {
      id: Math.max(0, ...transactions.map((t) => t.id)) + 1,
      customerId: currentUser.id,
      amount: finalAmount,
      pointsEarned: pointsToEarn,
      pointsRedeemed: 0,
      date: new Date().toISOString(),
      type: 'payment',
      couponUsed: selectedCoupon?.code
    };
    const updatedTransactions = [...transactions, newTransaction];
    updateLocalStorageData('transactions', updatedTransactions);
    
    // Update coupon usage if a coupon was used
    if (selectedCoupon) {
      const coupons = getLocalStorageData<Coupon[]>('coupons');
      const updatedCoupons = coupons.map((c) => {
        if (c.id === selectedCoupon.id) {
          return {
            ...c,
            usageCount: c.usageCount + 1
          };
        }
        return c;
      });
      updateLocalStorageData('coupons', updatedCoupons);
    }
    
    // Close modal and show success notification
    setIsQRModalOpen(false);
    addNotification(`Payment successful! You earned ${pointsToEarn} points.`, 'success');
    
    // Reset
    setAmount(0);
    setSelectedCoupon(null);
    setFinalAmount(0);
    setDiscount(0);
    
    // Update max redeemable amount for the updated points
    const updatedUser = updatedCustomers.find((c) => c.id === currentUser.id);
    if (updatedUser) {
      setMaxRedeemableAmount(calculateMaxRedemption(updatedUser.points));
    }
  };

  // Handle redeem amount change
  const handleRedeemAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    setRedeemAmount(Math.min(value, maxRedeemableAmount));
  };

  // Handle redeem points
  const handleRedeemPoints = () => {
    if (!currentUser || !settings) return;
    
    if (redeemAmount <= 0) {
      addNotification('Please enter a valid amount to redeem', 'error');
      return;
    }
    
    if (redeemAmount > maxRedeemableAmount) {
      addNotification(`Maximum redeemable amount is ₹${maxRedeemableAmount}`, 'error');
      return;
    }
    
    // Calculate points needed
    const pointsNeeded = Math.ceil(redeemAmount / settings.pointsToRupeeRatio);
    
    // Update customer
    const customers = getLocalStorageData<Customer[]>('customers');
    const updatedCustomers = customers.map((c) => {
      if (c.id === currentUser.id) {
        return {
          ...c,
          points: c.points - pointsNeeded,
          lastVisit: getCurrentDate()
        };
      }
      return c;
    });
    updateLocalStorageData('customers', updatedCustomers);
    
    // Add transaction
    const transactions = getLocalStorageData<Transaction[]>('transactions');
    const newTransaction: Transaction = {
      id: Math.max(0, ...transactions.map((t) => t.id)) + 1,
      customerId: currentUser.id,
      amount: redeemAmount,
      pointsEarned: 0,
      pointsRedeemed: pointsNeeded,
      date: new Date().toISOString(),
      type: 'redemption'
    };
    const updatedTransactions = [...transactions, newTransaction];
    updateLocalStorageData('transactions', updatedTransactions);
    
    // Close modal and show success notification
    setIsRedeemModalOpen(false);
    addNotification(`Redemption successful! You redeemed ₹${redeemAmount}.`, 'success');
    
    // Reset
    setRedeemAmount(0);
    
    // Update max redeemable amount for the updated points
    const updatedUser = updatedCustomers.find((c) => c.id === currentUser.id);
    if (updatedUser) {
      setMaxRedeemableAmount(calculateMaxRedemption(updatedUser.points));
    }
  };

  // Handle select coupon
  const handleSelectCoupon = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setIsCouponModalOpen(false);
    addNotification(`Coupon "${coupon.code}" applied successfully!`, 'success');
  };

  // Handle remove coupon
  const handleRemoveCoupon = () => {
    setSelectedCoupon(null);
    addNotification('Coupon removed', 'info');
  };

  // Filter coupons based on amount
  const eligibleCoupons = availableCoupons.filter(
    (c) => amount >= c.minOrderValue
  );

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Make Payment</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Card */}
        <Card>
          <h2 className="text-lg font-semibold mb-4">Enter Payment Details</h2>
          
          <Input
            id="amount"
            label="Amount (₹)"
            type="number"
            value={amount || ''}
            onChange={handleAmountChange}
            placeholder="Enter amount"
            required
            min={1}
            icon={<CreditCard size={18} />}
          />
          
          {/* Coupon Section */}
          <div className="mb-4 p-3 bg-gray-50 rounded-md">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium text-gray-700 flex items-center">
                <Tag size={16} className="mr-1" />
                Apply Coupon
              </h3>
              {selectedCoupon ? (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleRemoveCoupon}
                >
                  Remove
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsCouponModalOpen(true)}
                  disabled={eligibleCoupons.length === 0}
                >
                  {eligibleCoupons.length > 0 ? 'Select Coupon' : 'No Eligible Coupons'}
                </Button>
              )}
            </div>
            
            {selectedCoupon && (
              <div className="bg-white p-2 rounded border border-amber-200">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                      {selectedCoupon.code}
                    </span>
                    <p className="text-sm font-medium mt-1">{selectedCoupon.title}</p>
                  </div>
                  <span className="text-green-600 text-sm font-medium">
                    {discount > 0 && `- ₹${discount.toFixed(2)}`}
                  </span>
                </div>
              </div>
            )}
          </div>
          
          {/* Payment Summary */}
          <div className="mb-4 p-4 bg-amber-50 rounded-md border border-amber-100">
            <h3 className="font-medium text-amber-800 mb-2">Payment Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>₹{amount.toFixed(2)}</span>
              </div>
              
              {discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Coupon Discount:</span>
                  <span>- ₹{discount.toFixed(2)}</span>
                </div>
              )}
              
              <div className="flex justify-between font-medium pt-2 border-t border-amber-200">
                <span>Total Amount:</span>
                <span>₹{finalAmount.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between text-sm text-amber-600">
                <span>Points to Earn:</span>
                <span>+ {pointsToEarn} points</span>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <Button
              variant="primary"
              onClick={handleGenerateQR}
              disabled={finalAmount <= 0}
              fullWidth
            >
              Generate Payment QR
            </Button>
          </div>
        </Card>
        
        {/* Points Card */}
        <Card>
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-lg font-semibold">Your Points</h2>
            <div className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full font-medium">
              {currentUser?.points || 0} points
            </div>
          </div>
          
          <div className="mb-4">
            <div className="bg-gradient-to-r from-amber-50 to-amber-100 p-4 rounded-md border border-amber-200">
              <h3 className="font-medium text-amber-800 mb-2">Points Value</h3>
              <p className="text-3xl font-bold text-amber-600">
                ₹{maxRedeemableAmount.toFixed(2)}
              </p>
              <p className="text-sm text-amber-700 mt-1">
                1 point = ₹{settings?.pointsToRupeeRatio}
              </p>
            </div>
          </div>
          
          <Button
            variant="success"
            onClick={() => setIsRedeemModalOpen(true)}
            disabled={!canRedeemPoints(currentUser?.points || 0)}
            fullWidth
            className="mb-6"
          >
            Redeem Points
          </Button>
          
          {/* Payment Slabs */}
          <div>
            <h3 className="font-medium text-gray-700 mb-2">Points Earning Slabs</h3>
            <div className="space-y-2">
              {paymentSlabs.map((slab) => (
                <div
                  key={slab.id}
                  className="flex justify-between items-center p-2 bg-gray-50 rounded border border-gray-200"
                >
                  <span className="text-sm">
                    ₹{slab.minAmount} - ₹{slab.maxAmount}
                  </span>
                  <span className="font-medium text-amber-600">
                    {slab.points} points
                  </span>
                </div>
              ))}
            </div>
            
            {currentUser?.isVip && settings && (
              <div className="mt-3 p-2 bg-purple-50 rounded border border-purple-200">
                <p className="text-sm text-purple-700">
                  <span className="font-medium">VIP Bonus:</span> You earn {(settings.vipPointsMultiplier - 1) * 100}% 
                  extra points on all purchases!
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>
      
      {/* QR Code Modal */}
      <Modal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        title="Scan QR Code to Pay"
        size="md"
      >
        <div className="text-center">
          <div className="bg-white p-4 rounded-md border border-gray-200 inline-block mb-4">
            <img
              src={qrCodeUrl}
              alt="Payment QR Code"
              className="w-48 h-48 mx-auto"
            />
            <p className="text-lg font-bold mt-2">₹{finalAmount.toFixed(2)}</p>
          </div>
          
          <p className="text-gray-600 mb-6">
            Scan this QR code using any UPI app like Google Pay, PhonePe, or Paytm to make your payment.
          </p>
          
          <div className="flex justify-center space-x-4">
            <Button
              variant="secondary"
              onClick={() => setIsQRModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="success"
              onClick={handlePaymentSuccess}
              icon={<Check size={18} />}
            >
              I've Paid
            </Button>
          </div>
          
          <div className="mt-4 text-sm text-gray-500">
            <p className="flex items-center justify-center">
              <RefreshCw size={14} className="mr-1" />
              The QR code is valid for this session only
            </p>
          </div>
        </div>
      </Modal>
      
      {/* Redeem Points Modal */}
      <Modal
        isOpen={isRedeemModalOpen}
        onClose={() => setIsRedeemModalOpen(false)}
        title="Redeem Your Points"
        size="md"
      >
        <div>
          <div className="mb-4 p-4 bg-amber-50 rounded-md border border-amber-100">
            <div className="flex justify-between items-center">
              <span className="font-medium">Available Points:</span>
              <span className="font-bold text-amber-600">{currentUser?.points || 0}</span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="font-medium">Maximum Redeemable:</span>
              <span className="font-bold text-green-600">₹{maxRedeemableAmount.toFixed(2)}</span>
            </div>
          </div>
          
          <Input
            id="redeemAmount"
            label="Amount to Redeem (₹)"
            type="number"
            value={redeemAmount || ''}
            onChange={handleRedeemAmountChange}
            placeholder="Enter amount to redeem"
            required
            min={1}
            max={maxRedeemableAmount}
          />
          
          {settings && settings.minRedemptionPoints > 0 && (
            <div className="mt-2 text-sm text-gray-500 flex items-start">
              <AlertCircle size={16} className="mr-1 flex-shrink-0 mt-0.5" />
              <p>
                Minimum {settings.minRedemptionPoints} points required for redemption.
                You can redeem up to ₹{maxRedeemableAmount.toFixed(2)} with your current points.
              </p>
            </div>
          )}
          
          <div className="mt-6 flex justify-end space-x-3">
            <Button
              variant="secondary"
              onClick={() => setIsRedeemModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="success"
              onClick={handleRedeemPoints}
              disabled={redeemAmount <= 0 || redeemAmount > maxRedeemableAmount}
            >
              Redeem Now
            </Button>
          </div>
        </div>
      </Modal>
      
      {/* Coupon Selection Modal */}
      <Modal
        isOpen={isCouponModalOpen}
        onClose={() => setIsCouponModalOpen(false)}
        title="Select Coupon"
        size="md"
      >
        <div>
          {eligibleCoupons.length > 0 ? (
            <div className="space-y-3">
              {eligibleCoupons.map((coupon) => (
                <div
                  key={coupon.id}
                  className="border border-gray-200 rounded-md p-3 hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleSelectCoupon(coupon)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                        {coupon.code}
                      </span>
                      <h3 className="font-medium mt-1">{coupon.title}</h3>
                    </div>
                    <span className="text-green-600 text-sm font-medium">
                      {coupon.discountType === 'percentage'
                        ? `${coupon.discountValue}% off`
                        : coupon.discountType === 'fixed'
                        ? `₹${coupon.discountValue} off`
                        : 'Free item'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{coupon.description}</p>
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>Min order: ₹{coupon.minOrderValue}</span>
                    <span>
                      Expires: {new Date(coupon.expiryDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <AlertCircle size={40} className="mx-auto text-amber-500 mb-2" />
              <p className="text-gray-600">
                No eligible coupons for this amount. Try increasing your order amount.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Minimum order amount required: ₹
                {Math.min(...availableCoupons.map((c) => c.minOrderValue))}
              </p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default PaymentSection;