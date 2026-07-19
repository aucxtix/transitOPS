import express from 'express';
import db from '../db.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Security Fix: Rate limit for trip dispatching to prevent spam
const dispatchLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max 100 dispatches per IP
  message: { error: 'Too many trips dispatched from this IP, please try again later' }
});

const tripSchema = z.object({
  source: z.string().min(1).max(255),
  destination: z.string().min(1).max(255),
  vehicle_id: z.number().int().positive(),
  driver_id: z.number().int().positive(),
  cargo_weight: z.number().positive().max(100000), // Max 100 tons
  planned_distance: z.number().positive().max(50000), // Max 50,000 km
  notes: z.string().max(1000).optional()
});

const completeTripSchema = z.object({
  actual_distance: z.number().positive().max(50000),
  fuel_consumed: z.number().positive().max(20000)
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

// Edit Trip
router.put('/:id', requireRole(['Fleet Manager', 'Dispatcher']), (req, res) => {
  try {
    const { id } = req.params;
    const data = tripSchema.parse(req.body);
    
    const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(id);
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    if (trip.status === 'Completed' || trip.status === 'Cancelled') {
      db.prepare(`UPDATE trips SET notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(data.notes || null, id);
      const updatedTrip = db.prepare('SELECT * FROM trips WHERE id = ?').get(id);
      return res.json(updatedTrip);
    }

    // Validate vehicle and driver
    const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(data.vehicle_id);
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
    // If vehicle changed, ensure it's available
    if (vehicle.id !== trip.vehicle_id && vehicle.status !== 'Available') {
      return res.status(400).json({ error: 'Selected vehicle is not available' });
    }
    if (data.cargo_weight > vehicle.max_load_capacity) {
      return res.status(400).json({ error: `Cargo weight exceeds vehicle capacity (${vehicle.max_load_capacity}kg)` });
    }

    const driver = db.prepare('SELECT * FROM drivers WHERE id = ?').get(data.driver_id);
    if (!driver) return res.status(404).json({ error: 'Driver not found' });
    if (driver.id !== trip.driver_id && driver.status !== 'Available') {
      return res.status(400).json({ error: 'Selected driver is not available' });
    }

    const editTransaction = db.transaction(() => {
      if (trip.status === 'On Trip') {
        if (vehicle.id !== trip.vehicle_id) {
          db.prepare("UPDATE vehicles SET status = 'Available' WHERE id = ?").run(trip.vehicle_id);
          db.prepare("UPDATE vehicles SET status = 'On Trip' WHERE id = ?").run(vehicle.id);
        }
        if (driver.id !== trip.driver_id) {
          db.prepare("UPDATE drivers SET status = 'Available' WHERE id = ?").run(trip.driver_id);
          db.prepare("UPDATE drivers SET status = 'On Trip' WHERE id = ?").run(driver.id);
        }
      }

      const stmt = db.prepare(`
        UPDATE trips SET 
          source = ?, destination = ?, vehicle_id = ?, driver_id = ?, 
          cargo_weight = ?, planned_distance = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      
      stmt.run(
        data.source, data.destination, data.vehicle_id, data.driver_id,
        data.cargo_weight, data.planned_distance, data.notes || null, id
      );
    });

    editTransaction();
    const updatedTrip = db.prepare('SELECT * FROM trips WHERE id = ?').get(id);
    res.json(updatedTrip);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    res.status(500).json({ error: 'Failed to edit trip' });
  }
});

// Dispatch / Start Trip
router.put('/:id/dispatch', requireRole(['Fleet Manager', 'Dispatcher', 'Driver']), dispatchLimiter, (req, res) => {
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
