import { useState, useRef } from 'react';
import { 
  ArrowLeft
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
    if (isSubmitting) return;
    
    // Check if text content is provided
    if (!content.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit({
        content: content.trim(),
        imageUrl: null,
        poll: null
      });
      
      // Reset form
      setContent('');
    } catch (error) {
      console.error('Failed to submit confession:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Validation: text is mandatory
  const hasText = content.trim().length > 0;
  
  const canSubmit = hasText && !isSubmitting;

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
        <div className="flex items-center justify-end">
          {/* Confess Button */}
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`px-8 py-3 rounded-full font-semibold transition-all duration-300 border ${
              canSubmit
                ? 'bg-[#F4E3B5] hover:bg-[#F1DEAB] text-black border-[#F4E3B5] hover:border-[#F1DEAB]'
                : 'bg-black/60 text-zinc-400 cursor-not-allowed border-zinc-600'
            }`}
            title={!canSubmit ? 'Add text to confess' : 'Share your confession'}
          >
            {isSubmitting ? 'Sharing...' : 'Share'}
          </button>
        </div>
      </div>
    </div>
  );
}
