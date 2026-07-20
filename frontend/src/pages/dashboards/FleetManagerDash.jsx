import React from 'react';
import { Activity, AlertTriangle, PenTool } from 'lucide-react';
import { MonoNumber } from '../../components/ui/MonoNumber';

const EmptyState = ({ message }) => (
  <div className="flex-1 flex items-center justify-center text-foreground/50 h-full p-6 text-center border-2 border-dashed border-border rounded-[1.75rem]">
    {message}
  </div>
);

const FleetManagerDash = ({ data }) => {
  const { kpis, financials, maintenanceAlerts } = data;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 relative glass-panel rounded-[2rem] p-8 overflow-hidden min-h-[260px] flex flex-col justify-between shadow-float">
          <div className="absolute inset-0 bg-white/20 dark:bg-black/10 backdrop-blur-[2px]"></div>
          <div className="bubble bg-gradient-violet w-64 h-64 top-[-10%] left-[20%] opacity-20 mix-blend-multiply dark:mix-blend-lighten animate-pulse" style={{ animationDuration: '8s' }}></div>
          <div className="bubble bg-gradient-blue w-56 h-56 bottom-[-20%] left-[45%] opacity-20 mix-blend-multiply dark:mix-blend-lighten animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }}></div>
          
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <p className="text-foreground/70 font-medium mb-1">Fleet Health</p>
              <h2 className="text-5xl font-bold tracking-tight mono-text">{kpis?.fleetUtilization || 0}%</h2>
            </div>
          </div>
          
          <div className="relative z-10 flex gap-4 mt-12">
            <div className="glass rounded-[1.25rem] px-6 py-4 flex-1 text-center bg-white/40 dark:bg-black/20 shadow-sm">
              <p className="text-2xl font-bold mono-text">{kpis?.activeVehicles || 0}</p>
              <p className="text-xs font-medium text-foreground/60 uppercase tracking-wider mt-1">Active</p>
            </div>
            <div className="glass rounded-[1.25rem] px-6 py-4 flex-1 text-center bg-gradient-violet text-white shadow-md">
              <p className="text-2xl font-bold mono-text">{kpis?.availableVehicles || 0}</p>
              <p className="text-xs font-medium text-white/80 uppercase tracking-wider mt-1">Available</p>
            </div>
            <div className="glass rounded-[1.25rem] px-6 py-4 flex-1 text-center bg-white/40 dark:bg-black/20 shadow-sm">
              <p className="text-2xl font-bold mono-text">{kpis?.inMaintenance || 0}</p>
              <p className="text-xs font-medium text-foreground/60 uppercase tracking-wider mt-1">In Shop</p>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] p-8 flex flex-col justify-center bg-gradient-blue text-white shadow-float relative overflow-hidden">
           <div className="flex justify-between items-center mb-2 z-10 relative">
            <h3 className="font-medium text-white/90">Total Operational Costs</h3>
          </div>
          <div className="z-10 relative mt-2">
            <h4 className="text-4xl font-bold tracking-tight"><MonoNumber value={financials?.totalCosts || 0} prefix="$" /></h4>
            <p className="text-xs text-white/70 mt-1">Fuel & Approved Expenses</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel rounded-[1.75rem] p-6 h-[300px] flex flex-col">
          <h3 className="font-semibold text-foreground/80 mb-4 flex items-center gap-2"><Activity size={18}/> Trip Overview</h3>
          <div className="flex-1 flex gap-4">
             <div className="flex-1 flex flex-col justify-center items-center bg-foreground/5 rounded-2xl">
               <h4 className="text-5xl font-bold mono-text text-primary mb-2">{kpis?.activeTrips || 0}</h4>
               <p className="text-sm font-medium text-foreground/50">On Route</p>
             </div>
             <div className="flex-1 flex flex-col justify-center items-center bg-foreground/5 rounded-2xl">
               <h4 className="text-5xl font-bold mono-text text-amber-600 dark:text-amber-400 mb-2">{kpis?.pendingTrips || 0}</h4>
               <p className="text-sm font-medium text-foreground/50">Pending</p>
             </div>
          </div>
        </div>

        <div className="glass-panel rounded-[1.75rem] p-6 h-[300px] flex flex-col">
          <h3 className="font-semibold text-foreground/80 mb-4 flex items-center gap-2 text-red-500"><AlertTriangle size={18}/> Open Maintenance Alerts</h3>
          {maintenanceAlerts && maintenanceAlerts.length > 0 ? (
            <div className="overflow-y-auto pr-2 space-y-3 h-full">
              {maintenanceAlerts.map(alert => (
                <div key={alert.id} className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex justify-between items-center">
                  <div>
                    <p className="font-bold text-sm">{alert.maintenance_name}</p>
                    <p className="text-xs text-foreground/60 mt-0.5">Vehicle ID: {alert.vehicle_id}</p>
                  </div>
                  <PenTool size={16} className="text-red-500" />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState message="No open maintenance alerts. The fleet is healthy!" />
          )}
        </div>
      </div>
    </div>
  );
};

export default FleetManagerDash;
