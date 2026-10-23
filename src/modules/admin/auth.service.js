import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { getDb } from '../../db/database.js';

// Stockage des tokens en mémoire et support stateless HMAC
const activeSessions = new Map();
const AUTH_SECRET = process.env.JWT_SECRET || 'wuazeshop-admin-hmac-secret-gabon-2026';

export const authService = {
  login(identifier, password) {
    const db = getDb();
    const user = db.prepare(`SELECT * FROM admin_users WHERE email = ? OR username = ?`).get(identifier, identifier);
    if (!user) {
      throw new Error('Identifiants incorrects');
    }

    if (user.is_active === 0) {
      throw new Error('Ce compte collaborateur a été désactivé. Veuillez contacter un administrateur.');
    }

    const isValid = bcrypt.compareSync(password, user.password_hash);
    if (!isValid) {
      throw new Error('Identifiants incorrects');
    }

    try {
      db.prepare(`UPDATE admin_users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?`).run(user.id);
    } catch {}

    const sessionPayload = {
      userId: user.id,
      username: user.username,
      email: user.email,
      fullName: user.full_name || user.username,
      role: user.role || 'SUPER_ADMIN',
      createdAt: Date.now()
    };

    const encoded = Buffer.from(JSON.stringify(sessionPayload)).toString('base64url');
    const signature = crypto.createHmac('sha256', AUTH_SECRET).update(encoded).digest('base64url');
    const token = `${encoded}.${signature}`;

    activeSessions.set(token, sessionPayload);

    return { 
      token, 
      username: user.username, 
      email: user.email,
      fullName: user.full_name || user.username,
      role: user.role || 'SUPER_ADMIN'
    };
  },

  verifyToken(token) {
    if (!token) return null;

    // 1. Vérification en mémoire si disponible
    const session = activeSessions.get(token);
    if (session) {
      if (Date.now() - session.createdAt > 24 * 60 * 60 * 1000) {
        activeSessions.delete(token);
        return null;
      }
      return session;
    }

    // 2. Vérification stateless (HMAC) pour environnement serverless / multi-instance
    if (token.includes('.')) {
      try {
        const [encoded, signature] = token.split('.');
        const expectedSig = crypto.createHmac('sha256', AUTH_SECRET).update(encoded).digest('base64url');
        if (signature !== expectedSig) return null;

        const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
        if (Date.now() - payload.createdAt > 24 * 60 * 60 * 1000) {
          return null;
        }
        return payload;
      } catch (e) {
        return null;
      }
    }

    return null;
  }
};


export function requireAdminAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Accès non autorisé : Token manquant' });
  }

  const token = authHeader.slice(7);
  const session = authService.verifyToken(token);
  if (!session) {
    return res.status(401).json({ error: 'Session invalide ou expirée' });
  }

  req.admin = session;
  next();
}
