import express from 'express';
import bcrypt from 'bcryptjs';
import db from '../db.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';

const router = express.Router();

const userCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { error: 'Too many users created from this IP, please try again later' }
});

// Only Fleet Managers can manage users
router.use(authenticate, requireRole(['Fleet Manager']));

const userSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().max(255),
  password: z.string().min(12, 'Password must be at least 12 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[a-z]/, 'Must contain a lowercase letter')
    .regex(/[0-9]/, 'Must contain a number')
    .regex(/[^A-Za-z0-9]/, 'Must contain a special character'),
  roleName: z.enum(['Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst', 'Customer', 'Driver'])
});

// Get all users
router.get('/', (req, res) => {
  try {
    const users = db.prepare(`
      SELECT u.id, u.name, u.email, r.name as roleName, u.created_at
      FROM users u
      JOIN roles r ON u.role_id = r.id
    `).all();
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Add a user
router.post('/', userCreationLimiter, async (req, res) => {
  try {
    const { name, email, password, roleName } = userSchema.parse(req.body);

    const role = db.prepare('SELECT id FROM roles WHERE name = ?').get(roleName);
    if (!role) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const result = db.prepare(`
      INSERT INTO users (name, email, password, role_id)
      VALUES (?, ?, ?, ?)
    `).run(name, email, hashedPassword, role.id);

    // Prompt requested: "if the user is added then it should be declared by username and the password too"
    res.status(201).json({
      message: 'User added successfully',
      user: {
        id: result.lastInsertRowid,
        name,
        email,
        roleName,
        declaredPassword: password // Returning plaintext password as requested to show in UI once
      }
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to add user' });
  }
});

// Edit a user (name, email, password, role)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Partially validate (can update just name or password)
    const updateSchema = z.object({
      name: z.string().min(2).max(100).optional(),
      email: z.string().email().max(255).optional(),
      password: z.string().min(12).optional(),
      roleName: z.enum(['Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst', 'Customer', 'Driver']).optional()
    });

    const data = updateSchema.parse(req.body);

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let roleId = user.role_id;
    if (data.roleName) {
      const role = db.prepare('SELECT id FROM roles WHERE name = ?').get(data.roleName);
      if (!role) return res.status(400).json({ error: 'Invalid role' });
      roleId = role.id;
    }

    let finalPassword = user.password;
    if (data.password) {
      finalPassword = await bcrypt.hash(data.password, 12);
    }

    db.prepare(`
      UPDATE users 
      SET name = ?, email = ?, password = ?, role_id = ?
      WHERE id = ?
    `).run(
      data.name || user.name, 
      data.email || user.email, 
      finalPassword, 
      roleId, 
      id
    );

    res.json({ message: 'User updated successfully' });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete a user
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    // Prevent self-deletion
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Check if user exists
    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    db.prepare('DELETE FROM users WHERE id = ?').run(id);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;
