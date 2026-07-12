import express from 'express';
import db from '../db.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { z } from 'zod';

const router = express.Router();

router.use(authenticate);
// Financial routes require higher roles or Fleet Manager
// Let's assume Fleet Manager, Financial Analyst for read.
// Fleet Manager for write.

const fuelSchema = z.object({
  vehicle_id: z.number().int().positive(),
  trip_id: z.number().int().positive().optional(),
  liters: z.number().positive(),
  cost: z.number().positive(),
  date: z.string().min(1)
});

const expenseSchema = z.object({
  vehicle_id: z.number().int().positive().optional(),
  type: z.string().min(1),
  quantity: z.number().optional(),
  amount: z.number().positive(),
  date: z.string().min(1),
  status: z.string().optional()
});

// Fuel Logs
router.get('/fuel', requireRole(['Fleet Manager', 'Financial Analyst']), (req, res) => {
  if (!['Fleet Manager', 'Financial Analyst'].includes(req.user.roleName)) {
    return res.status(403).json({ error: 'Forbidden: Unauthorized role' });
  }
  try {
    const logs = db.prepare(`
      SELECT f.*, v.registration_number, v.name_model 
      FROM fuel_logs f
      JOIN vehicles v ON f.vehicle_id = v.id
      ORDER BY f.date DESC
    `).all();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch fuel logs' });
  }
});

router.post('/fuel', requireRole(['Fleet Manager']), (req, res) => {
  if (req.user.roleName !== 'Fleet Manager') return res.status(403).json({ error: 'Forbidden: Unauthorized role' });
  try {
    const data = fuelSchema.parse(req.body);
    const stmt = db.prepare(`
      INSERT INTO fuel_logs (vehicle_id, trip_id, liters, cost, date)
      VALUES (?, ?, ?, ?, ?)
    `);
    const info = stmt.run(data.vehicle_id, data.trip_id || null, data.liters, data.cost, data.date);
    const newLog = db.prepare('SELECT * FROM fuel_logs WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(newLog);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    res.status(500).json({ error: 'Failed to create fuel log' });
  }
});

// Expenses
router.get('/expenses', requireRole(['Fleet Manager', 'Financial Analyst']), (req, res) => {
  if (!['Fleet Manager', 'Financial Analyst'].includes(req.user.roleName)) {
    return res.status(403).json({ error: 'Forbidden: Unauthorized role' });
  }
  try {
    const expenses = db.prepare(`
      SELECT e.*, v.registration_number, v.name_model 
      FROM expenses e
      LEFT JOIN vehicles v ON e.vehicle_id = v.id
      ORDER BY e.date DESC
    `).all();
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

router.post('/expenses', requireRole(['Fleet Manager']), (req, res) => {
  if (req.user.roleName !== 'Fleet Manager') return res.status(403).json({ error: 'Forbidden: Unauthorized role' });
  try {
    const data = expenseSchema.parse(req.body);
    const stmt = db.prepare(`
      INSERT INTO expenses (vehicle_id, type, quantity, amount, date, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      data.vehicle_id || null, data.type, data.quantity || null, 
      data.amount, data.date, data.status || 'Paid'
    );
    const newExpense = db.prepare('SELECT * FROM expenses WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(newExpense);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

export default router;
