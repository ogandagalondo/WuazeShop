import { describe, it, expect } from 'vitest';
import { calculateShippingFee, calculateVolumetricWeight } from '../../src/modules/orders/shipping.service.js';

describe('Shipping Service', () => {
  it('calculates Normal cargo fee at 10,000 FCFA/kg', () => {
    const fee = calculateShippingFee(0.4, 'normal', { normalRate: 10000, expressRate: 13500 });
    expect(fee).toBe(4000);
  });

  it('calculates Express cargo fee at 13,500 FCFA/kg', () => {
    const fee = calculateShippingFee(2.0, 'express', { normalRate: 10000, expressRate: 13500 });
    expect(fee).toBe(27000);
  });

  it('enforces minimum weight floor of 0.1 kg', () => {
    const fee = calculateShippingFee(0.02, 'normal', { normalRate: 10000, expressRate: 13500, minWeight: 0.1 });
    expect(fee).toBe(1000);
  });

  it('calculates volumetric weight correctly (L*W*H / 5000)', () => {
    const volWeight = calculateVolumetricWeight(30, 20, 10); // 6000 / 5000 = 1.2 kg
    expect(volWeight).toBe(1.2);
  });
});
