import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config/env.js';
import { productRouter } from './modules/products/product.controller.js';
import { paymentRouter } from './modules/payments/payment.controller.js';
import { orderRouter } from './modules/orders/order.controller.js';
import { adminRouter } from './modules/admin/admin.controller.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();

app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Healthcheck endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'WuazeShop' });
});

// Products, Categories, Payment, Orders & Admin APIs
app.use('/api', productRouter);
app.use('/api', paymentRouter);
app.use('/api', orderRouter);
app.use('/api', adminRouter);

// Explicit root route for storefront
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Shopify-style Admin portal route: /admin directly serves admin.html
app.get(['/admin', '/admin/'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public/admin.html'));
});

// Uploaded images (supports local & serverless /tmp)
const uploadsPath = process.env.VERCEL
  ? path.resolve('/tmp', 'uploads')
  : path.join(__dirname, 'public/uploads');

if (fs.existsSync(uploadsPath)) {
  app.use('/uploads', express.static(uploadsPath));
}

// Static assets (front-end public folder)
app.use(express.static(path.join(__dirname, 'public')));

// Only start listening if run directly
if (process.env.NODE_ENV !== 'test' && process.argv[1] === __filename) {
  app.listen(config.port, () => {
    console.log(`[WuazeShop] Server running on http://localhost:${config.port}`);
  });
}

export default app;

