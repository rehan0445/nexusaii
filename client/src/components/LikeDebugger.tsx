import React, { useState, useEffect } from 'react';
import { Heart, AlertCircle, CheckCircle, Loader } from 'lucide-react';

interface LikeDebuggerProps {
  slug: string;
  characterName: string;
  characterId: number;
  onLike: (e: React.MouseEvent, slug: string) => void;
  likeCount: number;
  userLiked: boolean;
  loading: boolean;
}

export const LikeDebugger: React.FC<LikeDebuggerProps> = ({
  slug,
  characterName,
  characterId,
  onLike,
  likeCount,
  userLiked,
  loading
}) => {
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [testResults, setTestResults] = useState<{
    backendReachable: boolean;
    characterDataValid: boolean;
    authStatus: boolean;
  }>({
    backendReachable: false,
    characterDataValid: false,
    authStatus: false,
  });

  const addDebugInfo = (info: string) => {
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${info}`]);
  };

  const testBackendConnection = async () => {
    try {
      addDebugInfo('Testing backend connection...');
      const response = await fetch('/api/v1/character/1/likes');
      if (response.ok) {
        setTestResults(prev => ({ ...prev, backendReachable: true }));
        addDebugInfo('✅ Backend is reachable');
      } else {
        addDebugInfo('❌ Backend responded with error');
      }
    } catch (error) {
      addDebugInfo('❌ Backend connection failed');
      console.error('Backend test error:', error);
    }
  };

  const testCharacterData = () => {
    if (characterId && characterId > 0) {
      setTestResults(prev => ({ ...prev, characterDataValid: true }));
      addDebugInfo('✅ Character data is valid');
    } else {
      addDebugInfo('❌ Character data is invalid');
    }
  };

  useEffect(() => {
    testBackendConnection();
    testCharacterData();
    addDebugInfo(`Character: ${characterName} (ID: ${characterId})`);
    addDebugInfo(`Current like count: ${likeCount}`);
    addDebugInfo(`User liked: ${userLiked}`);
  }, [characterName, characterId, likeCount, userLiked]);

  return (
    <div className="p-4 border border-gray-300 rounded-lg m-2 bg-gray-50">
      <h3 className="text-lg font-bold mb-2">{characterName} - Debug Info</h3>
      
      {/* Test Results */}
      <div className="mb-4">
        <div className="flex items-center space-x-2 mb-1">
          {testResults.backendReachable ? (
            <CheckCircle className="w-4 h-4 text-green-500" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-500" />
          )}
          <span className="text-sm">Backend Connection</span>
        </div>
        <div className="flex items-center space-x-2 mb-1">
          {testResults.characterDataValid ? (
            <CheckCircle className="w-4 h-4 text-green-500" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-500" />
          )}
          <span className="text-sm">Character Data</span>
        </div>
      </div>

      {/* Like Button */}
      <div className="flex items-center space-x-4 mb-4">
        <button
          onClick={(e) => {
            addDebugInfo('Like button clicked');
            onLike(e, slug);
          }}
          disabled={loading}
          className={`p-2 rounded-full transition-all ${
            userLiked
              ? "bg-red-500 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {loading ? (
            <Loader className="w-4 h-4 animate-spin" />
          ) : (
            <Heart className="w-4 h-4" fill={userLiked ? "currentColor" : "none"} />
          )}
        </button>
        <span className="text-sm">Likes: {likeCount}</span>
      </div>

      {/* Debug Log */}
      <div className="bg-black text-green-400 p-2 rounded text-xs max-h-32 overflow-y-auto">
        {debugInfo.map((info, index) => (
          <div key={index}>{info}</div>
        ))}
      </div>

      {/* Troubleshooting Tips */}
      {!testResults.backendReachable && (
        <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded">
          <h4 className="font-bold text-yellow-800 mb-2">Troubleshooting:</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Make sure the backend server is running on port 8002</li>
            <li>• Run: <code>cd nexus/server && npm run dev</code></li>
            <li>• Check if the server is accessible at {import.meta.env.VITE_SERVER_URL || window.location.origin}</li>
          </ul>
        </div>
      )}
    </div>
  );
}; 