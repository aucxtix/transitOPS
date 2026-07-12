import React from 'react';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  return (
    <div className="flex h-screen overflow-hidden relative">
      <Sidebar />
      <main className="flex-1 h-full overflow-y-auto relative z-10 px-4 py-6 md:px-8 md:py-8 lg:pr-8">
        <div className="max-w-[1400px] mx-auto w-full h-full">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
