import { getDb } from '../../db/database.js';

export const orderRepository = {
  create({
    orderNumber,
    customerName,
    customerPhone,
    customerNeighborhood,
    productId,
    productTitle,
    quantity,
    totalAmount,
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
        payment_method,
        transaction_reference,
        payment_status,
        fulfillment_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', 'AWAITING_PROCUREMENT')
    `);

    stmt.run(
      orderNumber,
      customerName,
      customerPhone,
      customerNeighborhood,
      productId,
      productTitle,
      quantity,
      totalAmount,
      paymentMethod,
      transactionReference
    );

    return this.findByOrderNumber(orderNumber);
  },

  findByOrderNumber(orderNumber) {
    const db = getDb();
    const row = db.prepare(`SELECT * FROM orders WHERE order_number = ?`).get(orderNumber);
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
      paymentStatus: row.payment_status,
      fulfillmentStatus: row.fulfillment_status,
      paymentMethod: row.payment_method,
      transactionReference: row.transaction_reference,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  },

  findAll() {
    const db = getDb();
    const rows = db.prepare(`SELECT * FROM orders ORDER BY id DESC`).all();
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
      paymentStatus: row.payment_status,
      fulfillmentStatus: row.fulfillment_status,
      paymentMethod: row.payment_method,
      transactionReference: row.transaction_reference,
      createdAt: row.created_at
    }));
  }
};
