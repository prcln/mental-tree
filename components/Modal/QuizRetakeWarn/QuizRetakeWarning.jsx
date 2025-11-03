import React from 'react';
import { AlertTriangle, RotateCcw, X } from 'lucide-react';

const RetakeQuizModal = ({ onConfirm, onCancel, timeLeftMessage, canRetake }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-start justify-center overflow-y-auto p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full mt-20 animate-slideUp">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white relative">
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition-all"
          >
            <X size={24} />
          </button>
          <div className="flex items-center gap-3">
            <AlertTriangle size={32} />
            <h2 className="text-2xl font-bold">Renew Your Seed?</h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <div className="flex items-center justify-center mb-4">
              <div className="text-6xl animate-bounce">🌱</div>
            </div>
            
            <h3 className="text-xl font-bold text-gray-800 mb-3 text-center">
              Start Fresh with a New Tree
            </h3>
            
            <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 mb-4">
              <p className="text-amber-800 text-sm font-semibold mb-2">
                ⚠️ Important: This action will:
              </p>
              <ul className="text-amber-700 text-sm space-y-1 ml-4">
                <li>• Reset your tree to seed stage</li>
                <li>• Clear all growth points (mood score)</li>
                <li>• Remove all encouragement messages</li>
                <li>• Let you choose a new tree personality</li>
              </ul>
            </div>

            <p className="text-gray-600 text-center text-sm">
              This is a fresh start. Your journey begins anew! 🌟
            </p>
          </div>

          {/* Buttons */}
          <div className="space-y-3">
            {canRetake ? (
              <>
                <button
                  onClick={onConfirm}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-xl font-bold hover:from-green-600 hover:to-green-700 transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
                >
                  <RotateCcw size={20} />
                  Yes, Renew My Seed
                </button>
                <button
                  onClick={onCancel}
                  className="w-full bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-all duration-200"
                >
                  Cancel
                </button>
              </>
            ) : (
              <div className="text-center">
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-3">
                  <p className="text-red-800 font-semibold">🕐 Please wait</p>
                  <p className="text-red-600 text-sm mt-1">{timeLeftMessage}</p>
                </div>
                <button
                  onClick={onCancel}
                  className="w-full bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-all duration-200"
                >
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