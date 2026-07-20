import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { StatusBadge } from '../components/ui/StatusBadge';
import { MonoNumber } from '../components/ui/MonoNumber';
import { Modal } from '../components/ui/Modal';
import { RoleGate } from '../components/ui/RoleGate';
import { Trash2, Edit2 } from 'lucide-react';

const Drivers = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const initialFormData = {
    name: '',
    email: '',
    password: '',
    license_number: '',
    license_category: 'C',
    license_expiry_date: '',
    contact_number: '',
    status: 'Available',
    safety_score: 100
  };
  
  const [formData, setFormData] = useState(initialFormData);

  const fetchDrivers = async () => {
    try {
      const { data } = await api.get('/drivers');
      setDrivers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const openCreateModal = () => {
    setEditingId(null);
    setFormData(initialFormData);
    setIsModalOpen(true);
  };

  const openEditModal = (driver) => {
    setEditingId(driver.id);
    setFormData({
      name: driver.name,
      license_number: driver.license_number,
      license_category: driver.license_category,
      license_expiry_date: driver.license_expiry_date,
      contact_number: driver.contact_number,
      status: driver.status,
      safety_score: driver.safety_score
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/drivers/${editingId}`, formData);
      } else {
        await api.post('/drivers', formData);
      }
      setIsModalOpen(false);
      setFormData(initialFormData);
      fetchDrivers(); // Reactively update table
    } catch (err) {
      alert(err.response?.data?.error || `Failed to ${editingId ? 'update' : 'create'} driver`);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this driver?')) return;
    try {
      await api.delete(`/drivers/${id}`);
      fetchDrivers(); // Reactively update table
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete driver');
    }
  };

  const getExpiryStyle = (dateStr) => {
    const expDate = new Date(dateStr);
    const today = new Date();
    const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'text-red-500 font-bold';
    if (diffDays <= 30) return 'text-amber-500 font-bold';
    return 'text-foreground/70';
  };

  if (loading) return <div className="animate-pulse min-h-[80vh] bg-foreground/5 rounded-3xl border border-border/50"></div>;

  return (
    <RoleGate 
      allowedRoles={['Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst']}
      fallback={
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <h2 className="text-2xl font-bold text-red-500 mb-2">Unauthorized Access</h2>
          <p className="text-foreground/60">You do not have permission to view the drivers directory.</p>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Safety Profiles & Drivers</h1>
            <p className="text-foreground/60 text-sm mt-1">Monitor driver compliance and statuses.</p>
          </div>
          <RoleGate allowedRoles={['Fleet Manager']}>
            <button 
              onClick={openCreateModal}
              className="pill-button pill-button-dark shadow-sm"
            >
              Add Driver
            </button>
          </RoleGate>
        </div>

        <div className="glass-panel rounded-3xl overflow-hidden shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-foreground/5 border-b border-border text-foreground/70 font-medium">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">License No.</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Expiry Date</th>
                  <th className="px-6 py-4">Safety Score</th>
                  <th className="px-6 py-4">Status</th>
                  <RoleGate allowedRoles={['Fleet Manager']}>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </RoleGate>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {drivers.map((d) => (
                  <tr key={d.id} className="hover:bg-foreground/[0.02] transition-colors">
                    <td className="px-6 py-4 font-medium">{d.name}</td>
                    <td className="px-6 py-4"><MonoNumber value={d.license_number} className="text-primary" /></td>
                    <td className="px-6 py-4">{d.license_category}</td>
                    <td className={`px-6 py-4 ${getExpiryStyle(d.license_expiry_date)}`}>{d.license_expiry_date}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-border rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${d.safety_score >= 90 ? 'bg-emerald-500' : d.safety_score >= 75 ? 'bg-amber-500' : 'bg-red-500'}`} 
                            style={{ width: `${d.safety_score}%` }}
                          ></div>
                        </div>
                        <MonoNumber value={d.safety_score} />
                      </div>
                    </td>
                    <td className="px-6 py-4"><StatusBadge status={d.status} /></td>
                    <RoleGate allowedRoles={['Fleet Manager']}>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => openEditModal(d)} className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-xl transition-colors">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleDelete(d.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </RoleGate>
                  </tr>
                ))}
                {drivers.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-foreground/50">No drivers found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Edit Driver" : "Add New Driver"}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-foreground/70 mb-1">Full Name</label>
                <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-border bg-foreground/5 focus:outline-none focus:border-primary" placeholder="e.g. John Doe" />
              </div>
              {!editingId && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-foreground/70 mb-1">Login Email</label>
                    <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-border bg-foreground/5 focus:outline-none focus:border-primary" placeholder="e.g. john@transitops.com" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-foreground/70 mb-1">Login Password</label>
                    <input type="text" required minLength={6} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-border bg-foreground/5 focus:outline-none focus:border-primary" placeholder="Min 6 chars" />
                  </div>
                </>
              )}
              <div>
                <label className="block text-xs font-semibold text-foreground/70 mb-1">License No.</label>
                <input type="text" required value={formData.license_number} onChange={e => setFormData({...formData, license_number: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-border bg-foreground/5 focus:outline-none focus:border-primary" placeholder="e.g. DL-12345" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground/70 mb-1">License Category</label>
                <select value={formData.license_category} onChange={e => setFormData({...formData, license_category: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-border bg-foreground/5 focus:outline-none focus:border-primary">
                  <option>B</option>
                  <option>C</option>
                  <option>CE</option>
                  <option>D</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground/70 mb-1">Expiry Date</label>
                <input type="date" required value={formData.license_expiry_date} onChange={e => setFormData({...formData, license_expiry_date: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-border bg-foreground/5 focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground/70 mb-1">Contact Number</label>
                <input type="tel" required value={formData.contact_number} onChange={e => setFormData({...formData, contact_number: e.target.value.replace(/[^0-9+\-\s]/g, '')})} className="w-full px-4 py-2.5 rounded-xl border border-border bg-foreground/5 focus:outline-none focus:border-primary" placeholder="e.g. +1 555-1234" />
              </div>
              
              {editingId && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-foreground/70 mb-1">Status</label>
                    <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-border bg-foreground/5 focus:outline-none focus:border-primary">
                      <option>Available</option>
                      <option>On Trip</option>
                      <option>Suspended</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-foreground/70 mb-1">Safety Score (0-100)</label>
                    <input type="text" inputMode="numeric" required value={formData.safety_score} onChange={e => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      let num = parseInt(val);
                      if (isNaN(num)) num = 0;
                      if (num > 100) num = 100;
                      setFormData({...formData, safety_score: num});
                    }} className="w-full px-4 py-2.5 rounded-xl border border-border bg-foreground/5 focus:outline-none focus:border-primary" />
                  </div>
                </>
              )}
            </div>
            <div className="pt-4 flex justify-end gap-3">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl font-semibold hover:bg-foreground/5 transition-colors">Cancel</button>
              <button type="submit" className="pill-button pill-button-dark shadow-md">{editingId ? 'Save Changes' : 'Create Driver'}</button>
            </div>
          </form>
        </Modal>
      </div>
    </RoleGate>
  );
};

export default Drivers;
