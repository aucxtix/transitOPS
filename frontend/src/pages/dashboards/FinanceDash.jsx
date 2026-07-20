import React from 'react';
import { Clock } from 'lucide-react';
import { MonoNumber } from '../../components/ui/MonoNumber';

const EmptyState = ({ message }) => (
  <div className="flex-1 flex items-center justify-center text-foreground/50 p-6 text-center border-2 border-dashed border-border rounded-xl">
    {message}
  </div>
);

const FinanceDash = ({ data }) => {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-6">
        <div className="glass-panel rounded-[2rem] p-8 shadow-float flex flex-col justify-center">
          <p className="text-foreground/70 font-medium mb-1">Total Approved Expenses</p>
          <h2 className="text-4xl font-bold tracking-tight"><MonoNumber value={data.totalApprovedExpenses || 0} prefix="$" /></h2>
        </div>
        <div className="glass-panel rounded-[2rem] p-8 shadow-float flex flex-col justify-center bg-gradient-violet text-white">
          <p className="text-white/70 font-medium mb-1">Total Fuel Costs (30 days)</p>
          <h2 className="text-4xl font-bold tracking-tight"><MonoNumber value={data.totalFuelCosts || 0} prefix="$" /></h2>
        </div>
      </div>
      <div className="glass-panel rounded-[1.75rem] p-6 flex flex-col">
        <h3 className="font-semibold text-foreground/80 mb-4 flex items-center gap-2"><Clock size={18}/> Pending Expenses Awaiting Manager Approval</h3>
        {data.pendingExpenses && data.pendingExpenses.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-foreground/5 text-foreground/70">
                <tr>
                  <th className="px-4 py-3 rounded-l-xl">Date</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Vehicle</th>
                  <th className="px-4 py-3 rounded-r-xl">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {data.pendingExpenses.map(e => (
                  <tr key={e.id}>
                    <td className="px-4 py-3">{e.date}</td>
                    <td className="px-4 py-3 font-medium">{e.type}</td>
                    <td className="px-4 py-3">{e.registration_number || 'General'}</td>
                    <td className="px-4 py-3 font-bold text-amber-600 dark:text-amber-400">${e.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState message="All expenses have been approved or processed. No pending items." />
        )}
      </div>
    </div>
  );
};

export default FinanceDash;
