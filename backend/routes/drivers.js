import express from 'express';
import bcrypt from 'bcryptjs';
import db from '../db.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';

const router = express.Router();

const driverCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 50,
  message: { error: 'Too many drivers created from this IP, please try again later' }
});

const driverSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(255).optional(),
  password: z.string().min(12).optional(),
  license_number: z.string().min(1).max(50),
  license_category: z.string().min(1).max(50),
  license_expiry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  contact_number: z.string().min(1).max(20),
  safety_score: z.number().min(0).max(100).optional(),
  status: z.enum(['Available', 'On Trip', 'Suspended']).optional()
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

router.get('/', requireRole(['Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst']), (req, res) => {
  try {
    const drivers = db.prepare('SELECT * FROM drivers ORDER BY created_at DESC').all();
    res.json(drivers);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch drivers' });
  }
});

router.post('/', requireRole(['Fleet Manager']), driverCreationLimiter, async (req, res) => {
  try {
    const data = driverSchema.parse(req.body);
    const existing = db.prepare('SELECT * FROM drivers WHERE license_number = ?').get(data.license_number);
    if (existing) {
      return res.status(400).json({ error: 'License number must be unique.' });
    }

    const role = db.prepare('SELECT id FROM roles WHERE name = ?').get('Driver');
    if (!role) return res.status(500).json({ error: 'Driver role not found' });
    
    const email = data.email || `${data.license_number.toLowerCase().replace(/[^a-z0-9]/g, '')}@transitops.local`;
    const passwordToHash = data.password || data.license_number;
    const hashedPassword = await bcrypt.hash(passwordToHash, 12); // Secure hashing cost
    
    const createTransaction = db.transaction(() => {
      const userStmt = db.prepare(`
        INSERT INTO users (name, email, password, role_id)
        VALUES (?, ?, ?, ?)
      `);
      const userInfo = userStmt.run(data.name, email, hashedPassword, role.id);
      const userId = userInfo.lastInsertRowid;

      const stmt = db.prepare(`
        INSERT INTO drivers (user_id, name, license_number, license_category, license_expiry_date, contact_number, safety_score, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const info = stmt.run(
        userId, data.name, data.license_number, data.license_category, data.license_expiry_date,
        data.contact_number, data.safety_score ?? 100, data.status || 'Available'
      );
      
      return info.lastInsertRowid;
    });

    const driverId = createTransaction();
    const newDriver = db.prepare('SELECT * FROM drivers WHERE id = ?').get(driverId);
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
    
    if (driver.user_id) {
      db.prepare('UPDATE users SET name = ? WHERE id = ?').run(data.name, driver.user_id);
    }
    
    const updated = db.prepare('SELECT * FROM drivers WHERE id = ?').get(id);
    res.json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    res.status(500).json({ error: 'Failed to update driver' });
  }
});

router.delete('/:id', requireRole(['Fleet Manager']), (req, res) => {
  try {
    const driver = db.prepare('SELECT user_id FROM drivers WHERE id = ?').get(req.params.id);
    db.prepare('DELETE FROM drivers WHERE id = ?').run(req.params.id);
    if (driver && driver.user_id) {
      db.prepare('DELETE FROM users WHERE id = ?').run(driver.user_id);
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete driver. They may be associated with trips.' });
  }
});

export default router;
