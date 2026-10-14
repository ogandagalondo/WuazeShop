import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET || 'wuazeshop-dev-secret-key-change-in-production',
  dbPath: process.env.DB_PATH || 'wuazeshop.db',
  adminUsername: process.env.ADMIN_USERNAME || 'admin',
  adminPassword: process.env.ADMIN_PASSWORD || 'adminpassword123',
};
