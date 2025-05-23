// src/services/hybridStorageService.ts
import { Customer, Transaction, PaymentSlab, Coupon, Settings } from '../types';
import { mongoService } from './mongoService';
import { 
  getLocalStorageData as getLocalData, 
  updateLocalStorageData as updateLocalData,
  initializeLocalStorage 
} from '../utils/localStorage';

type StorageMode = 'localStorage' | 'mongodb' | 'hybrid';

class HybridStorageService {
  private mode: StorageMode = 'hybrid';
  private isMongoAvailable: boolean = false;
  private syncInProgress: boolean = false;

  constructor() {
    this.initialize();
  }

  async initialize(): Promise<void> {
    // Initialize localStorage first (always available)
    initializeLocalStorage();
    
    // Try to connect to MongoDB
    try {
      this.isMongoAvailable = await mongoService.initialize();
      console.log(`MongoDB connection: ${this.isMongoAvailable ? 'SUCCESS' : 'FAILED'}`);
      
      if (this.isMongoAvailable) {
        // Try to sync data from MongoDB to localStorage on startup
        await this.syncFromMongo();
      }
    } catch (error) {
      console.warn('MongoDB initialization failed:', error);
      this.isMongoAvailable = false;
    }
  }

  // Set storage mode
  setMode(mode: StorageMode): void {
    this.mode = mode;
  }

  // Get current storage mode
  getMode(): StorageMode {
    return this.mode;
  }

  // Check if MongoDB is available
  isMongoDBAvailable(): boolean {
    return this.isMongoAvailable;
  }

  // Generic get method with fallback
  private async getData<T>(key: keyof typeof this.collectionMap): Promise<T> {
    if (this.mode === 'localStorage' || !this.isMongoAvailable) {
      return getLocalData<T>(key);
    }

    if (this.mode === 'mongodb') {
      try {
        const mongoData = await this.getFromMongo<T>(key);
        return mongoData;
      } catch (error) {
        console.warn(`MongoDB fetch failed for ${key}, falling back to localStorage:`, error);
        return getLocalData<T>(key);
      }
    }

    // Hybrid mode: try MongoDB first, fallback to localStorage
    try {
      const mongoData = await this.getFromMongo<T>(key);
      return mongoData;
    } catch (error) {
      console.warn(`MongoDB fetch failed for ${key}, using localStorage:`, error);
      return getLocalData<T>(key);
    }
  }

  // Generic save method with sync
  private async saveData<T>(key: keyof typeof this.collectionMap, data: T): Promise<boolean> {
    // Always save to localStorage first (for immediate UI updates)
    updateLocalData(key, data);

    // If MongoDB is available and mode allows it, save there too
    if (this.isMongoAvailable && (this.mode === 'mongodb' || this.mode === 'hybrid')) {
      try {
        const success = await this.saveToMongo(key, data);
        if (!success) {
          console.warn(`MongoDB save failed for ${key}`);
        }
        return success;
      } catch (error) {
        console.warn(`MongoDB save error for ${key}:`, error);
        return false;
      }
    }

    return true;
  }

  // Collection mapping for MongoDB operations
  private collectionMap = {
    customers: () => mongoService.getCustomers(),
    transactions: () => mongoService.getTransactions(),
    paymentSlabs: () => mongoService.getPaymentSlabs(),
    coupons: () => mongoService.getCoupons(),
    settings: () => mongoService.getSettings().then(s => s || {})
  };

  private async getFromMongo<T>(key: keyof typeof this.collectionMap): Promise<T> {
    const getter = this.collectionMap[key];
    return await getter() as T;
  }

  private async saveToMongo<T>(key: keyof typeof this.collectionMap, data: T): Promise<boolean> {
    switch (key) {
      case 'customers':
        return mongoService.saveCustomers(data as Customer[]);
      case 'transactions':
        return mongoService.saveTransactions(data as Transaction[]);
      case 'paymentSlabs':
        return mongoService.savePaymentSlabs(data as PaymentSlab[]);
      case 'coupons':
        return mongoService.saveCoupons(data as Coupon[]);
      case 'settings':
        return mongoService.saveSettings(data as Settings);
      default:
        return false;
    }
  }

  // Public API methods
  async getCustomers(): Promise<Customer[]> {
    return this.getData<Customer[]>('customers');
  }

  async saveCustomers(customers: Customer[]): Promise<boolean> {
    return this.saveData('customers', customers);
  }

  async getTransactions(): Promise<Transaction[]> {
    return this.getData<Transaction[]>('transactions');
  }

  async saveTransactions(transactions: Transaction[]): Promise<boolean> {
    return this.saveData('transactions', transactions);
  }

  async getPaymentSlabs(): Promise<PaymentSlab[]> {
    return this.getData<PaymentSlab[]>('paymentSlabs');
  }

  async savePaymentSlabs(slabs: PaymentSlab[]): Promise<boolean> {
    return this.saveData('paymentSlabs', slabs);
  }

  async getCoupons(): Promise<Coupon[]> {
    return this.getData<Coupon[]>('coupons');
  }

  async saveCoupons(coupons: Coupon[]): Promise<boolean> {
    return this.saveData('coupons', coupons);
  }

  async getSettings(): Promise<Settings> {
    return this.getData<Settings>('settings');
  }

  async saveSettings(settings: Settings): Promise<boolean> {
    return this.saveData('settings', settings);
  }

  // Sync methods
  async syncToMongo(): Promise<boolean> {
    if (!this.isMongoAvailable || this.syncInProgress) {
      return false;
    }

    this.syncInProgress = true;
    try {
      const success = await mongoService.syncToMongo();
      console.log(`Sync to MongoDB: ${success ? 'SUCCESS' : 'FAILED'}`);
      return success;
    } catch (error) {
      console.error('Sync to MongoDB failed:', error);
      return false;
    } finally {
      this.syncInProgress = false;
    }
  }

  async syncFromMongo(): Promise<boolean> {
    if (!this.isMongoAvailable || this.syncInProgress) {
      return false;
    }

    this.syncInProgress = true;
    try {
      const success = await mongoService.syncFromMongo();
      console.log(`Sync from MongoDB: ${success ? 'SUCCESS' : 'FAILED'}`);
      
      // Trigger storage event to update UI
      if (success) {
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'curryPoint',
          newValue: localStorage.getItem('curryPoint'),
        }));
      }
      
      return success;
    } catch (error) {
      console.error('Sync from MongoDB failed:', error);
      return false;
    } finally {
      this.syncInProgress = false;
    }
  }

  // Get sync status
  getSyncStatus(): {
    mode: StorageMode;
    mongoAvailable: boolean;
    syncInProgress: boolean;
  } {
    return {
      mode: this.mode,
      mongoAvailable: this.isMongoAvailable,
      syncInProgress: this.syncInProgress
    };
  }

  // Manual toggle between storage modes
  async toggleStorageMode(): Promise<StorageMode> {
    if (this.mode === 'localStorage') {
      this.mode = this.isMongoAvailable ? 'mongodb' : 'localStorage';
    } else if (this.mode === 'mongodb') {
      this.mode = 'hybrid';
    } else {
      this.mode = 'localStorage';
    }

    console.log(`Storage mode changed to: ${this.mode}`);
    return this.mode;
  }
}

// Export singleton instance
export const hybridStorage = new HybridStorageService();

// Export for backward compatibility (drop-in replacement)
export const getLocalStorageData = <T>(key: keyof typeof hybridStorage.collectionMap): Promise<T> => {
  switch (key) {
    case 'customers': return hybridStorage.getCustomers() as Promise<T>;
    case 'transactions': return hybridStorage.getTransactions() as Promise<T>;
    case 'paymentSlabs': return hybridStorage.getPaymentSlabs() as Promise<T>;
    case 'coupons': return hybridStorage.getCoupons() as Promise<T>;
    case 'settings': return hybridStorage.getSettings() as Promise<T>;
    default: return Promise.resolve({} as T);
  }
};

export const updateLocalStorageData = async <T>(
  key: keyof typeof hybridStorage.collectionMap, 
  data: T
): Promise<boolean> => {
  switch (key) {
    case 'customers': return hybridStorage.saveCustomers(data as Customer[]);
    case 'transactions': return hybridStorage.saveTransactions(data as Transaction[]);
    case 'paymentSlabs': return hybridStorage.savePaymentSlabs(data as PaymentSlab[]);
    case 'coupons': return hybridStorage.saveCoupons(data as Coupon[]);
    case 'settings': return hybridStorage.saveSettings(data as Settings);
    default: return Promise.resolve(false);
  }
};