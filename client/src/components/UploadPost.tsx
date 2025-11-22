import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Image, 
  Link, 
  BarChart3, 
  Eye, 
  EyeOff, 
  Send, 
  FileText,
  Users,
  TrendingUp,
  Heart,
  MessageSquare,
  Clock,
  Upload,
  Plus
} from 'lucide-react';
import ShareMediaModal from './ShareMediaModal';

interface UploadPostProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: (post: any) => void;
}

interface Post {
  id: string;
  type: 'text' | 'image' | 'poll' | 'link';
  content: string;
  tags: string[];
  isAnonymous: boolean;
  community: string;
  createdAt: Date;
  likes: number;
  views: number;
  comments: number;
  trending: number;
  pollOptions?: string[];
  imageUrl?: string;
  linkUrl?: string;
  author: {
    id: string;
    name: string;
    avatar: string;
  };
}

// Removed community tags as tags feature is disabled

export default function UploadPost({ isOpen, onClose, onPostCreated }: UploadPostProps) {
  const [postType, setPostType] = useState<'text' | 'image' | 'poll' | 'link'>('text');
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [showShareMedia, setShowShareMedia] = useState(false);
  const maxChars = 1000;

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCharCount(content.length);
  }, [content]);

  // Removed tag selection handler

  const addPollOption = () => {
    if (pollOptions.length < 6) {
      setPollOptions([...pollOptions, '']);
    }
  };

  const removePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };

  const updatePollOption = (index: number, value: string) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
    }
  };

  const validateForm = () => {
    if (!content.trim()) return false;
    
    // Link and Poll are optional - only validate if user has selected them
    if (postType === 'poll') {
      // Only require poll options if user has started creating a poll
      const validOptions = pollOptions.filter(opt => opt.trim());
      if (validOptions.length > 0 && validOptions.length < 2) {
        return false; // If they started a poll, they need at least 2 options
      }
    }
    
    if (postType === 'link') {
      // Only require URL if user has started typing one
      if (linkUrl.trim() !== '' && !linkUrl.startsWith('http')) {
        return false; // If they started a URL, it should be valid
      }
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Determine the actual post type based on what user has added
      let actualPostType: Post['type'] = 'text';
      if (postType === 'poll' && pollOptions.filter(opt => opt.trim()).length >= 2) {
        actualPostType = 'poll';
      } else if (postType === 'link' && linkUrl.trim() !== '') {
        actualPostType = 'link';
      } else if (imageFile) {
        actualPostType = 'image';
      }

      const newPost: Post = {
        id: `post_${Date.now()}`,
        type: actualPostType,
        content: content.trim(),
        tags: [],
        isAnonymous,
        community: 'General',
        createdAt: new Date(),
        likes: 0,
        views: 0,
        comments: 0,
        trending: Math.floor(Math.random() * 10) + 1,
        pollOptions: actualPostType === 'poll' ? pollOptions.filter(opt => opt.trim()) : undefined,
        imageUrl: imageFile ? URL.createObjectURL(imageFile) : undefined,
        linkUrl: actualPostType === 'link' ? linkUrl : undefined,
        author: {
          id: 'user_1',
          name: isAnonymous ? 'Anonymous User' : 'John Doe',
          avatar: isAnonymous ? '/anonymous-avatar.png' : '/user-avatar.png'
        }
      };

      onPostCreated(newPost);
      handleClose();
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setContent('');
    setIsAnonymous(false);
    setPollOptions(['', '']);
    setImageFile(null);
    setLinkUrl('');
    setPostType('text');
    setShowShareMedia(false);
    onClose();
  };

  const handleMediaShared = (mediaData: any) => {
    // Handle the shared media data
    console.log('Media shared:', mediaData);
    
    // Update the post type and content based on media type
    switch (mediaData.type) {
      case 'image':
      case 'camera':
        if (mediaData.files && mediaData.files.length > 0) {
          setImageFile(mediaData.files[0]);
          setPostType('image');
        }
        if (mediaData.content) {
          setContent(mediaData.content);
        }
        break;
      case 'poll':
        if (mediaData.poll) {
          setPostType('poll');
          setPollOptions(mediaData.poll.options);
          if (mediaData.content) {
            setContent(mediaData.content);
          }
        }
        break;
      case 'location':
        // Handle location sharing - could be added as a new post type
        if (mediaData.content) {
          setContent(mediaData.content);
        }
        break;
      case 'document':
        // Handle document sharing - could be added as a new post type
        if (mediaData.content) {
          setContent(mediaData.content);
        }
        break;
    }
  };

  if (!isOpen) return null;

  console.log('UploadPost modal is open:', isOpen);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md sm:max-w-2xl max-h-[85vh] sm:max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Top Bar - Create Button and Privacy Mode */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-zinc-700 bg-zinc-800/50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-gold to-yellow-500 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-zinc-900" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white">Create</h2>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 sm:space-x-3">
            {/* Privacy Mode Button */}
            <div className="flex items-center bg-zinc-700/50 rounded-lg p-1 order-2 sm:order-none">
              <button
                onClick={() => setIsAnonymous(false)}
                className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all duration-300 flex items-center space-x-1 ${
                  !isAnonymous
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Users className="w-3 h-3" />
                <span className="hidden sm:inline">Public</span>
              </button>
              <button
                onClick={() => setIsAnonymous(true)}
                className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all duration-300 flex items-center space-x-1 ${
                  isAnonymous
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <EyeOff className="w-3 h-3" />
                <span className="hidden sm:inline">Anonymous</span>
              </button>
            </div>

            {/* Create Button */}
            <button
              onClick={handleSubmit}
              disabled={!validateForm() || isSubmitting}
              className="px-3 py-2 sm:px-4 bg-gradient-to-r from-gold to-yellow-500 hover:from-gold/90 hover:to-yellow-500/90 disabled:from-zinc-600 disabled:to-zinc-700 disabled:cursor-not-allowed text-zinc-900 font-semibold rounded-lg transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-xl text-sm sm:text-base shrink-0 order-1 sm:order-none"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Create</span>
                </>
              )}
            </button>

            {/* Close Button */}
            <button
              onClick={handleClose}
              className="p-2 hover:bg-zinc-700 rounded-lg transition-colors shrink-0"
            >
              <X className="w-5 h-5 text-zinc-400" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-h-[calc(85vh-96px)] sm:max-h-[calc(90vh-120px)] overflow-y-auto">
          {/* Content Input - Main Writing Area */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-zinc-300">What's on your mind?</label>
              <span className={`text-xs ${charCount > maxChars ? 'text-red-400' : 'text-zinc-400'}`}>
                {charCount}/{maxChars}
              </span>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={maxChars}
              placeholder="Share your thoughts, ideas, or questions with the community..."
              className="w-full h-32 sm:h-40 p-3 sm:p-4 bg-zinc-800 border border-zinc-700 rounded-lg sm:rounded-xl text-base sm:text-lg text-white placeholder-zinc-500 focus:border-gold focus:outline-none resize-none leading-relaxed"
            />
          </div>

          {/* URL/Poll Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <button
                onClick={() => setPostType('link')}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg transition-all duration-300 flex items-center space-x-2 ${
                  postType === 'link'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-zinc-700/50 text-zinc-400 hover:bg-zinc-600/50 hover:text-zinc-300'
                }`}
              >
                <Link className="w-4 h-4" />
                <span className="text-xs sm:text-sm font-medium">Add Link</span>
              </button>
              
              <button
                onClick={() => setPostType('poll')}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg transition-all duration-300 flex items-center space-x-2 ${
                  postType === 'poll'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-zinc-700/50 text-zinc-400 hover:bg-zinc-600/50 hover:text-zinc-300'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span className="text-xs sm:text-sm font-medium">Create Poll</span>
              </button>
            </div>

            {/* Link Input */}
            {postType === 'link' && (
              <div className="space-y-2">
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full p-2.5 sm:p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
                />
              </div>
            )}

            {/* Poll Options */}
            {postType === 'poll' && (
              <div className="space-y-3">
                <div className="space-y-2">
                  {pollOptions.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => updatePollOption(index, e.target.value)}
                        placeholder={`Poll option ${index + 1}`}
                        className="flex-1 p-2.5 sm:p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:border-purple-500 focus:outline-none"
                      />
                      {pollOptions.length > 2 && (
                        <button
                          onClick={() => removePollOption(index)}
                          className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  {pollOptions.length < 6 && (
                    <button
                      onClick={addPollOption}
                      className="w-full p-2.5 sm:p-3 border border-dashed border-zinc-700 rounded-lg text-zinc-400 hover:border-purple-500 hover:text-purple-400 transition-colors flex items-center justify-center space-x-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Poll Option</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Image Upload Section */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Upload className="w-5 h-5 text-zinc-400" />
              <span className="text-sm font-medium text-zinc-300">Upload Image</span>
            </div>
            
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-zinc-700 rounded-xl p-4 sm:p-6 text-center hover:border-gold transition-colors cursor-pointer bg-zinc-800/50 hover:bg-zinc-700/50"
            >
              {imageFile ? (
                <div className="space-y-3">
                  <img
                    src={URL.createObjectURL(imageFile)}
                    alt="Preview"
                    className="w-full h-40 sm:h-48 object-cover rounded-lg mx-auto"
                  />
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-sm text-zinc-400">{imageFile.name}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setImageFile(null);
                      }}
                      className="p-1 text-red-400 hover:bg-red-500/20 rounded transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-zinc-700/50 rounded-full flex items-center justify-center mx-auto">
                    <Image className="w-6 h-6 sm:w-8 sm:h-8 text-zinc-500" />
                  </div>
                  <div>
                    <p className="text-zinc-400 font-medium">Click to upload an image</p>
                    <p className="text-zinc-500 text-sm">or drag and drop</p>
                  </div>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          {/* Tags feature removed */}
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