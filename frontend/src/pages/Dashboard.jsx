import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';

// Role-specific Dashboards
import FleetManagerDash from './dashboards/FleetManagerDash';
import DispatcherDash from './dashboards/DispatcherDash';
import DriverDash from './dashboards/DriverDash';
import FinanceDash from './dashboards/FinanceDash';
import SafetyDash from './dashboards/SafetyDash';

import { AlertCircle } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // FIX: Explicitly request the correct endpoint for the dashboard data
      const { data } = await api.get('/dashboard');
      setDashboardData(data);
    } catch (err) {
      console.error('Dashboard Error:', err);
      setError(err.response?.data?.error || 'A critical error occurred while loading your dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading) return (
    <div className="animate-pulse space-y-8 h-full pb-10">
      <div className="h-10 bg-border/50 rounded-xl w-1/3"></div>
      <div className="h-[260px] bg-border/50 rounded-[2rem]"></div>
      <div className="grid grid-cols-2 gap-6"><div className="h-64 bg-border/50 rounded-[1.75rem]"></div><div className="h-64 bg-border/50 rounded-[1.75rem]"></div></div>
    </div>
  );

  return (
    <div className="h-full space-y-8 pb-10">
      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 font-medium shadow-sm">
          <AlertCircle size={20} />
          {error}
          <button onClick={fetchDashboard} className="ml-auto underline text-sm hover:text-red-400">Retry</button>
        </div>
      )}

      {/* Universal Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Welcome back, {user?.name?.split(' ')[0] || 'User'}
          </h1>
          <p className="text-foreground/50 font-medium mt-1">Here is your {user?.role} overview.</p>
        </div>
        <div className="glass-panel px-5 py-2.5 rounded-full flex items-center gap-6 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-sm font-semibold mono-text">SYS_OK</span>
          </div>
          <div className="w-px h-4 bg-border"></div>
          <span className="text-sm font-semibold text-foreground/80">{user?.role}</span>
        </div>
      </div>

      {/* Router: Conditional Rendering based on strict API response type */}
      {dashboardData && (
        <>
          {dashboardData.type === 'FleetManager' && <FleetManagerDash data={dashboardData} />}
          {dashboardData.type === 'Dispatcher' && <DispatcherDash data={dashboardData} onRefresh={fetchDashboard} />}
          {dashboardData.type === 'Driver' && <DriverDash data={dashboardData} onRefresh={fetchDashboard} />}
          {dashboardData.type === 'Finance' && <FinanceDash data={dashboardData} />}
          {dashboardData.type === 'SafetyOfficer' && <SafetyDash data={dashboardData} />}
        </>
      )}

      {/* Fallback if no data and no error */}
      {!loading && !error && !dashboardData && (
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-foreground/50 border-2 border-dashed border-border rounded-[2rem]">
          <h3 className="text-xl font-bold text-foreground mb-2">No Dashboard Data</h3>
          <p>We could not load a dashboard for your specific role. Please contact system administration.</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
