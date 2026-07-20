import React from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

export const Modal = ({ isOpen, onClose, title, children, className }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
      <div 
        className={cn(
          "bg-card border border-border w-full max-w-lg rounded-3xl shadow-xl overflow-hidden animate-slide-up",
          className
        )}
      >
        <div className="flex justify-between items-center px-6 py-4 border-b border-border bg-foreground/5">
          <h2 className="text-xl font-bold tracking-tight">{title}</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-foreground/10 transition-colors"
           title="X" aria-label="X">
                          <X size={16} />
                        </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};
