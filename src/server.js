import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Healthcheck endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'WuazeShop' });
});

// Static assets (front-end public folder)
app.use(express.static(path.join(__dirname, 'public')));

// Only start listening if run directly
if (process.env.NODE_ENV !== 'test' && process.argv[1] === __filename) {
  app.listen(config.port, () => {
    console.log(`[WuazeShop] Server running on http://localhost:${config.port}`);
  });
}
