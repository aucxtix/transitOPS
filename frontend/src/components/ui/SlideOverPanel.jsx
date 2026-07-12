import React from 'react';
import { X } from 'lucide-react';

export const SlideOverPanel = ({ isOpen, title, onClose, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/60 backdrop-blur-sm" 
        onClick={onClose}
      ></div>
      
      {/* Panel */}
      <div className="relative z-10 w-full max-w-lg h-full glass-panel border-l border-white/60 dark:border-white/10 shadow-float flex flex-col p-8 md:p-10 justify-between animate-slide-in">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-2xl font-bold tracking-tight">{title}</h3>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full hover:bg-foreground/5 text-foreground/50 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto pr-2">
          {children}
        </div>
      </div>
    </div>
  );
};
