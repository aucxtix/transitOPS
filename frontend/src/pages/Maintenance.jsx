import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { StatusBadge } from '../components/ui/StatusBadge';
import { MonoNumber } from '../components/ui/MonoNumber';
import { useAuth } from '../hooks/useAuth';
import { Modal } from '../components/ui/Modal';

const Maintenance = () => {
  const [logs, setLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const { hasRole } = useAuth();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createData, setCreateData] = useState({ vehicle_id: '', maintenance_name: '', description: '', notes: '' });
  
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [activeLogId, setActiveLogId] = useState(null);
  const [closeCost, setCloseCost] = useState('');

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

  const fetchVehicles = async () => {
    try {
      const { data } = await api.get('/vehicles');
      setVehicles(data);
      if (data.length > 0) setCreateData(prev => ({ ...prev, vehicle_id: data[0].id }));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const openCreateModal = () => {
    fetchVehicles();
    setIsCreateModalOpen(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/maintenance', {
        ...createData,
        vehicle_id: parseInt(createData.vehicle_id)
      });
      setIsCreateModalOpen(false);
      setCreateData({ vehicle_id: '', maintenance_name: '', description: '', notes: '' });
      fetchLogs();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create maintenance log');
    }
  };

  const openCloseModal = (id) => {
    setActiveLogId(id);
    setCloseCost('');
    setIsCloseModalOpen(true);
  };

  const handleClose = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/maintenance/${activeLogId}/close`, { cost: parseFloat(closeCost) });
      setIsCloseModalOpen(false);
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
          <button onClick={openCreateModal} className="pill-button pill-button-dark shadow-sm">
            Create Log
          </button>
        )}
      </div>

      <div className="glass-panel rounded-3xl overflow-hidden shadow-soft">
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
                      <button onClick={() => openCloseModal(l.id)} className="text-xs px-3 py-1.5 bg-emerald-500/10 text-emerald-600 rounded hover:bg-emerald-500/20 font-medium transition-colors">
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

      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Log Maintenance">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground/70 mb-1">Vehicle</label>
              <select required value={createData.vehicle_id} onChange={e => setCreateData({...createData, vehicle_id: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-border bg-foreground/5 focus:outline-none focus:border-primary">
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.registration_number} - {v.name_model}</option>)}
                {vehicles.length === 0 && <option value="">No vehicles available</option>}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground/70 mb-1">Service Name</label>
              <input type="text" required value={createData.maintenance_name} onChange={e => setCreateData({...createData, maintenance_name: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-border bg-foreground/5 focus:outline-none focus:border-primary" placeholder="e.g. Routine Oil Change" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground/70 mb-1">Description</label>
              <textarea required value={createData.description} onChange={e => setCreateData({...createData, description: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-border bg-foreground/5 focus:outline-none focus:border-primary" placeholder="Details of the issue or service..." />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground/70 mb-1">Internal Notes (Optional)</label>
              <textarea value={createData.notes} onChange={e => setCreateData({...createData, notes: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-border bg-foreground/5 focus:outline-none focus:border-primary" placeholder="Mechanic notes..." />
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-5 py-2.5 rounded-xl font-semibold hover:bg-foreground/5 transition-colors">Cancel</button>
            <button type="submit" disabled={vehicles.length === 0} className="pill-button pill-button-dark shadow-md disabled:opacity-50">Create Log</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isCloseModalOpen} onClose={() => setIsCloseModalOpen(false)} title="Close Maintenance Log">
        <form onSubmit={handleClose} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground/70 mb-1">Total Cost ($)</label>
              <input type="number" required min="0" step="0.01" value={closeCost} onChange={e => setCloseCost(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-border bg-foreground/5 focus:outline-none focus:border-primary" />
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={() => setIsCloseModalOpen(false)} className="px-5 py-2.5 rounded-xl font-semibold hover:bg-foreground/5 transition-colors">Cancel</button>
            <button type="submit" className="pill-button pill-button-dark shadow-md">Complete Maintenance</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Maintenance;
