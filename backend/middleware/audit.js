import db from '../db.js';

export const auditLogger = (req, res, next) => {
  const isMutation = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method);
  const isAuth = req.path.includes('/auth/login') || req.path.includes('/auth/signup') || req.path.includes('/auth/logout');

  if (isMutation || isAuth) {
    res.on('finish', () => {
      // Log successful actions
      if (res.statusCode >= 200 && res.statusCode < 400) {
        try {
          let userId = req.user?.id || null;
          
          let action = req.method;
          if (req.path.includes('/login')) action = 'LOGIN';
          else if (req.path.includes('/signup')) action = 'SIGNUP';
          else if (req.path.includes('/logout')) action = 'LOGOUT';
          
          const entity = req.originalUrl.split('?')[0]; 
          
          const safeBody = { ...req.body };
          if (safeBody.password) safeBody.password = '***';

          db.prepare(`
            INSERT INTO audit_logs (user_id, action, entity, details)
            VALUES (?, ?, ?, ?)
          `).run(userId, action, entity, JSON.stringify(safeBody));
        } catch (err) {
          console.error('Audit Log Error:', err);
        }
      }
    });
  }
  next();
};
