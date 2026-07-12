import { useEffect, useState } from 'react';
import api from '../lib/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';

export default function Drivers() {
  const [drivers, setDrivers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', license_number: '', license_category: 'Class B', license_expiry_date: '', contact_number: '' });

  const fetchDrivers = async () => {
    try {
      const res = await api.get('/drivers');
      setDrivers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/drivers', formData);
      setShowForm(false);
      setFormData({ name: '', license_number: '', license_category: 'Class B', license_expiry_date: '', contact_number: '' });
      fetchDrivers();
    } catch (err) {
      alert(err.response?.data?.error || 'Error creating driver');
    }
  };

  const isExpired = (dateString) => new Date(dateString) < new Date();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Driver Management</h2>
        <Button onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : 'Add Driver'}</Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>Add New Driver</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Alex Smith" />
              </div>
              <div>
                <label className="text-sm font-medium">License Number</label>
                <Input required value={formData.license_number} onChange={e => setFormData({...formData, license_number: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium">License Category</label>
                <Input required value={formData.license_category} onChange={e => setFormData({...formData, license_category: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium">Expiry Date</label>
                <Input type="date" required value={formData.license_expiry_date} onChange={e => setFormData({...formData, license_expiry_date: e.target.value})} />
              </div>
              <div>
                <label className="text-sm font-medium">Contact Number</label>
                <Input required value={formData.contact_number} onChange={e => setFormData({...formData, contact_number: e.target.value})} />
              </div>
              <div className="col-span-full">
                <Button type="submit">Save Driver</Button>
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
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">License</th>
                  <th className="px-6 py-3">Expiry</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map(d => (
                  <tr key={d.id} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{d.name}</td>
                    <td className="px-6 py-4">{d.license_number} ({d.license_category})</td>
                    <td className="px-6 py-4">
                      <span className={isExpired(d.license_expiry_date) ? 'text-red-600 font-bold' : ''}>
                        {d.license_expiry_date}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        d.status === 'Available' ? 'bg-green-100 text-green-800' :
                        d.status === 'On Trip' ? 'bg-blue-100 text-blue-800' :
                        d.status === 'Suspended' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {d.status}
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
