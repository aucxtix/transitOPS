import React from 'react';
import { cn } from '../../utils/cn';

const statusStyles = {
  'Available': 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  'On Trip': 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  'In Shop': 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  'Suspended': 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
  'Retired': 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
  'Pending': 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  'Completed': 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  'Cancelled': 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
  'Open': 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  'Closed': 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  'Paid': 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
};

export const StatusBadge = ({ status, className }) => {
  const defaultStyle = 'bg-gray-500/10 text-gray-500 border-gray-500/20';
  const appliedStyle = statusStyles[status] || defaultStyle;

  return (
    <span className={cn('px-2.5 py-1 rounded-full text-xs font-semibold border inline-flex items-center justify-center', appliedStyle, className)}>
      {status}
    </span>
  );
};
