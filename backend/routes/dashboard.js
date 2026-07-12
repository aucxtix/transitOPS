import express from 'express';
import db from '../db.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Unified Role-Specific Dashboard Route
router.get('/', authenticate, async (req, res) => {
  try {
    const role = req.user.roleName;
    
    switch (role) {
      case 'Driver': {
        const driver = db.prepare('SELECT * FROM drivers WHERE user_id = ?').get(req.user.id);
        if (!driver) {
           return res.status(404).json({ error: 'Driver profile not associated with this user.' });
        }
        
        const activeTrips = db.prepare(`
          SELECT t.*, v.registration_number, v.name_model
          FROM trips t
          JOIN vehicles v ON t.vehicle_id = v.id
          WHERE t.driver_id = ? AND t.status = 'On Trip'
        `).all(driver.id);

        const upcomingTrips = db.prepare(`
          SELECT t.*, v.registration_number, v.name_model
          FROM trips t
          JOIN vehicles v ON t.vehicle_id = v.id
          WHERE t.driver_id = ? AND t.status = 'Pending'
          ORDER BY t.created_at ASC
        `).all(driver.id);

        return res.json({
          type: 'Driver',
          safetyScore: driver.safety_score,
          activeTrips,
          upcomingTrips
        });
      }

      case 'Fleet Manager': {
        const vehicles = db.prepare('SELECT status, COUNT(*) as count FROM vehicles GROUP BY status').all();
        const trips = db.prepare('SELECT status, COUNT(*) as count FROM trips GROUP BY status').all();
        
        let activeVehicles = 0; let availableVehicles = 0; let inMaintenance = 0; let totalVehicles = 0;
        vehicles.forEach(v => {
          totalVehicles += v.count;
          if (v.status === 'On Trip') activeVehicles += v.count;
          if (v.status === 'Available') availableVehicles += v.count;
          if (v.status === 'In Shop') inMaintenance += v.count;
        });

        let activeTrips = 0; let pendingTrips = 0;
        trips.forEach(t => {
          if (t.status === 'On Trip') activeTrips += t.count;
          if (t.status === 'Pending') pendingTrips += t.count;
        });

        const fleetUtilization = totalVehicles > 0 ? ((activeVehicles / totalVehicles) * 100).toFixed(1) : 0;

        const maintenanceAlerts = db.prepare(`SELECT * FROM maintenance_logs WHERE status = 'Open' ORDER BY created_at DESC LIMIT 5`).all();
        
        const fuelCosts = db.prepare('SELECT SUM(cost) as total FROM fuel_logs').get();
        const expenses = db.prepare(`SELECT SUM(amount) as total FROM expenses WHERE status = 'Approved'`).get();

        return res.json({
          type: 'FleetManager',
          kpis: { activeVehicles, availableVehicles, inMaintenance, activeTrips, pendingTrips, fleetUtilization },
          financials: { totalCosts: (fuelCosts.total || 0) + (expenses.total || 0) },
          maintenanceAlerts
        });
      }

      case 'Dispatcher': {
        const trips = db.prepare('SELECT status, COUNT(*) as count FROM trips GROUP BY status').all();
        let activeTrips = 0; let pendingTrips = 0;
        trips.forEach(t => {
          if (t.status === 'On Trip') activeTrips += t.count;
          if (t.status === 'Pending') pendingTrips += t.count;
        });

        const pendingTripList = db.prepare(`
          SELECT t.*, v.registration_number, d.name as driver_name 
          FROM trips t
          JOIN vehicles v ON t.vehicle_id = v.id
          JOIN drivers d ON t.driver_id = d.id
          WHERE t.status = 'Pending'
          ORDER BY t.created_at ASC LIMIT 10
        `).all();

        const activeTripList = db.prepare(`
          SELECT t.*, v.registration_number, d.name as driver_name 
          FROM trips t
          JOIN vehicles v ON t.vehicle_id = v.id
          JOIN drivers d ON t.driver_id = d.id
          WHERE t.status = 'On Trip'
          ORDER BY t.created_at DESC LIMIT 10
        `).all();

        const availableDrivers = db.prepare(`SELECT * FROM drivers WHERE status = 'Available' AND license_expiry_date >= date('now')`).all();
        const availableVehicles = db.prepare(`SELECT * FROM vehicles WHERE status = 'Available'`).all();

        return res.json({
          type: 'Dispatcher',
          kpis: { activeTrips, pendingTrips },
          pendingTripList,
          activeTripList,
          availableDrivers,
          availableVehicles
        });
      }

      case 'Financial Analyst': {
        const pendingExpenses = db.prepare(`
          SELECT e.*, v.registration_number 
          FROM expenses e
          LEFT JOIN vehicles v ON e.vehicle_id = v.id
          WHERE e.status = 'Pending'
          ORDER BY e.created_at DESC
        `).all();

        const costs = db.prepare(`SELECT SUM(amount) as total FROM expenses WHERE status = 'Approved'`).get();
        const fuelCosts = db.prepare('SELECT SUM(cost) as total FROM fuel_logs').get();

        return res.json({
          type: 'Finance',
          pendingExpenses,
          totalApprovedExpenses: costs.total || 0,
          totalFuelCosts: fuelCosts.total || 0
        });
      }

      case 'Safety Officer': {
        const drivers = db.prepare(`SELECT * FROM drivers ORDER BY safety_score ASC LIMIT 10`).all();
        const openMaintenance = db.prepare(`
          SELECT m.*, v.registration_number 
          FROM maintenance_logs m
          JOIN vehicles v ON m.vehicle_id = v.id
          WHERE m.status = 'Open'
          ORDER BY m.created_at ASC
        `).all();
        
        return res.json({
          type: 'SafetyOfficer',
          driverRankings: drivers,
          overdueMaintenance: openMaintenance
        });
      }

      default:
        return res.status(403).json({ error: 'Role not supported on dashboard' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

router.get('/export', authenticate, requireRole(['Fleet Manager', 'Financial Analyst']), (req, res) => {
  try {
    const trips = db.prepare(`
      SELECT t.id, t.source, t.destination, t.cargo_weight, t.planned_distance, t.actual_distance, t.fuel_consumed, t.status, t.created_at, v.registration_number, d.name as driver_name
      FROM trips t
      JOIN vehicles v ON t.vehicle_id = v.id
      JOIN drivers d ON t.driver_id = d.id
    `).all();
    res.json({ trips });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate export data' });
  }
});

export default router;
