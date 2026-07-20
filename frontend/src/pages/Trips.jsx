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
  const { hasRole, user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [activeRequestId, setActiveRequestId] = useState(null);
  const [quoteBudget, setQuoteBudget] = useState('');
  const [approveData, setApproveData] = useState({ vehicle_id: '', driver_id: '', planned_distance: '' });

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createData, setCreateData] = useState({
    source: '', destination: '', vehicle_id: '', driver_id: '', cargo_weight: '', planned_distance: '', notes: ''
  });

  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [activeTripId, setActiveTripId] = useState(null);
  const [completeData, setCompleteData] = useState({ actual_distance: '', fuel_consumed: '' });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditRestricted, setIsEditRestricted] = useState(false);
  const [editData, setEditData] = useState({
    source: '', destination: '', vehicle_id: '', driver_id: '', cargo_weight: '', planned_distance: '', notes: ''
  });

  const fetchTrips = async () => {
    try {
      const { data } = await api.get('/trips');
      setTrips(data);
      if (['Fleet Manager', 'Dispatcher'].includes(user?.role)) {
        const reqRes = await api.get('/customers/trip-requests');
        // Show both Pending (needs quote) and Customer Approved (needs dispatch)
        setRequests(reqRes.data.filter(r => r.status === 'Pending' || r.status === 'Customer Approved'));
      }
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
      if (vRes.data.length > 0) {
        setCreateData(prev => ({ ...prev, vehicle_id: vRes.data[0].id }));
        setApproveData(prev => ({ ...prev, vehicle_id: vRes.data[0].id }));
      }
      if (dRes.data.length > 0) {
        setCreateData(prev => ({ ...prev, driver_id: dRes.data[0].id }));
        setApproveData(prev => ({ ...prev, driver_id: dRes.data[0].id }));
      }
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

  const openEditModal = (trip) => {
    fetchAvailable();
    setActiveTripId(trip.id);
    setIsEditRestricted(trip.status === 'Completed' || trip.status === 'Cancelled');
    setEditData({
      source: trip.source,
      destination: trip.destination,
      vehicle_id: trip.vehicle_id,
      driver_id: trip.driver_id,
      cargo_weight: trip.cargo_weight,
      planned_distance: trip.planned_distance,
      notes: trip.notes || ''
    });
    setIsEditModalOpen(true);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/trips/${activeTripId}`, {
        ...editData,
        vehicle_id: parseInt(editData.vehicle_id),
        driver_id: parseInt(editData.driver_id),
        cargo_weight: parseFloat(editData.cargo_weight),
        planned_distance: parseFloat(editData.planned_distance)
      });
      setIsEditModalOpen(false);
      fetchTrips();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to edit trip');
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

  const openQuoteModal = (id) => {
    setActiveRequestId(id);
    setQuoteBudget('');
    setIsQuoteModalOpen(true);
  };

  const handleQuote = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/customers/trip-requests/${activeRequestId}/quote`, {
        budget: parseFloat(quoteBudget)
      });
      setIsQuoteModalOpen(false);
      fetchTrips();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to send quote');
    }
  };

  const openApproveModal = (id) => {
    fetchAvailable();
    setActiveRequestId(id);
    setApproveData({ vehicle_id: '', driver_id: '', planned_distance: '' });
    setIsApproveModalOpen(true);
  };

  const handleApprove = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/customers/trip-requests/${activeRequestId}/approve`, {
        vehicle_id: parseInt(approveData.vehicle_id),
        driver_id: parseInt(approveData.driver_id),
        planned_distance: parseFloat(approveData.planned_distance)
      });
      setIsApproveModalOpen(false);
      fetchTrips();
    } catch (err) {
      alert(err.response?.data?.error || 'Approval failed');
    }
  };

  const handleReject = async (id) => {
    if (!confirm('Are you sure you want to reject this request?')) return;
    try {
      await api.post(`/customers/trip-requests/${id}/reject`);
      fetchTrips();
    } catch (err) {
      alert(err.response?.data?.error || 'Reject failed');
    }
  };

  if (loading) return <div className="animate-pulse min-h-[80vh] bg-foreground/5 rounded-3xl border border-border/50"></div>;

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
                        <button onClick={() => openEditModal(t)} className="text-xs px-3 py-1.5 bg-foreground/5 border border-border text-foreground rounded-xl hover:bg-foreground hover:text-background shadow-sm hover:shadow-md active:scale-95 font-semibold transition-all">Edit</button>
                        {t.status === 'Pending' && (
                          <button onClick={() => handleDispatch(t.id)} className="text-xs px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-600 rounded-xl hover:bg-blue-500 hover:text-white shadow-sm hover:shadow-md active:scale-95 font-semibold transition-all">Dispatch</button>
                        )}
                        {t.status === 'On Trip' && (
                          <button onClick={() => openCompleteModal(t.id)} className="text-xs px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-xl hover:bg-emerald-500 hover:text-white shadow-sm hover:shadow-md active:scale-95 font-semibold transition-all">Complete</button>
                        )}
                        {(t.status === 'Pending' || t.status === 'On Trip') && (
                          <button onClick={() => handleCancel(t.id)} className="text-xs px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-600 rounded-xl hover:bg-red-500 hover:text-white shadow-sm hover:shadow-md active:scale-95 font-semibold transition-all">Cancel</button>
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

      {hasRole(['Fleet Manager', 'Dispatcher']) && requests.length > 0 && (
        <div className="glass-panel rounded-3xl overflow-hidden shadow-soft mt-8">
          <div className="p-5 border-b border-border bg-amber-500/10">
            <h2 className="text-lg font-bold tracking-tight text-amber-600">Pending Customer Requests</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-foreground/5 border-b border-border text-foreground/70 font-medium">
                <tr>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Route</th>
                  <th className="px-6 py-4">Cargo</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Notes</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {requests.map((r) => (
                  <tr key={r.id} className="hover:bg-foreground/[0.02] transition-colors">
                    <td className="px-6 py-4 font-medium">{r.customer_name}<br/><span className="text-xs text-foreground/50">{r.customer_email}</span></td>
                    <td className="px-6 py-4 font-medium">{r.source} → {r.destination}</td>
                    <td className="px-6 py-4"><MonoNumber value={r.cargo_weight} suffix=" kg" /></td>
                    <td className="px-6 py-4"><StatusBadge status={r.status} /></td>
                    <td className="px-6 py-4 text-foreground/70">{r.notes || '-'}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {r.status === 'Pending' && (
                          <button onClick={() => openQuoteModal(r.id)} className="text-xs px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-600 rounded-xl hover:bg-blue-500 hover:text-white shadow-sm hover:shadow-md active:scale-95 font-semibold transition-all">Send Quote</button>
                        )}
                        {r.status === 'Customer Approved' && (
                          <button onClick={() => openApproveModal(r.id)} className="text-xs px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-xl hover:bg-emerald-500 hover:text-white shadow-sm hover:shadow-md active:scale-95 font-semibold transition-all">Dispatch</button>
                        )}
                        <button onClick={() => handleReject(r.id)} className="text-xs px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-600 rounded-xl hover:bg-red-500 hover:text-white shadow-sm hover:shadow-md active:scale-95 font-semibold transition-all">Reject</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
              <input type="text" inputMode="decimal" required value={createData.cargo_weight} onChange={e => setCreateData({...createData, cargo_weight: e.target.value.replace(/[^0-9.]/g, '')})} className="w-full px-4 py-2.5 rounded-xl border border-border bg-foreground/5 focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground/70 mb-1">Planned Distance (km)</label>
              <input type="text" inputMode="decimal" required value={createData.planned_distance} onChange={e => setCreateData({...createData, planned_distance: e.target.value.replace(/[^0-9.]/g, '')})} className="w-full px-4 py-2.5 rounded-xl border border-border bg-foreground/5 focus:outline-none focus:border-primary" />
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
              <label className="block text-xs font-semibold text-foreground/70 mb-1">Actual Distance (km)</label>
              <input type="text" inputMode="decimal" required value={completeData.actual_distance} onChange={e => setCompleteData({...completeData, actual_distance: e.target.value.replace(/[^0-9.]/g, '')})} className="w-full px-4 py-2.5 rounded-xl border border-border bg-foreground/5 focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground/70 mb-1">Fuel Consumed (Liters)</label>
              <input type="text" inputMode="decimal" required value={completeData.fuel_consumed} onChange={e => setCompleteData({...completeData, fuel_consumed: e.target.value.replace(/[^0-9.]/g, '')})} className="w-full px-4 py-2.5 rounded-xl border border-border bg-foreground/5 focus:outline-none focus:border-primary" />
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={() => setIsCompleteModalOpen(false)} className="px-5 py-2.5 rounded-xl font-semibold hover:bg-foreground/5 transition-colors">Cancel</button>
            <button type="submit" className="pill-button pill-button-dark shadow-md">Complete Trip</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isApproveModalOpen} onClose={() => setIsApproveModalOpen(false)} title="Approve Request & Dispatch">
        <form onSubmit={handleApprove} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground/70 mb-1">Assign Vehicle</label>
              <select required value={approveData.vehicle_id} onChange={e => setApproveData({...approveData, vehicle_id: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-border bg-foreground/5 focus:outline-none focus:border-primary">
                {availableVehicles.map(v => <option key={v.id} value={v.id}>{v.registration_number} - {v.name_model} ({v.max_load_capacity}kg)</option>)}
                {availableVehicles.length === 0 && <option value="">No vehicles available</option>}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground/70 mb-1">Assign Driver</label>
              <select required value={approveData.driver_id} onChange={e => setApproveData({...approveData, driver_id: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-border bg-foreground/5 focus:outline-none focus:border-primary">
                {availableDrivers.map(d => <option key={d.id} value={d.id}>{d.name} (Score: {d.safety_score})</option>)}
                {availableDrivers.length === 0 && <option value="">No drivers available</option>}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground/70 mb-1">Planned Distance (km)</label>
              <input type="text" inputMode="decimal" required value={approveData.planned_distance} onChange={e => setApproveData({...approveData, planned_distance: e.target.value.replace(/[^0-9.]/g, '')})} className="w-full px-4 py-2.5 rounded-xl border border-border bg-foreground/5 focus:outline-none focus:border-primary" />
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={() => setIsApproveModalOpen(false)} className="px-5 py-2.5 rounded-xl font-semibold hover:bg-foreground/5 transition-colors">Cancel</button>
            <button type="submit" disabled={availableVehicles.length === 0 || availableDrivers.length === 0} className="pill-button pill-button-dark shadow-md disabled:opacity-50">Approve & Dispatch</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isQuoteModalOpen} onClose={() => setIsQuoteModalOpen(false)} title="Send Quote to Customer">
        <form onSubmit={handleQuote} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-foreground/70 mb-1">Proposed Budget ($)</label>
            <input type="text" inputMode="decimal" required value={quoteBudget} onChange={e => setQuoteBudget(e.target.value.replace(/[^0-9.]/g, ''))} className="w-full px-4 py-2.5 rounded-xl border border-border bg-foreground/5 focus:outline-none focus:border-primary" placeholder="e.g. 500" />
            <p className="text-xs text-foreground/50 mt-2">The customer will review this quote and can accept or reject it.</p>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={() => setIsQuoteModalOpen(false)} className="px-5 py-2.5 rounded-xl font-semibold hover:bg-foreground/5 transition-colors">Cancel</button>
            <button type="submit" className="pill-button pill-button-dark shadow-md">Send Quote</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Trip">
        <form onSubmit={handleEdit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground/70 mb-1">Source</label>
              <input type="text" disabled={isEditRestricted} required value={editData.source} onChange={e => setEditData({...editData, source: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-border bg-foreground/5 focus:outline-none focus:border-primary disabled:opacity-50" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground/70 mb-1">Destination</label>
              <input type="text" disabled={isEditRestricted} required value={editData.destination} onChange={e => setEditData({...editData, destination: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-border bg-foreground/5 focus:outline-none focus:border-primary disabled:opacity-50" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground/70 mb-1">Vehicle</label>
              <select disabled={isEditRestricted} required value={editData.vehicle_id} onChange={e => setEditData({...editData, vehicle_id: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-border bg-foreground/5 focus:outline-none focus:border-primary disabled:opacity-50">
                {availableVehicles.map(v => <option key={v.id} value={v.id}>{v.registration_number} - {v.name_model}</option>)}
                {!availableVehicles.find(v => v.id === editData.vehicle_id) && <option value={editData.vehicle_id}>Keep Current Vehicle</option>}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground/70 mb-1">Driver</label>
              <select disabled={isEditRestricted} required value={editData.driver_id} onChange={e => setEditData({...editData, driver_id: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-border bg-foreground/5 focus:outline-none focus:border-primary disabled:opacity-50">
                {availableDrivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                {!availableDrivers.find(d => d.id === editData.driver_id) && <option value={editData.driver_id}>Keep Current Driver</option>}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground/70 mb-1">Cargo Weight (kg)</label>
              <input type="text" inputMode="decimal" disabled={isEditRestricted} required value={editData.cargo_weight} onChange={e => setEditData({...editData, cargo_weight: e.target.value.replace(/[^0-9.]/g, '')})} className="w-full px-4 py-2.5 rounded-xl border border-border bg-foreground/5 focus:outline-none focus:border-primary disabled:opacity-50" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground/70 mb-1">Planned Distance (km)</label>
              <input type="text" inputMode="decimal" disabled={isEditRestricted} required value={editData.planned_distance} onChange={e => setEditData({...editData, planned_distance: e.target.value.replace(/[^0-9.]/g, '')})} className="w-full px-4 py-2.5 rounded-xl border border-border bg-foreground/5 focus:outline-none focus:border-primary disabled:opacity-50" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-foreground/70 mb-1">Notes</label>
              <textarea value={editData.notes} onChange={e => setEditData({...editData, notes: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-border bg-foreground/5 focus:outline-none focus:border-primary" />
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-5 py-2.5 rounded-xl font-semibold hover:bg-foreground/5 transition-colors">Cancel</button>
            <button type="submit" className="pill-button pill-button-dark shadow-md">Save Changes</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Trips;
