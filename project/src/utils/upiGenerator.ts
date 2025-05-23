import { Settings } from '../types';
import { getLocalStorageData } from './localStorage';

// Generate UPI payment string
export const generateUpiString = (
  amount: number, 
  description: string = 'Payment to Curry Point'
): string => {
  const settings = getLocalStorageData<Settings>('settings');
  
  const upiParams = new URLSearchParams();
  upiParams.append('pa', settings.upiId);
  upiParams.append('pn', settings.businessName);
  upiParams.append('am', amount.toString());
  upiParams.append('cu', 'INR');
  upiParams.append('tn', description);
  
  return `upi://pay?${upiParams.toString()}`;
};

// Generate QR code URL using QR Server API
export const generateQRCodeUrl = (text: string): string => {
  const encodedText = encodeURIComponent(text);
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodedText}`;
};

// Generate QR code for UPI payment
export const generateUpiQRCode = (
  amount: number,
  description: string = 'Payment to Curry Point'
): string => {
  const upiString = generateUpiString(amount, description);
  return generateQRCodeUrl(upiString);
};