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

// 1. Durcissement des en-têtes HTTP de sécurité
app.disable('x-powered-by');

app.use((req, res, next) => {
  // Empêcher l'interprétation MIME malveillante
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Protection contre le Clickjacking (iframe injection)
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  // Protection contre les fuites d'URL de référence
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Désactiver l'ancien filtre XSS à bugs de canal auxiliaire
  res.setHeader('X-XSS-Protection', '0');
  // Contrôle des fonctionnalités du navigateur
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

// 2. Configuration CORS restrictive ou permissive selon l'environnement
const corsOptions = config.allowedOrigins ? {
  origin: (origin, callback) => {
    if (!origin || config.allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Origine non autorisée par la politique CORS'));
    }
  },
  credentials: true
} : {};
app.use(cors(corsOptions));

// 3. Décodage des payloads JSON et formulaires
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// 4. Rate Limiter mémoire ultra-léger (Anti-Bruteforce & DoS)
function createRateLimiter({ windowMs, max, message }) {
  const ipMap = new Map();
  setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of ipMap.entries()) {
      if (now > data.resetTime) ipMap.delete(ip);
    }
  }, Math.max(windowMs, 60000)).unref();

  return (req, res, next) => {
    // Ne pas bloquer la suite de tests automatisés rapides
    if (process.env.NODE_ENV === 'test') {
      return next();
    }

    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    let record = ipMap.get(ip);

    if (!record || now > record.resetTime) {
      record = { count: 1, resetTime: now + windowMs };
      ipMap.set(ip, record);
    } else {
      record.count++;
    }

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - record.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

    if (record.count > max) {
      return res.status(429).json({
        success: false,
        error: {
          code: 'TOO_MANY_REQUESTS',
          message: message || 'Trop de requêtes. Veuillez patienter avant de réessayer.'
        }
      });
    }

    next();
  };
}

// Limitation stricte sur l'authentification admin : 15 tentatives max par 10 minutes
const authRateLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 15,
  message: 'Trop de tentatives de connexion. Par mesure de sécurité, veuillez patienter 10 minutes.'
});

// Limitation sur la création de commandes : 40 commandes max par 15 minutes par IP
const checkoutRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 40,
  message: 'Limite de commandes atteinte pour cette adresse IP. Veuillez patienter 15 minutes.'
});

// Healthcheck endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'WuazeShop' });
});

// Application des limiteurs sur les routes sensibles
app.use('/api/admin/login', authRateLimiter);
app.use('/api/orders/checkout', checkoutRateLimiter);

// Products, Categories, Payment, Orders & Admin APIs
app.use('/api', productRouter);
app.use('/api', paymentRouter);
app.use('/api', orderRouter);
app.use('/api', adminRouter);


// Explicit root route for storefront
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Subdomain support: admin.wuazeshop.com (or admin.localhost) serves admin portal directly at root
app.use((req, res, next) => {
  const host = (req.hostname || req.headers.host || '').toLowerCase();
  if (host.startsWith('admin.') && (req.path === '/' || req.path === '')) {
    return res.sendFile(path.join(__dirname, 'public/admin.html'));
  }
  next();
});

// Shopify-style Admin portal route: /admin directly serves admin.html
app.get(['/admin', '/admin/'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public/admin.html'));
});

// Dedicated product detail page route: /product/:slug or /product
app.get(['/product', '/product/:slug'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public/product.html'));
});

// All categories grid page: /categories or /rayons
app.get(['/categories', '/categories/', '/rayons', '/rayons/'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public/categories.html'));
});

// Dedicated single category catalog page route: /category/:slug or /category
app.get(['/category', '/category/:slug', '/categories/:slug'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public/category.html'));
});

// Dedicated parcel tracking page route: /tracking or /suivi
app.get(['/tracking', '/tracking/', '/suivi', '/suivi/'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public/tracking.html'));
});

// Dedicated About Us page route: /about or /a-propos
app.get(['/about', '/about/', '/a-propos', '/a-propos/'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public/about.html'));
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

// Gestionnaire d'erreur centralisé (Empêche les fuites d'informations et tracebacks internes)
app.use((err, req, res, next) => {
  console.error('[WuazeShop] Erreur applicative capturée :', err.message);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    success: false,
    data: null,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: process.env.NODE_ENV === 'production'
        ? 'Une erreur inattendue est survenue. Veuillez contacter notre assistance.'
        : err.message
    }
  });
});

// Only start listening if run directly
if (process.env.NODE_ENV !== 'test' && process.argv[1] === __filename) {
  app.listen(config.port, () => {
    console.log(`[WuazeShop] Server running on http://localhost:${config.port}`);
  });
}

export default app;

