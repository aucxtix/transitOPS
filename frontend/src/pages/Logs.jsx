import { useEffect, useState } from 'react';
import api from '../lib/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent } from '../components/ui/Card';

export default function Logs() {
  const [fuelLogs, setFuelLogs] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  
  const [showFuelForm, setShowFuelForm] = useState(false);
  const [fuelForm, setFuelForm] = useState({ vehicle_id: '', liters: '', cost: '', date: '' });
  
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ vehicle_id: '', type: 'Toll', amount: '', date: '' });

  const fetchData = async () => {
    try {
      const [fRes, eRes, vRes] = await Promise.all([
        api.get('/fuel-logs'),
        api.get('/expenses'),
        api.get('/vehicles')
      ]);
      setFuelLogs(fRes.data);
      setExpenses(eRes.data);
      setVehicles(vRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFuelSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/fuel-logs', fuelForm);
      setShowFuelForm(false);
      setFuelForm({ vehicle_id: '', liters: '', cost: '', date: '' });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Error saving fuel log');
    }
  };

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/expenses', expenseForm);
      setShowExpenseForm(false);
      setExpenseForm({ vehicle_id: '', type: 'Toll', amount: '', date: '' });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Error saving expense');
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fuel Logs Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Fuel Logs</h2>
            <Button size="sm" onClick={() => setShowFuelForm(!showFuelForm)}>{showFuelForm ? 'Cancel' : 'Add Log'}</Button>
          </div>
          
          {showFuelForm && (
            <Card>
              <CardContent className="p-4">
                <form onSubmit={handleFuelSubmit} className="space-y-3">
                  <select required className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm" value={fuelForm.vehicle_id} onChange={e => setFuelForm({...fuelForm, vehicle_id: e.target.value})}>
                    <option value="">Select Vehicle</option>
                    {vehicles.map(v => <option key={v.id} value={v.id}>{v.registration_number}</option>)}
                  </select>
                  <Input type="number" required placeholder="Liters" value={fuelForm.liters} onChange={e => setFuelForm({...fuelForm, liters: e.target.value})} />
                  <Input type="number" required placeholder="Cost ($)" value={fuelForm.cost} onChange={e => setFuelForm({...fuelForm, cost: e.target.value})} />
                  <Input type="date" required value={fuelForm.date} onChange={e => setFuelForm({...fuelForm, date: e.target.value})} />
                  <Button type="submit" size="sm" className="w-full">Save</Button>
                </form>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-700 bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-2">Vehicle</th>
                    <th className="px-4 py-2">Date</th>
                    <th className="px-4 py-2">Liters</th>
                    <th className="px-4 py-2">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {fuelLogs.map(log => (
                    <tr key={log.id} className="border-b">
                      <td className="px-4 py-2">{log.registration_number}</td>
                      <td className="px-4 py-2">{log.date}</td>
                      <td className="px-4 py-2">{log.liters} L</td>
                      <td className="px-4 py-2">${log.cost}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        {/* Expenses Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Other Expenses</h2>
            <Button size="sm" onClick={() => setShowExpenseForm(!showExpenseForm)}>{showExpenseForm ? 'Cancel' : 'Add Expense'}</Button>
          </div>
          
          {showExpenseForm && (
            <Card>
              <CardContent className="p-4">
                <form onSubmit={handleExpenseSubmit} className="space-y-3">
                  <select required className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm" value={expenseForm.vehicle_id} onChange={e => setExpenseForm({...expenseForm, vehicle_id: e.target.value})}>
                    <option value="">Select Vehicle</option>
                    {vehicles.map(v => <option key={v.id} value={v.id}>{v.registration_number}</option>)}
                  </select>
                  <select required className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm" value={expenseForm.type} onChange={e => setExpenseForm({...expenseForm, type: e.target.value})}>
                    <option value="Toll">Toll</option>
                    <option value="Fine">Fine</option>
                    <option value="Insurance">Insurance</option>
                    <option value="Other">Other</option>
                  </select>
                  <Input type="number" required placeholder="Amount ($)" value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})} />
                  <Input type="date" required value={expenseForm.date} onChange={e => setExpenseForm({...expenseForm, date: e.target.value})} />
                  <Button type="submit" size="sm" className="w-full">Save</Button>
                </form>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-700 bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-2">Vehicle</th>
                    <th className="px-4 py-2">Date</th>
                    <th className="px-4 py-2">Type</th>
                    <th className="px-4 py-2">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map(exp => (
                    <tr key={exp.id} className="border-b">
                      <td className="px-4 py-2">{exp.registration_number}</td>
                      <td className="px-4 py-2">{exp.date}</td>
                      <td className="px-4 py-2">{exp.type}</td>
                      <td className="px-4 py-2">${exp.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
