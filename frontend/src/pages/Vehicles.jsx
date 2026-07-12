import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { StatusBadge } from '../components/ui/StatusBadge';
import { MonoNumber } from '../components/ui/MonoNumber';

const Vehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    fetchVehicles();
  }, []);

  if (loading) return <div className="animate-pulse h-64 bg-border rounded-xl"></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vehicle Registry</h1>
          <p className="text-foreground/60 text-sm mt-1">Manage your fleet, view status, and track metrics.</p>
        </div>
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
                </tr>
              ))}
              {vehicles.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-foreground/50">No vehicles found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Vehicles;
