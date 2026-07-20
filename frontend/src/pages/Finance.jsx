import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { StatusBadge } from '../components/ui/StatusBadge';
import { MonoNumber } from '../components/ui/MonoNumber';
import { useAuth } from '../hooks/useAuth';
import { Modal } from '../components/ui/Modal';
import { RoleGate } from '../components/ui/RoleGate';
import { Check, X } from 'lucide-react';

const Finance = () => {
  const [fuel, setFuel] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const { hasRole } = useAuth();

  const [isFuelModalOpen, setIsFuelModalOpen] = useState(false);
  const [fuelData, setFuelData] = useState({ vehicle_id: '', liters: '', cost: '', date: new Date().toISOString().slice(0, 10) });
  const [isSubmittingFuel, setIsSubmittingFuel] = useState(false);

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseData, setExpenseData] = useState({ type: 'Toll', amount: '', date: new Date().toISOString().slice(0, 10), vehicle_id: '' });
  const [isSubmittingExpense, setIsSubmittingExpense] = useState(false);

  const fetchFinance = async () => {
    try {
      const [f, e] = await Promise.all([
        api.get('/finance/fuel'),
        api.get('/finance/expenses')
      ]);
      setFuel(f.data);
      setExpenses(e.data);
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
      if (data.length > 0) {
        setFuelData(prev => ({ ...prev, vehicle_id: data[0].id }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchFinance();
  }, []);

  const openFuelModal = () => {
    fetchVehicles();
    setIsFuelModalOpen(true);
  };

  const openExpenseModal = () => {
    fetchVehicles();
    setIsExpenseModalOpen(true);
  };

  const handleFuelSubmit = async (e) => {
    e.preventDefault();
    if (isSubmittingFuel) return;
    setIsSubmittingFuel(true);
    try {
      await api.post('/finance/fuel', {
        ...fuelData,
        vehicle_id: parseInt(fuelData.vehicle_id),
        liters: parseFloat(fuelData.liters),
        cost: parseFloat(fuelData.cost)
      });
      setIsFuelModalOpen(false);
      setFuelData({ vehicle_id: vehicles[0]?.id || '', liters: '', cost: '', date: new Date().toISOString().slice(0, 10) });
      fetchFinance();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to log fuel');
    } finally {
      setIsSubmittingFuel(false);
    }
  };

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    if (isSubmittingExpense) return;
    setIsSubmittingExpense(true);
    try {
      const payload = {
        ...expenseData,
        amount: parseFloat(expenseData.amount)
      };
      if (payload.vehicle_id) payload.vehicle_id = parseInt(payload.vehicle_id);
      else delete payload.vehicle_id;

      await api.post('/finance/expenses', payload);
      setIsExpenseModalOpen(false);
      setExpenseData({ type: 'Toll', amount: '', date: new Date().toISOString().slice(0, 10), vehicle_id: '' });
      fetchFinance();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to log expense');
    } finally {
      setIsSubmittingExpense(false);
    }
  };

  const handleApproval = async (id, action) => {
    if (!confirm(`Are you sure you want to ${action} this expense?`)) return;
    try {
      await api.put(`/finance/expenses/${id}/${action}`);
      fetchFinance();
    } catch (err) {
      alert(err.response?.data?.error || `Failed to ${action} expense`);
    }
  };

  if (loading) return <div className="animate-pulse h-64 bg-border rounded-xl"></div>;

  return (
    <RoleGate 
      allowedRoles={['Fleet Manager', 'Financial Analyst']}
      fallback={<div className="p-8 text-center text-red-500 font-bold">Unauthorized Access</div>}
    >
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Finance Management</h1>
            <p className="text-foreground/60 text-sm mt-1">Track fuel logs, operational expenses, and approvals.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={openFuelModal} className="pill-button shadow-sm">Log Fuel</button>
            <button onClick={openExpenseModal} className="pill-button pill-button-dark shadow-sm">Log Expense</button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Fuel Logs */}
          <div className="glass-panel rounded-3xl overflow-hidden shadow-soft flex flex-col">
            <div className="p-6 border-b border-border bg-foreground/[0.02]">
              <h2 className="text-lg font-semibold">Fuel Logs</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-foreground/70 font-medium">
                  <tr>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Vehicle</th>
                    <th className="px-6 py-3">Liters</th>
                    <th className="px-6 py-3">Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {fuel.map((f) => (
                    <tr key={f.id} className="hover:bg-foreground/[0.02]">
                      <td className="px-6 py-3">{f.date}</td>
                      <td className="px-6 py-3 font-medium">{f.name_model}</td>
                      <td className="px-6 py-3"><MonoNumber value={f.liters} suffix=" L" /></td>
                      <td className="px-6 py-3"><MonoNumber value={f.cost} prefix="$" className="text-primary font-semibold" /></td>
                    </tr>
                  ))}
                  {fuel.length === 0 && (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-foreground/50">No fuel logs found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Expenses */}
          <div className="glass-panel rounded-3xl overflow-hidden shadow-soft flex flex-col">
            <div className="p-6 border-b border-border bg-foreground/[0.02]">
              <h2 className="text-lg font-semibold">Expenses & Approvals</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-foreground/70 font-medium">
                  <tr>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Type</th>
                    <th className="px-6 py-3">Amount</th>
                    <th className="px-6 py-3">Status</th>
                    <RoleGate allowedRoles={['Fleet Manager']}>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </RoleGate>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {expenses.map((e) => (
                    <tr key={e.id} className="hover:bg-foreground/[0.02]">
                      <td className="px-6 py-3">{e.date}</td>
                      <td className="px-6 py-3 font-medium">{e.type}</td>
                      <td className="px-6 py-3"><MonoNumber value={e.amount} prefix="$" className="font-semibold" /></td>
                      <td className="px-6 py-3"><StatusBadge status={e.status} /></td>
                      <RoleGate allowedRoles={['Fleet Manager']}>
                        <td className="px-6 py-3 text-right">
                          {e.status === 'Pending' && (
                            <div className="flex justify-end gap-1">
                              <button onClick={() => handleApproval(e.id, 'approve')} className="p-1.5 text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white rounded-lg shadow-sm hover:shadow-md active:scale-95 transition-all" title="Approve">
                                <Check size={16} />
                              </button>
                              <button onClick={() => handleApproval(e.id, 'reject')} className="p-1.5 text-red-600 bg-red-500/10 border border-red-500/20 hover:bg-red-500 hover:text-white rounded-lg shadow-sm hover:shadow-md active:scale-95 transition-all" title="Reject">
                                <X size={16} />
                              </button>
                            </div>
                          )}
                        </td>
                      </RoleGate>
                    </tr>
                  ))}
                  {expenses.length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-foreground/50">No expenses found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <Modal isOpen={isFuelModalOpen} onClose={() => setIsFuelModalOpen(false)} title="Log Fuel Purchase">
          <form onSubmit={handleFuelSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-foreground/70 mb-1">Vehicle</label>
                <select required value={fuelData.vehicle_id} onChange={e => setFuelData({...fuelData, vehicle_id: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-border bg-foreground/5 focus:outline-none focus:border-primary">
                  {vehicles.map(v => <option key={v.id} value={v.id}>{v.registration_number} - {v.name_model}</option>)}
                  {vehicles.length === 0 && <option value="">No vehicles available</option>}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground/70 mb-1">Date</label>
                <input type="date" required value={fuelData.date} onChange={e => setFuelData({...fuelData, date: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-border bg-foreground/5 focus:outline-none focus:border-primary" />
              </div>
              <div></div>
              <div>
                <label className="block text-xs font-semibold text-foreground/70 mb-1">Liters</label>
                <input type="text" inputMode="decimal" required value={fuelData.liters} onChange={e => setFuelData({...fuelData, liters: e.target.value.replace(/[^0-9.]/g, '')})} className="w-full px-4 py-2.5 rounded-xl border border-border bg-foreground/5 focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground/70 mb-1">Total Cost ($)</label>
                <input type="text" inputMode="decimal" required value={fuelData.cost} onChange={e => setFuelData({...fuelData, cost: e.target.value.replace(/[^0-9.]/g, '')})} className="w-full px-4 py-2.5 rounded-xl border border-border bg-foreground/5 focus:outline-none focus:border-primary" />
              </div>
            </div>
            <div className="pt-4 flex justify-end gap-3">
              <button type="button" onClick={() => setIsFuelModalOpen(false)} className="px-5 py-2.5 rounded-xl font-semibold hover:bg-foreground/5 transition-colors">Cancel</button>
              <button type="submit" disabled={vehicles.length === 0 || isSubmittingFuel} className="pill-button pill-button-dark shadow-md disabled:opacity-50">
                {isSubmittingFuel ? 'Logging...' : 'Log Fuel'}
              </button>
            </div>
          </form>
        </Modal>

        <Modal isOpen={isExpenseModalOpen} onClose={() => setIsExpenseModalOpen(false)} title="Log Expense (Pending Approval)">
          <form onSubmit={handleExpenseSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-foreground/70 mb-1">Expense Type</label>
                <select required value={expenseData.type} onChange={e => setExpenseData({...expenseData, type: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-border bg-foreground/5 focus:outline-none focus:border-primary">
                  <option>Toll</option>
                  <option>Repair</option>
                  <option>Permit</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-foreground/70 mb-1">Vehicle (Optional)</label>
                <select value={expenseData.vehicle_id} onChange={e => setExpenseData({...expenseData, vehicle_id: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-border bg-foreground/5 focus:outline-none focus:border-primary">
                  <option value="">General Expense</option>
                  {vehicles.map(v => <option key={v.id} value={v.id}>{v.registration_number}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground/70 mb-1">Date</label>
                <input type="date" required value={expenseData.date} onChange={e => setExpenseData({...expenseData, date: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-border bg-foreground/5 focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground/70 mb-1">Amount ($)</label>
                <input type="text" inputMode="decimal" required value={expenseData.amount} onChange={e => setExpenseData({...expenseData, amount: e.target.value.replace(/[^0-9.]/g, '')})} className="w-full px-4 py-2.5 rounded-xl border border-border bg-foreground/5 focus:outline-none focus:border-primary" />
              </div>
            </div>
            <div className="pt-4 flex justify-end gap-3">
              <button type="button" onClick={() => setIsExpenseModalOpen(false)} className="px-5 py-2.5 rounded-xl font-semibold hover:bg-foreground/5 transition-colors">Cancel</button>
              <button type="submit" disabled={isSubmittingExpense} className="pill-button pill-button-dark shadow-md disabled:opacity-50">
                {isSubmittingExpense ? 'Submitting...' : 'Submit for Approval'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </RoleGate>
  );
};

export default Finance;
