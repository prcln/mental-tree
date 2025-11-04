import React from 'react';
import { Heart, MessageCircle } from 'lucide-react';

const MessagePreviewTooltip = ({ message, icon }) => {
  return (
    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-white rounded-lg shadow-xl p-3 z-50 border border-gray-200">
      <div className="text-sm text-gray-700 font-medium mb-1 line-clamp-2">
        {message.text}
      </div>
      <div className="text-xs text-gray-500">
        — {message.author}
      </div>
      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <Heart className="w-3 h-3" />
          {message.likes || 0}
        </span>
        <span className="flex items-center gap-1">
          <MessageCircle className="w-3 h-3" />
          {message.reply_count || 0}
        </span>
      </div>
    </div>
  );
};

export default MessagePreviewTooltip;