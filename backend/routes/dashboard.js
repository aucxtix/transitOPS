import express from 'express';
import db from '../db.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/kpi', (req, res) => {
  try {
    const vehicles = db.prepare('SELECT status, COUNT(*) as count FROM vehicles GROUP BY status').all();
    const trips = db.prepare('SELECT status, COUNT(*) as count FROM trips GROUP BY status').all();
    const drivers = db.prepare('SELECT status, COUNT(*) as count FROM drivers GROUP BY status').all();
    
    let activeVehicles = 0;
    let availableVehicles = 0;
    let inMaintenance = 0;
    let totalVehicles = 0;
    
    vehicles.forEach(v => {
      totalVehicles += v.count;
      if (v.status === 'On Trip') activeVehicles += v.count;
      if (v.status === 'Available') availableVehicles += v.count;
      if (v.status === 'In Shop') inMaintenance += v.count;
    });

    let activeTrips = 0;
    let pendingTrips = 0;
    trips.forEach(t => {
      if (t.status === 'On Trip') activeTrips += t.count;
      if (t.status === 'Pending') pendingTrips += t.count;
    });

    let driversOnDuty = 0;
    drivers.forEach(d => {
      if (d.status === 'On Trip') driversOnDuty += d.count;
    });

    const fleetUtilization = totalVehicles > 0 ? ((activeVehicles / totalVehicles) * 100).toFixed(1) : 0;

    res.json({
      activeVehicles,
      availableVehicles,
      inMaintenance,
      activeTrips,
      pendingTrips,
      driversOnDuty,
      fleetUtilization
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch KPIs' });
  }
});

router.get('/reports', (req, res) => {
  try {
    // For charting purposes, get completed trips aggregated by month (or recent trips)
    // Simplified: Just returning all completed trips for Recharts to process.
    const completedTrips = db.prepare(`
      SELECT t.id, t.actual_distance, t.fuel_consumed, t.created_at, v.registration_number
      FROM trips t
      JOIN vehicles v ON t.vehicle_id = v.id
      WHERE t.status = 'Completed'
    `).all();
    
    // Operational costs
    const expenses = db.prepare(`
      SELECT e.type, SUM(e.amount) as total
      FROM expenses e
      GROUP BY e.type
    `).all();

    res.json({ completedTrips, expenses });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

export default router;
