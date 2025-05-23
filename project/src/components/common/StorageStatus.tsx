// src/components/common/StorageStatus.tsx
import React, { useState, useEffect } from 'react';
import { hybridStorage } from '../../services/hybridStorageService';
import Button from './Button';
import { Database, HardDrive, RefreshCw, Wifi, WifiOff, ToggleLeft, ToggleRight } from 'lucide-react';

const StorageStatus: React.FC = () => {
  const [status, setStatus] = useState(hybridStorage.getSyncStatus());
  const [syncing, setSyncing] = useState(false);

  // Update status every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setStatus(hybridStorage.getSyncStatus());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleSyncToMongo = async () => {
    setSyncing(true);
    await hybridStorage.syncToMongo();
    setStatus(hybridStorage.getSyncStatus());
    setSyncing(false);
  };

  const handleSyncFromMongo = async () => {
    setSyncing(true);
    await hybridStorage.syncFromMongo();
    setStatus(hybridStorage.getSyncStatus());
    setSyncing(false);
  };

  const handleToggleMode = async () => {
    const newMode = await hybridStorage.toggleStorageMode();
    setStatus(hybridStorage.getSyncStatus());
  };

  const getModeIcon = () => {
    switch (status.mode) {
      case 'localStorage':
        return <HardDrive size={16} className="text-blue-500" />;
      case 'mongodb':
        return <Database size={16} className="text-green-500" />;
      case 'hybrid':
        return <ToggleRight size={16} className="text-purple-500" />;
      default:
        return <HardDrive size={16} className="text-gray-500" />;
    }
  };

  const getModeColor = () => {
    switch (status.mode) {
      case 'localStorage':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'mongodb':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'hybrid':
        return 'bg-purple-50 border-purple-200 text-purple-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm z-50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900">Storage Status</h3>
        <div className="flex items-center">
          {status.mongoAvailable ? (
            <Wifi size={16} className="text-green-500" />
          ) : (
            <WifiOff size={16} className="text-red-500" />
          )}
        </div>
      </div>

      {/* Current Mode */}
      <div className={`flex items-center justify-between p-2 rounded border ${getModeColor()} mb-3`}>
        <div className="flex items-center">
          {getModeIcon()}
          <span className="ml-2 text-sm font-medium capitalize">
            {status.mode}
          </span>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleToggleMode}
          disabled={status.syncInProgress}
        >
          Switch
        </Button>
      </div>

      {/* MongoDB Status */}
      <div className="text-xs text-gray-600 mb-3">
        <div className="flex justify-between">
          <span>MongoDB:</span>
          <span className={status.mongoAvailable ? 'text-green-600' : 'text-red-600'}>
            {status.mongoAvailable ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Sync Status:</span>
          <span className={status.syncInProgress ? 'text-yellow-600' : 'text-gray-600'}>
            {status.syncInProgress ? 'In Progress...' : 'Idle'}
          </span>
        </div>
      </div>

      {/* Sync Controls */}
      {status.mongoAvailable && (
        <div className="flex space-x-2">
          <Button
            variant="info"
            size="sm"
            onClick={handleSyncToMongo}
            disabled={syncing || status.syncInProgress}
            icon={syncing ? <RefreshCw size={14} className="animate-spin" /> : undefined}
            className="flex-1"
          >
            Push to DB
          </Button>
          <Button
            variant="success"
            size="sm"
            onClick={handleSyncFromMongo}
            disabled={syncing || status.syncInProgress}
            icon={syncing ? <RefreshCw size={14} className="animate-spin" /> : undefined}
            className="flex-1"
          >
            Pull from DB
          </Button>
        </div>
      )}

      {/* Mode Description */}
      <div className="mt-3 text-xs text-gray-500">
        {status.mode === 'localStorage' && (
          <p>Using browser storage only. Changes are local.</p>
        )}
        {status.mode === 'mongodb' && (
          <p>Using MongoDB exclusively. Requires internet.</p>
        )}
        {status.mode === 'hybrid' && (
          <p>Auto-sync between browser and MongoDB.</p>
        )}
      </div>
    </div>
  );
};

export default StorageStatus;