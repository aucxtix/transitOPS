import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { StatusBadge } from '../components/ui/StatusBadge';
import { MonoNumber } from '../components/ui/MonoNumber';
import { useAuth } from '../hooks/useAuth';
import { Modal } from '../components/ui/Modal';

const Trips = () => {
  const [trips, setTrips] = useState([]);
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [availableDrivers, setAvailableDrivers] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { hasRole } = useAuth();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createData, setCreateData] = useState({
    source: '', destination: '', vehicle_id: '', driver_id: '', cargo_weight: '', planned_distance: '', notes: ''
  });

  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [activeTripId, setActiveTripId] = useState(null);
  const [completeData, setCompleteData] = useState({ actual_distance: '', fuel_consumed: '' });

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

  const fetchAvailable = async () => {
    try {
      const [vRes, dRes] = await Promise.all([
        api.get('/vehicles/available'),
        api.get('/drivers/available')
      ]);
      setAvailableVehicles(vRes.data);
      setAvailableDrivers(dRes.data);
      if (vRes.data.length > 0) setCreateData(prev => ({ ...prev, vehicle_id: vRes.data[0].id }));
      if (dRes.data.length > 0) setCreateData(prev => ({ ...prev, driver_id: dRes.data[0].id }));
    } catch (err) {
      console.error('Failed to load available resources', err);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  const openCreateModal = () => {
    fetchAvailable();
    setIsCreateModalOpen(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/trips', {
        ...createData,
        vehicle_id: parseInt(createData.vehicle_id),
        driver_id: parseInt(createData.driver_id),
        cargo_weight: parseFloat(createData.cargo_weight),
        planned_distance: parseFloat(createData.planned_distance)
      });
      setIsCreateModalOpen(false);
      setCreateData({ source: '', destination: '', vehicle_id: '', driver_id: '', cargo_weight: '', planned_distance: '', notes: '' });
      fetchTrips();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create trip');
    }
  };

  const handleDispatch = async (id) => {
    if (!confirm('Dispatch this trip now?')) return;
    try {
      await api.put(`/trips/${id}/dispatch`);
      fetchTrips();
    } catch (err) {
      alert(err.response?.data?.error || 'Dispatch failed');
    }
  };

  const openCompleteModal = (id) => {
    setActiveTripId(id);
    setCompleteData({ actual_distance: '', fuel_consumed: '' });
    setIsCompleteModalOpen(true);
  };

  const handleComplete = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/trips/${activeTripId}/complete`, {
        actual_distance: parseFloat(completeData.actual_distance),
        fuel_consumed: parseFloat(completeData.fuel_consumed)
      });
      setIsCompleteModalOpen(false);
      fetchTrips();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to complete trip');
    }
  };

  const handleCancel = async (id) => {
    if (!confirm('Are you sure you want to cancel this trip?')) return;
    try {
      await api.put(`/trips/${id}/cancel`);
      fetchTrips();
    } catch (err) {
      alert(err.response?.data?.error || 'Cancel failed');
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
          <button onClick={openCreateModal} className="pill-button pill-button-dark shadow-sm">
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
                  <td className="px-6 py-4 font-medium">{t.source?.split(',')[0]} → {t.destination?.split(',')[0]}</td>
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
                          <button onClick={() => handleDispatch(t.id)} className="text-xs px-3 py-1.5 bg-blue-500/10 text-blue-600 rounded-xl hover:bg-blue-500/20 font-medium transition-colors">Dispatch</button>
                        )}
                        {t.status === 'On Trip' && (
                          <button onClick={() => openCompleteModal(t.id)} className="text-xs px-3 py-1.5 bg-emerald-500/10 text-emerald-600 rounded-xl hover:bg-emerald-500/20 font-medium transition-colors">Complete</button>
                        )}
                        {(t.status === 'Pending' || t.status === 'On Trip') && (
                          <button onClick={() => handleCancel(t.id)} className="text-xs px-3 py-1.5 bg-red-500/10 text-red-600 rounded-xl hover:bg-red-500/20 font-medium transition-colors">Cancel</button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {trips.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-foreground/50">No trips found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create New Trip">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground/70 mb-1">Source</label>
              <input type="text" required value={createData.source} onChange={e => setCreateData({...createData, source: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-border bg-foreground/5 focus:outline-none focus:border-primary" placeholder="e.g. Warehouse A" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground/70 mb-1">Destination</label>
              <input type="text" required value={createData.destination} onChange={e => setCreateData({...createData, destination: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-border bg-foreground/5 focus:outline-none focus:border-primary" placeholder="e.g. Distribution Center" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground/70 mb-1">Vehicle</label>
              <select required value={createData.vehicle_id} onChange={e => setCreateData({...createData, vehicle_id: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-border bg-foreground/5 focus:outline-none focus:border-primary">
                {availableVehicles.map(v => <option key={v.id} value={v.id}>{v.registration_number} - {v.name_model} ({v.max_load_capacity}kg)</option>)}
                {availableVehicles.length === 0 && <option value="">No vehicles available</option>}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground/70 mb-1">Driver</label>
              <select required value={createData.driver_id} onChange={e => setCreateData({...createData, driver_id: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-border bg-foreground/5 focus:outline-none focus:border-primary">
                {availableDrivers.map(d => <option key={d.id} value={d.id}>{d.name} (Score: {d.safety_score})</option>)}
                {availableDrivers.length === 0 && <option value="">No drivers available</option>}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground/70 mb-1">Cargo Weight (kg)</label>
              <input type="number" required min="1" value={createData.cargo_weight} onChange={e => setCreateData({...createData, cargo_weight: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-border bg-foreground/5 focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground/70 mb-1">Planned Distance (km)</label>
              <input type="number" required min="1" value={createData.planned_distance} onChange={e => setCreateData({...createData, planned_distance: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-border bg-foreground/5 focus:outline-none focus:border-primary" />
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-5 py-2.5 rounded-xl font-semibold hover:bg-foreground/5 transition-colors">Cancel</button>
            <button type="submit" disabled={availableVehicles.length === 0 || availableDrivers.length === 0} className="pill-button pill-button-dark shadow-md disabled:opacity-50">Create Trip</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isCompleteModalOpen} onClose={() => setIsCompleteModalOpen(false)} title="Complete Trip">
        <form onSubmit={handleComplete} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground/70 mb-1">Actual Distance Driven (km)</label>
              <input type="number" required min="1" step="0.1" value={completeData.actual_distance} onChange={e => setCompleteData({...completeData, actual_distance: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-border bg-foreground/5 focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground/70 mb-1">Fuel Consumed (Liters)</label>
              <input type="number" required min="1" step="0.1" value={completeData.fuel_consumed} onChange={e => setCompleteData({...completeData, fuel_consumed: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-border bg-foreground/5 focus:outline-none focus:border-primary" />
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={() => setIsCompleteModalOpen(false)} className="px-5 py-2.5 rounded-xl font-semibold hover:bg-foreground/5 transition-colors">Cancel</button>
            <button type="submit" className="pill-button pill-button-dark shadow-md">Complete Trip</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Trips;
