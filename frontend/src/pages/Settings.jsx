import React from 'react';
import { ShieldCheck, UserCheck, AlertTriangle } from 'lucide-react';

const Settings = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings & RBAC</h1>
        <p className="text-foreground/50 font-medium mt-1">Configure system parameters and role profiles.</p>
      </div>

      <div className="glass-panel rounded-3xl p-8 space-y-6">
        <div className="flex items-start gap-4 p-4 bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 rounded-2xl">
          <ShieldCheck size={24} className="mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-bold">Role-Based Access is Active</h3>
            <p className="text-sm text-indigo-500/80 mt-1">
              Permissions are configured securely on the backend across 4 independent security layers: UI display, router level, API endpoints, and controller layer validation.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          <div className="space-y-2">
            <h4 className="font-semibold text-sm uppercase tracking-wider text-foreground/50">Active Roles</h4>
            <div className="space-y-2">
              {['Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst', 'Driver'].map((role, idx) => (
                <div key={idx} className="flex justify-between items-center p-3.5 bg-foreground/5 rounded-2xl text-sm font-semibold">
                  <span>{role}</span>
                  <span className="text-xs px-2.5 py-1 bg-primary/10 text-primary rounded-full">Seeded</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-semibold text-sm uppercase tracking-wider text-foreground/50">System Logs & Integrity</h4>
            <div className="p-4 bg-card rounded-2xl border border-border/40 text-sm space-y-3">
              <div className="flex justify-between text-xs text-foreground/50">
                <span>Database persistence:</span>
                <span className="font-mono">SQLite (better-sqlite3)</span>
              </div>
              <div className="flex justify-between text-xs text-foreground/50">
                <span>JWT encryption:</span>
                <span className="font-mono">HS256</span>
              </div>
              <div className="flex justify-between text-xs text-foreground/50">
                <span>Rate limiting:</span>
                <span className="font-mono">Active (100 req / 15m)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
