import React, { useState } from 'react';
import api from '../../services/api';
import { Truck, Clock, CheckCircle } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';

const EmptyState = ({ message }) => (
  <div className="flex-1 flex items-center justify-center text-foreground/50 h-full p-6 text-center border-2 border-dashed border-border rounded-[1.75rem]">
    {message}
  </div>
);

const DriverDash = ({ data, onRefresh }) => {
  const [loadingTripId, setLoadingTripId] = useState(null);
  const [completeModalData, setCompleteModalData] = useState(null);
  const [completeForm, setCompleteForm] = useState({ actual_distance: '', fuel_consumed: '' });

  const handleStartTrip = async (id) => {
    setLoadingTripId(id);
    try {
      await api.put(`/trips/${id}/dispatch`);
      onRefresh(); // Trigger optimistic/reactive update
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to start trip');
    } finally {
      setLoadingTripId(null);
    }
  };

  const handleCompleteTrip = async (e) => {
    e.preventDefault();
    setLoadingTripId(completeModalData.id);
    try {
      await api.put(`/trips/${completeModalData.id}/complete`, {
        actual_distance: parseFloat(completeForm.actual_distance),
        fuel_consumed: parseFloat(completeForm.fuel_consumed)
      });
      setCompleteModalData(null);
      setCompleteForm({ actual_distance: '', fuel_consumed: '' });
      onRefresh();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to complete trip');
    } finally {
      setLoadingTripId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="glass-panel rounded-[2rem] p-8 bg-gradient-blue text-white shadow-float relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-white/70 font-medium mb-1">Your Safety Score</p>
          <h2 className="text-5xl font-bold tracking-tight mono-text">{data.safetyScore}%</h2>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Trip Panel */}
        <div className="glass-panel rounded-[1.75rem] p-6 flex flex-col h-[320px]">
          <h3 className="font-semibold text-foreground/80 mb-4 flex items-center gap-2"><Truck size={18}/> Active Trip</h3>
          {data.activeTrips && data.activeTrips.length > 0 ? (
            <div className="flex-1 flex flex-col justify-center gap-2">
              <p className="text-2xl font-bold">{data.activeTrips[0].source} → {data.activeTrips[0].destination}</p>
              <p className="text-sm text-foreground/60">Vehicle: <span className="mono-text">{data.activeTrips[0].registration_number}</span> ({data.activeTrips[0].name_model})</p>
              <span className="inline-block mt-2 px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-full text-xs font-bold w-max animate-pulse mb-4">ON ROUTE</span>
              <button 
                onClick={() => setCompleteModalData(data.activeTrips[0])}
                disabled={loadingTripId === data.activeTrips[0].id}
                className="pill-button pill-button-dark shadow-md mt-auto flex justify-center items-center gap-2"
              >
                {loadingTripId === data.activeTrips[0].id ? 'Processing...' : <><CheckCircle size={16}/> Complete Trip</>}
              </button>
            </div>
          ) : (
            <EmptyState message="You have no active trips currently." />
          )}
        </div>
        
        {/* Upcoming Trips Panel */}
        <div className="glass-panel rounded-[1.75rem] p-6 flex flex-col h-[320px]">
           <h3 className="font-semibold text-foreground/80 mb-4 flex items-center gap-2"><Clock size={18}/> Upcoming Schedule</h3>
           {data.upcomingTrips && data.upcomingTrips.length > 0 ? (
             <div className="overflow-y-auto pr-2 space-y-3 h-full">
               {data.upcomingTrips.map(trip => (
                 <div key={trip.id} className="p-4 bg-foreground/5 rounded-2xl flex flex-col gap-3 border border-border">
                   <div>
                     <p className="font-bold">{trip.source} → {trip.destination}</p>
                     <p className="text-xs text-foreground/60 mt-1">Dist: {trip.planned_distance}km | Veh: {trip.registration_number}</p>
                   </div>
                   {/* If there's no active trip, let the driver start the next one */}
                   {data.activeTrips.length === 0 && (
                     <button 
                       onClick={() => handleStartTrip(trip.id)}
                       disabled={loadingTripId === trip.id}
                       className="pill-button bg-emerald-500 hover:bg-emerald-600 text-white w-full shadow-sm"
                     >
                       {loadingTripId === trip.id ? 'Starting...' : 'Start Trip'}
                     </button>
                   )}
                 </div>
               ))}
             </div>
           ) : (
             <EmptyState message="Your schedule is clear." />
           )}
        </div>
      </div>

      <Modal isOpen={!!completeModalData} onClose={() => setCompleteModalData(null)} title="Complete Trip">
        {completeModalData && (
          <form onSubmit={handleCompleteTrip} className="space-y-4">
            <div className="bg-foreground/5 p-4 rounded-xl mb-4">
              <p className="font-bold">{completeModalData.source} → {completeModalData.destination}</p>
              <p className="text-xs text-foreground/60">Planned: {completeModalData.planned_distance}km</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground/70 mb-1">Actual Distance (km)</label>
              <input type="number" required min="1" step="0.1" value={completeForm.actual_distance} onChange={e => setCompleteForm({...completeForm, actual_distance: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-border bg-foreground/5 focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground/70 mb-1">Fuel Consumed (Liters)</label>
              <input type="number" required min="1" step="0.1" value={completeForm.fuel_consumed} onChange={e => setCompleteForm({...completeForm, fuel_consumed: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-border bg-foreground/5 focus:outline-none focus:border-primary" />
            </div>
            <div className="pt-4 flex justify-end gap-3">
              <button type="button" onClick={() => setCompleteModalData(null)} className="px-5 py-2.5 rounded-xl font-semibold hover:bg-foreground/5 transition-colors">Cancel</button>
              <button type="submit" disabled={loadingTripId === completeModalData.id} className="pill-button pill-button-dark shadow-md disabled:opacity-50">Confirm Completion</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default DriverDash;
