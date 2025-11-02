import React, { useState, useEffect } from 'react';
import { Share2, Copy, Check, Facebook, Twitter, Mail, Link2 } from 'lucide-react';
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
          <h2>Share Your Tree</h2>
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
                    <button onClick={shareToFacebook} className="share-btn facebook">
                      <Facebook size={20} />
                      <span>Facebook</span>
                    </button>
                    <button onClick={shareToTwitter} className="share-btn twitter">
                      <Twitter size={20} />
                      <span>Twitter</span>
                    </button>
                    <button onClick={shareViaEmail} className="share-btn email">
                      <Mail size={20} />
                      <span>Email</span>
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