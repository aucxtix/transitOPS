import React from 'react';
import { AlertTriangle } from 'lucide-react';

export const InlineErrorBanner = ({ message, onClose }) => {
  if (!message) return null;
  return (
    <div className="flex items-center justify-between p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-sm font-medium animate-fade-in shadow-sm">
      <div className="flex items-center gap-3">
        <AlertTriangle size={18} />
        <span>{message}</span>
      </div>
      {onClose && (
        <button 
          onClick={onClose} 
          className="text-red-500 hover:text-red-600 font-bold px-2 py-1 rounded-md"
        >
          Dismiss
        </button>
      )}
    </div>
  );
};
