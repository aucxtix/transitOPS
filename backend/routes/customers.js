import express from 'express';
import db from '../db.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { z } from 'zod';

const router = express.Router();

router.use(authenticate);

const requestSchema = z.object({
  source: z.string().min(1),
  destination: z.string().min(1),
  cargo_weight: z.number().positive(),
  notes: z.string().optional()
});

// Get all trip requests (Customers see their own, Fleet Managers/Dispatchers see all)
router.get('/trip-requests', (req, res) => {
  try {
    if (req.user.roleName === 'Customer') {
      const requests = db.prepare('SELECT * FROM trip_requests WHERE customer_id = ? ORDER BY created_at DESC').all(req.user.id);
      return res.json(requests);
    } else if (['Fleet Manager', 'Dispatcher'].includes(req.user.roleName)) {
      const requests = db.prepare(`
        SELECT tr.*, u.name as customer_name, u.email as customer_email 
        FROM trip_requests tr 
        JOIN users u ON tr.customer_id = u.id 
        ORDER BY tr.created_at DESC
      `).all();
      return res.json(requests);
    } else {
      return res.status(403).json({ error: 'Forbidden' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch trip requests' });
  }
});

// Customer creates a new trip request
router.post('/trip-requests', requireRole(['Customer']), (req, res) => {
  try {
    const data = requestSchema.parse(req.body);
    const stmt = db.prepare(`
      INSERT INTO trip_requests (customer_id, source, destination, cargo_weight, notes)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const info = stmt.run(req.user.id, data.source, data.destination, data.cargo_weight, data.notes || null);
    const newRequest = db.prepare('SELECT * FROM trip_requests WHERE id = ?').get(info.lastInsertRowid);
    
    res.status(201).json(newRequest);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    res.status(500).json({ error: 'Failed to create trip request' });
  }
});

// Dispatcher sends a budget quote
router.post('/trip-requests/:id/quote', requireRole(['Fleet Manager', 'Dispatcher']), (req, res) => {
  try {
    const { id } = req.params;
    const { budget } = req.body;
    
    if (!budget) return res.status(400).json({ error: 'Budget is required to send a quote.' });

    const request = db.prepare('SELECT * FROM trip_requests WHERE id = ?').get(id);
    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (request.status !== 'Pending') return res.status(400).json({ error: 'Only pending requests can be quoted.' });

    db.prepare(`UPDATE trip_requests SET status = 'Quoted', budget = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(budget, id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send quote' });
  }
});

// Customer accepts the quote
router.post('/trip-requests/:id/accept', requireRole(['Customer']), (req, res) => {
  try {
    const { id } = req.params;
    
    const request = db.prepare('SELECT * FROM trip_requests WHERE id = ? AND customer_id = ?').get(id, req.user.id);
    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (request.status !== 'Quoted') return res.status(400).json({ error: 'Only quoted requests can be accepted.' });

    db.prepare(`UPDATE trip_requests SET status = 'Customer Approved', updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to accept quote' });
  }
});

// Dispatcher approves request and creates trip (final dispatch)
router.post('/trip-requests/:id/approve', requireRole(['Fleet Manager', 'Dispatcher']), (req, res) => {
  try {
    const { id } = req.params;
    const { vehicle_id, driver_id, planned_distance } = req.body;
    
    if (!vehicle_id || !driver_id || !planned_distance) {
      return res.status(400).json({ error: 'Vehicle, driver, and planned distance are required to approve.' });
    }

    const request = db.prepare('SELECT * FROM trip_requests WHERE id = ?').get(id);
    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (request.status !== 'Customer Approved' && request.status !== 'Pending') return res.status(400).json({ error: 'Request must be Customer Approved or Pending.' });

    // Begin transaction to ensure both operations succeed
    const createTripTransaction = db.transaction(() => {
      // 1. Create the trip
      const stmt = db.prepare(`
        INSERT INTO trips (source, destination, vehicle_id, driver_id, cargo_weight, planned_distance, status, created_by)
        VALUES (?, ?, ?, ?, ?, ?, 'Pending', ?)
      `);
      stmt.run(request.source, request.destination, vehicle_id, driver_id, request.cargo_weight, planned_distance, req.user.id);

      // 2. Update request status
      db.prepare(`UPDATE trip_requests SET status = 'Approved', updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(id);
      
      // 3. Mark vehicle and driver as On Trip
      db.prepare(`UPDATE vehicles SET status = 'On Trip' WHERE id = ?`).run(vehicle_id);
      db.prepare(`UPDATE drivers SET status = 'On Trip' WHERE id = ?`).run(driver_id);
    });

    createTripTransaction();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to approve request' });
  }
});

// Customer or Dispatcher rejects request
router.post('/trip-requests/:id/reject', (req, res) => {
  try {
    const { id } = req.params;
    
    const request = db.prepare('SELECT * FROM trip_requests WHERE id = ?').get(id);
    if (!request) return res.status(404).json({ error: 'Request not found' });
    
    // Authorization check
    if (req.user.roleName === 'Customer' && request.customer_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    if (['Rejected', 'Approved'].includes(request.status)) {
      return res.status(400).json({ error: 'Request is already processed.' });
    }

    db.prepare(`UPDATE trip_requests SET status = 'Rejected', updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reject request' });
  }
});

export default router;
