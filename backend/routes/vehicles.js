import express from 'express';
import db from '../db.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { z } from 'zod';

const router = express.Router();

const vehicleSchema = z.object({
  registration_number: z.string().min(1),
  name_model: z.string().min(1),
  type: z.string().min(1),
  max_load_capacity: z.number().positive(),
  odometer: z.number().min(0).optional(),
  acquisition_cost: z.number().min(0),
  status: z.string().optional(),
  region: z.string().optional()
});

router.use(authenticate);

// Get available vehicles
router.get('/available', requireRole(['Fleet Manager', 'Dispatcher']), (req, res) => {
  if (!['Fleet Manager', 'Dispatcher'].includes(req.user.roleName)) {
    return res.status(403).json({ error: 'Forbidden: Unauthorized role' });
  }
  const { type, region } = req.query;
  let query = "SELECT * FROM vehicles WHERE status = 'Available'";
  const params = [];
  
  if (type) {
    query += " AND type = ?";
    params.push(type);
  }
  if (region) {
    query += " AND region = ?";
    params.push(region);
  }
  
  try {
    const vehicles = db.prepare(query).all(...params);
    res.json(vehicles);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
});

router.get('/', (req, res) => {
  if (!['Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst'].includes(req.user.roleName)) {
    return res.status(403).json({ error: 'Forbidden: Unauthorized role' });
  }
  try {
    const vehicles = db.prepare('SELECT * FROM vehicles ORDER BY created_at DESC').all();
    res.json(vehicles);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
});

router.post('/', requireRole(['Fleet Manager']), (req, res) => {
  if (req.user.roleName !== 'Fleet Manager') return res.status(403).json({ error: 'Forbidden: Unauthorized role' });
  try {
    const data = vehicleSchema.parse(req.body);
    
    const existing = db.prepare('SELECT * FROM vehicles WHERE registration_number = ?').get(data.registration_number);
    if (existing) {
      return res.status(400).json({ error: 'Registration number must be unique.' });
    }

    const stmt = db.prepare(`
      INSERT INTO vehicles (registration_number, name_model, type, max_load_capacity, odometer, acquisition_cost, status, region)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const info = stmt.run(
      data.registration_number, 
      data.name_model, 
      data.type, 
      data.max_load_capacity, 
      data.odometer || 0, 
      data.acquisition_cost, 
      data.status || 'Available', 
      data.region || null
    );
    
    const newVehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(newVehicle);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    res.status(500).json({ error: 'Failed to create vehicle' });
  }
});

router.put('/:id', requireRole(['Fleet Manager']), (req, res) => {
  if (req.user.roleName !== 'Fleet Manager') return res.status(403).json({ error: 'Forbidden: Unauthorized role' });
  try {
    const { id } = req.params;
    const data = vehicleSchema.parse(req.body);
    
    const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(id);
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
    
    // Retired -> Never restored business rule
    if (vehicle.status === 'Retired') {
      return res.status(400).json({ error: 'Retired vehicles cannot be modified or restored to service.' });
    }

    if (data.status === 'Retired' && vehicle.status === 'On Trip') {
      return res.status(400).json({ error: 'Cannot retire a vehicle while it is active on a trip.' });
    }

    const existing = db.prepare('SELECT * FROM vehicles WHERE registration_number = ? AND id != ?').get(data.registration_number, id);
    if (existing) return res.status(400).json({ error: 'Registration number must be unique.' });

    const stmt = db.prepare(`
      UPDATE vehicles SET 
        registration_number = ?, name_model = ?, type = ?, max_load_capacity = ?, 
        odometer = ?, acquisition_cost = ?, status = ?, region = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    stmt.run(
      data.registration_number, data.name_model, data.type, data.max_load_capacity,
      data.odometer || vehicle.odometer, data.acquisition_cost, data.status || vehicle.status, data.region || vehicle.region, id
    );
    
    const updated = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(id);
    res.json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    res.status(500).json({ error: 'Failed to update vehicle' });
  }
});

router.delete('/:id', requireRole(['Fleet Manager']), (req, res) => {
  if (req.user.roleName !== 'Fleet Manager') return res.status(403).json({ error: 'Forbidden: Unauthorized role' });
  try {
    const { id } = req.params;
    const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(id);
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
    
    if (vehicle.status === 'Retired') {
      return res.status(400).json({ error: 'Retired vehicles cannot be deleted to preserve audit and operational logs.' });
    }

    db.prepare('DELETE FROM vehicles WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete vehicle. It may be in use.' });
  }
});

export default router;
