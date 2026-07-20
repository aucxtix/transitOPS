import React, { useState, useEffect } from 'react';
import { Package, MapPin, Clock, CheckCircle, XCircle } from 'lucide-react';
import api from '../../services/api';
import { Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/StatusBadge';

const CustomerDash = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    source: '',
    destination: '',
    cargo_weight: '',
    notes: ''
  });

  const fetchRequests = async () => {
    try {
      const { data } = await api.get('/customers/trip-requests');
      setRequests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/customers/trip-requests', {
        ...formData,
        cargo_weight: parseFloat(formData.cargo_weight)
      });
      setIsModalOpen(false);
      setFormData({ source: '', destination: '', cargo_weight: '', notes: '' });
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to request trip');
    }
  };

  const handleAcceptQuote = async (id) => {
    try {
      await api.post(`/customers/trip-requests/${id}/accept`);
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to accept quote');
    }
  };

  const handleRejectQuote = async (id) => {
    if (!confirm('Are you sure you want to reject this request?')) return;
    try {
      await api.post(`/customers/trip-requests/${id}/reject`);
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to reject quote');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pending': return <Clock size={24} className="text-amber-600 dark:text-amber-400" />;
      case 'Quoted': return <Clock size={24} className="text-blue-600 dark:text-blue-400" />;
      case 'Customer Approved': 
      case 'Approved': return <CheckCircle size={24} className="text-emerald-600 dark:text-emerald-400" />;
      case 'Rejected': return <XCircle size={24} className="text-red-500" />;
      default: return <Package size={24} />;
    }
  };

  if (loading) return <div className="animate-pulse min-h-[80vh] bg-foreground/5 rounded-3xl border border-border/50"></div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-[2rem] shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
              <Package size={24} />
            </div>
            <h3 className="text-3xl font-bold tracking-tight">{requests.length}</h3>
          </div>
          <p className="text-foreground/60 font-medium mt-2">Total Requests</p>
        </div>
        <div className="glass-panel p-6 rounded-[2rem] shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-4">
              <Clock size={24} />
            </div>
            <h3 className="text-3xl font-bold tracking-tight">{requests.filter(r => r.status === 'Pending').length}</h3>
          </div>
          <p className="text-foreground/60 font-medium mt-2">Pending Review</p>
        </div>
        <div className="glass-panel p-6 rounded-[2rem] shadow-sm flex flex-col justify-center items-center text-center">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="pill-button pill-button-dark shadow-float px-8 py-4 text-lg w-full max-w-[200px]"
          >
            Request Trip
          </button>
        </div>
      </div>

      <div className="glass-panel rounded-3xl overflow-hidden shadow-soft">
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-bold tracking-tight">Your Trip Requests</h2>
        </div>
        <div className="divide-y divide-border">
          {requests.map(req => (
            <div key={req.id} className="p-6 flex flex-col md:flex-row items-center gap-6 hover:bg-foreground/[0.02] transition-colors">
              <div className="flex-shrink-0">
                {getStatusIcon(req.status)}
              </div>
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium mb-1 text-foreground/70">
                    <MapPin size={14} className="text-emerald-600 dark:text-emerald-400" /> From
                  </div>
                  <p className="font-semibold text-base">{req.source}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium mb-1 text-foreground/70">
                    <MapPin size={14} className="text-rose-500" /> To
                  </div>
                  <p className="font-semibold text-base">{req.destination}</p>
                </div>
              </div>
              <div className="flex flex-col md:flex-row items-center gap-6 w-full md:w-auto">
                <div className="text-center md:text-right">
                  <p className="text-xs text-foreground/50 font-medium uppercase tracking-wider mb-1">Cargo Weight</p>
                  <p className="font-bold font-mono">{req.cargo_weight} kg</p>
                </div>
                {req.budget && (
                  <div className="text-center md:text-right">
                    <p className="text-xs text-foreground/50 font-medium uppercase tracking-wider mb-1">Proposed Budget</p>
                    <p className="font-bold font-mono text-emerald-600 dark:text-emerald-400">${req.budget}</p>
                  </div>
                )}
                <div>
                  <StatusBadge status={req.status} />
                </div>
              </div>
              {req.status === 'Quoted' && (
                <div className="flex flex-col gap-2 mt-4 md:mt-0 w-full md:w-auto md:ml-4 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6">
                  <p className="text-xs text-foreground/50 font-medium text-center md:text-left mb-1">
                    Accept this budget or <a href="tel:1-800-TRANSIT" className="text-primary hover:underline">call us</a> to negotiate.
                  </p>
                  <div className="flex gap-2 justify-center md:justify-start">
                    <button onClick={() => handleAcceptQuote(req.id)} className="text-xs px-4 py-2 bg-emerald-500/10 text-emerald-600 rounded-xl hover:bg-emerald-500/20 font-medium transition-colors">Accept Quote</button>
                    <button onClick={() => handleRejectQuote(req.id)} className="text-xs px-4 py-2 bg-red-500/10 text-red-600 rounded-xl hover:bg-red-500/20 font-medium transition-colors">Reject</button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {requests.length === 0 && (
            <div className="p-12 text-center text-foreground/50">
              You haven't made any trip requests yet.
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Request New Trip">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-foreground/70 mb-1">Pickup Location</label>
            <input type="text" required value={formData.source} onChange={e => setFormData({...formData, source: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-border bg-foreground/5 focus:outline-none focus:border-primary" placeholder="e.g. 123 Factory St" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-foreground/70 mb-1">Delivery Destination</label>
            <input type="text" required value={formData.destination} onChange={e => setFormData({...formData, destination: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-border bg-foreground/5 focus:outline-none focus:border-primary" placeholder="e.g. 456 Warehouse Blvd" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-foreground/70 mb-1">Estimated Cargo Weight (kg)</label>
            <input type="text" inputMode="decimal" required value={formData.cargo_weight} onChange={e => setFormData({...formData, cargo_weight: e.target.value.replace(/[^0-9.]/g, '')})} className="w-full px-4 py-2.5 rounded-xl border border-border bg-foreground/5 focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-foreground/70 mb-1">Special Notes (Optional)</label>
            <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-border bg-foreground/5 focus:outline-none focus:border-primary" rows="3" placeholder="Handling instructions, contacts, etc." />
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl font-semibold hover:bg-foreground/5 transition-colors">Cancel</button>
            <button type="submit" className="pill-button pill-button-dark shadow-md">Submit Request</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CustomerDash;
