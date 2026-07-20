import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { StatusBadge } from '../components/ui/StatusBadge';
import { MonoNumber } from '../components/ui/MonoNumber';
import { useAuth } from '../hooks/useAuth';
import { Modal } from '../components/ui/Modal';
import { Trash2 } from 'lucide-react';

const Vehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { hasRole } = useAuth();
  
  const [formData, setFormData] = useState({
    registration_number: '',
    name_model: '',
    type: 'Van',
    max_load_capacity: '',
    acquisition_cost: '',
    odometer: ''
  });

  const fetchVehicles = async () => {
    try {
      const { data } = await api.get('/vehicles');
      setVehicles(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/vehicles', {
        ...formData,
        max_load_capacity: parseFloat(formData.max_load_capacity),
        acquisition_cost: parseFloat(formData.acquisition_cost),
        odometer: parseFloat(formData.odometer) || 0
      });
      setIsModalOpen(false);
      setFormData({ registration_number: '', name_model: '', type: 'Van', max_load_capacity: '', acquisition_cost: '', odometer: '' });
      fetchVehicles();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create vehicle');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this vehicle?')) return;
    try {
      await api.delete(`/vehicles/${id}`);
      fetchVehicles();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete vehicle');
    }
  };

  if (loading) return <div className="animate-pulse min-h-[80vh] bg-foreground/5 rounded-3xl border border-border/50"></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vehicle Registry</h1>
          <p className="text-foreground/60 text-sm mt-1">Manage your fleet, view status, and track metrics.</p>
        </div>
        {hasRole(['Fleet Manager']) && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="pill-button pill-button-dark shadow-sm"
          >
            Add Vehicle
          </button>
        )}
      </div>

      <div className="glass-panel rounded-3xl overflow-hidden shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-foreground/5 border-b border-border text-foreground/70 font-medium">
              <tr>
                <th className="px-6 py-4">Registration</th>
                <th className="px-6 py-4">Model</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Capacity</th>
                <th className="px-6 py-4">Odometer</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {vehicles.map((v) => (
                <tr key={v.id} className="hover:bg-foreground/[0.02] transition-colors">
                  <td className="px-6 py-4"><MonoNumber value={v.registration_number} className="text-primary font-semibold" /></td>
                  <td className="px-6 py-4 font-medium">{v.name_model}</td>
                  <td className="px-6 py-4 text-foreground/70">{v.type}</td>
                  <td className="px-6 py-4"><MonoNumber value={v.max_load_capacity} suffix=" kg" /></td>
                  <td className="px-6 py-4"><MonoNumber value={v.odometer} suffix=" km" /></td>
                  <td className="px-6 py-4"><StatusBadge status={v.status} /></td>
                  <td className="px-6 py-4 text-right">
                    {hasRole(['Fleet Manager']) && (
                      <button onClick={() => handleDelete(v.id)} title="Delete" aria-label="Delete" className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {vehicles.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-foreground/50">No vehicles found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Vehicle">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground/70 mb-1">Registration No.</label>
              <input type="text" required value={formData.registration_number} onChange={e => setFormData({...formData, registration_number: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-border bg-foreground/5 focus:outline-none focus:border-primary" placeholder="e.g. MH-01-AB-1234" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground/70 mb-1">Model Name</label>
              <input type="text" required value={formData.name_model} onChange={e => setFormData({...formData, name_model: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-border bg-foreground/5 focus:outline-none focus:border-primary" placeholder="e.g. Ford Transit" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground/70 mb-1">Vehicle Type</label>
              <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-border bg-foreground/5 focus:outline-none focus:border-primary">
                <option>Van</option>
                <option>Truck</option>
                <option>Reefer</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground/70 mb-1">Max Capacity (kg)</label>
              <input type="text" inputMode="numeric" required value={formData.max_load_capacity} onChange={e => setFormData({...formData, max_load_capacity: e.target.value.replace(/[^0-9]/g, '')})} className="w-full px-4 py-2.5 rounded-xl border border-border bg-foreground/5 focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground/70 mb-1">Acquisition Cost ($)</label>
              <input type="text" inputMode="decimal" required value={formData.acquisition_cost} onChange={e => setFormData({...formData, acquisition_cost: e.target.value.replace(/[^0-9.]/g, '')})} className="w-full px-4 py-2.5 rounded-xl border border-border bg-foreground/5 focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground/70 mb-1">Initial Odometer (km)</label>
              <input type="text" inputMode="numeric" value={formData.odometer} onChange={e => setFormData({...formData, odometer: e.target.value.replace(/[^0-9]/g, '')})} className="w-full px-4 py-2.5 rounded-xl border border-border bg-foreground/5 focus:outline-none focus:border-primary" />
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl font-semibold hover:bg-foreground/5 transition-colors">Cancel</button>
            <button type="submit" className="pill-button pill-button-dark shadow-md">Create Vehicle</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Vehicles;
