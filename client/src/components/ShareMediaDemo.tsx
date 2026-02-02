import React, { useState } from 'react';
import { Upload, MessageSquare, FileText, Image, Camera, MapPin, Vote } from 'lucide-react';
import ShareMediaModal from './ShareMediaModal';

interface SharedMedia {
  id: string;
  type: 'image' | 'document' | 'camera' | 'location' | 'poll';
  content?: string;
  files?: File[];
  location?: {
    lat: number;
    lng: number;
    address: string;
  };
  poll?: {
    question: string;
    options: string[];
    duration?: number;
  };
  timestamp: Date;
}

export default function ShareMediaDemo() {
  const [showShareMedia, setShowShareMedia] = useState(false);
  const [sharedMedia, setSharedMedia] = useState<SharedMedia[]>([]);

  const handleMediaShared = (mediaData: any) => {
    const newMedia: SharedMedia = {
      id: `media_${Date.now()}`,
      ...mediaData,
      timestamp: new Date()
    };
    
    setSharedMedia(prev => [newMedia, ...prev]);
    console.log('Media shared:', mediaData);
  };

  const getMediaIcon = (type: string) => {
    switch (type) {
      case 'image':
      case 'camera':
        return <Image className="w-5 h-5 text-blue-500" />;
      case 'document':
        return <FileText className="w-5 h-5 text-green-500" />;
      case 'location':
        return <MapPin className="w-5 h-5 text-red-500" />;
      case 'poll':
        return <Vote className="w-5 h-5 text-purple-500" />;
      default:
        return <Upload className="w-5 h-5 text-zinc-500" />;
    }
  };

  const getMediaPreview = (media: SharedMedia) => {
    switch (media.type) {
      case 'image':
      case 'camera':
        if (media.files && media.files.length > 0) {
          return (
            <div className="flex flex-wrap gap-2">
              {media.files.map((file, index) => (
                <img
                  key={index}
                  src={URL.createObjectURL(file)}
                  alt="Preview"
                  className="w-16 h-16 object-cover rounded-lg"
                />
              ))}
            </div>
          );
        }
        return <span className="text-zinc-400">No files</span>;
      
      case 'document':
        if (media.files && media.files.length > 0) {
          return (
            <div className="space-y-1">
              {media.files.map((file, index) => (
                <div key={index} className="flex items-center space-x-2 text-sm">
                  <FileText className="w-4 h-4 text-green-500" />
                  <span className="text-zinc-300">{file.name}</span>
                  <span className="text-zinc-500">
                    ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
              ))}
            </div>
          );
        }
        return <span className="text-zinc-400">No files</span>;
      
      case 'location':
        if (media.location) {
          return (
            <div className="text-sm">
              <div className="text-zinc-300">{media.location.address}</div>
              <div className="text-zinc-500">
                {media.location.lat.toFixed(6)}, {media.location.lng.toFixed(6)}
              </div>
            </div>
          );
        }
        return <span className="text-zinc-400">No location</span>;
      
      case 'poll':
        if (media.poll) {
          return (
            <div className="text-sm">
              <div className="text-zinc-300 font-medium">{media.poll.question}</div>
              <div className="text-zinc-500">
                {media.poll.options.length} options • {media.poll.duration}h duration
              </div>
            </div>
          );
        }
        return <span className="text-zinc-400">No poll data</span>;
      
      default:
        return <span className="text-zinc-400">Unknown type</span>;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Share Media Demo</h1>
          <p className="text-zinc-400">
            Test the comprehensive media sharing functionality with images, documents, camera, location, and polls
          </p>
        </div>

        {/* Demo Controls */}
        <div className="bg-zinc-800 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Media Sharing</h2>
            <button
              onClick={() => setShowShareMedia(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-lg transition-all duration-300 flex items-center space-x-2"
            >
              <Upload className="w-5 h-5" />
              <span>Share Media</span>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-zinc-700/50 rounded-lg">
              <Image className="w-8 h-8 mx-auto mb-2 text-blue-500" />
              <div className="text-sm font-medium">Images</div>
              <div className="text-xs text-zinc-400">Upload from device</div>
            </div>
            <div className="text-center p-4 bg-zinc-700/50 rounded-lg">
              <FileText className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <div className="text-sm font-medium">Documents</div>
              <div className="text-xs text-zinc-400">PDFs, docs, etc.</div>
            </div>
            <div className="text-center p-4 bg-zinc-700/50 rounded-lg">
              <Camera className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
              <div className="text-sm font-medium">Camera</div>
              <div className="text-xs text-zinc-400">Take photos</div>
            </div>
            <div className="text-center p-4 bg-zinc-700/50 rounded-lg">
              <MapPin className="w-8 h-8 mx-auto mb-2 text-red-500" />
              <div className="text-sm font-medium">Location</div>
              <div className="text-xs text-zinc-400">Share your location</div>
            </div>
            <div className="text-center p-4 bg-zinc-700/50 rounded-lg">
              <Vote className="w-8 h-8 mx-auto mb-2 text-purple-500" />
              <div className="text-sm font-medium">Polls</div>
              <div className="text-xs text-zinc-400">Create polls</div>
            </div>
          </div>
        </div>

        {/* Shared Media History */}
        <div className="bg-zinc-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Shared Media History</h2>
          
          {sharedMedia.length === 0 ? (
            <div className="text-center py-12 text-zinc-400">
              <Upload className="w-12 h-12 mx-auto mb-4 text-zinc-500" />
              <p>No media shared yet. Click "Share Media" to get started!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sharedMedia.map((media) => (
                <div key={media.id} className="bg-zinc-700/50 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    {getMediaIcon(media.type)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium capitalize">{media.type}</h3>
                        <span className="text-xs text-zinc-400">
                          {media.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      
                      {media.content && (
                        <p className="text-zinc-300 mb-3">{media.content}</p>
                      )}
                      
                      <div className="bg-zinc-800/50 rounded-lg p-3">
                        {getMediaPreview(media)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Share Media Modal */}
      <ShareMediaModal
        isOpen={showShareMedia}
        onClose={() => setShowShareMedia(false)}
        onMediaShared={handleMediaShared}
        context="post"
      />
    </div>
  );
}
