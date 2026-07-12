import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

export const ThemeToggle = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`p-3.5 rounded-2xl text-foreground/50 hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${className}`}
      title="Toggle Theme"
      aria-label="Toggle Theme"
    >
      {theme === 'dark' ? <Sun size={22} /> : <Moon size={22} />}
    </button>
  );
};
