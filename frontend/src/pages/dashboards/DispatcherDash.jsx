import React, { useState } from 'react';
import api from '../../services/api';
import { Truck, Navigation, Plus } from 'lucide-react';
import { MonoNumber } from '../../components/ui/MonoNumber';

const EmptyState = ({ message }) => (
  <div className="flex-1 flex items-center justify-center text-foreground/50 h-full p-6 text-center border-2 border-dashed border-border rounded-[1.75rem]">
    {message}
  </div>
);

const DispatcherDash = ({ data, onRefresh }) => {
  const { kpis, pendingTripList, activeTripList, availableDrivers, availableVehicles } = data;
  
  const [selectedDriverId, setSelectedDriverId] = useState(availableDrivers?.[0]?.id || null);
  const [dispatchLoading, setDispatchLoading] = useState(false);

  const handleQuickDispatch = async () => {
    if (!selectedDriverId || availableVehicles.length === 0) return;
    setDispatchLoading(true);
    try {
      const vehicleId = availableVehicles[0].id;
      const tripRes = await api.post('/trips', {
        source: 'HQ Base',
        destination: 'Local Route',
        vehicle_id: vehicleId,
        driver_id: selectedDriverId,
        cargo_weight: 100, 
        planned_distance: 50
      });
      await api.put(`/trips/${tripRes.data.id}/dispatch`);
      onRefresh(); // Optimistic/reactive update
    } catch (err) {
      alert(err.response?.data?.error || 'Quick Dispatch Failed');
    } finally {
      setDispatchLoading(false);
    }
  };

  const assignedVehicle = availableVehicles && availableVehicles.length > 0 ? availableVehicles[0].registration_number : 'None';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8 h-full pb-10">
      <div className="space-y-8 flex flex-col">
        <div className="grid grid-cols-2 gap-6">
          <div className="glass-panel rounded-[2rem] p-8 shadow-float flex flex-col justify-center">
            <p className="text-foreground/70 font-medium mb-1">Active Trips On Route</p>
            <h2 className="text-5xl font-bold tracking-tight mono-text text-primary">{kpis?.activeTrips || 0}</h2>
          </div>
          <div className="glass-panel rounded-[2rem] p-8 shadow-float flex flex-col justify-center">
            <p className="text-foreground/70 font-medium mb-1">Trips Pending Dispatch</p>
            <h2 className="text-5xl font-bold tracking-tight mono-text text-amber-500">{kpis?.pendingTrips || 0}</h2>
          </div>
        </div>

        <div className="glass-panel rounded-[1.75rem] p-6 flex flex-col flex-1">
          <h3 className="font-semibold text-foreground/80 mb-4 flex items-center gap-2"><Navigation size={18}/> Active Fleet</h3>
          {activeTripList && activeTripList.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-foreground/5 text-foreground/70">
                  <tr>
                    <th className="px-4 py-3 rounded-l-xl">Route</th>
                    <th className="px-4 py-3">Vehicle</th>
                    <th className="px-4 py-3">Driver</th>
                    <th className="px-4 py-3 rounded-r-xl">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {activeTripList.map(trip => (
                    <tr key={trip.id}>
                      <td className="px-4 py-3 font-medium">{trip.source} → {trip.destination}</td>
                      <td className="px-4 py-3 mono-text">{trip.registration_number}</td>
                      <td className="px-4 py-3">{trip.driver_name}</td>
                      <td className="px-4 py-3"><span className="px-2 py-1 bg-emerald-500/10 text-emerald-600 rounded-md text-[10px] font-bold uppercase">On Route</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState message="No trips are currently active." />
          )}
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className="glass-panel rounded-[1.75rem] p-6 flex flex-col h-[300px]">
          <h3 className="font-semibold text-foreground/80 mb-4 flex items-center gap-2 text-amber-500"><Truck size={18}/> Awaiting Dispatch</h3>
          {pendingTripList && pendingTripList.length > 0 ? (
            <div className="overflow-y-auto pr-2 space-y-3">
              {pendingTripList.map(trip => (
                <div key={trip.id} className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                  <p className="font-bold text-sm">{trip.source} → {trip.destination}</p>
                  <p className="text-xs text-foreground/60 mt-1">Driver: {trip.driver_name} | Veh: {trip.registration_number}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState message="No pending trips in queue." />
          )}
        </div>

        <div className="glass rounded-3xl p-6 relative overflow-hidden shadow-sm border border-border">
          <div className="relative z-10 flex justify-between items-center mb-6">
            <h3 className="font-semibold">Quick Dispatch</h3>
          </div>
          <div className="relative z-10 flex items-center gap-3 mb-8">
             <button className="w-12 h-12 rounded-full border border-dashed border-foreground/30 flex items-center justify-center hover:bg-foreground/5 transition-colors">
               <Plus size={20} className="text-foreground/50" />
             </button>
             {availableDrivers && availableDrivers.slice(0, 3).map((driver) => (
               <div key={driver.id} onClick={() => setSelectedDriverId(driver.id)} className="flex flex-col items-center gap-1 cursor-pointer">
                  <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${driver.name}&backgroundColor=e2e8f0`} className={`w-12 h-12 rounded-full border-2 transition-all shadow-sm ${selectedDriverId === driver.id ? 'border-primary' : 'border-transparent hover:border-primary/50'}`} alt={driver.name} />
                  <span className={`text-[10px] font-semibold ${selectedDriverId === driver.id ? 'text-primary' : ''}`}>{driver.name.split(' ')[0]}</span>
               </div>
             ))}
          </div>
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-xs text-foreground/50 mb-1">Assigned Vehicle</p>
              <p className="text-lg font-bold mono-text text-foreground/80">{assignedVehicle}</p>
            </div>
            <button 
              onClick={handleQuickDispatch}
              disabled={dispatchLoading || !selectedDriverId || !availableVehicles?.length}
              className="pill-button pill-button-dark shadow-lg disabled:opacity-50"
            >
              {dispatchLoading ? 'Dispatching...' : 'Assign'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DispatcherDash;
