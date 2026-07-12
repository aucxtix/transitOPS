import { useEffect, useState } from 'react';
import api from '../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from '../components/ui/Button';

export default function Reports() {
  const [fuelData, setFuelData] = useState([]);
  const [roiData, setRoiData] = useState([]);
  const [costData, setCostData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fuel, roi, cost] = await Promise.all([
          api.get('/reports/fuel-efficiency'),
          api.get('/reports/vehicle-roi'),
          api.get('/reports/operational-cost')
        ]);
        setFuelData(fuel.data);
        setRoiData(roi.data);
        setCostData(cost.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  const exportCSV = (data, filename) => {
    if (!data || !data.length) return;
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(obj => Object.values(obj).join(',')).join('\\n');
    const csvContent = `data:text/csv;charset=utf-8,${headers}\\n${rows}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Reports & Analytics</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportCSV(fuelData, 'fuel-efficiency.csv')}>Export Fuel Data</Button>
          <Button variant="outline" onClick={() => exportCSV(roiData, 'vehicle-roi.csv')}>Export ROI Data</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Vehicle ROI (%)</CardTitle></CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={roiData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="registration_number" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="roi_percent" fill="#3b82f6" name="ROI %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Operational Cost by Vehicle ($)</CardTitle></CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={costData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="registration_number" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total_operational_cost" fill="#f59e0b" name="Total Cost $" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Fuel Efficiency (km/L)</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-700 bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-2">Vehicle</th>
                  <th className="px-4 py-2">Model</th>
                  <th className="px-4 py-2">Efficiency (km/L)</th>
                </tr>
              </thead>
              <tbody>
                {fuelData.map((data, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="px-4 py-2">{data.registration_number}</td>
                    <td className="px-4 py-2">{data.name_model}</td>
                    <td className="px-4 py-2 font-medium">{data.efficiency}</td>
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
