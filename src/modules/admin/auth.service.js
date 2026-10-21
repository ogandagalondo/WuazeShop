import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { getDb } from '../../db/database.js';

// Stockage sécurisé des tokens en mémoire
const activeSessions = new Map();

export const authService = {
  login(identifier, password) {
    const db = getDb();
    const user = db.prepare(`SELECT * FROM admin_users WHERE email = ? OR username = ?`).get(identifier, identifier);
    if (!user) {
      throw new Error('Identifiants incorrects');
    }

    const isValid = bcrypt.compareSync(password, user.password_hash);
    if (!isValid) {
      throw new Error('Identifiants incorrects');
    }

    const token = crypto.randomBytes(32).toString('hex');
    activeSessions.set(token, {
      userId: user.id,
      username: user.username,
      email: user.email,
      createdAt: Date.now()
    });

    return { token, username: user.username, email: user.email };
  },

  verifyToken(token) {
    if (!token) return null;
    const session = activeSessions.get(token);
    if (!session) return null;
    // Expiration de session après 24 heures
    if (Date.now() - session.createdAt > 24 * 60 * 60 * 1000) {
      activeSessions.delete(token);
      return null;
    }
    return session;
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
