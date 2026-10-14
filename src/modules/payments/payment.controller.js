import { Router } from 'express';
import { getPaymentGateway } from './payment.factory.js';
import { getDb } from '../../db/database.js';

export const paymentRouter = Router();

// Endpoint pour déclencher la confirmation dans le simulateur
paymentRouter.post('/payments/simulator/confirm', async (req, res) => {
  try {
    const { transactionReference } = req.body;
    if (!transactionReference) {
      return res.status(400).json({ error: 'transactionReference requis' });
    }

    const gateway = getPaymentGateway();
    const result = await gateway.confirmPayment(transactionReference);

    // Mettre à jour la commande associée dans la base de données
    const db = getDb();
    const updateOrder = db.prepare(
      `UPDATE orders 
       SET payment_status = 'CONFIRMED_CLEARED', 
           fulfillment_status = 'AWAITING_PROCUREMENT', 
           updated_at = CURRENT_TIMESTAMP
       WHERE transaction_reference = ?`
    );
    updateOrder.run(transactionReference);

    res.json({
      success: true,
      status: result.status,
      transactionReference
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Webhook générique pour les agrégateurs de paiement réels / sandbox
paymentRouter.post('/payments/webhook', async (req, res) => {
  try {
    const gateway = getPaymentGateway();
    const result = await gateway.handleWebhook(req.body, req.headers);

    if (result && result.status === 'CONFIRMED_CLEARED') {
      const db = getDb();
      db.prepare(
        `UPDATE orders 
         SET payment_status = 'CONFIRMED_CLEARED', 
             fulfillment_status = 'AWAITING_PROCUREMENT', 
             updated_at = CURRENT_TIMESTAMP
         WHERE transaction_reference = ?`
      ).run(result.transactionReference);
    }

    res.json({ received: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
