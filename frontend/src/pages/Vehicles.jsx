import { useEffect, useState } from 'react';
import api from '../lib/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ registration_number: '', name_model: '', type: 'Van', max_load_capacity: '', acquisition_cost: '' });

  const fetchVehicles = async () => {
    try {
      const res = await api.get('/vehicles');
      setVehicles(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/vehicles', formData);
      setShowForm(false);
      setFormData({ registration_number: '', name_model: '', type: 'Van', max_load_capacity: '', acquisition_cost: '' });
      fetchVehicles();
    } catch (err) {
      alert(err.response?.data?.error || 'Error creating vehicle');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Vehicle Registry</h2>
        <Button onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : 'Add Vehicle'}</Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>Add New Vehicle</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Registration Number</label>
                <Input required value={formData.registration_number} onChange={e => setFormData({...formData, registration_number: e.target.value})} placeholder="e.g. Van-05" />
              </div>
              <div>
                <label className="text-sm font-medium">Model/Name</label>
                <Input required value={formData.name_model} onChange={e => setFormData({...formData, name_model: e.target.value})} placeholder="Ford Transit" />
              </div>
              <div>
                <label className="text-sm font-medium">Type</label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                  <option value="Van">Van</option>
                  <option value="Truck">Truck</option>
                  <option value="Car">Car</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Max Load Capacity (kg)</label>
                <Input type="number" required value={formData.max_load_capacity} onChange={e => setFormData({...formData, max_load_capacity: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium">Acquisition Cost</label>
                <Input type="number" required value={formData.acquisition_cost} onChange={e => setFormData({...formData, acquisition_cost: e.target.value})} />
              </div>
              <div className="col-span-full">
                <Button type="submit">Save Vehicle</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3">Registration</th>
                  <th className="px-6 py-3">Model</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Capacity</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map(v => (
                  <tr key={v.id} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{v.registration_number}</td>
                    <td className="px-6 py-4">{v.name_model}</td>
                    <td className="px-6 py-4">{v.type}</td>
                    <td className="px-6 py-4">{v.max_load_capacity} kg</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        v.status === 'Available' ? 'bg-green-100 text-green-800' :
                        v.status === 'On Trip' ? 'bg-blue-100 text-blue-800' :
                        v.status === 'In Shop' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {v.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
