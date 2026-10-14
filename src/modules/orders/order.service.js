import { z } from 'zod';
import { orderRepository } from './order.repository.js';
import { productRepository } from '../products/product.repository.js';
import { getPaymentGateway } from '../payments/payment.factory.js';

const checkoutSchema = z.object({
  productId: z.number().int().positive('ID produit invalide'),
  quantity: z.number().int().positive().default(1),
  customerName: z.string().trim().min(2, 'Le nom doit contenir au moins 2 caractères'),
  customerPhone: z.string().trim().min(6, 'Numéro WhatsApp invalide'),
  customerNeighborhood: z.string().trim().min(2, 'Le quartier au Gabon est obligatoire'),
  paymentMethod: z.enum(['AIRTEL_MONEY', 'MOOV_MONEY', 'SIMULATOR']).default('AIRTEL_MONEY')
});

export const orderService = {
  async checkout(inputData) {
    // 1. Validation Zod stricte
    const validated = checkoutSchema.parse(inputData);

    // 2. Recherche du produit en base (pour garantir le prix authentique du serveur)
    const product = productRepository.findById(validated.productId);
    if (!product) {
      throw new Error('Produit non trouvé ou indisponible');
    }

    // 3. Recalcul côté serveur du montant (empêche toute falsification de prix)
    const totalAmount = product.price * validated.quantity;

    // 4. Génération du numéro de commande unique (ex: WZ-17289...)
    const orderNumber = `WZ-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 90 + 10)}`;

    // 5. Appel de la passerelle de paiement
    const gateway = getPaymentGateway();
    const paymentResult = await gateway.initiatePayment({
      orderId: orderNumber,
      amount: totalAmount,
      phone: validated.customerPhone,
      provider: validated.paymentMethod
    });

    // 6. Enregistrement en base de données
    const order = orderRepository.create({
      orderNumber,
      customerName: validated.customerName,
      customerPhone: validated.customerPhone,
      customerNeighborhood: validated.customerNeighborhood,
      productId: product.id,
      productTitle: product.title,
      quantity: validated.quantity,
      totalAmount,
      paymentMethod: validated.paymentMethod,
      transactionReference: paymentResult.transactionReference
    });

    return order;
  },

  getOrderByNumber(orderNumber) {
    const order = orderRepository.findByOrderNumber(orderNumber);
    if (!order) {
      throw new Error(`Commande ${orderNumber} non trouvée`);
    }
    return order;
  },

  getAllOrders() {
    return orderRepository.findAll();
  }
};
