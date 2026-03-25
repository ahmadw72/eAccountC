const express = require('express');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { requireAuth, requireAnyPermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../lib/permissions');

const router = express.Router();

router.use(requireAuth);

function isValidOrderId(value) {
  return typeof value === 'string' && /^[A-Za-z0-9]{12}$/.test(value);
}

router.get('/', requireAnyPermission(PERMISSIONS.SELL_PRODUCTS), async (_req, res) => {
  const orders = await Order.find().sort({ createdAt: -1 });
  return res.json(orders);
});

router.post('/', requireAnyPermission(PERMISSIONS.SELL_PRODUCTS), async (req, res) => {
  const { orderId, items } = req.body;

  if (!isValidOrderId(orderId)) {
    return res.status(400).json({ message: 'Order ID must be a unique 12 character alphanumeric value' });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Order must include at least one item' });
  }

  const orderItems = [];
  let totalAmount = 0;

  for (const item of items) {
    const quantity = Number(item.quantity);
    if (!item.productId || !Number.isFinite(quantity) || quantity <= 0) {
      return res.status(400).json({ message: 'Each order item must include a valid productId and quantity' });
    }

    const product = await Product.findById(item.productId);
    if (!product) {
      return res.status(404).json({ message: `Product not found: ${item.productId}` });
    }

    if (product.quantity < quantity) {
      return res.status(400).json({ message: `Not enough stock for ${product.name}` });
    }

    const salePrice = Number(product.salePrice ?? product.price ?? 0);
    const lineTotal = Number((salePrice * quantity).toFixed(2));
    totalAmount = Number((totalAmount + lineTotal).toFixed(2));

    product.quantity -= quantity;
    await product.save();

    orderItems.push({
      productId: product._id,
      name: product.name,
      sku: product.sku,
      quantity,
      unitPrice: salePrice,
      lineTotal,
    });
  }

  try {
    const order = await Order.create({
      orderId,
      createdBy: req.auth.username,
      items: orderItems,
      totalAmount,
    });

    return res.status(201).json(order);
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: 'Order ID already exists. Please create a new order ID.' });
    }

    return res.status(400).json({ message: error.message });
  }
});

router.post('/:id/refund', requireAnyPermission(PERMISSIONS.REFUND_COMPLETED_SALES), async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  if (order.refundedAt) {
    return res.status(400).json({ message: 'Order has already been refunded' });
  }

  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.productId, { $inc: { quantity: item.quantity } });
  }

  order.refundedAt = new Date();
  order.refundedBy = req.auth.username;
  order.refundReason = (req.body?.reason || '').toString().trim();
  await order.save();

  return res.json(order);
});

module.exports = router;
