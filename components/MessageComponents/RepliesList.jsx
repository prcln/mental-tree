import React from 'react';
import { MessageCircle } from 'lucide-react';
import ReplyItem from './ReplyItem';

const RepliesList = ({ replies, isLoading, currentUserId, onDelete }) => {
  return (
    <div className="mb-6">
      <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <MessageCircle className="w-5 h-5" />
        Replies ({replies.length})
      </h4>

      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">
            Loading replies...
          </div>
        ) : replies.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No replies yet. Be the first to reply!
          </p>
        ) : (
          replies.map((reply) => (
            <ReplyItem
              key={reply.id}
              reply={reply}
              currentUserId={currentUserId}
              onDelete={onDelete}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default RepliesList;