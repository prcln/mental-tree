import React from 'react';
import { Heart, Copy } from 'lucide-react';

const MessageActions = ({ likes, hasLiked, onLike, onCopy, disabled }) => {
  return (
    <div className="flex items-center gap-4">
      <button
        onClick={onLike}
        disabled={disabled}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
          hasLiked
            ? 'bg-red-100 text-red-600 hover:bg-red-200'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        <Heart className={`w-5 h-5 ${hasLiked ? 'fill-current' : ''}`} />
        <span className="font-medium">{likes}</span>
      </button>

      <button
        onClick={onCopy}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
      >
        <Copy className="w-5 h-5" />
        Copy
      </button>
    </div>
  );
};

export default MessageActions;