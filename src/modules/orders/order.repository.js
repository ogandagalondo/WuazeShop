import { getDb } from '../../db/database.js';

export const orderRepository = {
  async create({
    orderNumber,
    customerName,
    customerPhone,
    customerNeighborhood,
    productId,
    productTitle,
    quantity,
    totalAmount,
    shippingMethod = 'normal',
    shippingFee = 0,
    totalWeight = 0.0,
    paymentMethod,
    transactionReference
  }) {
    const db = getDb();
    const stmt = db.prepare(`
      INSERT INTO orders (
        order_number,
        customer_name,
        customer_phone,
        customer_neighborhood,
        product_id,
        product_title,
        quantity,
        total_amount,
        shipping_method,
        shipping_fee,
        total_weight,
        payment_method,
        transaction_reference,
        payment_status,
        fulfillment_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', 'AWAITING_PROCUREMENT')
    `);

    await stmt.run(
      orderNumber,
      customerName,
      customerPhone,
      customerNeighborhood,
      productId,
      productTitle,
      quantity,
      totalAmount,
      shippingMethod,
      shippingFee,
      totalWeight,
      paymentMethod,
      transactionReference
    );

    return await this.findByOrderNumber(orderNumber);
  },

  async findByOrderNumber(orderNumber) {
    const db = getDb();
    const row = await db.prepare(`SELECT * FROM orders WHERE order_number = ?`).get(orderNumber);
    if (!row) return null;
    return {
      id: row.id,
      orderNumber: row.order_number,
      customerName: row.customer_name,
      customerPhone: row.customer_phone,
      customerNeighborhood: row.customer_neighborhood,
      productId: row.product_id,
      productTitle: row.product_title,
      quantity: row.quantity,
      totalAmount: row.total_amount,
      shippingMethod: row.shipping_method || 'normal',
      shippingFee: row.shipping_fee || 0,
      totalWeight: row.total_weight || 0.0,
      paymentStatus: row.payment_status,
      fulfillmentStatus: row.fulfillment_status,
      paymentMethod: row.payment_method,
      transactionReference: row.transaction_reference,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  },

  async findAll() {
    const db = getDb();
    const rows = await db.prepare(`SELECT * FROM orders ORDER BY id DESC`).all();
    return rows.map(row => ({
      id: row.id,
      orderNumber: row.order_number,
      customerName: row.customer_name,
      customerPhone: row.customer_phone,
      customerNeighborhood: row.customer_neighborhood,
      productId: row.product_id,
      productTitle: row.product_title,
      quantity: row.quantity,
      totalAmount: row.total_amount,
      shippingMethod: row.shipping_method || 'normal',
      shippingFee: row.shipping_fee || 0,
      totalWeight: row.total_weight || 0.0,
      paymentStatus: row.payment_status,
      fulfillmentStatus: row.fulfillment_status,
      paymentMethod: row.payment_method,
      transactionReference: row.transaction_reference,
      createdAt: row.created_at
    }));
  }
};
