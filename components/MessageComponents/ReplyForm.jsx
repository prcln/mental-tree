import React, { useState } from 'react';

const ReplyForm = ({ onSubmit, disabled }) => {
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!replyText.trim()) {
      alert('Please enter a reply');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(replyText.trim());
      setReplyText('');
    } catch (error) {
      alert('Failed to submit reply. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <textarea
          placeholder="Write a reply..."
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none"
          disabled={isSubmitting || disabled}
        />
      </div>
      <button
        onClick={handleSubmit}
        disabled={isSubmitting || disabled}
        className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 rounded-lg font-medium hover:from-green-600 hover:to-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Sending...' : 'Send Reply'}
      </button>
    </div>
  );
};

export default ReplyForm;