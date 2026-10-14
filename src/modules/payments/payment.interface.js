/**
 * Abstract PaymentGateway Interface (Adapter Pattern)
 * Defines standard operations for payment processors (Simulator, SingPay, CinetPay, etc.)
 */
export class PaymentGateway {
  /**
   * Initiates payment request
   * @param {{ orderId: string, amount: number, phone: string, provider: string }} params
   * @returns {Promise<{ status: string, transactionReference: string, checkoutUrl?: string }>}
   */
  async initiatePayment(params) {
    throw new Error('Method initiatePayment() must be implemented');
  }

  /**
   * Verifies/Confirms a payment by transaction reference
   * @param {string} transactionReference
   * @returns {Promise<{ status: string, transactionReference: string, amount: number }>}
   */
  async verifyPayment(transactionReference) {
    throw new Error('Method verifyPayment() must be implemented');
  }

  /**
   * Parses and validates incoming webhook payload
   * @param {object} payload
   * @param {object} headers
   * @returns {Promise<{ status: string, transactionReference: string, orderId: string }>}
   */
  async handleWebhook(payload, headers) {
    throw new Error('Method handleWebhook() must be implemented');
  }
}
