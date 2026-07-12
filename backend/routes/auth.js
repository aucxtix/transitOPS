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

// Security & Performance Fix: Applied loginLimiter and made route fully async
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
