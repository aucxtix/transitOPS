import React from 'react';

export const ConfirmModal = ({ isOpen, title = 'Confirm Action', message = 'Are you sure you want to perform this action?', confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, onCancel }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm" 
        onClick={onCancel}
      ></div>
      
      {/* Modal Content */}
      <div className="relative z-10 w-full max-w-md glass-panel rounded-[2rem] p-8 border border-white/60 dark:border-white/10 shadow-float overflow-hidden">
        <h3 className="text-xl font-bold tracking-tight mb-2">{title}</h3>
        <p className="text-sm text-foreground/60 mb-6">{message}</p>
        
        <div className="flex gap-3 justify-end">
          <button 
            onClick={onCancel} 
            className="pill-button pill-button-light text-sm"
          >
            {cancelText}
          </button>
          <button 
            onClick={onConfirm} 
            className="pill-button pill-button-dark text-sm"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
