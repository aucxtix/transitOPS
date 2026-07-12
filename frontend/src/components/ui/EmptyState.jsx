import React from 'react';
import { AlertCircle } from 'lucide-react';

export const EmptyState = ({ title = 'No data available', description = 'Try adjusting your filters or checking back later.', icon: Icon = AlertCircle }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center glass-panel rounded-3xl border border-border/40">
      <div className="p-4 bg-foreground/5 rounded-full text-foreground/40 mb-4">
        <Icon size={32} />
      </div>
      <h3 className="text-lg font-bold text-foreground">{title}</h3>
      <p className="text-sm text-foreground/50 max-w-sm mt-1">{description}</p>
    </div>
  );
};
