import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { BarChart3, TrendingUp, PieChart as PieChartIcon, Download, Truck, Users, Droplets, Activity } from 'lucide-react';
import { InlineErrorBanner } from '../components/ui/InlineErrorBanner';
import { KPICard } from '../components/ui/KPICard';
import { useAuth } from '../hooks/useAuth';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area
} from 'recharts';

const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
const DONUT_COLORS = ['#3B82F6', '#8B5CF6', '#F43F5E'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-panel p-4 rounded-xl border border-white/20 shadow-xl z-50 backdrop-blur-xl">
        <p className="font-bold text-foreground mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm font-semibold" style={{ color: entry.color }}>
            {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const Reports = () => {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { hasRole } = useAuth();

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const { data } = await api.get('/dashboard/reports');
        setReports(data);
      } catch (err) {
        setError('Failed to load reports data');
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const handleExport = async () => {
    try {
      const { data } = await api.get('/dashboard/export');
      const headers = ['Trip ID', 'Source', 'Destination', 'Cargo Weight', 'Distance', 'Fuel', 'Status', 'Date', 'Vehicle', 'Driver'];
      const rows = data.trips.map(t => [
        t.id, `"${t.source}"`, `"${t.destination}"`, t.cargo_weight, t.actual_distance || t.planned_distance, t.fuel_consumed || '', t.status, t.created_at, t.registration_number, t.driver_name
      ]);
      const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `transitops_analytics_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert('Export failed');
    }
  };

  if (loading) return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 bg-border/50 rounded w-1/4"></div>
      <div className="grid grid-cols-4 gap-4"><div className="h-32 bg-border/50 rounded-2xl"></div><div className="h-32 bg-border/50 rounded-2xl"></div><div className="h-32 bg-border/50 rounded-2xl"></div><div className="h-32 bg-border/50 rounded-2xl"></div></div>
      <div className="h-[400px] bg-border/50 rounded-3xl"></div>
    </div>
  );

  const barChartData = reports?.completedTrips?.map(t => ({ name: `Trip ${t.id}`, Distance: t.actual_distance, Fuel: t.fuel_consumed })) || [];
  
  return (
    <div className="space-y-8 pb-10">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <BarChart3 className="text-primary" size={32} />
            Enterprise Analytics
          </h1>
          <p className="text-foreground/50 font-medium mt-1">Comprehensive operational insights and financial telemetry.</p>
        </div>
        {hasRole(['Fleet Manager', 'Financial Analyst']) && (
          <button onClick={handleExport} className="pill-button pill-button-dark shadow-md flex items-center gap-2">
            <Download size={16} /> Export Dataset
          </button>
        )}
      </div>

      <InlineErrorBanner message={error} onClose={() => setError(null)} />

      {/* Top Level KPIs */}
      {reports?.kpis && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard title="Total Lifetime Trips" value={reports.kpis.totalTrips} icon={TrendingUp} color="text-indigo-500" />
          <KPICard title="Total Fuel Cost" value={`$${reports.kpis.totalFuelCost.toLocaleString()}`} icon={Droplets} color="text-cyan-500" />
          <KPICard title="Approved Expenses" value={`$${reports.kpis.totalExpenses.toLocaleString()}`} icon={PieChartIcon} color="text-emerald-600 dark:text-emerald-400" />
          <KPICard title="Fleet Safety Score" value={`${reports.kpis.avgSafetyScore.toFixed(1)} / 100`} icon={Activity} color="text-purple-500" />
        </div>
      )}

      {/* Main Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Fleet Utilization Donut */}
        <div className="glass-panel rounded-[2rem] p-8 shadow-float flex flex-col h-[400px] lg:col-span-1">
          <div className="flex items-center gap-3 mb-2">
            <Truck className="text-blue-600 dark:text-blue-400" size={24} />
            <h3 className="font-bold text-xl">Fleet Utilization</h3>
          </div>
          <div className="flex-1 w-full relative">
            {reports?.utilization ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={reports.utilization} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={5} dataKey="value">
                    {reports.utilization.map((entry, index) => <Cell key={index} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="absolute inset-0 flex items-center justify-center text-foreground/40 font-medium">No data</div>}
          </div>
        </div>

        {/* Fuel Consumption Trend */}
        <div className="glass-panel rounded-[2rem] p-8 shadow-float flex flex-col h-[400px] lg:col-span-2">
          <div className="flex items-center gap-3 mb-2">
            <Droplets className="text-cyan-500" size={24} />
            <h3 className="font-bold text-xl">Fuel Consumption Trends</h3>
          </div>
          <div className="flex-1 w-full relative">
            {reports?.fuelLogs?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={reports.fuelLogs} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorLiters" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#06B6D4" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(150,150,150,0.1)" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: 'currentColor', opacity: 0.5}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: 'currentColor', opacity: 0.5}} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="liters" stroke="#06B6D4" strokeWidth={3} fillOpacity={1} fill="url(#colorLiters)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : <div className="absolute inset-0 flex items-center justify-center text-foreground/40 font-medium">No fuel logs</div>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Driver Performance */}
        <div className="glass-panel rounded-[2rem] p-8 shadow-float flex flex-col h-[450px]">
          <div className="flex items-center gap-3 mb-6">
            <Users className="text-indigo-500" size={24} />
            <h3 className="font-bold text-xl">Driver Safety Scores</h3>
          </div>
          <div className="flex-1 w-full relative">
            {reports?.drivers?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={reports.drivers} margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(150,150,150,0.1)" />
                  <XAxis type="number" domain={[0, 100]} axisLine={false} tickLine={false} tick={{fill: 'currentColor', opacity: 0.5}} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: 'currentColor', opacity: 0.8}} width={90} />
                  <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(150,150,150,0.05)'}} />
                  <Bar dataKey="safety_score" fill="#6366F1" radius={[0, 4, 4, 0]} barSize={20}>
                    {reports.drivers.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.safety_score >= 90 ? '#10B981' : entry.safety_score >= 75 ? '#F59E0B' : '#EF4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="absolute inset-0 flex items-center justify-center text-foreground/40 font-medium">No driver data</div>}
          </div>
        </div>

        {/* Expense Breakdown Pie Chart */}
        <div className="glass-panel rounded-[2rem] p-8 shadow-float flex flex-col h-[450px]">
          <div className="flex items-center gap-3 mb-8">
            <PieChartIcon className="text-amber-600 dark:text-amber-400" size={24} />
            <h3 className="font-bold text-xl">Operational Expense Breakdown</h3>
          </div>
          <div className="flex-1 w-full relative">
            {reports?.expenses?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={reports.expenses} cx="50%" cy="50%" innerRadius={80} outerRadius={130} paddingAngle={4} dataKey="total" nameKey="type" stroke="none">
                    {reports.expenses.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="absolute inset-0 flex items-center justify-center text-foreground/40 font-medium">No expense data available</div>}
          </div>
        </div>
        
        {/* Distance vs Fuel Bar Chart (Full Width) */}
        <div className="glass-panel rounded-[2rem] p-8 shadow-float flex flex-col h-[400px] lg:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="text-primary" size={24} />
            <h3 className="font-bold text-xl">Trip Summary: Distance vs Fuel</h3>
          </div>
          <div className="flex-1 w-full relative">
            {barChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(150,150,150,0.1)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'currentColor', opacity: 0.5}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: 'currentColor', opacity: 0.5}} />
                  <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(150,150,150,0.05)'}} />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar dataKey="Distance" fill="#8B5CF6" radius={[4, 4, 0, 0]} barSize={25} />
                  <Bar dataKey="Fuel" fill="#F43F5E" radius={[4, 4, 0, 0]} barSize={25} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="absolute inset-0 flex items-center justify-center text-foreground/40 font-medium">No completed trip data available</div>}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Reports;
