import React from 'react';
import { cn } from '../../utils/cn';

export const MonoNumber = ({ value, prefix = '', suffix = '', className }) => {
  return (
    <span className={cn('font-mono font-medium tracking-tight', className)}>
      {prefix}{value}{suffix}
    </span>
  );
};
