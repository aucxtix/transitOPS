import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react';

const Layout = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden relative bg-background">
      {/* Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 dark:bg-black/80 z-40 backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <Sidebar 
        isMobileOpen={isMobileMenuOpen} 
        setIsMobileOpen={setIsMobileMenuOpen} 
      />

      <main className="flex-1 h-full overflow-y-auto relative z-10 px-4 py-6 md:px-8 md:py-8 lg:pr-8 transition-all duration-300">
        {/* Header with Menu Button */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/10">
          <div className="flex items-center gap-3">
            <span className="font-bold text-2xl tracking-tight text-foreground md:ml-20">TransitOps</span>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2.5 bg-card/80 backdrop-blur-sm rounded-xl shadow-sm border border-border/20 text-foreground hover:bg-card transition-colors z-20"
          >
            <Menu size={24} />
          </button>
        </div>

        <div className="max-w-[1400px] mx-auto w-full h-full md:pl-20">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
