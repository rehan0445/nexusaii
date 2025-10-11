import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Image, 
  FileText, 
  Camera, 
  MapPin, 
  Vote, 
  Upload, 
  Plus, 
  Trash2,
  Send,
  Loader2,
  CheckCircle,
  AlertCircle,
  Map,
  File,
  ImageIcon,
  CameraIcon,
  MapPinIcon,
  VoteIcon
} from 'lucide-react';

interface ShareMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMediaShared: (mediaData: any) => void;
  context?: 'post' | 'chat';
}

interface MediaData {
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
}

export default function ShareMediaModal({ isOpen, onClose, onMediaShared, context = 'post' }: ShareMediaModalProps) {
  const [selectedType, setSelectedType] = useState<'image' | 'document' | 'camera' | 'location' | 'poll' | null>(null);
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [location, setLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [pollData, setPollData] = useState({
    question: '',
    options: ['', ''],
    duration: 24 // hours
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  const mediaOptions = [
    { id: 'image', name: 'Image', icon: ImageIcon, description: 'Upload images from your device' },
    { id: 'document', name: 'Document', icon: FileText, description: 'Share PDFs, docs, and other files' },
    { id: 'camera', name: 'Camera', icon: CameraIcon, description: 'Take a photo with your camera' },
    { id: 'location', name: 'Location', icon: MapPinIcon, description: 'Share your current location' },
    { id: 'poll', name: 'Poll', icon: VoteIcon, description: 'Create a poll for others to vote' }
  ];

  const handleTypeSelect = (type: 'image' | 'document' | 'camera' | 'location' | 'poll') => {
    setSelectedType(type);
    setError('');
    
    switch (type) {
      case 'image':
        fileInputRef.current?.click();
        break;
      case 'camera':
        cameraInputRef.current?.click();
        break;
      case 'document':
        documentInputRef.current?.click();
        break;
      case 'location':
        handleLocationShare();
        break;
      case 'poll':
        // Just set the type, poll creation UI will show
        break;
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'document') => {
    const uploadedFiles = Array.from(event.target.files || []);
    
    if (uploadedFiles.length === 0) return;

    // Validate file types
    const validTypes = type === 'image' 
      ? ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      : ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];

    const invalidFiles = uploadedFiles.filter(file => !validTypes.includes(file.type));
    if (invalidFiles.length > 0) {
      setError(`Invalid file type(s): ${invalidFiles.map(f => f.name).join(', ')}`);
      return;
    }

    // Validate file sizes (10MB for images, 50MB for documents)
    const maxSize = type === 'image' ? 10 * 1024 * 1024 : 50 * 1024 * 1024;
    const oversizedFiles = uploadedFiles.filter(file => file.size > maxSize);
    if (oversizedFiles.length > 0) {
      setError(`File(s) too large: ${oversizedFiles.map(f => f.name).join(', ')}`);
      return;
    }

    setFiles(uploadedFiles);
    setSelectedType(type);
    setError('');
  };

  const handleLocationShare = async () => {
    setLocationLoading(true);
    setError('');

    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by this browser');
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        });
      });

      const { latitude, longitude } = position.coords;
      
      // Get address from coordinates using reverse geocoding
      const address = await getAddressFromCoords(latitude, longitude);
      
      setLocation({ lat: latitude, lng: longitude, address });
      setSelectedType('location');
    } catch (err: any) {
      setError(err.message || 'Failed to get location');
    } finally {
      setLocationLoading(false);
    }
  };

  const getAddressFromCoords = async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      const data = await response.json();
      return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } catch (error) {
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  };

  const addPollOption = () => {
    if (pollData.options.length < 6) {
      setPollData(prev => ({
        ...prev,
        options: [...prev.options, '']
      }));
    }
  };

  const removePollOption = (index: number) => {
    if (pollData.options.length > 2) {
      setPollData(prev => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== index)
      }));
    }
  };

  const updatePollOption = (index: number, value: string) => {
    setPollData(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => i === index ? value : opt)
    }));
  };

  const handleSubmit = async () => {
    if (!selectedType) return;

    setIsLoading(true);
    setError('');

    try {
      let mediaData: MediaData = { type: selectedType };

      switch (selectedType) {
        case 'image':
        case 'document':
        case 'camera':
          if (files.length === 0) {
            throw new Error('Please select at least one file');
          }
          mediaData.files = files;
          mediaData.content = content;
          break;

        case 'location':
          if (!location) {
            throw new Error('Location not available');
          }
          mediaData.location = location;
          mediaData.content = content;
          break;

        case 'poll':
          if (!pollData.question.trim()) {
            throw new Error('Please enter a poll question');
          }
          const validOptions = pollData.options.filter(opt => opt.trim());
          if (validOptions.length < 2) {
            throw new Error('Please provide at least 2 poll options');
          }
          mediaData.poll = {
            question: pollData.question,
            options: validOptions,
            duration: pollData.duration
          };
          mediaData.content = content;
          break;
      }

      onMediaShared(mediaData);
      handleClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedType(null);
    setContent('');
    setFiles([]);
    setLocation(null);
    setPollData({ question: '', options: ['', ''], duration: 24 });
    setError('');
    setIsLoading(false);
    setLocationLoading(false);
    onClose();
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md sm:max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-700 bg-zinc-800/50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Upload className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-bold text-white">Share Media</h2>
          </div>
          
          <button
            onClick={handleClose}
            className="p-2 hover:bg-zinc-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 max-h-[calc(85vh-80px)] overflow-y-auto">
          {!selectedType ? (
            // Media Type Selection
            <div className="space-y-3">
              <p className="text-zinc-300 text-sm">Choose what you'd like to share:</p>
              <div className="grid grid-cols-1 gap-3">
                {mediaOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleTypeSelect(option.id as any)}
                    className="flex items-center space-x-3 p-3 bg-zinc-800 border border-zinc-700 rounded-lg hover:bg-zinc-700 transition-colors text-left"
                  >
                    <div className="w-10 h-10 bg-zinc-700 rounded-lg flex items-center justify-center">
                      <option.icon className="w-5 h-5 text-zinc-300" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-medium">{option.name}</h3>
                      <p className="text-zinc-400 text-sm">{option.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            // Media Type Specific UI
            <div className="space-y-4">
              {/* Content Input */}
              <div>
                <label className="text-sm font-medium text-zinc-300 mb-2 block">
                  {context === 'chat' ? 'Add a message (optional):' : 'Add a caption (optional):'}
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={context === 'chat' ? 'Add a message to your media...' : 'Add a caption to your post...'}
                  className="w-full h-20 p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none resize-none"
                />
              </div>

              {/* Error Display */}
              {error && (
                <div className="flex items-center space-x-2 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <span className="text-red-400 text-sm">{error}</span>
                </div>
              )}

              {/* File Upload Display */}
              {selectedType === 'image' || selectedType === 'document' || selectedType === 'camera' ? (
                <div className="space-y-3">
                  <h3 className="text-white font-medium">
                    {selectedType === 'image' ? 'Images' : selectedType === 'document' ? 'Documents' : 'Camera Photo'}
                  </h3>
                  
                  {files.length > 0 ? (
                    <div className="space-y-2">
                      {files.map((file, index) => (
                        <div key={index} className="flex items-center space-x-3 p-3 bg-zinc-800 border border-zinc-700 rounded-lg">
                          {selectedType === 'image' && file.type.startsWith('image/') ? (
                            <img
                              src={URL.createObjectURL(file)}
                              alt="Preview"
                              className="w-12 h-12 object-cover rounded"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-zinc-700 rounded flex items-center justify-center">
                              <File className="w-6 h-6 text-zinc-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm truncate">{file.name}</p>
                            <p className="text-zinc-400 text-xs">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                          <button
                            onClick={() => removeFile(index)}
                            className="p-1 text-red-400 hover:bg-red-500/20 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-zinc-400">
                      <Upload className="w-12 h-12 mx-auto mb-3 text-zinc-500" />
                      <p>No files selected</p>
                    </div>
                  )}
                </div>
              ) : null}

              {/* Location Display */}
              {selectedType === 'location' && (
                <div className="space-y-3">
                  <h3 className="text-white font-medium">Location</h3>
                  {locationLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                      <span className="ml-2 text-zinc-400">Getting your location...</span>
                    </div>
                  ) : location ? (
                    <div className="p-4 bg-zinc-800 border border-zinc-700 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <Map className="w-5 h-5 text-blue-500 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-white font-medium">{location.address}</p>
                          <p className="text-zinc-400 text-sm">
                            {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                          </p>
                        </div>
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-zinc-400">
                      <MapPin className="w-12 h-12 mx-auto mb-3 text-zinc-500" />
                      <p>Location not available</p>
                    </div>
                  )}
                </div>
              )}

              {/* Poll Creation */}
              {selectedType === 'poll' && (
                <div className="space-y-4">
                  <h3 className="text-white font-medium">Create Poll</h3>
                  
                  <div>
                    <label className="text-sm font-medium text-zinc-300 mb-2 block">Question</label>
                    <input
                      type="text"
                      value={pollData.question}
                      onChange={(e) => setPollData(prev => ({ ...prev, question: e.target.value }))}
                      placeholder="Ask your question..."
                      className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:border-purple-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-zinc-300 mb-2 block">Options</label>
                    <div className="space-y-2">
                      {pollData.options.map((option, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => updatePollOption(index, e.target.value)}
                            placeholder={`Option ${index + 1}`}
                            className="flex-1 p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:border-purple-500 focus:outline-none"
                          />
                          {pollData.options.length > 2 && (
                            <button
                              onClick={() => removePollOption(index)}
                              className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      {pollData.options.length < 6 && (
                        <button
                          onClick={addPollOption}
                          className="w-full p-2 border border-dashed border-zinc-700 rounded-lg text-zinc-400 hover:border-purple-500 hover:text-purple-400 transition-colors flex items-center justify-center space-x-2"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add Option</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-zinc-300 mb-2 block">Duration (hours)</label>
                    <select
                      value={pollData.duration}
                      onChange={(e) => setPollData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                      className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                    >
                      <option value={1}>1 hour</option>
                      <option value={6}>6 hours</option>
                      <option value={12}>12 hours</option>
                      <option value={24}>24 hours</option>
                      <option value={48}>48 hours</option>
                      <option value={168}>1 week</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {selectedType && (
          <div className="flex items-center justify-between p-4 border-t border-zinc-700 bg-zinc-800/50">
            <button
              onClick={() => setSelectedType(null)}
              className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
            >
              Back
            </button>
            
            <button
              onClick={handleSubmit}
              disabled={isLoading || locationLoading}
              className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-zinc-600 disabled:to-zinc-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-300 flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sharing...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Share</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Hidden file inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFileUpload(e, 'image')}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => handleFileUpload(e, 'image')}
        />
        <input
          ref={documentInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt,.rtf"
          multiple
          className="hidden"
          onChange={(e) => handleFileUpload(e, 'document')}
        />
      </div>
    </div>
  );
}
