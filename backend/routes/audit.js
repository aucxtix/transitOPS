import express from 'express';
import db from '../db.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Only Fleet Manager can view audit logs
router.get('/', authenticate, requireRole(['Fleet Manager']), (req, res) => {
  try {
    const logs = db.prepare(`
      SELECT a.*, u.name as user_name, u.email as user_email
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC
      LIMIT 200
    `).all();
    res.json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

export default router;
