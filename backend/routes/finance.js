import express from 'express';
import db from '../db.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { z } from 'zod';

const router = express.Router();

router.use(authenticate);

const fuelSchema = z.object({
  vehicle_id: z.number().int().positive(),
  trip_id: z.number().int().positive().optional(),
  liters: z.number().positive().max(5000),
  cost: z.number().positive().max(100000),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD')
});

const expenseSchema = z.object({
  vehicle_id: z.number().int().positive().optional(),
  type: z.string().min(1).max(100),
  quantity: z.number().max(10000).optional(),
  amount: z.number().positive().max(1000000),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD')
});

// Fuel Logs
router.get('/fuel', requireRole(['Fleet Manager', 'Financial Analyst']), (req, res) => {
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

router.post('/fuel', requireRole(['Fleet Manager', 'Financial Analyst']), (req, res) => {
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

router.post('/expenses', requireRole(['Fleet Manager', 'Financial Analyst']), (req, res) => {
  try {
    const data = expenseSchema.parse(req.body);
    const stmt = db.prepare(`
      INSERT INTO expenses (vehicle_id, type, quantity, amount, date, status)
      VALUES (?, ?, ?, ?, ?, 'Pending')
    `);
    const info = stmt.run(
      data.vehicle_id || null, data.type, data.quantity || null, 
      data.amount, data.date
    );
    const newExpense = db.prepare('SELECT * FROM expenses WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(newExpense);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

// Finance Approval Workflow
router.put('/expenses/:id/approve', requireRole(['Fleet Manager']), (req, res) => {
  try {
    const { id } = req.params;
    const expense = db.prepare('SELECT * FROM expenses WHERE id = ?').get(id);
    if (!expense) return res.status(404).json({ error: 'Expense not found' });
    if (expense.status !== 'Pending') return res.status(400).json({ error: 'Expense is not pending' });

    db.prepare("UPDATE expenses SET status = 'Approved' WHERE id = ?").run(id);
    res.json({ success: true, status: 'Approved' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to approve expense' });
  }
});

router.put('/expenses/:id/reject', requireRole(['Fleet Manager']), (req, res) => {
  try {
    const { id } = req.params;
    const expense = db.prepare('SELECT * FROM expenses WHERE id = ?').get(id);
    if (!expense) return res.status(404).json({ error: 'Expense not found' });
    if (expense.status !== 'Pending') return res.status(400).json({ error: 'Expense is not pending' });

    db.prepare("UPDATE expenses SET status = 'Rejected' WHERE id = ?").run(id);
    res.json({ success: true, status: 'Rejected' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reject expense' });
  }
});

export default router;
