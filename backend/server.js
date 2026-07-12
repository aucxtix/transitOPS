const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { db, initDB } = require('./database');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'supersecret_transitops_key_123';

initDB();

// -- Middleware --
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// -- Auth Routes --
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const stmt = db.prepare('INSERT INTO Users (name, email, password_hash, role) VALUES (?, ?, ?, ?)');
    const info = stmt.run(name, email, hashedPassword, role || 'Fleet Manager');
    res.status(201).json({ id: info.lastInsertRowid, message: 'User created' });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const stmt = db.prepare('SELECT * FROM Users WHERE email = ?');
    const user = stmt.get(email);
    
    if (user && await bcrypt.compare(password, user.password_hash)) {
      const token = jwt.sign({ id: user.id, role: user.role, name: user.name, email: user.email }, JWT_SECRET);
      res.json({ token, role: user.role, name: user.name });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -- Vehicles Routes --
app.get('/api/vehicles', authenticateToken, (req, res) => {
  const stmt = db.prepare('SELECT * FROM Vehicles');
  res.json(stmt.all());
});

app.post('/api/vehicles', authenticateToken, (req, res) => {
  try {
    const { registration_number, name_model, type, max_load_capacity, acquisition_cost, status } = req.body;
    const stmt = db.prepare('INSERT INTO Vehicles (registration_number, name_model, type, max_load_capacity, acquisition_cost, status) VALUES (?, ?, ?, ?, ?, ?)');
    const info = stmt.run(registration_number, name_model, type, max_load_capacity, acquisition_cost, status || 'Available');
    res.status(201).json({ id: info.lastInsertRowid, message: 'Vehicle added' });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Registration number already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/vehicles/:id', authenticateToken, (req, res) => {
  try {
    const { name_model, type, max_load_capacity, status } = req.body;
    const stmt = db.prepare('UPDATE Vehicles SET name_model = ?, type = ?, max_load_capacity = ?, status = ? WHERE id = ?');
    stmt.run(name_model, type, max_load_capacity, status, req.params.id);
    res.json({ message: 'Vehicle updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -- Drivers Routes --
app.get('/api/drivers', authenticateToken, (req, res) => {
  const stmt = db.prepare('SELECT * FROM Drivers');
  res.json(stmt.all());
});

app.post('/api/drivers', authenticateToken, (req, res) => {
  try {
    const { name, license_number, license_category, license_expiry_date, contact_number, status } = req.body;
    const stmt = db.prepare('INSERT INTO Drivers (name, license_number, license_category, license_expiry_date, contact_number, status) VALUES (?, ?, ?, ?, ?, ?)');
    const info = stmt.run(name, license_number, license_category, license_expiry_date, contact_number, status || 'Available');
    res.status(201).json({ id: info.lastInsertRowid, message: 'Driver added' });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'License number already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/drivers/:id', authenticateToken, (req, res) => {
  try {
    const { name, license_category, license_expiry_date, contact_number, status } = req.body;
    const stmt = db.prepare('UPDATE Drivers SET name = ?, license_category = ?, license_expiry_date = ?, contact_number = ?, status = ? WHERE id = ?');
    stmt.run(name, license_category, license_expiry_date, contact_number, status, req.params.id);
    res.json({ message: 'Driver updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -- Trips Routes --
app.get('/api/trips', authenticateToken, (req, res) => {
  const stmt = db.prepare(`
    SELECT t.*, v.registration_number, v.name_model, d.name as driver_name 
    FROM Trips t
    JOIN Vehicles v ON t.vehicle_id = v.id
    JOIN Drivers d ON t.driver_id = d.id
    ORDER BY t.created_at DESC
  `);
  res.json(stmt.all());
});

app.post('/api/trips', authenticateToken, (req, res) => {
  try {
    const { source, destination, vehicle_id, driver_id, cargo_weight, planned_distance } = req.body;
    
    // Check vehicle rules
    const vehicle = db.prepare('SELECT * FROM Vehicles WHERE id = ?').get(vehicle_id);
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
    if (['In Shop', 'Retired'].includes(vehicle.status)) return res.status(400).json({ error: 'Vehicle cannot be used (In Shop or Retired)' });
    if (vehicle.status === 'On Trip') return res.status(400).json({ error: 'Vehicle is already On Trip' });
    if (cargo_weight > vehicle.max_load_capacity) return res.status(400).json({ error: 'Cargo weight exceeds vehicle capacity' });

    // Check driver rules
    const driver = db.prepare('SELECT * FROM Drivers WHERE id = ?').get(driver_id);
    if (!driver) return res.status(404).json({ error: 'Driver not found' });
    if (driver.status === 'Suspended') return res.status(400).json({ error: 'Driver is Suspended' });
    if (driver.status === 'On Trip') return res.status(400).json({ error: 'Driver is already On Trip' });
    if (new Date(driver.license_expiry_date) < new Date()) return res.status(400).json({ error: 'Driver license is expired' });

    const stmt = db.prepare('INSERT INTO Trips (source, destination, vehicle_id, driver_id, cargo_weight, planned_distance) VALUES (?, ?, ?, ?, ?, ?)');
    const info = stmt.run(source, destination, vehicle_id, driver_id, cargo_weight, planned_distance);
    res.status(201).json({ id: info.lastInsertRowid, message: 'Trip created (Draft)' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/trips/:id/dispatch', authenticateToken, (req, res) => {
  const transaction = db.transaction(() => {
    const trip = db.prepare('SELECT * FROM Trips WHERE id = ?').get(req.params.id);
    if (!trip) throw new Error('Trip not found');
    if (trip.status !== 'Draft') throw new Error('Only Draft trips can be dispatched');

    // Double check constraints just in case status changed
    const vehicle = db.prepare('SELECT status FROM Vehicles WHERE id = ?').get(trip.vehicle_id);
    if (vehicle.status !== 'Available') throw new Error('Vehicle is no longer Available');
    
    const driver = db.prepare('SELECT status FROM Drivers WHERE id = ?').get(trip.driver_id);
    if (driver.status !== 'Available') throw new Error('Driver is no longer Available');

    db.prepare("UPDATE Trips SET status = 'Dispatched' WHERE id = ?").run(trip.id);
    db.prepare("UPDATE Vehicles SET status = 'On Trip' WHERE id = ?").run(trip.vehicle_id);
    db.prepare("UPDATE Drivers SET status = 'On Trip' WHERE id = ?").run(trip.driver_id);
  });

  try {
    transaction();
    res.json({ message: 'Trip dispatched successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/trips/:id/complete', authenticateToken, (req, res) => {
  const { actual_distance, fuel_consumed } = req.body;
  
  const transaction = db.transaction(() => {
    const trip = db.prepare('SELECT * FROM Trips WHERE id = ?').get(req.params.id);
    if (!trip) throw new Error('Trip not found');
    if (trip.status !== 'Dispatched') throw new Error('Only Dispatched trips can be completed');

    db.prepare("UPDATE Trips SET status = 'Completed', actual_distance = ?, fuel_consumed = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?").run(actual_distance, fuel_consumed, trip.id);
    db.prepare("UPDATE Vehicles SET status = 'Available', odometer = odometer + ? WHERE id = ?").run(actual_distance, trip.vehicle_id);
    db.prepare("UPDATE Drivers SET status = 'Available' WHERE id = ?").run(trip.driver_id);
  });

  try {
    transaction();
    res.json({ message: 'Trip completed successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/trips/:id/cancel', authenticateToken, (req, res) => {
  const transaction = db.transaction(() => {
    const trip = db.prepare('SELECT * FROM Trips WHERE id = ?').get(req.params.id);
    if (!trip) throw new Error('Trip not found');
    if (trip.status === 'Completed' || trip.status === 'Cancelled') throw new Error('Cannot cancel a completed or already cancelled trip');

    db.prepare("UPDATE Trips SET status = 'Cancelled' WHERE id = ?").run(trip.id);
    if (trip.status === 'Dispatched') {
      db.prepare("UPDATE Vehicles SET status = 'Available' WHERE id = ?").run(trip.vehicle_id);
      db.prepare("UPDATE Drivers SET status = 'Available' WHERE id = ?").run(trip.driver_id);
    }
  });

  try {
    transaction();
    res.json({ message: 'Trip cancelled' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// -- Maintenance Routes --
app.get('/api/maintenance', authenticateToken, (req, res) => {
  const stmt = db.prepare(`
    SELECT m.*, v.registration_number, v.name_model 
    FROM MaintenanceLogs m
    JOIN Vehicles v ON m.vehicle_id = v.id
    ORDER BY m.created_at DESC
  `);
  res.json(stmt.all());
});

app.post('/api/maintenance', authenticateToken, (req, res) => {
  const { vehicle_id, description, cost } = req.body;
  const transaction = db.transaction(() => {
    const vehicle = db.prepare('SELECT status FROM Vehicles WHERE id = ?').get(vehicle_id);
    if (!vehicle) throw new Error('Vehicle not found');
    if (vehicle.status === 'On Trip') throw new Error('Cannot put an On Trip vehicle into maintenance');

    db.prepare('INSERT INTO MaintenanceLogs (vehicle_id, description, cost) VALUES (?, ?, ?)').run(vehicle_id, description, cost);
    db.prepare("UPDATE Vehicles SET status = 'In Shop' WHERE id = ?").run(vehicle_id);
  });

  try {
    transaction();
    res.status(201).json({ message: 'Maintenance record created' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/maintenance/:id/close', authenticateToken, (req, res) => {
  const transaction = db.transaction(() => {
    const log = db.prepare('SELECT * FROM MaintenanceLogs WHERE id = ?').get(req.params.id);
    if (!log) throw new Error('Maintenance log not found');
    if (log.status === 'Closed') throw new Error('Already closed');

    db.prepare("UPDATE MaintenanceLogs SET status = 'Closed', closed_at = CURRENT_TIMESTAMP WHERE id = ?").run(log.id);
    
    // Restore vehicle status to Available, unless it was retired (need logic, assume Available for now)
    const vehicle = db.prepare('SELECT status FROM Vehicles WHERE id = ?').get(log.vehicle_id);
    if (vehicle.status !== 'Retired') {
      db.prepare("UPDATE Vehicles SET status = 'Available' WHERE id = ?").run(log.vehicle_id);
    }
  });

  try {
    transaction();
    res.json({ message: 'Maintenance record closed' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// -- Fuel Logs & Expenses --
app.get('/api/fuel-logs', authenticateToken, (req, res) => {
  res.json(db.prepare('SELECT f.*, v.registration_number FROM FuelLogs f JOIN Vehicles v ON f.vehicle_id = v.id ORDER BY f.date DESC').all());
});

app.post('/api/fuel-logs', authenticateToken, (req, res) => {
  try {
    const { vehicle_id, liters, cost, date } = req.body;
    db.prepare('INSERT INTO FuelLogs (vehicle_id, liters, cost, date) VALUES (?, ?, ?, ?)').run(vehicle_id, liters, cost, date);
    res.status(201).json({ message: 'Fuel log added' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/expenses', authenticateToken, (req, res) => {
  res.json(db.prepare('SELECT e.*, v.registration_number FROM Expenses e JOIN Vehicles v ON e.vehicle_id = v.id ORDER BY e.date DESC').all());
});

app.post('/api/expenses', authenticateToken, (req, res) => {
  try {
    const { vehicle_id, type, amount, date } = req.body;
    db.prepare('INSERT INTO Expenses (vehicle_id, type, amount, date) VALUES (?, ?, ?, ?)').run(vehicle_id, type, amount, date);
    res.status(201).json({ message: 'Expense added' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -- Dashboard KPIs --
app.get('/api/dashboard/kpis', authenticateToken, (req, res) => {
  try {
    const vehicles = db.prepare('SELECT status, COUNT(*) as count FROM Vehicles GROUP BY status').all();
    const trips = db.prepare('SELECT status, COUNT(*) as count FROM Trips GROUP BY status').all();
    const driversOnDuty = db.prepare("SELECT COUNT(*) as count FROM Drivers WHERE status = 'On Trip'").get().count;

    const vStats = { 'Available': 0, 'On Trip': 0, 'In Shop': 0, 'Retired': 0, total: 0 };
    vehicles.forEach(v => {
      vStats[v.status] = v.count;
      vStats.total += v.count;
    });

    const tStats = { 'Draft': 0, 'Dispatched': 0, 'Completed': 0, 'Cancelled': 0 };
    trips.forEach(t => {
      tStats[t.status] = t.count;
    });

    const utilization = vStats.total > 0 ? ((vStats['On Trip'] / vStats.total) * 100).toFixed(2) : 0;

    res.json({
      activeVehicles: vStats['On Trip'] + vStats['Available'],
      availableVehicles: vStats['Available'],
      vehiclesInMaintenance: vStats['In Shop'],
      activeTrips: tStats['Dispatched'],
      pendingTrips: tStats['Draft'],
      driversOnDuty: driversOnDuty,
      fleetUtilizationPercent: parseFloat(utilization)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -- Reports & Analytics --
app.get('/api/reports/fuel-efficiency', authenticateToken, (req, res) => {
  const data = db.prepare(`
    SELECT v.registration_number, v.name_model, 
           SUM(t.actual_distance) as total_distance, 
           SUM(t.fuel_consumed) as total_fuel
    FROM Vehicles v
    LEFT JOIN Trips t ON v.id = t.vehicle_id AND t.status = 'Completed'
    GROUP BY v.id
  `).all();
  
  const formatted = data.map(d => ({
    registration_number: d.registration_number,
    name_model: d.name_model,
    efficiency: d.total_fuel > 0 ? (d.total_distance / d.total_fuel).toFixed(2) : 0
  }));
  res.json(formatted);
});

app.get('/api/reports/vehicle-roi', authenticateToken, (req, res) => {
  const data = db.prepare(`
    SELECT v.registration_number, v.name_model, v.acquisition_cost,
      COALESCE((SELECT SUM(cost) FROM MaintenanceLogs WHERE vehicle_id = v.id), 0) as maintenance_cost,
      COALESCE((SELECT SUM(cost) FROM FuelLogs WHERE vehicle_id = v.id), 0) as fuel_cost,
      COALESCE((SELECT SUM(amount) FROM Expenses WHERE vehicle_id = v.id), 0) as expenses
    FROM Vehicles v
  `).all();
  // Assume a fixed revenue per km or similar, but since we don't track revenue in schema natively, let's just do cost analysis or mock revenue (e.g. 10 * distance)
  // Let's add distance to calculate revenue
  const trips = db.prepare("SELECT vehicle_id, SUM(actual_distance) as dist FROM Trips WHERE status='Completed' GROUP BY vehicle_id").all();
  const distMap = {};
  trips.forEach(t => distMap[t.vehicle_id] = t.dist);

  const formatted = data.map(d => {
    const dist = distMap[d.id] || 0;
    const revenue = dist * 5; // $5 per km
    const total_cost = d.maintenance_cost + d.fuel_cost + d.expenses;
    const roi = d.acquisition_cost > 0 ? (((revenue - total_cost) / d.acquisition_cost) * 100).toFixed(2) : 0;
    
    return {
      registration_number: d.registration_number,
      revenue,
      total_cost,
      acquisition_cost: d.acquisition_cost,
      roi_percent: parseFloat(roi)
    };
  });
  res.json(formatted);
});

app.get('/api/reports/operational-cost', authenticateToken, (req, res) => {
  const data = db.prepare(`
    SELECT v.registration_number, v.name_model,
      COALESCE((SELECT SUM(cost) FROM MaintenanceLogs WHERE vehicle_id = v.id), 0) as maintenance_cost,
      COALESCE((SELECT SUM(cost) FROM FuelLogs WHERE vehicle_id = v.id), 0) as fuel_cost
    FROM Vehicles v
  `).all();
  
  const formatted = data.map(d => ({
    registration_number: d.registration_number,
    name_model: d.name_model,
    total_operational_cost: d.maintenance_cost + d.fuel_cost
  }));
  res.json(formatted);
});

app.get('/api/export/csv/:reportType', authenticateToken, (req, res) => {
  // basic csv export implementation placeholder
  res.json({ message: 'CSV export would be generated here' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
