import { Router } from 'express';
import { orderService } from './order.service.js';

export const orderRouter = Router();

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

// GET /api/orders/:orderNumber
orderRouter.get('/orders/:orderNumber', (req, res) => {
  try {
    const order = orderService.getOrderByNumber(req.params.orderNumber);
    res.json(order);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});
