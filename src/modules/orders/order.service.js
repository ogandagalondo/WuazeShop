import { z } from 'zod';
import { orderRepository } from './order.repository.js';
import { productRepository } from '../products/product.repository.js';
import { getPaymentGateway } from '../payments/payment.factory.js';
import { calculateShippingFee } from './shipping.service.js';
import { getDb } from '../../db/database.js';

const checkoutSchema = z.object({
  productId: z.number().int().positive('ID produit invalide'),
  quantity: z.number().int().positive().default(1),
  customerName: z.string().trim().min(2, 'Le nom doit contenir au moins 2 caractères'),
  customerPhone: z.string().trim().min(6, 'Numéro WhatsApp invalide'),
  customerNeighborhood: z.string().trim().min(2, 'Le quartier au Gabon est obligatoire'),
  shippingMethod: z.enum(['normal', 'express']).default('normal'),
  paymentMethod: z.enum(['AIRTEL_MONEY', 'MOOV_MONEY', 'CREDIT_CARD', 'SIMULATOR']).default('AIRTEL_MONEY')
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

    // 3. Récupération des paramètres cargo configurés dans le CMS
    let cargoSettings = null;
    try {
      const db = getDb();
      const row = db.prepare(`SELECT value FROM site_settings WHERE key = 'cargo_settings'`).get();
      if (row && row.value) {
        cargoSettings = JSON.parse(row.value);
      }
    } catch {
      // Fallback sur les valeurs par défaut
    }

    // 4. Calcul du poids total et du coût de transport cargo aérien
    const unitWeight = (product.weight !== undefined && product.weight !== null && product.weight > 0)
      ? Number(product.weight)
      : 0.4;
    const totalWeight = Number((unitWeight * validated.quantity).toFixed(2));
    const shippingFee = calculateShippingFee(totalWeight, validated.shippingMethod, cargoSettings);

    // 5. Recalcul côté serveur du montant total (produits + fret cargo)
    const totalAmount = (product.price * validated.quantity) + shippingFee;

    // 6. Génération du numéro de commande unique (ex: WZ-17289...)
    const orderNumber = `WZ-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 90 + 10)}`;

    // 7. Appel de la passerelle de paiement
    const gateway = getPaymentGateway();
    const paymentResult = await gateway.initiatePayment({
      orderId: orderNumber,
      amount: totalAmount,
      phone: validated.customerPhone,
      provider: validated.paymentMethod
    });

    // 8. Enregistrement en base de données avec détail fret cargo
    const order = orderRepository.create({
      orderNumber,
      customerName: validated.customerName,
      customerPhone: validated.customerPhone,
      customerNeighborhood: validated.customerNeighborhood,
      productId: product.id,
      productTitle: product.title,
      quantity: validated.quantity,
      totalAmount,
      shippingMethod: validated.shippingMethod,
      shippingFee,
      totalWeight,
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
