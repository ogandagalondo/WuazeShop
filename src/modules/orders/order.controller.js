import { Router } from 'express';
import { orderService } from './order.service.js';
import { authService } from '../admin/auth.service.js';

export const orderRouter = Router();

// Fonction utilitaire de masquage PII du numéro de téléphone
function maskPhone(phone) {
  if (!phone) return 'N/A';
  const clean = String(phone).trim();
  if (clean.length <= 4) return '••••';
  const last2 = clean.slice(-2);
  const prefix = clean.startsWith('+') ? clean.slice(0, 4) : clean.slice(0, 2);
  return `${prefix} •• •• •• ${last2}`;
}

// POST /api/orders/checkout
orderRouter.post('/orders/checkout', async (req, res) => {
  try {
    const order = await orderService.checkout(req.body);
    res.status(201).json(order);
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: error.errors[0]?.message || 'Validation échouée' });
    }
    res.status(400).json({ error: error.message });
  }
});

// GET /api/orders/:orderNumber - Suivi de commande avec anonymisation PII
orderRouter.get('/orders/:orderNumber', (req, res) => {
  try {
    const order = orderService.getOrderByNumber(req.params.orderNumber);
    
    // Détecter si la requête provient d'un collaborateur authentifié
    const authHeader = req.headers['authorization'];
    const isAdmin = authHeader && authHeader.startsWith('Bearer ') && authService.verifyToken(authHeader.slice(7));

    // Si public, masquer le numéro de téléphone pour protéger la vie privée du client
    const sanitizedOrder = {
      ...order,
      customerPhone: isAdmin ? order.customerPhone : maskPhone(order.customerPhone)
    };

    res.json(sanitizedOrder);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

