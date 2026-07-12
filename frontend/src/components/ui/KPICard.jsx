import React from 'react';
import { MonoNumber } from './MonoNumber';
import { cn } from '../../utils/cn';

export const KPICard = ({ title, value, suffix = '', icon: Icon, color, bg, glow, className }) => {
  return (
    <div className={cn(
      "p-6 rounded-[1.75rem] border border-border bg-card relative overflow-hidden group shadow-soft",
      glow && "shadow-[0_0_30px_rgba(90,86,246,0.15)] border-primary/30",
      className
    )}>
      <div className="flex justify-between items-start mb-4">
        {Icon && (
          <div className={cn("p-3 rounded-2xl shadow-sm", bg, color)}>
            <Icon size={20} />
          </div>
        )}
      </div>
      <div>
        <h3 className="text-3xl font-bold tracking-tight mb-1">
          <MonoNumber value={value} suffix={suffix} />
        </h3>
        <p className="text-sm font-semibold text-foreground/50">{title}</p>
      </div>
    </div>
  );
};
