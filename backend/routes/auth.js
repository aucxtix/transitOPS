import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db.js';
import { authenticate } from '../middleware/auth.js';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { config } from '../config.js'; // Security Fix: Centralized config

const router = express.Router();

// Security Fix: Strict rate limiter for login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 attempts
  skipSuccessfulRequests: true, // Only count failed attempts
  message: { error: 'Too many login attempts from this IP, please try again after 15 minutes' }
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6)
});

// Security & Performance Fix: Applied loginLimiter and made route fully async
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = signupSchema.parse(req.body);
    
    const role = db.prepare('SELECT id FROM roles WHERE name = ?').get('Customer');
    if (!role) {
      return res.status(500).json({ error: 'Customer role not found. Contact administrator.' });
    }

    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = db.prepare(`
      INSERT INTO users (name, email, password, role_id)
      VALUES (?, ?, ?, ?)
    `).run(name, email, hashedPassword, role.id);

    const token = jwt.sign(
      { id: result.lastInsertRowid, email, roleId: role.id, roleName: 'Customer', name },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN }
    );

    res.status(201).json({
      token,
      user: { id: result.lastInsertRowid, name, email, role: 'Customer' }
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    console.error(err);
    res.status(500).json({ error: 'Signup failed' });
  }
});

router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    
    const user = db.prepare(`
      SELECT u.*, r.name as roleName 
      FROM users u 
      JOIN roles r ON u.role_id = r.id 
      WHERE u.email = ?
    `).get(email);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Performance Fix: Replaced blocking bcrypt.compareSync with async bcrypt.compare
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, roleId: user.role_id, roleName: user.roleName, name: user.name },
      config.JWT_SECRET, // Strictly imported from config
      { expiresIn: config.JWT_EXPIRES_IN }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.roleName
      }
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      // Fix: Return the full array of validation errors for frontend mapping
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

export default router;
