import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { StatusBadge } from '../components/ui/StatusBadge';
import { MonoNumber } from '../components/ui/MonoNumber';

const Finance = () => {
  const [fuel, setFuel] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    fetchFinance();
  }, []);

  if (loading) return <div className="animate-pulse h-64 bg-border rounded-xl"></div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Finance Management</h1>
        <p className="text-foreground/60 text-sm mt-1">Track fuel logs and operational expenses.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Fuel Logs */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
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
              </tbody>
            </table>
          </div>
        </div>

        {/* Expenses */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
          <div className="p-6 border-b border-border bg-foreground/[0.02]">
            <h2 className="text-lg font-semibold">Expenses</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-foreground/70 font-medium">
                <tr>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-foreground/[0.02]">
                    <td className="px-6 py-3">{e.date}</td>
                    <td className="px-6 py-3 font-medium">{e.type}</td>
                    <td className="px-6 py-3"><MonoNumber value={e.amount} prefix="$" className="font-semibold" /></td>
                    <td className="px-6 py-3"><StatusBadge status={e.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Finance;
