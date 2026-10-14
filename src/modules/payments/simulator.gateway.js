import { PaymentGateway } from './payment.interface.js';

// In-memory transaction registry for simulation
const transactions = new Map();

export class SimulatorGateway extends PaymentGateway {
  async initiatePayment({ orderId, amount, phone, provider }) {
    const transactionReference = `SIM-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const tx = {
      orderId,
      amount,
      phone,
      provider: provider || 'AIRTEL_MONEY',
      transactionReference,
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };
    transactions.set(transactionReference, tx);
    return {
      status: 'PENDING',
      transactionReference,
      amount,
      provider: tx.provider,
      orderId
    };
  }

  async confirmPayment(transactionReference) {
    const tx = transactions.get(transactionReference);
    if (!tx) {
      // Auto-create for direct simulation tests if needed
      const newTx = {
        transactionReference,
        status: 'CONFIRMED_CLEARED',
        confirmedAt: new Date().toISOString()
      };
      transactions.set(transactionReference, newTx);
      return newTx;
    }
    tx.status = 'CONFIRMED_CLEARED';
    tx.confirmedAt = new Date().toISOString();
    return tx;
  }

  async failPayment(transactionReference, reason = 'Échec de paiement simulé') {
    const tx = transactions.get(transactionReference);
    if (!tx) {
      return { status: 'FAILED', reason, transactionReference };
    }
    tx.status = 'FAILED';
    tx.reason = reason;
    return tx;
  }

  async verifyPayment(transactionReference) {
    const tx = transactions.get(transactionReference);
    if (!tx) {
      throw new Error(`Transaction ${transactionReference} non trouvée`);
    }
    return tx;
  }

  async handleWebhook(payload) {
    const { transactionReference, status } = payload;
    if (status === 'CONFIRMED' || status === 'CONFIRMED_CLEARED') {
      return this.confirmPayment(transactionReference);
    }
    return this.failPayment(transactionReference, payload.reason);
  }
}
