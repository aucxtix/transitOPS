import { useEffect, useState } from 'react';
import api from '../lib/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';

export default function Trips() {
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ source: '', destination: '', vehicle_id: '', driver_id: '', cargo_weight: '', planned_distance: '' });

  const fetchData = async () => {
    try {
      const [tRes, vRes, dRes] = await Promise.all([
        api.get('/trips'),
        api.get('/vehicles'),
        api.get('/drivers')
      ]);
      setTrips(tRes.data);
      setVehicles(vRes.data.filter(v => v.status === 'Available'));
      setDrivers(dRes.data.filter(d => d.status === 'Available' && new Date(d.license_expiry_date) >= new Date()));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/trips', formData);
      setShowForm(false);
      setFormData({ source: '', destination: '', vehicle_id: '', driver_id: '', cargo_weight: '', planned_distance: '' });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Error creating trip');
    }
  };

  const handleAction = async (id, action) => {
    try {
      if (action === 'complete') {
        const dist = prompt('Enter actual distance (km):');
        const fuel = prompt('Enter fuel consumed (liters):');
        if (!dist || !fuel) return;
        await api.put(`/trips/${id}/complete`, { actual_distance: dist, fuel_consumed: fuel });
      } else {
        await api.put(`/trips/${id}/${action}`);
      }
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || `Error ${action}ing trip`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Trip Management</h2>
        <Button onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : 'Create Trip'}</Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>Create New Trip</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Source</label>
                <Input required value={formData.source} onChange={e => setFormData({...formData, source: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium">Destination</label>
                <Input required value={formData.destination} onChange={e => setFormData({...formData, destination: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium">Vehicle</label>
                <select required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.vehicle_id} onChange={e => setFormData({...formData, vehicle_id: e.target.value})}>
                  <option value="">Select Vehicle</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.registration_number} (Max: {v.max_load_capacity}kg)</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Driver</label>
                <select required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.driver_id} onChange={e => setFormData({...formData, driver_id: e.target.value})}>
                  <option value="">Select Driver</option>
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Cargo Weight (kg)</label>
                <Input type="number" required value={formData.cargo_weight} onChange={e => setFormData({...formData, cargo_weight: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium">Planned Distance (km)</label>
                <Input type="number" required value={formData.planned_distance} onChange={e => setFormData({...formData, planned_distance: e.target.value})} />
              </div>
              <div className="col-span-full">
                <Button type="submit">Create Trip</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4">
        {trips.map(trip => (
          <Card key={trip.id}>
            <CardContent className="p-6 flex flex-col md:flex-row justify-between items-center">
              <div>
                <h3 className="font-bold text-lg">{trip.source} → {trip.destination}</h3>
                <p className="text-sm text-gray-500">
                  Vehicle: {trip.registration_number} | Driver: {trip.driver_name} | Cargo: {trip.cargo_weight}kg
                </p>
                <div className="mt-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    trip.status === 'Draft' ? 'bg-gray-100 text-gray-800' :
                    trip.status === 'Dispatched' ? 'bg-blue-100 text-blue-800' :
                    trip.status === 'Completed' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {trip.status}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 mt-4 md:mt-0">
                {trip.status === 'Draft' && (
                  <Button onClick={() => handleAction(trip.id, 'dispatch')} className="bg-blue-600">Dispatch</Button>
                )}
                {trip.status === 'Dispatched' && (
                  <Button onClick={() => handleAction(trip.id, 'complete')} className="bg-green-600">Complete</Button>
                )}
                {(trip.status === 'Draft' || trip.status === 'Dispatched') && (
                  <Button onClick={() => handleAction(trip.id, 'cancel')} variant="destructive">Cancel</Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
