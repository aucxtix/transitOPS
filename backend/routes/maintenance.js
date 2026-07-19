import express from 'express';
import db from '../db.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { z } from 'zod';

const router = express.Router();

const maintenanceSchema = z.object({
  vehicle_id: z.number().int().positive(),
  maintenance_name: z.string().min(1),
  description: z.string().min(1),
  notes: z.string().optional()
});

const closeMaintenanceSchema = z.object({
  cost: z.number().min(0)
});

router.use(authenticate);

router.get('/', (req, res) => {
  if (!['Fleet Manager', 'Safety Officer'].includes(req.user.roleName)) {
    return res.status(403).json({ error: 'Forbidden: Unauthorized role' });
  }
  try {
    const logs = db.prepare(`
      SELECT m.*, v.registration_number, v.name_model
      FROM maintenance_logs m
      JOIN vehicles v ON m.vehicle_id = v.id
      ORDER BY m.created_at DESC
    `).all();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch maintenance logs' });
  }
});

router.post('/', requireRole(['Fleet Manager', 'Safety Officer']), (req, res) => {
  if (!['Fleet Manager', 'Safety Officer'].includes(req.user.roleName)) return res.status(403).json({ error: 'Forbidden: Unauthorized role' });
  try {
    const data = maintenanceSchema.parse(req.body);
    
    const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(data.vehicle_id);
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
    if (vehicle.status === 'On Trip') return res.status(400).json({ error: 'Cannot perform maintenance on vehicle currently on trip' });

    const createTransaction = db.transaction(() => {
      const stmt = db.prepare(`
        INSERT INTO maintenance_logs (vehicle_id, maintenance_name, description, notes)
        VALUES (?, ?, ?, ?)
      `);
      const info = stmt.run(data.vehicle_id, data.maintenance_name, data.description, data.notes || null);
      
      db.prepare("UPDATE vehicles SET status = 'In Shop' WHERE id = ?").run(data.vehicle_id);
      
      return info.lastInsertRowid;
    });

    const logId = createTransaction();
    const newLog = db.prepare('SELECT * FROM maintenance_logs WHERE id = ?').get(logId);
    res.status(201).json(newLog);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    res.status(500).json({ error: 'Failed to create maintenance log' });
  }
});

router.put('/:id/close', requireRole(['Fleet Manager', 'Safety Officer']), (req, res) => {
  if (!['Fleet Manager', 'Safety Officer'].includes(req.user.roleName)) return res.status(403).json({ error: 'Forbidden: Unauthorized role' });
  const { id } = req.params;
  
  try {
    const data = closeMaintenanceSchema.parse(req.body);
    const log = db.prepare('SELECT * FROM maintenance_logs WHERE id = ?').get(id);
    
    if (!log) return res.status(404).json({ error: 'Maintenance log not found' });
    if (log.status !== 'Open') return res.status(400).json({ error: 'Maintenance log is already closed' });

    const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(log.vehicle_id);

    const closeTransaction = db.transaction(() => {
      db.prepare(`
        UPDATE maintenance_logs SET 
          status = 'Closed', 
          cost = ?,
          updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `).run(data.cost, id);
      
      // If vehicle was In Shop, restore to Available (unless it's somehow Retired)
      if (vehicle && vehicle.status === 'In Shop') {
        db.prepare("UPDATE vehicles SET status = 'Available' WHERE id = ?").run(log.vehicle_id);
      }
    });

    closeTransaction();
    const updatedLog = db.prepare('SELECT * FROM maintenance_logs WHERE id = ?').get(id);
    res.json(updatedLog);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    res.status(500).json({ error: 'Failed to close maintenance log' });
  }
});

export default router;
