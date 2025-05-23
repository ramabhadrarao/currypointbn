// src/components/admin/MongoSyncStatus.tsx - Updated for localhost
import React, { useState, useEffect } from 'react';
import { hybridStorage } from '../../services/hybridStorageService';
import { mongoService } from '../../services/mongoService';
import Card from '../common/Card';
import Button from '../common/Button';
import { 
  Database, 
  HardDrive, 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Clock,
  Upload,
  Download,
  Activity,
  Server
} from 'lucide-react';

interface SyncStatus {
  mongoConnected: boolean;
  lastSyncAttempt: Date | null;
  lastSuccessfulSync: Date | null;
  syncInProgress: boolean;
  storageMode: string;
  dataStats: {
    customers: number;
    transactions: number;
    coupons: number;
    paymentSlabs: number;
  };
  connectionDetails: {
    uri: string;
    host: string;
    database: string;
    status: 'connected' | 'disconnected' | 'error';
    error?: string;
  };
}

const MongoSyncStatus: React.FC = () => {
  const [status, setStatus] = useState<SyncStatus>({
    mongoConnected: false,
    lastSyncAttempt: null,
    lastSuccessfulSync: null,
    syncInProgress: false,
    storageMode: 'localStorage',
    dataStats: {
      customers: 0,
      transactions: 0,
      coupons: 0,
      paymentSlabs: 0
    },
    connectionDetails: {
      uri: 'mongodb://localhost:27017/currypointNew',
      host: 'localhost:27017',
      database: 'currypointNew',
      status: 'disconnected'
    }
  });

  const [autoRefresh, setAutoRefresh] = useState(true);
  const [logs, setLogs] = useState<string[]>([]);

  // Function to check MongoDB connection and gather status
  const checkMongoStatus = async () => {
    const startTime = new Date();
    
    try {
      // Get hybrid storage status
      const hybridStatus = hybridStorage.getSyncStatus();
      
      // Test MongoDB connection
      const isConnected = await mongoService.initialize();
      
      // Get connection details from service
      const connectionDetails = mongoService.getConnectionDetails();
      
      // Get data counts from localStorage
      const customers = await hybridStorage.getCustomers();
      const transactions = await hybridStorage.getTransactions();
      const coupons = await hybridStorage.getCoupons();
      const paymentSlabs = await hybridStorage.getPaymentSlabs();

      const newStatus: SyncStatus = {
        mongoConnected: isConnected,
        lastSyncAttempt: startTime,
        lastSuccessfulSync: isConnected ? startTime : status.lastSuccessfulSync,
        syncInProgress: hybridStatus.syncInProgress,
        storageMode: hybridStatus.mode,
        dataStats: {
          customers: customers.length,
          transactions: transactions.length,
          coupons: coupons.length,
          paymentSlabs: paymentSlabs.length
        },
        connectionDetails: {
          uri: connectionDetails.uri,
          host: connectionDetails.host,
          database: connectionDetails.database,
          status: isConnected ? 'connected' : 'disconnected'
        }
      };

      setStatus(newStatus);
      
      // Add log entry
      const logMessage = `${startTime.toLocaleTimeString()} - MongoDB ${isConnected ? 'Connected' : 'Disconnected'} (${connectionDetails.host})`;
      setLogs(prev => [logMessage, ...prev.slice(0, 9)]); // Keep last 10 logs
      
    } catch (error) {
      const errorStatus: SyncStatus = {
        ...status,
        mongoConnected: false,
        lastSyncAttempt: startTime,
        connectionDetails: {
          ...status.connectionDetails,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
      
      setStatus(errorStatus);
      
      const errorLog = `${startTime.toLocaleTimeString()} - Error: ${error instanceof Error ? error.message : 'Connection failed'}`;
      setLogs(prev => [errorLog, ...prev.slice(0, 9)]);
    }
  };

  // Auto-refresh every 10 seconds
  useEffect(() => {
    checkMongoStatus(); // Initial check
    
    if (autoRefresh) {
      const interval = setInterval(checkMongoStatus, 10000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // Manual sync functions
  const handleSyncToMongo = async () => {
    setStatus(prev => ({ ...prev, syncInProgress: true }));
    try {
      const success = await hybridStorage.syncToMongo();
      const logMessage = `${new Date().toLocaleTimeString()} - Sync to MongoDB: ${success ? 'SUCCESS' : 'FAILED'}`;
      setLogs(prev => [logMessage, ...prev.slice(0, 9)]);
    } catch (error) {
      const errorLog = `${new Date().toLocaleTimeString()} - Sync Error: ${error instanceof Error ? error.message : 'Unknown'}`;
      setLogs(prev => [errorLog, ...prev.slice(0, 9)]);
    }
    setStatus(prev => ({ ...prev, syncInProgress: false }));
  };

  const handleSyncFromMongo = async () => {
    setStatus(prev => ({ ...prev, syncInProgress: true }));
    try {
      const success = await hybridStorage.syncFromMongo();
      const logMessage = `${new Date().toLocaleTimeString()} - Sync from MongoDB: ${success ? 'SUCCESS' : 'FAILED'}`;
      setLogs(prev => [logMessage, ...prev.slice(0, 9)]);
      
      if (success) {
        // Refresh status after successful sync
        setTimeout(checkMongoStatus, 1000);
      }
    } catch (error) {
      const errorLog = `${new Date().toLocaleTimeString()} - Sync Error: ${error instanceof Error ? error.message : 'Unknown'}`;
      setLogs(prev => [errorLog, ...prev.slice(0, 9)]);
    }
    setStatus(prev => ({ ...prev, syncInProgress: false }));
  };

  const getStatusIcon = () => {
    if (status.syncInProgress) {
      return <RefreshCw size={20} className="animate-spin text-yellow-500" />;
    }
    
    switch (status.connectionDetails.status) {
      case 'connected':
        return <CheckCircle size={20} className="text-green-500" />;
      case 'error':
        return <XCircle size={20} className="text-red-500" />;
      default:
        return <AlertTriangle size={20} className="text-yellow-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status.connectionDetails.status) {
      case 'connected':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">MongoDB Sync Status</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Connection Status Card */}
        <Card title="Connection Status">
          <div className={`p-4 rounded-lg border ${getStatusColor()}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                {getStatusIcon()}
                <span className="ml-2 font-semibold">
                  {status.connectionDetails.status.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center">
                {status.mongoConnected ? (
                  <Wifi size={16} className="text-green-500" />
                ) : (
                  <WifiOff size={16} className="text-red-500" />
                )}
              </div>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="flex items-center">
                  <Server size={14} className="mr-1" />
                  Host:
                </span>
                <span className="font-mono">{status.connectionDetails.host}</span>
              </div>
              <div className="flex justify-between">
                <span className="flex items-center">
                  <Database size={14} className="mr-1" />
                  Database:
                </span>
                <span className="font-mono">{status.connectionDetails.database}</span>
              </div>
              <div className="flex justify-between">
                <span>URI:</span>
                <span className="font-mono text-xs">{status.connectionDetails.uri}</span>
              </div>
              <div className="flex justify-between">
                <span>Storage Mode:</span>
                <span className="font-semibold capitalize">{status.storageMode}</span>
              </div>
              {status.connectionDetails.error && (
                <div className="mt-2 p-2 bg-red-100 rounded text-red-700 text-xs">
                  <strong>Error:</strong> {status.connectionDetails.error}
                </div>
              )}
            </div>
            
            {/* Localhost specific info */}
            <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200">
              <p className="text-xs text-blue-700">
                <strong>Localhost Mode:</strong> Make sure MongoDB is running locally on port 27017
              </p>
            </div>
          </div>
        </Card>

        {/* Data Statistics Card */}
        <Card title="Data Statistics">
          <div className="space-y-3">
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span className="flex items-center">
                <Database size={16} className="mr-2 text-blue-500" />
                Customers
              </span>
              <span className="font-bold">{status.dataStats.customers}</span>
            </div>
            
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span className="flex items-center">
                <Activity size={16} className="mr-2 text-green-500" />
                Transactions
              </span>
              <span className="font-bold">{status.dataStats.transactions}</span>
            </div>
            
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span className="flex items-center">
                <HardDrive size={16} className="mr-2 text-purple-500" />
                Coupons
              </span>
              <span className="font-bold">{status.dataStats.coupons}</span>
            </div>
            
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span className="flex items-center">
                <HardDrive size={16} className="mr-2 text-amber-500" />
                Payment Slabs
              </span>
              <span className="font-bold">{status.dataStats.paymentSlabs}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Sync Controls */}
      <Card title="Sync Controls" className="mb-6">
        <div className="flex flex-wrap gap-3 mb-4">
          <Button
            variant="info"
            onClick={handleSyncToMongo}
            disabled={status.syncInProgress || !status.mongoConnected}
            icon={status.syncInProgress ? <RefreshCw size={16} className="animate-spin" /> : <Upload size={16} />}
          >
            Push to MongoDB
          </Button>
          
          <Button
            variant="success"
            onClick={handleSyncFromMongo}
            disabled={status.syncInProgress || !status.mongoConnected}
            icon={status.syncInProgress ? <RefreshCw size={16} className="animate-spin" /> : <Download size={16} />}
          >
            Pull from MongoDB
          </Button>
          
          <Button
            variant="secondary"
            onClick={checkMongoStatus}
            disabled={status.syncInProgress}
            icon={<RefreshCw size={16} />}
          >
            Refresh Status
          </Button>
          
          <Button
            variant={autoRefresh ? "warning" : "secondary"}
            onClick={() => setAutoRefresh(!autoRefresh)}
            icon={<Clock size={16} />}
          >
            Auto Refresh: {autoRefresh ? "ON" : "OFF"}
          </Button>
        </div>
        
        <div className="text-sm text-gray-600">
          <div className="flex justify-between mb-2">
            <span>Last Sync Attempt:</span>
            <span>{status.lastSyncAttempt ? status.lastSyncAttempt.toLocaleTimeString() : 'Never'}</span>
          </div>
          <div className="flex justify-between">
            <span>Last Successful Sync:</span>
            <span>{status.lastSuccessfulSync ? status.lastSuccessfulSync.toLocaleTimeString() : 'Never'}</span>
          </div>
        </div>
      </Card>

      {/* Activity Logs */}
      <Card title="Activity Logs">
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {logs.length > 0 ? (
            logs.map((log, index) => (
              <div key={index} className="text-sm font-mono p-2 bg-gray-50 rounded border-l-4 border-gray-300">
                {log}
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 py-4">
              No activity logs yet. Logs will appear as sync operations occur.
            </div>
          )}
        </div>
        
        {logs.length > 0 && (
          <div className="mt-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setLogs([])}
            >
              Clear Logs
            </Button>
          </div>
        )}
      </Card>

      {/* MongoDB Setup Instructions */}
      <Card title="MongoDB Setup Instructions">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-800 mb-2">For Localhost MongoDB:</h3>
          <div className="text-sm text-blue-700 space-y-1">
            <p>1. Install MongoDB Community Edition</p>
            <p>2. Start MongoDB service: <code className="bg-blue-100 px-1 rounded">mongod</code></p>
            <p>3. Create database: <code className="bg-blue-100 px-1 rounded">use currypointNew</code></p>
            <p>4. Enable HTTP interface (if required by your setup)</p>
            <p>5. Ensure MongoDB is running on port 27017</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default MongoSyncStatus;