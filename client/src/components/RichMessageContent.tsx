import React from 'react';
import { ChatMessage } from '../types/chat';

interface RichMessageContentProps {
  message: ChatMessage;
  isUser: boolean;
}

export const RichMessageContent: React.FC<RichMessageContentProps> = ({ message, isUser }) => {
  // Render only text content
  const renderContent = () => {
    return (
      <div className="text-zinc-300 leading-relaxed">
        {message.content.split('\n').map((paragraph, index) => (
          <p key={`paragraph-${index}`}>{paragraph}</p>
        ))}
      </div>
    );
  };

  return (
    <div className="rich-message-content">
      {renderContent()}
    </div>
  );
};