import { useEffect, useState } from 'react';
import api from '../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Truck, Activity, Wrench, CheckCircle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export default function Dashboard() {
  const [kpis, setKpis] = useState(null);

  useEffect(() => {
    const fetchKpis = async () => {
      try {
        const res = await api.get('/dashboard/kpis');
        setKpis(res.data);
      } catch (err) {
        console.error('Failed to fetch KPIs', err);
      }
    };
    fetchKpis();
  }, []);

  if (!kpis) return <div className="p-4">Loading...</div>;

  const pieData = [
    { name: 'Available', value: kpis.availableVehicles, color: '#22c55e' },
    { name: 'On Trip', value: kpis.activeVehicles - kpis.availableVehicles, color: '#3b82f6' },
    { name: 'In Shop', value: kpis.vehiclesInMaintenance, color: '#f59e0b' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard title="Active Vehicles" value={kpis.activeVehicles} icon={Truck} color="text-blue-600" bg="bg-blue-100" />
        <KpiCard title="Vehicles in Maintenance" value={kpis.vehiclesInMaintenance} icon={Wrench} color="text-orange-600" bg="bg-orange-100" />
        <KpiCard title="Active Trips" value={kpis.activeTrips} icon={Activity} color="text-purple-600" bg="bg-purple-100" />
        <KpiCard title="Drivers On Duty" value={kpis.driversOnDuty} icon={CheckCircle} color="text-green-600" bg="bg-green-100" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Fleet Status Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border">
                <span className="font-medium text-gray-700">Fleet Utilization</span>
                <span className="text-2xl font-bold text-blue-600">{kpis.fleetUtilizationPercent}%</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border">
                <span className="font-medium text-gray-700">Pending Trips</span>
                <span className="text-2xl font-bold text-orange-600">{kpis.pendingTrips}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border">
                <span className="font-medium text-gray-700">Available Vehicles</span>
                <span className="text-2xl font-bold text-green-600">{kpis.availableVehicles}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KpiCard({ title, value, icon: Icon, color, bg }) {
  return (
    <Card>
      <CardContent className="p-6 flex items-center space-x-4">
        <div className={`p-3 rounded-full ${bg}`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        </div>
      </CardContent>
    </Card>
  );
}
