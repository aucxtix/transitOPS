import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { Truck, Activity, CalendarCheck, ArrowUpRight, Search, Plus } from 'lucide-react';
import { MonoNumber } from '../components/ui/MonoNumber';

const Dashboard = () => {
  const { user } = useAuth();
  const [kpis, setKpis] = useState(null);
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [kpiRes, reportsRes] = await Promise.all([
          api.get('/dashboard/kpi'),
          api.get('/dashboard/reports')
        ]);
        setKpis(kpiRes.data);
        setReports(reportsRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return (
    <div className="animate-pulse space-y-6 h-full p-4">
      <div className="h-10 bg-border/50 rounded-xl w-1/4"></div>
      <div className="h-64 bg-border/50 rounded-3xl"></div>
      <div className="grid grid-cols-2 gap-6"><div className="h-48 bg-border/50 rounded-3xl"></div><div className="h-48 bg-border/50 rounded-3xl"></div></div>
    </div>
  );

  // Generate some dummy recent trips if empty for visual demo
  const recentTrips = reports?.completedTrips?.slice(0, 5) || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8 h-full pb-10">
      
      {/* Main Content (Left) */}
      <div className="space-y-8 flex flex-col">
        
        {/* Header */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">TransitOps</h1>
            <p className="text-foreground/50 font-medium mt-1">Start managing your fleet</p>
          </div>
          
          <div className="glass-panel px-5 py-2.5 rounded-full flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-sm font-semibold mono-text">SYS_OK</span>
            </div>
            <div className="w-px h-4 bg-border"></div>
            <span className="text-sm font-semibold text-foreground/80">{user?.role}</span>
          </div>
        </div>

        {/* Hero KPI Card */}
        <div className="relative glass-panel rounded-[2rem] p-8 overflow-hidden min-h-[260px] flex flex-col justify-between shadow-float">
          <div className="absolute inset-0 bg-white/20 dark:bg-black/10 backdrop-blur-[2px]"></div>
          
          {/* Bubbles bg */}
          <div className="bubble bg-gradient-violet w-64 h-64 top-[-10%] left-[20%] opacity-20 mix-blend-multiply dark:mix-blend-lighten animate-pulse" style={{ animationDuration: '8s' }}></div>
          <div className="bubble bg-gradient-blue w-56 h-56 bottom-[-20%] left-[45%] opacity-20 mix-blend-multiply dark:mix-blend-lighten animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }}></div>
          
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <p className="text-foreground/70 font-medium mb-1">Fleet Health</p>
              <h2 className="text-5xl font-bold tracking-tight mono-text">{kpis?.fleetUtilization}%</h2>
            </div>
            
            <div className="flex flex-col gap-3">
              <button className="pill-button pill-button-light shadow-sm text-sm">
                <Plus size={16} /> Add Vehicle
              </button>
              <button className="pill-button pill-button-dark shadow-md text-sm">
                <Truck size={16} /> Dispatch Trip
              </button>
            </div>
          </div>
          
          <div className="relative z-10 flex gap-4 mt-12">
            <div className="glass rounded-[1.25rem] px-6 py-4 flex-1 text-center bg-white/40 dark:bg-black/20 border-white/60 dark:border-white/10 shadow-sm">
              <p className="text-2xl font-bold mono-text">{kpis?.activeVehicles}</p>
              <p className="text-xs font-medium text-foreground/60 uppercase tracking-wider mt-1">Active</p>
            </div>
            <div className="glass rounded-[1.25rem] px-6 py-4 flex-1 text-center bg-gradient-violet text-white border-none shadow-md">
              <p className="text-2xl font-bold mono-text">{kpis?.availableVehicles}</p>
              <p className="text-xs font-medium text-white/80 uppercase tracking-wider mt-1">Available</p>
            </div>
            <div className="glass rounded-[1.25rem] px-6 py-4 flex-1 text-center bg-white/40 dark:bg-black/20 border-white/60 dark:border-white/10 shadow-sm">
              <p className="text-2xl font-bold mono-text">{kpis?.inMaintenance}</p>
              <p className="text-xs font-medium text-foreground/60 uppercase tracking-wider mt-1">In Shop</p>
            </div>
          </div>
        </div>

        {/* Embedded Charts Area */}
        <div className="grid grid-cols-2 gap-6">
          <div className="glass-panel rounded-[1.75rem] p-6 h-64 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-semibold text-foreground/80">Active Trips</h3>
              <span className="glass px-4 py-1.5 rounded-full text-xs font-semibold">Today</span>
            </div>
            <div className="flex-1 flex items-end gap-3 px-2">
              {/* Dummy Bar Chart visually similar to FundFlow */}
              {[40, 60, 30, 80, 50].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col justify-end gap-2 group">
                  <div className="w-full rounded-full transition-all duration-300 relative group-hover:opacity-90"
                       style={{ height: `${h}%`, background: i === 3 ? 'linear-gradient(180deg, #6366F1 0%, rgba(99,102,241,0.2) 100%)' : 'rgba(156,163,175,0.2)' }}>
                    {i === 3 && <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs font-bold px-2 py-1 rounded-full">{kpis?.activeTrips}</div>}
                  </div>
                  <span className="text-[10px] text-center font-medium text-foreground/40">DAY {i+1}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="rounded-[1.75rem] p-6 h-64 flex flex-col bg-gradient-blue text-white shadow-float relative overflow-hidden">
             <div className="flex justify-between items-center mb-2 z-10 relative">
              <h3 className="font-medium text-white/90">Operational Health</h3>
              <button className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
                <Activity size={14} className="text-white" />
              </button>
            </div>
            <div className="z-10 relative mt-2">
              <h4 className="text-4xl font-bold tracking-tight">92<span className="text-xl text-white/70">%</span></h4>
              <p className="text-xs text-white/70 mt-1">Efficiency score</p>
            </div>
            {/* Fake SVG line chart embedded */}
            <svg className="absolute bottom-0 left-0 w-full h-32 opacity-80" preserveAspectRatio="none" viewBox="0 0 100 100">
              <path d="M0,100 L0,70 Q20,80 40,50 T80,30 L100,20 L100,100 Z" fill="rgba(255,255,255,0.15)"/>
              <path d="M0,70 Q20,80 40,50 T80,30 L100,20" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
              <circle cx="80" cy="30" r="3" fill="#fff" />
            </svg>
          </div>
        </div>

      </div>

      {/* Secondary Content (Right Side) */}
      <div className="flex flex-col gap-6">
        
        {/* Header Right */}
        <div className="flex justify-between items-center h-16">
          <h2 className="text-xl font-bold tracking-tight">Recent Activity</h2>
          <div className="flex gap-2">
            <button className="w-10 h-10 rounded-full glass-panel flex items-center justify-center hover:bg-white/60 dark:hover:bg-white/10 transition-colors">
              <Search size={18} className="text-foreground/70" />
            </button>
            <button className="pill-button pill-button-dark !px-4 text-sm font-semibold">View All</button>
          </div>
        </div>

        {/* Activity List */}
        <div className="flex-1 flex flex-col gap-3">
          {recentTrips.length > 0 ? (
            recentTrips.map((trip, idx) => (
              <div key={idx} className="glass-panel p-4 rounded-2xl flex items-center justify-between group hover:bg-white/80 dark:hover:bg-white/5 transition-all cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <ArrowUpRight size={18} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{trip.vehicle_name || trip.registration_number || 'Trip ' + trip.id}</p>
                    <p className="text-xs text-foreground/50">{trip.source.split(',')[0]} → {trip.destination.split(',')[0]}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">Done</span>
                  <span className="font-mono text-sm font-bold">{trip.actual_distance}km</span>
                </div>
              </div>
            ))
          ) : (
             <div className="glass-panel p-4 rounded-2xl flex flex-col items-center justify-center h-32 text-foreground/50 text-sm">
                No recent trips.
             </div>
          )}
        </div>

        {/* Quick Dispatch Widget */}
        <div className="glass rounded-3xl p-6 relative overflow-hidden mt-4 shadow-sm">
          <div className="absolute inset-0 bg-white/40 dark:bg-black/20"></div>
          <div className="relative z-10 flex justify-between items-center mb-6">
            <h3 className="font-semibold">Quick Dispatch</h3>
            <button className="text-xs font-bold text-primary hover:underline">All Drivers</button>
          </div>
          
          <div className="relative z-10 flex items-center gap-3 mb-8">
             <button className="w-12 h-12 rounded-full border border-dashed border-foreground/30 flex items-center justify-center hover:bg-foreground/5 transition-colors">
               <Plus size={20} className="text-foreground/50" />
             </button>
             {['Alex', 'Sarah', 'John'].map((name, i) => (
               <div key={i} className="flex flex-col items-center gap-1 cursor-pointer">
                  <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${name}&backgroundColor=e2e8f0`} className="w-12 h-12 rounded-full border-2 border-transparent hover:border-primary transition-all shadow-sm" alt={name} />
                  <span className="text-[10px] font-semibold">{name}</span>
               </div>
             ))}
          </div>

          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-xs text-foreground/50 mb-1">Assigned Vehicle</p>
              <p className="text-lg font-bold mono-text">VAN-01</p>
            </div>
            <button className="pill-button pill-button-dark shadow-lg">Assign</button>
          </div>
        </div>

      </div>

    </div>
  );
};

export default Dashboard;
