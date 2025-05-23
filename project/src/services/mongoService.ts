// src/services/mongoService.ts - Updated for localhost
import { Customer, Transaction, PaymentSlab, Coupon, Settings } from '../types';

interface MongoDocument {
  _id?: string;
  [key: string]: any;
}

class MongoService {
  private baseUrl: string;
  private isConnected: boolean = false;
  private mongoUri: string;

  constructor() {
    // Use environment variable or fallback to localhost
    this.mongoUri = import.meta.env.VITE_MONGO_URI || 'mongodb://localhost:27017/currypointNew';
    
    // Extract host and port from MongoDB URI for HTTP API calls
    const url = new URL(this.mongoUri.replace('mongodb://', 'http://'));
    this.baseUrl = `http://${url.hostname}:${url.port || '27017'}`;
    
    console.log('MongoDB Service initialized with URI:', this.mongoUri);
    console.log('HTTP API Base URL:', this.baseUrl);
  }

  // Initialize connection and test connectivity
  async initialize(): Promise<boolean> {
    try {
      // Test connection with a simple ping to the database
      const response = await fetch(`${this.baseUrl}/currypointNew/ping`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
          // No Authorization header for localhost
        }
      });
      
      this.isConnected = response.ok;
      console.log(`MongoDB connection test: ${this.isConnected ? 'SUCCESS' : 'FAILED'}`);
      return this.isConnected;
    } catch (error) {
      console.warn('MongoDB connection failed, falling back to localStorage:', error);
      this.isConnected = false;
      return false;
    }
  }

  // Generic method to fetch data from MongoDB
  private async fetchFromMongo<T>(collection: string): Promise<T[]> {
    try {
      if (!this.isConnected) {
        throw new Error('MongoDB not connected');
      }

      const response = await fetch(`${this.baseUrl}/currypointNew/${collection}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
          // No Authorization for localhost
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error(`Error fetching ${collection}:`, error);
      throw error;
    }
  }

  // Generic method to save data to MongoDB
  private async saveToMongo<T>(collection: string, data: T[]): Promise<boolean> {
    try {
      if (!this.isConnected) {
        throw new Error('MongoDB not connected');
      }

      const response = await fetch(`${this.baseUrl}/currypointNew/${collection}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
          // No Authorization for localhost
        },
        body: JSON.stringify(data)
      });

      return response.ok;
    } catch (error) {
      console.error(`Error saving ${collection}:`, error);
      return false;
    }
  }

  // Generic method to update single document in MongoDB
  private async updateInMongo<T extends { id: number }>(
    collection: string, 
    item: T
  ): Promise<boolean> {
    try {
      if (!this.isConnected) {
        throw new Error('MongoDB not connected');
      }

      const response = await fetch(`${this.baseUrl}/currypointNew/${collection}/${item.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
          // No Authorization for localhost
        },
        body: JSON.stringify(item)
      });

      return response.ok;
    } catch (error) {
      console.error(`Error updating ${collection}:`, error);
      return false;
    }
  }

  // Generic method to delete from MongoDB
  private async deleteFromMongo(collection: string, id: number): Promise<boolean> {
    try {
      if (!this.isConnected) {
        throw new Error('MongoDB not connected');
      }

      const response = await fetch(`${this.baseUrl}/currypointNew/${collection}/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
          // No Authorization for localhost
        }
      });

      return response.ok;
    } catch (error) {
      console.error(`Error deleting from ${collection}:`, error);
      return false;
    }
  }

  // Specific methods for each collection
  async getCustomers(): Promise<Customer[]> {
    return this.fetchFromMongo<Customer>('customers');
  }

  async saveCustomers(customers: Customer[]): Promise<boolean> {
    return this.saveToMongo('customers', customers);
  }

  async updateCustomer(customer: Customer): Promise<boolean> {
    return this.updateInMongo('customers', customer);
  }

  async deleteCustomer(id: number): Promise<boolean> {
    return this.deleteFromMongo('customers', id);
  }

  async getTransactions(): Promise<Transaction[]> {
    return this.fetchFromMongo<Transaction>('transactions');
  }

  async saveTransactions(transactions: Transaction[]): Promise<boolean> {
    return this.saveToMongo('transactions', transactions);
  }

  async addTransaction(transaction: Transaction): Promise<boolean> {
    return this.updateInMongo('transactions', transaction);
  }

  async getPaymentSlabs(): Promise<PaymentSlab[]> {
    return this.fetchFromMongo<PaymentSlab>('paymentSlabs');
  }

  async savePaymentSlabs(slabs: PaymentSlab[]): Promise<boolean> {
    return this.saveToMongo('paymentSlabs', slabs);
  }

  async getCoupons(): Promise<Coupon[]> {
    return this.fetchFromMongo<Coupon>('coupons');
  }

  async saveCoupons(coupons: Coupon[]): Promise<boolean> {
    return this.saveToMongo('coupons', coupons);
  }

  async updateCoupon(coupon: Coupon): Promise<boolean> {
    return this.updateInMongo('coupons', coupon);
  }

  async deleteCoupon(id: number): Promise<boolean> {
    return this.deleteFromMongo('coupons', id);
  }

  async getSettings(): Promise<Settings | null> {
    try {
      const settings = await this.fetchFromMongo<Settings>('settings');
      return settings.length > 0 ? settings[0] : null;
    } catch (error) {
      console.error('Error fetching settings:', error);
      return null;
    }
  }

  async saveSettings(settings: Settings): Promise<boolean> {
    return this.saveToMongo('settings', [settings]);
  }

  // Sync localStorage data to MongoDB
  async syncToMongo(): Promise<boolean> {
    try {
      const localData = localStorage.getItem('curryPoint');
      if (!localData) return false;

      const data = JSON.parse(localData);
      
      const promises = [
        this.saveCustomers(data.customers),
        this.saveTransactions(data.transactions),
        this.savePaymentSlabs(data.paymentSlabs),
        this.saveCoupons(data.coupons),
        this.saveSettings(data.settings)
      ];

      const results = await Promise.all(promises);
      return results.every(result => result === true);
    } catch (error) {
      console.error('Error syncing to MongoDB:', error);
      return false;
    }
  }

  // Sync MongoDB data to localStorage
  async syncFromMongo(): Promise<boolean> {
    try {
      const [customers, transactions, paymentSlabs, coupons, settings] = await Promise.all([
        this.getCustomers(),
        this.getTransactions(),
        this.getPaymentSlabs(),
        this.getCoupons(),
        this.getSettings()
      ]);

      const data = {
        customers,
        transactions,
        paymentSlabs,
        coupons,
        settings: settings || {}
      };

      localStorage.setItem('curryPoint', JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Error syncing from MongoDB:', error);
      return false;
    }
  }

  // Check if MongoDB is connected
  isMongoConnected(): boolean {
    return this.isConnected;
  }

  // Get connection details for status display
  getConnectionDetails() {
    return {
      uri: this.mongoUri,
      host: 'localhost:27017',
      database: 'currypointNew',
      isConnected: this.isConnected
    };
  }
}

// Export singleton instance
export const mongoService = new MongoService();