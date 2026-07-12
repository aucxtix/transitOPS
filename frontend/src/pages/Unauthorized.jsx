import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

const Unauthorized = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
      <div className="p-4 bg-red-500/10 text-red-500 rounded-full mb-4">
        <ShieldAlert size={48} />
      </div>
      <h1 className="text-3xl font-bold tracking-tight text-foreground">403 Forbidden</h1>
      <p className="text-foreground/60 max-w-md">
        You do not have the required permissions to access this page. Please contact your system administrator if you believe this is a mistake.
      </p>
      <Link 
        to="/" 
        className="mt-6 bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-6 py-2.5 rounded-lg transition-colors shadow-sm"
      >
        Return to Dashboard
      </Link>
    </div>
  );
};

export default Unauthorized;
