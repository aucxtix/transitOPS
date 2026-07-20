import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Activity, ArrowUpRight, Search, Plus } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const ManagerDashboard = ({ data }) => {
  const { kpis, recentTrips } = data;
  const { hasRole } = useAuth();
  
  // Quick Dispatch State
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [selectedDriverId, setSelectedDriverId] = useState(null);
  const [dispatchLoading, setDispatchLoading] = useState(false);

  const fetchResources = async () => {
    try {
      const [driversRes, vehiclesRes] = await Promise.all([
        api.get('/drivers/available'),
        api.get('/vehicles/available')
      ]);
      setAvailableDrivers(driversRes.data.slice(0, 3)); // Top 3 available drivers
      setAvailableVehicles(vehiclesRes.data);
      if (driversRes.data.length > 0) setSelectedDriverId(driversRes.data[0].id);
    } catch (err) {
      console.error('Failed to fetch resources for quick dispatch', err);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const handleQuickDispatch = async () => {
    if (!selectedDriverId || availableVehicles.length === 0) return;
    setDispatchLoading(true);
    try {
      // 1. Create a quick trip
      const vehicleId = availableVehicles[0].id;
      const tripRes = await api.post('/trips', {
        source: 'HQ Base',
        destination: 'Local Route',
        vehicle_id: vehicleId,
        driver_id: selectedDriverId,
        cargo_weight: 100, // Dummy weight for quick dispatch
        planned_distance: 50
      });
      
      // 2. Dispatch the trip immediately
      await api.put(`/trips/${tripRes.data.id}/dispatch`);
      
      alert('Quick Dispatch Successful! The dashboard KPIs will update on next refresh.');
      // Refresh resources
      fetchResources();
    } catch (err) {
      alert(err.response?.data?.error || 'Quick Dispatch Failed');
    } finally {
      setDispatchLoading(false);
    }
  };

  const assignedVehicle = availableVehicles.length > 0 ? availableVehicles[0].registration_number : 'None';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8 h-full pb-10">
      {/* Main Content (Left) */}
      <div className="space-y-8 flex flex-col">
        <div className="relative glass-panel rounded-[2rem] p-8 overflow-hidden min-h-[260px] flex flex-col justify-between shadow-float">
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

        <div className="grid grid-cols-2 gap-6">
          <div className="glass-panel rounded-[1.75rem] p-6 h-64 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-semibold text-foreground/80">Active Trips</h3>
              <span className="glass px-4 py-1.5 rounded-full text-xs font-semibold">Today</span>
            </div>
            <div className="flex-1 flex items-end justify-center">
               <div className="text-center">
                 <h4 className="text-5xl font-bold mono-text text-primary mb-2">{kpis?.activeTrips || 0}</h4>
                 <p className="text-sm font-medium text-foreground/50">Currently On Route</p>
               </div>
            </div>
          </div>
          
          <div className="rounded-[1.75rem] p-6 h-64 flex flex-col bg-gradient-blue text-white shadow-float relative overflow-hidden">
             <div className="flex justify-between items-center mb-2 z-10 relative">
              <h3 className="font-medium text-white/90">Operational Health</h3>
              <button className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md" title="Activity" aria-label="Activity">
                          <Activity size={16} />
                        </button>
            </div>
            <div className="z-10 relative mt-2">
              <h4 className="text-4xl font-bold tracking-tight">92<span className="text-xl text-white/70">%</span></h4>
              <p className="text-xs text-white/70 mt-1">Efficiency score</p>
            </div>
            <svg className="absolute bottom-0 left-0 w-full h-32 opacity-80" preserveAspectRatio="none" viewBox="0 0 100 100">
              <path d="M0,100 L0,70 Q20,80 40,50 T80,30 L100,20 L100,100 Z" fill="rgba(255,255,255,0.15)"/>
              <path d="M0,70 Q20,80 40,50 T80,30 L100,20" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </div>

      {/* Secondary Content (Right Side) */}
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center h-16">
          <h2 className="text-xl font-bold tracking-tight">Recent Activity</h2>
          <button className="pill-button pill-button-dark !px-4 text-sm font-semibold">View All</button>
        </div>

        <div className="flex-1 flex flex-col gap-3">
          {recentTrips && recentTrips.length > 0 ? recentTrips.map((trip) => (
            <div key={trip.id} className="glass-panel p-4 rounded-2xl flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <ArrowUpRight size={18} />
                </div>
                <div>
                  <p className="font-semibold text-sm">{trip.registration_number}</p>
                  <p className="text-xs text-foreground/50">{trip.source} → {trip.destination}</p>
                </div>
              </div>
              <div><span className="px-3 py-1 rounded-full text-[10px] font-bold bg-foreground/10">{trip.status}</span></div>
            </div>
          )) : (
             <div className="glass-panel p-4 rounded-2xl flex flex-col items-center justify-center h-32 text-foreground/50 text-sm">No recent trips.</div>
          )}
        </div>

        {/* Restore Functional Quick Dispatch Widget */}
        <div className="glass rounded-3xl p-6 relative overflow-hidden mt-4 shadow-sm">
          <div className="absolute inset-0 bg-white/40 dark:bg-black/20"></div>
          <div className="relative z-10 flex justify-between items-center mb-6">
            <h3 className="font-semibold">Quick Dispatch</h3>
            <button className="text-xs font-bold text-primary hover:underline">All Drivers</button>
          </div>
          
          <div className="relative z-10 flex items-center gap-3 mb-8">
             <button className="w-12 h-12 rounded-full border border-dashed border-foreground/30 flex items-center justify-center hover:bg-foreground/5 transition-colors" title="Plus" aria-label="Plus">
                          <Plus size={16} />
                        </button>
             {availableDrivers.map((driver) => (
               <div 
                 key={driver.id} 
                 onClick={() => setSelectedDriverId(driver.id)}
                 className="flex flex-col items-center gap-1 cursor-pointer"
               >
                  <img 
                    src={`https://api.dicebear.com/7.x/notionists/svg?seed=${driver.name}&backgroundColor=e2e8f0`} 
                    className={`w-12 h-12 rounded-full border-2 transition-all shadow-sm ${selectedDriverId === driver.id ? 'border-primary' : 'border-transparent hover:border-primary/50'}`} 
                    alt={driver.name} 
                  />
                  <span className={`text-[10px] font-semibold ${selectedDriverId === driver.id ? 'text-primary' : ''}`}>{driver.name.split(' ')[0]}</span>
               </div>
             ))}
             {availableDrivers.length === 0 && (
               <span className="text-xs text-foreground/50">No available drivers</span>
             )}
          </div>

          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-xs text-foreground/50 mb-1">Assigned Vehicle</p>
              <p className="text-lg font-bold mono-text text-foreground/80">{assignedVehicle}</p>
            </div>
            <button 
              onClick={handleQuickDispatch}
              disabled={dispatchLoading || !selectedDriverId || availableVehicles.length === 0 || !hasRole(['Fleet Manager', 'Dispatcher'])}
              className="pill-button pill-button-dark shadow-lg disabled:opacity-50"
            >
              {dispatchLoading ? 'Dispatching...' : 'Assign'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ManagerDashboard;
