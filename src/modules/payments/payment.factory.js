import { SimulatorGateway } from './simulator.gateway.js';

let activeGateway = null;

export function getPaymentGateway() {
  if (!activeGateway) {
    const provider = process.env.PAYMENT_GATEWAY || 'SIMULATOR';
    switch (provider.toUpperCase()) {
      case 'SIMULATOR':
      default:
        activeGateway = new SimulatorGateway();
        break;
    }
  }
  return activeGateway;
}
