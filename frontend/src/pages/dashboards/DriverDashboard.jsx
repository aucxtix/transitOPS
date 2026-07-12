import React from 'react';
import { Truck, Clock } from 'lucide-react';

const DriverDashboard = ({ data }) => {
  return (
    <div className="space-y-8">
      <div className="glass-panel rounded-[2rem] p-8 bg-gradient-blue text-white shadow-float relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-white/70 font-medium mb-1">Your Safety Score</p>
          <h2 className="text-5xl font-bold tracking-tight mono-text">{data.safetyScore}%</h2>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel rounded-[1.75rem] p-6 flex flex-col h-64">
          <h3 className="font-semibold text-foreground/80 mb-4 flex items-center gap-2"><Truck size={18}/> Active Trip</h3>
          {data.activeTrips && data.activeTrips.length > 0 ? (
            <div className="flex-1 flex flex-col justify-center gap-2">
              <p className="text-2xl font-bold">{data.activeTrips[0].source} → {data.activeTrips[0].destination}</p>
              <p className="text-sm text-foreground/60">Vehicle: <span className="mono-text">{data.activeTrips[0].registration_number}</span></p>
              <span className="inline-block mt-2 px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-full text-xs font-bold w-max animate-pulse">ON ROUTE</span>
            </div>
          ) : (
             <div className="flex-1 flex items-center justify-center text-foreground/50">No active trips right now.</div>
          )}
        </div>
        <div className="glass-panel rounded-[1.75rem] p-6 flex flex-col h-64">
           <h3 className="font-semibold text-foreground/80 mb-4 flex items-center gap-2"><Clock size={18}/> Upcoming Schedule</h3>
           <div className="overflow-y-auto pr-2 space-y-3">
             {data.upcomingTrips && data.upcomingTrips.length > 0 ? (
               data.upcomingTrips.map(trip => (
                 <div key={trip.id} className="p-3 bg-foreground/5 rounded-xl">
                   <p className="font-semibold text-sm">{trip.source} → {trip.destination}</p>
                   <p className="text-xs text-foreground/50 mt-1">Distance: {trip.planned_distance}km | Vehicle: {trip.registration_number}</p>
                 </div>
               ))
             ) : (
                <div className="text-center text-foreground/50 mt-10">No upcoming trips scheduled.</div>
             )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default DriverDashboard;
