import React from 'react';

const ReplyItem = ({ reply, currentUserId, onDelete }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleDelete = async () => {
    if (currentUserId !== reply.user_id) {
      alert('You can only delete your own replies');
      return;
    }

    if (!window.confirm('Delete this reply?')) return;

    try {
      await onDelete(reply.id);
    } catch (error) {
      alert('Failed to delete reply. Please try again.');
    }
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <span className="font-semibold text-gray-800">
          {reply.author}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            {formatDate(reply.created_at)}
          </span>
          {currentUserId === reply.user_id && (
            <button
              onClick={handleDelete}
              className="text-red-500 hover:text-red-700 text-xs"
            >
              Delete
            </button>
          )}
        </div>
      </div>
      <p className="text-gray-700">{reply.text}</p>
    </div>
  );
};

export default ReplyItem;