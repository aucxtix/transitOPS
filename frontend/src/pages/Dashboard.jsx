import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Truck, Activity, AlertTriangle, CalendarCheck } from 'lucide-react';
import { MonoNumber } from '../components/ui/MonoNumber';

const Dashboard = () => {
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const { data } = await api.get('/dashboard/kpi');
        setKpis(data);
      } catch (err) {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return <div className="animate-pulse space-y-4">
    <div className="h-8 bg-border rounded w-1/4"></div>
    <div className="grid grid-cols-4 gap-4"><div className="h-32 bg-border rounded"></div><div className="h-32 bg-border rounded"></div></div>
  </div>;
  if (error) return <div className="p-4 bg-red-500/10 text-red-500 rounded-lg">{error}</div>;

  const kpiCards = [
    { title: 'Active Vehicles', value: kpis.activeVehicles, icon: Activity, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { title: 'Available', value: kpis.availableVehicles, icon: Truck, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { title: 'In Maintenance', value: kpis.inMaintenance, icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { title: 'Active Trips', value: kpis.activeTrips, icon: CalendarCheck, color: 'text-purple-500', bg: 'bg-purple-500/10', glow: true },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-foreground/60 text-sm mt-1">Live overview of fleet operations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className={`p-6 rounded-2xl border border-border bg-card relative overflow-hidden group ${card.glow ? 'shadow-[0_0_20px_rgba(168,85,247,0.15)] border-purple-500/30' : ''}`}>
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${card.bg} ${card.color}`}>
                  <Icon size={20} />
                </div>
              </div>
              <div>
                <h3 className="text-3xl font-bold font-mono tracking-tight mb-1">{card.value}</h3>
                <p className="text-sm font-medium text-foreground/60">{card.title}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="text-lg font-bold mb-4">Fleet Utilization</h3>
          <div className="flex items-center gap-4">
            <div className="text-5xl font-bold font-mono text-primary">{kpis.fleetUtilization}%</div>
            <p className="text-sm text-foreground/60 max-w-[200px]">Of your fleet is currently deployed on active trips.</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="text-lg font-bold mb-4">Drivers On Duty</h3>
          <div className="flex items-center gap-4">
            <div className="text-5xl font-bold font-mono text-emerald-500">{kpis.driversOnDuty}</div>
            <p className="text-sm text-foreground/60 max-w-[200px]">Drivers are currently engaged in active transport.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
