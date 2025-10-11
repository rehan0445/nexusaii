import React, { useState, useEffect, useCallback } from 'react';
import { Bug, Database, Settings } from 'lucide-react';

interface DebugPanelProps {
  readonly isVisible: boolean;
  readonly onToggle: () => void;
}

export function DebugPanel({ isVisible, onToggle }: DebugPanelProps) {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [localStorageStatus, setLocalStorageStatus] = useState<string>('Unknown');

  const updateDebugInfo = useCallback(() => {
    // Check localStorage
    let localStorageAvailable = false;
    let favoritesData = null;
    let searchHistoryData = null;

    try {
      const testKey = '__test_key__';
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
      localStorageAvailable = true;

      const favorites = localStorage.getItem('favorites');
      const searchHistory = localStorage.getItem('searchHistory');

      if (favorites) {
        favoritesData = JSON.parse(favorites);
      }
      if (searchHistory) {
        searchHistoryData = JSON.parse(searchHistory);
      }
    } catch (error) {
      localStorageAvailable = false;
      console.warn('LocalStorage test failed:', error);
    }

    setLocalStorageStatus(localStorageAvailable ? 'Available' : 'Not Available');

    // Test backend connection
    testBackendConnection().then(backendStatus => {
      setDebugInfo({
        localStorage: {
          available: localStorageAvailable,
          status: localStorageAvailable ? 'Available' : 'Not Available',
          favorites: favoritesData,
          searchHistory: searchHistoryData
        },
        backend: backendStatus,
        timestamp: new Date().toISOString()
      });
    });
  }, []);

  useEffect(() => {
    if (isVisible) {
      updateDebugInfo();
    }
  }, [isVisible, updateDebugInfo]);

  const testBackendConnection = async () => {
    try {
      const response = await fetch('/api/');
      return {
        status: 'Connected',
        response: response.status,
        data: await response.text()
      };
    } catch (error) {
      console.warn('Backend connection test failed:', error);
      return {
        status: 'Failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  const clearFavorites = () => {
    try {
      localStorage.removeItem('favorites');
      updateDebugInfo();
      alert('Favorites cleared!');
    } catch (error) {
      console.error('Failed to clear favorites:', error);
      alert('Failed to clear favorites');
    }
  };

  const clearSearchHistory = () => {
    try {
      localStorage.removeItem('searchHistory');
      updateDebugInfo();
      alert('Search history cleared!');
    } catch (error) {
      console.error('Failed to clear search history:', error);
      alert('Failed to clear search history');
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-28 right-4 w-96 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
      <div className="p-4 border-b border-zinc-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bug className="w-5 h-5 text-gold" />
            <h3 className="text-white font-semibold">Debug Panel</h3>
          </div>
          <button
            onClick={onToggle}
            className="text-zinc-400 hover:text-white"
          >
            ×
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* LocalStorage Status */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-blue-400" />
            <span className="text-white font-medium">LocalStorage</span>
            <span className={`px-2 py-1 rounded text-xs ${
              localStorageStatus === 'Available' 
                ? 'bg-green-500/20 text-green-400' 
                : 'bg-red-500/20 text-red-400'
            }`}>
              {localStorageStatus}
            </span>
          </div>
          
          {debugInfo.localStorage && (
            <div className="text-sm text-zinc-300 space-y-1">
              <div>Favorites: {Array.isArray(debugInfo.localStorage.favorites) ? debugInfo.localStorage.favorites.length : 0} items</div>
              <div>Search History: {Array.isArray(debugInfo.localStorage.searchHistory) ? debugInfo.localStorage.searchHistory.length : 0} items</div>
            </div>
          )}
        </div>

        {/* Backend Status */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Settings className="w-4 h-4 text-purple-400" />
            <span className="text-white font-medium">Backend</span>
            {debugInfo.backend && (
              <span className={`px-2 py-1 rounded text-xs ${
                debugInfo.backend.status === 'Connected' 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {debugInfo.backend.status}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <div className="text-white font-medium">Actions</div>
          <div className="flex space-x-2">
            <button
              onClick={clearFavorites}
              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
            >
              Clear Favorites
            </button>
            <button
              onClick={clearSearchHistory}
              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
            >
              Clear History
            </button>
            <button
              onClick={updateDebugInfo}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Raw Data */}
        <div className="space-y-2">
          <div className="text-white font-medium">Raw Data</div>
          <pre className="text-xs text-zinc-400 bg-zinc-800 p-2 rounded overflow-x-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
} 