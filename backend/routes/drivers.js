import express from 'express';
import db from '../db.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { z } from 'zod';

const router = express.Router();

const driverSchema = z.object({
  name: z.string().min(1),
  license_number: z.string().min(1),
  license_category: z.string().min(1),
  license_expiry_date: z.string().min(1),
  contact_number: z.string().min(1),
  safety_score: z.number().min(0).max(100).optional(),
  status: z.string().optional()
});

router.use(authenticate);

// Get available drivers
router.get('/available', requireRole(['Fleet Manager', 'Dispatcher']), (req, res) => {
  try {
    // Drivers with expired licenses or status Suspended must never appear in dispatch dropdowns.
    const query = `
      SELECT * FROM drivers 
      WHERE status = 'Available' 
      AND license_expiry_date >= date('now')
    `;
    const drivers = db.prepare(query).all();
    res.json(drivers);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch available drivers' });
  }
});

router.get('/', (req, res) => {
  try {
    const drivers = db.prepare('SELECT * FROM drivers ORDER BY created_at DESC').all();
    res.json(drivers);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch drivers' });
  }
});

router.post('/', requireRole(['Fleet Manager']), (req, res) => {
  try {
    const data = driverSchema.parse(req.body);
    const existing = db.prepare('SELECT * FROM drivers WHERE license_number = ?').get(data.license_number);
    if (existing) {
      return res.status(400).json({ error: 'License number must be unique.' });
    }

    const stmt = db.prepare(`
      INSERT INTO drivers (name, license_number, license_category, license_expiry_date, contact_number, safety_score, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    const info = stmt.run(
      data.name, data.license_number, data.license_category, data.license_expiry_date,
      data.contact_number, data.safety_score ?? 100, data.status || 'Available'
    );
    
    const newDriver = db.prepare('SELECT * FROM drivers WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(newDriver);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    res.status(500).json({ error: 'Failed to create driver' });
  }
});

router.put('/:id', requireRole(['Fleet Manager']), (req, res) => {
  try {
    const { id } = req.params;
    const data = driverSchema.parse(req.body);
    
    const driver = db.prepare('SELECT * FROM drivers WHERE id = ?').get(id);
    if (!driver) return res.status(404).json({ error: 'Driver not found' });

    const existing = db.prepare('SELECT * FROM drivers WHERE license_number = ? AND id != ?').get(data.license_number, id);
    if (existing) return res.status(400).json({ error: 'License number must be unique.' });

    const stmt = db.prepare(`
      UPDATE drivers SET 
        name = ?, license_number = ?, license_category = ?, license_expiry_date = ?, 
        contact_number = ?, safety_score = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    stmt.run(
      data.name, data.license_number, data.license_category, data.license_expiry_date,
      data.contact_number, data.safety_score ?? driver.safety_score, data.status || driver.status, id
    );
    
    const updated = db.prepare('SELECT * FROM drivers WHERE id = ?').get(id);
    res.json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    res.status(500).json({ error: 'Failed to update driver' });
  }
});

router.delete('/:id', requireRole(['Fleet Manager']), (req, res) => {
  try {
    db.prepare('DELETE FROM drivers WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete driver. They may be associated with trips.' });
  }
});

export default router;
