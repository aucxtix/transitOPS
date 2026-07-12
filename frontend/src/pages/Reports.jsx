import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { BarChart3, TrendingUp, PieChart as PieChartIcon, Download } from 'lucide-react';
import { InlineErrorBanner } from '../components/ui/InlineErrorBanner';
import { useAuth } from '../hooks/useAuth';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-panel p-4 rounded-xl border border-white/20 shadow-xl z-50">
        <p className="font-bold text-foreground mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm font-semibold" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
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
      
      const headers = ['Trip ID', 'Source', 'Destination', 'Cargo Weight (kg)', 'Planned Distance (km)', 'Actual Distance (km)', 'Fuel Consumed (L)', 'Status', 'Created At', 'Vehicle Registration', 'Driver Name'];
      const rows = data.trips.map(t => [
        t.id, `"${t.source}"`, `"${t.destination}"`, t.cargo_weight, t.planned_distance, t.actual_distance || '', t.fuel_consumed || '', t.status, t.created_at, t.registration_number, t.driver_name
      ]);
      
      const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `transitops_export_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert('Export failed or unauthorized');
    }
  };

  if (loading) return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 bg-border/50 rounded w-1/4"></div>
      <div className="h-64 bg-border/50 rounded-3xl"></div>
    </div>
  );

  const barChartData = reports?.completedTrips?.map(t => ({
    name: `Trip ${t.id}`,
    Distance: t.actual_distance,
    Fuel: t.fuel_consumed
  })) || [];

  return (
    <div className="space-y-8 pb-10">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <BarChart3 className="text-primary" size={32} />
            Reports & Analytics
          </h1>
          <p className="text-foreground/50 font-medium mt-1">Interactive operational data visualizations and exports.</p>
        </div>
        {hasRole(['Fleet Manager', 'Financial Analyst']) && (
          <button 
            onClick={handleExport}
            className="pill-button pill-button-dark shadow-md flex items-center gap-2"
          >
            <Download size={16} /> Export CSV
          </button>
        )}
      </div>

      <InlineErrorBanner message={error} onClose={() => setError(null)} />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* Distance vs Fuel Bar Chart */}
        <div className="glass-panel rounded-[2rem] p-8 shadow-float flex flex-col h-[500px]">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <TrendingUp className="text-primary" size={24} />
              <h3 className="font-bold text-xl">Distance & Fuel Analytics</h3>
            </div>
          </div>
          
          <div className="flex-1 w-full relative min-h-[300px]">
            {barChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(150,150,150,0.1)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'currentColor', opacity: 0.5}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: 'currentColor', opacity: 0.5}} />
                  <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(150,150,150,0.05)'}} />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar dataKey="Distance" fill="#6366F1" radius={[4, 4, 0, 0]} barSize={30} />
                  <Bar dataKey="Fuel" fill="#10B981" radius={[4, 4, 0, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-foreground/40 font-medium">No completed trip data available</div>
            )}
          </div>
        </div>

        {/* Expense Breakdown Pie Chart */}
        <div className="glass-panel rounded-[2rem] p-8 shadow-float flex flex-col h-[500px]">
          <div className="flex items-center gap-3 mb-8">
            <PieChartIcon className="text-amber-500" size={24} />
            <h3 className="font-bold text-xl">Expense Breakdown</h3>
          </div>
          
          <div className="flex-1 w-full relative min-h-[300px]">
            {reports?.expenses && reports.expenses.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={reports.expenses}
                    cx="50%"
                    cy="50%"
                    innerRadius={90}
                    outerRadius={140}
                    paddingAngle={5}
                    dataKey="total"
                    nameKey="type"
                    stroke="none"
                  >
                    {reports.expenses.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-foreground/40 font-medium">No expense data available</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Reports;
