import React, { useRef, useState } from 'react';

import peachResult from '../../assets/results/peach.jpg';
import greenappleResult from '../../assets/results/greenapple.jpg';
import mangoResult from '../../assets/results/mango.jpg';
import strawberryResult from '../../assets/results/strawberry.jpg';
import pineappleResult from '../../assets/results/pineapple.jpg';
import cherryResult from '../../assets/results/cherry.jpg';

const QuizResult = ({ result, onContinue, onRetake, isLoading: externalLoading }) => {
  const resultImageRef = useRef(null);
  const [internalLoading, setInternalLoading] = useState(false);
  const isProcessing = externalLoading || internalLoading;

  // Map result types to their images
  const resultImages = {
    peach: peachResult,
    greenapple: greenappleResult,
    mango: mangoResult,
    strawberry: strawberryResult,
    pineapple: pineappleResult,
    cherry: cherryResult,
  };

  const handleDownload = async () => {
    try {
      const imageSrc = resultImages[result.fruitType];

      const response = await fetch(imageSrc);
      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${result.fruitInfo.name}-result.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  const handleContinueClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Prevent multiple clicks
    if (isProcessing) {
      console.log('⏸️ Already processing, ignoring click');
      return;
    }

    console.log('🎯 Grow Your Tree button clicked');
    setInternalLoading(true);

    try {
      sessionStorage.setItem('justCompletedQuiz', 'true');
    } catch (err) {
      console.warn('Could not set sessionStorage.justCompletedQuiz', err);
    }

    if (onContinue) {
      console.log('✅ Calling onContinue with result payload');
      await onContinue(result);
    } else {
      console.error('❌ onContinue is not defined');
      setInternalLoading(false);
    }
  };

  const handleRetakeClick = (e) => {
    console.log('🔄 Retake button clicked');
    e.preventDefault();
    e.stopPropagation();
    if (onRetake) {
      onRetake();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'linear-gradient(to bottom, #dbeafe, #fce7f3, #dcfce7)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: '2rem 1rem',
        zIndex: 50,
        overflowY: 'auto',
        overflowX: 'hidden',
        gap: '2rem',
      }}
    >
      {/* Large Result Image Card */}
      <div
        style={{
          borderRadius: '1.5rem',
          padding: '1rem',
          maxWidth: '70vh',
          width: '100%',
          animation: 'slideUp 0.6s ease-out',
        }}
      >
        <div
          ref={resultImageRef}
          style={{
            borderRadius: '1rem',
            overflow: 'hidden',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          }}
        >
          <img
            src={resultImages[result.fruitType]}
            alt={`${result.fruitInfo.name} Result`}
            style={{
              width: '100%',
              height: 'auto',
              display: 'block',
            }}
          />
        </div>
      </div>

      {/* Buttons Section */}
      <div
        style={{
          background: 'white',
          borderRadius: '1.5rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          padding: '2rem',
          maxWidth: '80vh',
          width: '100%',
          animation: 'slideUp 0.8s ease-out',
        }}
      >
        {/* Result Info */}
        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <div
            style={{
              fontSize: '4rem',
              marginBottom: '0.5rem',
              animation: 'bounce 1s infinite',
            }}
          >
            {result.fruitInfo.emoji}
          </div>
          <h2
            style={{
              fontSize: '1.875rem',
              fontWeight: 'bold',
              color: '#1f2937',
              marginBottom: '0.5rem',
            }}
          >
            You're a {result.fruitInfo.name}!
          </h2>
          <p
            style={{
              color: '#16a34a',
              fontWeight: 600,
              fontSize: '1.125rem',
              marginBottom: '1rem',
            }}
          >
            {result.fruitInfo.traits?.[0] || 'Unique personality'}
          </p>
          <p
            style={{
              color: '#4b5563',
              fontSize: '1.125rem',
              lineHeight: 1.75,
            }}
          >
            {result.fruitInfo.description}
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {/* Download Button */}
          <button
            onClick={handleDownload}
            disabled={isProcessing}
            style={{
              width: '100%',
              background: 'linear-gradient(to right, #3b82f6, #2563eb)',
              color: 'white',
              padding: '1rem',
              borderRadius: '1rem',
              fontWeight: 'bold',
              fontSize: '1.125rem',
              border: 'none',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              opacity: isProcessing ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isProcessing) {
                e.currentTarget.style.background = 'linear-gradient(to right, #2563eb, #1d4ed8)';
                e.currentTarget.style.transform = 'scale(1.02)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isProcessing) {
                e.currentTarget.style.background = 'linear-gradient(to right, #3b82f6, #2563eb)';
                e.currentTarget.style.transform = 'scale(1)';
              }
            }}
          >
            <span>📥</span>
            Save Your Result
          </button>

          {/* Grow Your Tree Button */}
          <button
            onClick={handleContinueClick}
            disabled={isProcessing}
            style={{
              width: '100%',
              background: isProcessing 
                ? 'linear-gradient(to right, #9ca3af, #6b7280)' 
                : 'linear-gradient(to right, #22c55e, #16a34a)',
              color: 'white',
              padding: '1rem',
              borderRadius: '1rem',
              fontWeight: 'bold',
              fontSize: '1.125rem',
              border: 'none',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 10px 15px -3px rgba(34, 197, 94, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              opacity: isProcessing ? 0.7 : 1,
              pointerEvents: isProcessing ? 'none' : 'auto',
            }}
            onMouseEnter={(e) => {
              if (!isProcessing) {
                e.currentTarget.style.background = 'linear-gradient(to right, #16a34a, #15803d)';
                e.currentTarget.style.transform = 'scale(1.02)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isProcessing) {
                e.currentTarget.style.background = 'linear-gradient(to right, #22c55e, #16a34a)';
                e.currentTarget.style.transform = 'scale(1)';
              }
            }}
          >
            <span>{isProcessing ? '⏳' : '🌱'}</span>
            {isProcessing ? 'Growing your tree...' : 'Grow Your Tree'}
          </button>

          {/* Retake Quiz Button */}
          <button
            onClick={handleRetakeClick}
            disabled={isProcessing}
            style={{
              width: '100%',
              background: 'white',
              color: '#6b7280',
              padding: '1rem',
              borderRadius: '1rem',
              fontWeight: 'bold',
              fontSize: '1.125rem',
              border: '2px solid #e5e7eb',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              opacity: isProcessing ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isProcessing) {
                e.currentTarget.style.borderColor = '#9ca3af';
                e.currentTarget.style.color = '#374151';
                e.currentTarget.style.transform = 'scale(1.02)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isProcessing) {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.color = '#6b7280';
                e.currentTarget.style.transform = 'scale(1)';
              }
            }}
          >
            <span>🔄</span>
            Retake Quiz
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @media (max-width: 768px) {
          div[style*="maxWidth: '500px'"] {
            max-width: 100% !important;
          }
          div[style*="padding: '2rem 1rem'"] {
            padding: 1rem 1rem 2rem !important;
            gap: 1rem !important;
          }
          div[style*="padding: '2rem'"] {
            padding: 1.5rem !important;
          }
          div[style*="marginBottom: '2rem'"] {
            margin-bottom: 1.5rem !important;
          }
          h2 {
            font-size: 1.5rem !important;
          }
          div[style*="fontSize: '4rem'"] {
            font-size: 3rem !important;
          }
          p {
            font-size: 1rem !important;
          }
          button {
            font-size: 1rem !important;
            padding: 0.875rem !important;
          }
        }

        @media (max-height: 800px) {
          div[style*="padding: '2rem 1rem'"] {
            padding: 1rem !important;
            gap: 1rem !important;
          }
          div[style*="padding: '2rem'"] {
            padding: 1rem !important;
          }
          div[style*="marginBottom: '2rem'"] {
            margin-bottom: 1rem !important;
          }
          div[style*="fontSize: '4rem'"] {
            font-size: 2.5rem !important;
          }
          h2 {
            font-size: 1.25rem !important;
          }
          p {
            font-size: 0.9rem !important;
          }
          button {
            padding: 0.75rem !important;
            font-size: 0.9rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default QuizResult;