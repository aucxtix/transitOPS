import jwt from 'jsonwebtoken';
import { config } from '../config.js'; // Security Fix: Load from centralized config

export const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  try {
    // Security Fix: Using validated configuration secret
    const decoded = jwt.verify(token, config.JWT_SECRET);
    req.user = decoded;
    next(); 
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.roleName)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }
    next();
  };
};
