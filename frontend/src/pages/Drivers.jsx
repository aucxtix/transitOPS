import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { StatusBadge } from '../components/ui/StatusBadge';
import { MonoNumber } from '../components/ui/MonoNumber';

const Drivers = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    fetchDrivers();
  }, []);

  const getExpiryStyle = (dateStr) => {
    const expDate = new Date(dateStr);
    const today = new Date();
    const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'text-red-500 font-bold';
    if (diffDays <= 30) return 'text-amber-500 font-bold';
    return 'text-foreground/70';
  };

  if (loading) return <div className="animate-pulse h-64 bg-border rounded-xl"></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Safety Profiles & Drivers</h1>
          <p className="text-foreground/60 text-sm mt-1">Monitor driver compliance and statuses.</p>
        </div>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Drivers;
