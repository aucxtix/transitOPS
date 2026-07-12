import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db.js';
import { authenticate } from '../middleware/auth.js';
import { z } from 'zod';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'transitops-super-secret';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

router.post('/login', (req, res) => {
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

    const isValid = bcrypt.compareSync(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, roleId: user.role_id, roleName: user.roleName, name: user.name },
      JWT_SECRET,
      { expiresIn: '24h' }
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
      return res.status(400).json({ error: err.errors[0].message });
    }
    res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

export default router;
