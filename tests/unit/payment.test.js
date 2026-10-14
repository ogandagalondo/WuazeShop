import { describe, it, expect } from 'vitest';
import { SimulatorGateway } from '../../src/modules/payments/simulator.gateway.js';

describe('Simulator Payment Gateway', () => {
  it('initiates mobile money payment in PENDING state with valid reference', async () => {
    const gateway = new SimulatorGateway();
    const result = await gateway.initiatePayment({
      orderId: 'WZ-TEST-01',
      amount: 850000,
      phone: '+24174001122',
      provider: 'AIRTEL_MONEY'
    });
    expect(result.status).toBe('PENDING');
    expect(result.transactionReference).toBeDefined();
    expect(result.transactionReference.startsWith('SIM-')).toBe(true);
    expect(result.amount).toBe(850000);
  });

  it('verifies payment idempotence on duplicate notifications', async () => {
    const gateway = new SimulatorGateway();
    const pay = await gateway.initiatePayment({
      orderId: 'WZ-TEST-02',
      amount: 50000,
      phone: '+24166000000',
      provider: 'MOOV_MONEY'
    });
    const firstConfirm = await gateway.confirmPayment(pay.transactionReference);
    const secondConfirm = await gateway.confirmPayment(pay.transactionReference);
    expect(firstConfirm.status).toBe('CONFIRMED_CLEARED');
    expect(secondConfirm.status).toBe('CONFIRMED_CLEARED');
    expect(firstConfirm.transactionReference).toBe(pay.transactionReference);
  });

  it('handles simulated payment failure correctly', async () => {
    const gateway = new SimulatorGateway();
    const pay = await gateway.initiatePayment({
      orderId: 'WZ-TEST-03',
      amount: 340000,
      phone: '+24174001122',
      provider: 'AIRTEL_MONEY'
    });
    const failResult = await gateway.failPayment(pay.transactionReference, 'Fonds insuffisants');
    expect(failResult.status).toBe('FAILED');
    expect(failResult.reason).toBe('Fonds insuffisants');
  });
});
