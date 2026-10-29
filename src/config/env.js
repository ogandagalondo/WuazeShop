import dotenv from 'dotenv';
dotenv.config();

export const isProduction = process.env.NODE_ENV === 'production';

// Sécurité : Avertissement critique si secret par défaut en production
if (isProduction && (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'wuazeshop-dev-secret-key-change-in-production')) {
  console.error('[CRITICAL SECURITY WARNING] JWT_SECRET is not set or is using the insecure default in production! Set a cryptographically secure random key immediately.');
}

export const config = {
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET || 'wuazeshop-dev-secret-key-change-in-production',
  dbPath: process.env.DB_PATH || 'wuazeshop.db',
  adminUsername: process.env.ADMIN_USERNAME || 'admin',
  adminPassword: process.env.ADMIN_PASSWORD || 'adminpassword123',
  isProduction,
  enableSimulator: process.env.ENABLE_PAYMENT_SIMULATOR === 'true' || !isProduction,
  allowedOrigins: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim()) : null
};

