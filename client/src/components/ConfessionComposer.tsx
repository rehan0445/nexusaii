import { useState, useRef } from 'react';
import { 
  ArrowLeft, 
  Image, 
  BarChart3,
  Plus,
  X
} from 'lucide-react';

// Get the server URL for API calls
const getServerUrl = () => {
  return import.meta.env.VITE_SERVER_URL || window.location.origin;
};

interface ConfessionComposerProps {
  readonly onBack: () => void;
  readonly onSubmit: (data: {
    content: string;
    imageUrl?: string | null;
    poll?: {
      question: string;
      options: string[];
    } | null;
  }) => Promise<void>;
  readonly alias: {
    name: string;
    emoji: string;
    imageUrl?: string | null;
  };
}

export function ConfessionComposer({ onBack, onSubmit, alias }: ConfessionComposerProps) {
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showPoll, setShowPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploadingImage(true);
      try {
        // Create preview
        const preview = URL.createObjectURL(file);
        setImagePreview(preview);
        
        // Upload to backend
        const formData = new FormData();
        formData.append('image', file);
        
        const response = await fetch(`${getServerUrl()}/api/confessions/upload-image`, {
          method: 'POST',
          body: formData
        });
        
        const result = await response.json();
        if (result.success && result.data.url) {
          console.log('✅ Image uploaded:', result.data.url);
          setImageUrl(result.data.url);
        } else {
          console.error('Failed to upload image');
          alert('Failed to upload image. Please try again.');
          // Remove preview if upload failed
          URL.revokeObjectURL(preview);
          setImagePreview(null);
        }
      } catch (error) {
        console.error('Error uploading image:', error);
        alert('Failed to upload image. Please try again.');
        if (imagePreview) {
          URL.revokeObjectURL(imagePreview);
          setImagePreview(null);
        }
      } finally {
        setIsUploadingImage(false);
      }
    }
  };

  const removeImage = () => {
    setImageUrl(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const addPollOption = () => {
    if (pollOptions.length < 4) {
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

  const handleSubmit = async () => {
    if (isSubmitting || isUploadingImage) return;
    
    // Check if at least one content type is provided
    const hasValidContent = content.trim() || imageUrl || (showPoll && pollQuestion.trim() && pollOptions.some(opt => opt.trim()));
    if (!hasValidContent) return;
    
    setIsSubmitting(true);
    try {
      const pollData = showPoll && pollQuestion.trim() && pollOptions.some(opt => opt.trim()) 
        ? {
            question: pollQuestion.trim(),
            options: pollOptions.filter(opt => opt.trim())
          }
        : null;

      await onSubmit({
        content: content.trim() || '', // Allow empty content if other media is present
        imageUrl,
        poll: pollData
      });
      
      // Reset form
      setContent('');
      setImageUrl(null);
      setImagePreview(null);
      setShowPoll(false);
      setPollQuestion('');
      setPollOptions(['', '']);
    } catch (error) {
      console.error('Failed to submit confession:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Validation: text OR image OR poll is mandatory
  const hasText = content.trim().length > 0;
  const hasImage = imageUrl !== null;
  const hasPoll = showPoll && pollQuestion.trim().length > 0 && pollOptions.some(opt => opt.trim().length > 0);
  
  const canSubmit = (hasText || hasImage || hasPoll) && !isSubmitting && !isUploadingImage;

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-800">
        <button
          onClick={onBack}
          className="text-white hover:text-zinc-300 transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        
        <h1 className="text-xl font-semibold text-[#F4E3B5]">Confess Anything</h1>
        
        <div className="w-6"></div>
      </div>

      {/* User Profile Section */}
      <div className="p-6 border-b border-zinc-800">
        <div className="flex items-center gap-4">
          {/* Profile Picture */}
          <div className="relative">
            {alias.imageUrl ? (
              <img 
                src={alias.imageUrl} 
                alt="User avatar" 
                className="w-16 h-16 rounded-full object-cover border-2 border-[#F4E3B5]" 
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center text-white text-2xl font-bold border-2 border-[#F4E3B5]">
                {alias.emoji}
              </div>
            )}
            {/* Removed anonymous indicator */}
          </div>
          
          {/* Profile Info */}
          <div>
            <h2 className="text-xl font-bold text-white">{alias.name}</h2>
          </div>
        </div>
      </div>

      {/* Community Guidelines */}
      <div className="p-6">
        <div className="bg-[#F4E3B5]/10 border border-[#F4E3B5]/30 rounded-2xl p-4">
          <p className="text-[#F4E3B5] font-medium text-center">
            Read Community Guidelines before posting!
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 px-6">
        {/* Text Area */}
        <div className="relative border border-[#F4E3B5]/30 rounded-2xl p-4 focus-within:border-[#F4E3B5]/60 transition-all duration-300">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share your thoughts... (optional if you add a photo or poll)"
            className="w-full h-96 bg-transparent text-white text-lg placeholder-zinc-500 resize-none focus:outline-none border-none"
            maxLength={5000}
          />
          <div className="absolute bottom-4 right-4 text-zinc-500 text-sm">
            {content.length}/5000
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-zinc-800 p-4">
        <div className="flex items-center justify-between">
          {/* Media Options */}
          <div className="flex items-center gap-6">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors border border-[#F4E3B5]/30 rounded-xl px-3 py-2 hover:border-[#F4E3B5]/60"
            >
              <Image className="w-6 h-6" />
              <span className="text-sm font-medium">Upload</span>
            </button>
            
            <button
              onClick={() => setShowPoll(!showPoll)}
              className={`flex items-center gap-2 transition-colors border rounded-xl px-3 py-2 ${
                showPoll 
                  ? 'text-[#F4E3B5] border-[#F4E3B5]/60' 
                  : 'text-zinc-400 hover:text-white border-[#F4E3B5]/30 hover:border-[#F4E3B5]/60'
              }`}
            >
              <BarChart3 className="w-6 h-6" />
              <span className="text-sm font-medium">Poll</span>
            </button>
          </div>

          {/* Confess Button */}
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`px-8 py-3 rounded-full font-semibold transition-all duration-300 border ${
              canSubmit
                ? 'bg-[#F4E3B5] hover:bg-[#F1DEAB] text-black border-[#F4E3B5] hover:border-[#F1DEAB]'
                : 'bg-black/60 text-zinc-400 cursor-not-allowed border-zinc-600'
            }`}
            title={!canSubmit ? 'Add text, photo, or poll to confess' : 'Share your confession'}
          >
            {isSubmitting ? 'Sharing...' : 'Share'}
          </button>
        </div>

        {/* Poll Section */}
        {showPoll && (
          <div className="mt-4 bg-black rounded-2xl p-4 border border-zinc-800">
            <div className="space-y-4">
              <input
                type="text"
                value={pollQuestion}
                onChange={(e) => setPollQuestion(e.target.value)}
                placeholder="Ask a question..."
                className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-400 focus:border-[#F4E3B5] focus:outline-none"
                maxLength={200}
              />
              
              <div className="space-y-2">
                {pollOptions.map((option, index) => (
                  <div key={`poll-option-${index}`} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-[#F4E3B5]/20 rounded-full flex items-center justify-center text-[#F4E3B5] text-xs font-bold">
                      {index + 1}
                    </div>
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => updatePollOption(index, e.target.value)}
                      placeholder={`Choice ${index + 1}`}
                      className="flex-1 bg-black border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-400 focus:border-[#F4E3B5] focus:outline-none text-sm"
                      maxLength={100}
                    />
                    {pollOptions.length > 2 && (
                      <button
                        onClick={() => removePollOption(index)}
                        className="p-1 text-zinc-400 hover:text-red-400 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              
              {pollOptions.length < 4 && (
                <button
                  onClick={addPollOption}
                  className="flex items-center gap-2 px-3 py-2 text-[#F4E3B5] hover:text-[#F1DEAB] hover:bg-[#F4E3B5]/10 rounded-lg transition-colors text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Choice
                </button>
              )}
            </div>
          </div>
        )}

        {/* Image Preview */}
        {imagePreview && (
          <div className="mt-4 bg-black rounded-2xl p-4 border border-zinc-800">
            <div className="flex items-center gap-3">
              <img src={imagePreview} alt="preview" className="w-12 h-12 object-cover rounded-lg" />
              <div className="flex-1">
                <p className="text-white text-sm font-medium">Image attached</p>
                <p className="text-zinc-400 text-xs">Will be displayed with your post</p>
              </div>
              <button 
                onClick={removeImage} 
                className="text-zinc-400 hover:text-red-400 transition-colors p-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
