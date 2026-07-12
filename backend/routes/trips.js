import express from 'express';
import db from '../db.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { z } from 'zod';

const router = express.Router();

const tripSchema = z.object({
  source: z.string().min(1),
  destination: z.string().min(1),
  vehicle_id: z.number().int().positive(),
  driver_id: z.number().int().positive(),
  cargo_weight: z.number().positive(),
  planned_distance: z.number().positive(),
  notes: z.string().optional()
});

const completeTripSchema = z.object({
  actual_distance: z.number().positive(),
  fuel_consumed: z.number().positive()
});

router.use(authenticate);

router.get('/', requireRole(['Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst', 'Driver']), (req, res) => {
  try {
    let query = `
      SELECT t.*, v.registration_number, v.name_model as vehicle_name, d.name as driver_name 
      FROM trips t
      JOIN vehicles v ON t.vehicle_id = v.id
      JOIN drivers d ON t.driver_id = d.id
    `;
    let params = [];

    // FIX: Look up driver profile properly via user_id foreign key
    if (req.user.roleName === 'Driver') {
      query += ` WHERE d.user_id = ?`;
      params.push(req.user.id);
    }

    query += ` ORDER BY t.created_at DESC`;

    const trips = db.prepare(query).all(...params);
    res.json(trips);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch trips' });
  }
});

router.post('/', requireRole(['Fleet Manager', 'Dispatcher']), (req, res) => {
  try {
    const data = tripSchema.parse(req.body);
    
    // Validate vehicle and driver
    const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(data.vehicle_id);
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
    if (vehicle.status !== 'Available') return res.status(400).json({ error: 'Vehicle is not available for dispatch' });
    if (data.cargo_weight > vehicle.max_load_capacity) {
      return res.status(400).json({ error: `Cargo weight (${data.cargo_weight}kg) exceeds vehicle capacity (${vehicle.max_load_capacity}kg)` });
    }

    const driver = db.prepare('SELECT * FROM drivers WHERE id = ?').get(data.driver_id);
    if (!driver) return res.status(404).json({ error: 'Driver not found' });
    if (driver.status !== 'Available') return res.status(400).json({ error: 'Driver is not available for dispatch' });

    const stmt = db.prepare(`
      INSERT INTO trips (source, destination, vehicle_id, driver_id, cargo_weight, planned_distance, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const info = stmt.run(
      data.source, data.destination, data.vehicle_id, data.driver_id,
      data.cargo_weight, data.planned_distance, data.notes || null, req.user.id
    );
    
    const newTrip = db.prepare('SELECT * FROM trips WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(newTrip);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    res.status(500).json({ error: 'Failed to create trip' });
  }
});

// Dispatch / Start Trip
router.put('/:id/dispatch', requireRole(['Fleet Manager', 'Dispatcher', 'Driver']), (req, res) => {
  const { id } = req.params;
  
  const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(id);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });
  if (trip.status !== 'Pending') return res.status(400).json({ error: 'Only pending trips can be dispatched' });

  const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(trip.vehicle_id);
  const driver = db.prepare('SELECT * FROM drivers WHERE id = ?').get(trip.driver_id);

  if (vehicle.status !== 'Available') return res.status(400).json({ error: 'Vehicle is no longer available' });
  if (driver.status !== 'Available') return res.status(400).json({ error: 'Driver is no longer available' });

  // If driver is starting their own trip, verify ownership
  if (req.user.roleName === 'Driver') {
     if (driver.user_id !== req.user.id) {
       return res.status(403).json({ error: 'Forbidden: You can only start your own assigned trips' });
     }
  }

  const dispatchTransaction = db.transaction(() => {
    db.prepare("UPDATE trips SET status = 'On Trip', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(id);
    db.prepare("UPDATE vehicles SET status = 'On Trip' WHERE id = ?").run(trip.vehicle_id);
    db.prepare("UPDATE drivers SET status = 'On Trip' WHERE id = ?").run(trip.driver_id);
  });

  try {
    dispatchTransaction();
    const updatedTrip = db.prepare('SELECT * FROM trips WHERE id = ?').get(id);
    res.json(updatedTrip);
  } catch (err) {
    res.status(500).json({ error: 'Failed to dispatch trip' });
  }
});

// Complete Trip
router.put('/:id/complete', requireRole(['Fleet Manager', 'Dispatcher', 'Driver']), (req, res) => {
  const { id } = req.params;
  
  try {
    const data = completeTripSchema.parse(req.body);
    const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(id);
    
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    if (trip.status !== 'On Trip') return res.status(400).json({ error: 'Only dispatched trips can be completed' });

    // If driver is completing their own trip, verify ownership
    if (req.user.roleName === 'Driver') {
       const driver = db.prepare('SELECT * FROM drivers WHERE id = ?').get(trip.driver_id);
       if (driver.user_id !== req.user.id) {
         return res.status(403).json({ error: 'Forbidden: You can only complete your own assigned trips' });
       }
    }

    const completeTransaction = db.transaction(() => {
      db.prepare(`
        UPDATE trips SET 
          status = 'Completed', 
          actual_distance = ?, 
          fuel_consumed = ?,
          updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `).run(data.actual_distance, data.fuel_consumed, id);
      
      db.prepare("UPDATE vehicles SET status = 'Available' WHERE id = ?").run(trip.vehicle_id);
      db.prepare("UPDATE drivers SET status = 'Available' WHERE id = ?").run(trip.driver_id);
    });

    completeTransaction();
    const updatedTrip = db.prepare('SELECT * FROM trips WHERE id = ?').get(id);
    res.json(updatedTrip);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    res.status(500).json({ error: 'Failed to complete trip' });
  }
});

// Cancel Trip
router.put('/:id/cancel', requireRole(['Fleet Manager', 'Dispatcher']), (req, res) => {
  const { id } = req.params;
  
  const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(id);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });
  if (trip.status === 'Completed' || trip.status === 'Cancelled') {
    return res.status(400).json({ error: 'Cannot cancel completed or already cancelled trips' });
  }

  const cancelTransaction = db.transaction(() => {
    db.prepare("UPDATE trips SET status = 'Cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(id);
    if (trip.status === 'On Trip') {
      db.prepare("UPDATE vehicles SET status = 'Available' WHERE id = ?").run(trip.vehicle_id);
      db.prepare("UPDATE drivers SET status = 'Available' WHERE id = ?").run(trip.driver_id);
    }
  });

  try {
    cancelTransaction();
    const updatedTrip = db.prepare('SELECT * FROM trips WHERE id = ?').get(id);
    res.json(updatedTrip);
  } catch (err) {
    res.status(500).json({ error: 'Failed to cancel trip' });
  }
});

export default router;
