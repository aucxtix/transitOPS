import { useEffect, useState } from 'react';
import api from '../lib/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';

export default function Maintenance() {
  const [logs, setLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ vehicle_id: '', description: '', cost: '' });

  const fetchData = async () => {
    try {
      const [mRes, vRes] = await Promise.all([
        api.get('/maintenance'),
        api.get('/vehicles')
      ]);
      setLogs(mRes.data);
      // Only available vehicles can be put in maintenance (unless they already are, but creating new requires available)
      setVehicles(vRes.data.filter(v => v.status === 'Available' || v.status === 'In Shop'));
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
      await api.post('/maintenance', formData);
      setShowForm(false);
      setFormData({ vehicle_id: '', description: '', cost: '' });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Error creating maintenance record');
    }
  };

  const handleClose = async (id) => {
    try {
      await api.put(`/maintenance/${id}/close`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Error closing record');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Maintenance Records</h2>
        <Button onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : 'New Record'}</Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>Create Maintenance Record</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Vehicle</label>
                <select required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.vehicle_id} onChange={e => setFormData({...formData, vehicle_id: e.target.value})}>
                  <option value="">Select Vehicle</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.registration_number}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Cost ($)</label>
                <Input type="number" required value={formData.cost} onChange={e => setFormData({...formData, cost: e.target.value})} />
              </div>
              <div className="col-span-full">
                <label className="text-sm font-medium">Description</label>
                <Input required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              <div className="col-span-full">
                <Button type="submit">Save Record</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4">
        {logs.map(log => (
          <Card key={log.id}>
            <CardContent className="p-6 flex flex-col md:flex-row justify-between items-center">
              <div>
                <h3 className="font-bold text-lg">{log.registration_number} - {log.name_model}</h3>
                <p className="text-sm text-gray-700 mt-1">{log.description}</p>
                <p className="text-sm text-gray-500 mt-1">Cost: ${log.cost}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    log.status === 'Open' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {log.status}
                  </span>
                  <span className="text-xs text-gray-400">Created: {new Date(log.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="mt-4 md:mt-0">
                {log.status === 'Open' && (
                  <Button onClick={() => handleClose(log.id)}>Close Record</Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
