import React from 'react';
import { cn } from '../../utils/cn';

export const DemoAccountCard = ({ role, email, pass, icon: Icon, color, bg, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-5 p-5 glass-panel rounded-3xl border border-white/40 dark:border-white/5 hover:bg-white/60 dark:hover:bg-white/10 text-left transition-all hover:shadow-soft group relative overflow-hidden w-full"
    >
      <div className="absolute inset-0 bg-white/20 dark:bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <div className={cn("relative z-10 p-4 rounded-[1.25rem] transition-transform group-hover:scale-105 shadow-sm", bg, color)}>
        <Icon size={24} strokeWidth={2.5} />
      </div>
      <div className="relative z-10 flex-1">
        <p className="font-bold text-base mb-0.5">{role}</p>
        <p className="text-sm text-foreground/50 font-medium">{email}</p>
      </div>
    </button>
  );
};
