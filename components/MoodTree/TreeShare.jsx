import React, { useState, useEffect } from 'react';
import { Share2, Copy, Check, Mail, Link2 } from 'lucide-react';
import supabaseService from '../../services/supabaseService';
import './TreeShare.css';

const TreeShare = ({ treeId, treeName, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(true);
  const shareUrl = `${window.location.origin}/tree/shared/${treeId}`;

  // Fetch the current tree's public status on mount
  useEffect(() => {
    const fetchTreeStatus = async () => {
      try {
        setLoading(true);
        const tree = await supabaseService.getTree(treeId);
        setIsPublic(tree.is_public);
      } catch (err) {
        console.error('Failed to fetch tree status:', err);
      } finally {
        setLoading(false);
      }
    };

    if (treeId) {
      fetchTreeStatus();
    }
  }, [treeId]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleTogglePublic = async () => {
    try {
      await supabaseService.toggleTreePublic(treeId);
      setIsPublic(!isPublic);
    } catch (err) {
      console.error('Failed to toggle public status:', err);
      alert('Failed to update tree privacy. Please try again.');
    }
  };

  const shareToFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const shareToTwitter = () => {
    const text = `Check out my ${treeName}! 🌳✨`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const shareViaEmail = () => {
    const subject = `Check out my ${treeName}!`;
    const body = `I'd love for you to see my growing tree and send some encouragement! 🌳\n\n${shareUrl}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal tree-share-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <Share2 size={24} className="header-icon" />
          <h2 className="modal-header-title">Share Your Tree</h2>
        </div>

        {loading ? (
          <div className="share-loading">
            <div className="loading-spinner"></div>
            <p>Loading...</p>
          </div>
        ) : (
          <div className="share-content">
            <div className="privacy-toggle">
              <div className="toggle-info">
                <h3>Tree Visibility</h3>
                <p>Allow others to view and send encouragement to your tree</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={handleTogglePublic}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            {isPublic && (
              <>
                <div className="share-link-section">
                  <label>Share Link</label>
                  <div className="link-input-group">
                    <input
                      type="text"
                      value={shareUrl}
                      readOnly
                      className="share-link-input"
                    />
                    <button
                      onClick={handleCopyLink}
                      className={`copy-btn ${copied ? 'copied' : ''}`}
                    >
                      {copied ? (
                        <>
                          <Check size={18} />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={18} />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="share-options">
                  <h3>Share via</h3>
                  <div className="share-buttons">
                    <button 
                      onClick={shareToFacebook} 
                      className="share-btn facebook"
                      title="Share on Facebook"
                      aria-label="Share on Facebook"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    </button>
                    <button 
                      onClick={shareToTwitter} 
                      className="share-btn twitter"
                      title="Share on Twitter"
                      aria-label="Share on Twitter"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                    </button>
                    <button 
                      onClick={shareViaEmail} 
                      className="share-btn email"
                      title="Share via Email"
                      aria-label="Share via Email"
                    >
                      <Mail size={20} />
                    </button>
                  </div>
                </div>

                <div className="share-tip">
                  <Link2 size={16} />
                  <p>Anyone with this link can view your tree and send encouragement messages</p>
                </div>
              </>
            )}

            {!isPublic && (
              <div className="private-message">
                <div className="private-icon">🔒</div>
                <h3>Your tree is private</h3>
                <p>Enable public visibility to share your tree with others and receive encouragement!</p>
              </div>
            )}
          </div>
        )}

        <div className="modal-actions">
          <button onClick={onClose} className="btn-close">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TreeShare;