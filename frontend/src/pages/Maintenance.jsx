import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { StatusBadge } from '../components/ui/StatusBadge';
import { MonoNumber } from '../components/ui/MonoNumber';
import { useAuth } from '../hooks/useAuth';

const Maintenance = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { hasRole } = useAuth();

  const fetchLogs = async () => {
    try {
      const { data } = await api.get('/maintenance');
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleClose = async (id) => {
    const cost = prompt('Enter maintenance cost ($):', '0');
    if (cost === null) return;
    try {
      await api.put(`/maintenance/${id}/close`, { cost: parseFloat(cost) });
      fetchLogs();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to close log');
    }
  };

  if (loading) return <div className="animate-pulse h-64 bg-border rounded-xl"></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Maintenance Logs</h1>
          <p className="text-foreground/60 text-sm mt-1">Track vehicle repairs and service history.</p>
        </div>
        {hasRole(['Fleet Manager']) && (
          <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg font-medium transition-colors shadow-sm">
            Create Log
          </button>
        )}
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-foreground/5 border-b border-border text-foreground/70 font-medium">
              <tr>
                <th className="px-6 py-4">Vehicle</th>
                <th className="px-6 py-4">Service</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Cost</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs.map((l) => (
                <tr key={l.id} className="hover:bg-foreground/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-medium">{l.name_model}</span>
                      <MonoNumber value={l.registration_number} className="text-xs text-foreground/50" />
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium">{l.maintenance_name}</td>
                  <td className="px-6 py-4 text-foreground/70 max-w-xs truncate">{l.description}</td>
                  <td className="px-6 py-4">
                    {l.cost !== null ? <MonoNumber value={l.cost} prefix="$" /> : <span className="text-foreground/30">-</span>}
                  </td>
                  <td className="px-6 py-4"><StatusBadge status={l.status} /></td>
                  <td className="px-6 py-4 text-right">
                    {hasRole(['Fleet Manager']) && l.status === 'Open' && (
                      <button onClick={() => handleClose(l.id)} className="text-xs px-3 py-1.5 bg-emerald-500/10 text-emerald-600 rounded hover:bg-emerald-500/20 font-medium transition-colors">
                        Close Log
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-foreground/50">No maintenance logs found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Maintenance;
