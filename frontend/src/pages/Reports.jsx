import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { BarChart3, TrendingUp, PieChart, Download } from 'lucide-react';
import { KPICard } from '../components/ui/KPICard';
import { InlineErrorBanner } from '../components/ui/InlineErrorBanner';

const Reports = () => {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      
      // Basic client-side CSV generation
      const headers = ['Trip ID', 'Source', 'Destination', 'Cargo Weight (kg)', 'Planned Distance (km)', 'Actual Distance (km)', 'Fuel Consumed (L)', 'Status', 'Created At', 'Vehicle Registration', 'Driver Name'];
      const rows = data.trips.map(t => [
        t.id,
        `"${t.source}"`,
        `"${t.destination}"`,
        t.cargo_weight,
        t.planned_distance,
        t.actual_distance || '',
        t.fuel_consumed || '',
        t.status,
        t.created_at,
        t.registration_number,
        t.driver_name
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

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-foreground/50 font-medium mt-1">Operational data summaries and exports.</p>
        </div>
        <button 
          onClick={handleExport}
          className="pill-button pill-button-dark shadow-md flex items-center gap-2"
        >
          <Download size={16} /> Export Operational Data
        </button>
      </div>

      <InlineErrorBanner message={error} onClose={() => setError(null)} />

      {/* Reports layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Completed Trips Card */}
        <div className="glass-panel rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="text-primary" />
            <h3 className="font-bold text-lg">Trip Summaries</h3>
          </div>
          <div className="space-y-4">
            {reports?.completedTrips?.map((t) => (
              <div key={t.id} className="flex justify-between items-center py-2 border-b border-border/20 last:border-0">
                <div>
                  <p className="font-semibold text-sm">Trip #{t.id} ({t.registration_number})</p>
                  <p className="text-xs text-foreground/50">{new Date(t.created_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm">{t.actual_distance} km</p>
                  <p className="text-xs text-foreground/50">{t.fuel_consumed} L fuel</p>
                </div>
              </div>
            ))}
            {(!reports?.completedTrips || reports.completedTrips.length === 0) && (
              <p className="text-sm text-foreground/50 text-center py-8">No completed trips to report.</p>
            )}
          </div>
        </div>

        {/* Expenses Card */}
        <div className="glass-panel rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <PieChart className="text-primary" />
            <h3 className="font-bold text-lg">Expense Breakdown</h3>
          </div>
          <div className="space-y-4">
            {reports?.expenses?.map((e, idx) => (
              <div key={idx} className="flex justify-between items-center py-2 border-b border-border/20 last:border-0">
                <span className="font-semibold text-sm">{e.type}</span>
                <span className="font-mono text-sm font-bold">${e.total.toFixed(2)}</span>
              </div>
            ))}
            {(!reports?.expenses || reports.expenses.length === 0) && (
              <p className="text-sm text-foreground/50 text-center py-8">No expense logs to report.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
