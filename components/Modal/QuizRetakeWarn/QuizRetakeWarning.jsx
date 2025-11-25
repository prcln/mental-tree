import React from 'react';
import { AlertTriangle, RotateCcw, X } from 'lucide-react';
import './QuizRetakeWarning.css'

const RetakeQuizModal = ({ onConfirm, onCancel, timeLeftMessage, canRetake }) => {
  return (
    <div className="retake-modal-overlay">
      <div className="retake-modal-card">
        {/* Header */}
        <div className="retake-modal-header">
          <button onClick={onCancel} className="retake-modal-close">
            <X size={24} />
          </button>
          <div className="retake-modal-header-content">
            <AlertTriangle className="retake-modal-icon" />
            <h2>Renew Your Seed?</h2>
          </div>
        </div>

        {/* Content */}
        <div className="retake-modal-content">
          <div>
            <div className="retake-modal-emoji-container">
              <div className="retake-modal-emoji">🌱</div>
            </div>
            
            <h3 className="retake-modal-title">
              Start Fresh with a New Tree
            </h3>
            
            <div className="retake-modal-warning">
              <p className="retake-modal-warning-title">
                ⚠️ Important: This action will:
              </p>
              <ul className="retake-modal-warning-list">
                <li>• Reset your tree to seed stage</li>
                <li>• Clear all growth points (mood score)</li>
                <li>• Remove all encouragement messages</li>
                <li>• Let you choose a new tree personality</li>
              </ul>
            </div>

            <p className="retake-modal-description">
              This is a fresh start. Your journey begins anew! 🌟
            </p>
          </div>

          {/* Buttons */}
          <div className="retake-modal-buttons">
            {canRetake ? (
              <>
                <button onClick={onConfirm} className="retake-modal-btn-confirm">
                  <RotateCcw className="retake-modal-icon-small" />
                  Yes, Renew My Seed
                </button>
                <button onClick={onCancel} className="retake-modal-btn-cancel">
                  Cancel
                </button>
              </>
            ) : (
              <div className="retake-modal-cooldown">
                <div className="retake-modal-cooldown-box">
                  <p className="retake-modal-cooldown-title">🕐 Please wait</p>
                  <p className="retake-modal-cooldown-message">{timeLeftMessage}</p>
                </div>
                <button onClick={onCancel} className="retake-modal-btn-cancel">
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RetakeQuizModal;