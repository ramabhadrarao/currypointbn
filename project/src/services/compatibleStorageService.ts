// src/services/compatibleStorageService.ts
import { Customer, Transaction, PaymentSlab, Coupon, Settings } from '../types';
import { hybridStorage } from './hybridStorageService';
import { 
  getLocalStorageData as getOriginalLocalData, 
  updateLocalStorageData as updateOriginalLocalData 
} from '../utils/localStorage';

type DataKey = 'customers' | 'transactions' | 'paymentSlabs' | 'coupons' | 'settings';

// Cache for storing the latest data to provide synchronous access
class StorageCache {
  private cache = new Map<DataKey, any>();
  private initialized = false;

  async initialize() {
    if (this.initialized) return;
    
    try {
      // Load initial data from hybrid storage
      const [customers, transactions, paymentSlabs, coupons, settings] = await Promise.all([
        hybridStorage.getCustomers(),
        hybridStorage.getTransactions(), 
        hybridStorage.getPaymentSlabs(),
        hybridStorage.getCoupons(),
        hybridStorage.getSettings()
      ]);

      this.cache.set('customers', customers);
      this.cache.set('transactions', transactions);
      this.cache.set('paymentSlabs', paymentSlabs);
      this.cache.set('coupons', coupons);
      this.cache.set('settings', settings);
      
      this.initialized = true;
      console.log('Storage cache initialized');
    } catch (error) {
      console.warn('Failed to initialize hybrid storage, using localStorage:', error);
      // Fallback to localStorage
      this.cache.set('customers', getOriginalLocalData<Customer[]>('customers'));
      this.cache.set('transactions', getOriginalLocalData<Transaction[]>('transactions'));
      this.cache.set('paymentSlabs', getOriginalLocalData<PaymentSlab[]>('paymentSlabs'));
      this.cache.set('coupons', getOriginalLocalData<Coupon[]>('coupons'));
      this.cache.set('settings', getOriginalLocalData<Settings>('settings'));
      this.initialized = true;
    }
  }

  get<T>(key: DataKey): T {
    if (!this.initialized) {
      // Fallback to original localStorage if not initialized
      return getOriginalLocalData<T>(key);
    }
    return this.cache.get(key) || ([] as unknown as T);
  }

  async set<T>(key: DataKey, data: T): Promise<void> {
    // Update cache immediately for synchronous access
    this.cache.set(key, data);
    
    // Update localStorage immediately for UI reactivity
    updateOriginalLocalData(key, data);
    
    // Async update to hybrid storage (MongoDB if available)
    try {
      switch (key) {
        case 'customers':
          await hybridStorage.saveCustomers(data as Customer[]);
          break;
        case 'transactions':
          await hybridStorage.saveTransactions(data as Transaction[]);
          break;
        case 'paymentSlabs':
          await hybridStorage.savePaymentSlabs(data as PaymentSlab[]);
          break;
        case 'coupons':
          await hybridStorage.saveCoupons(data as Coupon[]);
          break;
        case 'settings':
          await hybridStorage.saveSettings(data as Settings);
          break;
      }
    } catch (error) {
      console.warn(`Failed to save ${key} to hybrid storage:`, error);
    }
  }

  // Refresh cache from hybrid storage
  async refresh(): Promise<void> {
    this.initialized = false;
    await this.initialize();
  }
}

// Create singleton cache instance
const storageCache = new StorageCache();

// Initialize cache when module loads
storageCache.initialize();

// Backward-compatible synchronous API
export const getLocalStorageData = <T>(key: DataKey): T => {
  return storageCache.get<T>(key);
};

export const updateLocalStorageData = <T>(key: DataKey, data: T): void => {
  // Fire and forget - async operation doesn't block UI
  storageCache.set(key, data).catch(error => {
    console.warn(`Background save failed for ${key}:`, error);
  });
};

// Additional utility functions for advanced usage
export const refreshFromCloud = async (): Promise<void> => {
  await storageCache.refresh();
  
  // Trigger storage event to update UI components
  window.dispatchEvent(new StorageEvent('storage', {
    key: 'curryPoint',
    newValue: localStorage.getItem('curryPoint'),
  }));
};

export const syncToCloud = async (): Promise<boolean> => {
  return hybridStorage.syncToMongo();
};

export const getStorageStatus = () => {
  return hybridStorage.getSyncStatus();
};

// Export hybrid storage for direct access when needed
export { hybridStorage } from './hybridStorageService';