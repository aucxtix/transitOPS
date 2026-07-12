import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { StatusBadge } from '../components/ui/StatusBadge';
import { MonoNumber } from '../components/ui/MonoNumber';
import { useAuth } from '../hooks/useAuth';

const Trips = () => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { hasRole } = useAuth();

  const fetchTrips = async () => {
    try {
      const { data } = await api.get('/trips');
      setTrips(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load trips');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  const handleAction = async (id, action) => {
    try {
      let body = {};
      if (action === 'complete') {
        const dist = prompt('Enter actual distance (km):', '150');
        const fuel = prompt('Enter fuel consumed (L):', '40');
        if (!dist || !fuel) return;
        body = { actual_distance: parseFloat(dist), fuel_consumed: parseFloat(fuel) };
      }
      await api.put(`/trips/${id}/${action}`, body);
      fetchTrips();
    } catch (err) {
      alert(err.response?.data?.error || 'Action failed');
    }
  };

  if (loading) return <div className="animate-pulse h-64 bg-border rounded-xl"></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Trip Dispatcher</h1>
          <p className="text-foreground/60 text-sm mt-1">Manage, dispatch, and track trips.</p>
        </div>
        {hasRole(['Fleet Manager', 'Dispatcher']) && (
          <button className="pill-button pill-button-dark shadow-sm">
            Create Trip
          </button>
        )}
      </div>

      <div className="glass-panel rounded-3xl overflow-hidden shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-foreground/5 border-b border-border text-foreground/70 font-medium">
              <tr>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Route</th>
                <th className="px-6 py-4">Vehicle</th>
                <th className="px-6 py-4">Driver</th>
                <th className="px-6 py-4">Cargo</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {trips.map((t) => (
                <tr key={t.id} className="hover:bg-foreground/[0.02] transition-colors">
                  <td className="px-6 py-4"><MonoNumber value={t.id} prefix="#" className="text-primary" /></td>
                  <td className="px-6 py-4 font-medium">{t.source} → {t.destination}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span>{t.vehicle_name}</span>
                      <MonoNumber value={t.registration_number} className="text-xs text-foreground/50" />
                    </div>
                  </td>
                  <td className="px-6 py-4">{t.driver_name}</td>
                  <td className="px-6 py-4"><MonoNumber value={t.cargo_weight} suffix=" kg" /></td>
                  <td className="px-6 py-4"><StatusBadge status={t.status} /></td>
                  <td className="px-6 py-4 text-right">
                    {hasRole(['Fleet Manager', 'Dispatcher']) && (
                      <div className="flex justify-end gap-2">
                        {t.status === 'Pending' && (
                          <button onClick={() => handleAction(t.id, 'dispatch')} className="text-xs px-3 py-1.5 bg-blue-500/10 text-blue-600 rounded-xl hover:bg-blue-500/20 font-medium transition-colors">Dispatch</button>
                        )}
                        {t.status === 'On Trip' && (
                          <button onClick={() => handleAction(t.id, 'complete')} className="text-xs px-3 py-1.5 bg-emerald-500/10 text-emerald-600 rounded-xl hover:bg-emerald-500/20 font-medium transition-colors">Complete</button>
                        )}
                        {(t.status === 'Pending' || t.status === 'On Trip') && (
                          <button onClick={() => handleAction(t.id, 'cancel')} className="text-xs px-3 py-1.5 bg-red-500/10 text-red-600 rounded-xl hover:bg-red-500/20 font-medium transition-colors">Cancel</button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Trips;
