import React from 'react';
import { Shield, AlertTriangle } from 'lucide-react';
import { MonoNumber } from '../../components/ui/MonoNumber';

const EmptyState = ({ message }) => (
  <div className="flex-1 flex items-center justify-center text-foreground/50 p-6 text-center border-2 border-dashed border-border rounded-xl">
    {message}
  </div>
);

const SafetyDash = ({ data }) => {
  const { driverRankings, overdueMaintenance } = data;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-10">
      {/* Driver Rankings Panel */}
      <div className="glass-panel rounded-[1.75rem] p-6 flex flex-col h-[600px]">
        <h3 className="font-semibold text-foreground/80 mb-4 flex items-center gap-2 text-primary"><Shield size={18}/> Driver Safety Rankings</h3>
        {driverRankings && driverRankings.length > 0 ? (
          <div className="overflow-y-auto pr-2 space-y-4">
            {driverRankings.map((driver, index) => (
              <div key={driver.id} className="p-4 bg-foreground/5 rounded-2xl flex justify-between items-center border border-border/50">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">#{index + 1}</div>
                   <div>
                     <p className="font-bold text-sm">{driver.name}</p>
                     <p className="text-xs text-foreground/60">{driver.license_number}</p>
                   </div>
                </div>
                <div className="flex flex-col items-end">
                   <span className={`text-lg font-bold mono-text ${driver.safety_score >= 90 ? 'text-emerald-500' : driver.safety_score >= 70 ? 'text-amber-500' : 'text-red-500'}`}>
                     {driver.safety_score}
                   </span>
                   <span className="text-[10px] uppercase text-foreground/40 font-bold">Score</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState message="No drivers evaluated yet." />
        )}
      </div>
      
      {/* Maintenance Alerts Panel */}
      <div className="glass-panel rounded-[1.75rem] p-6 flex flex-col h-[600px]">
        <h3 className="font-semibold text-foreground/80 mb-4 flex items-center gap-2 text-red-500"><AlertTriangle size={18}/> Critical Maintenance Logs</h3>
        {overdueMaintenance && overdueMaintenance.length > 0 ? (
          <div className="overflow-y-auto pr-2 space-y-3 h-full">
            {overdueMaintenance.map(log => (
              <div key={log.id} className="p-4 bg-red-500/5 border border-red-500/20 rounded-2xl flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <p className="font-bold text-sm text-red-600 dark:text-red-400">{log.maintenance_name}</p>
                  <span className="px-2 py-1 bg-red-500 text-white rounded text-[10px] font-bold">OPEN</span>
                </div>
                <p className="text-xs text-foreground/70">{log.description}</p>
                <p className="text-xs font-medium mt-1">Vehicle: {log.registration_number}</p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState message="No open critical maintenance alerts. Fleet is operating safely." />
        )}
      </div>
    </div>
  );
};

export default SafetyDash;
