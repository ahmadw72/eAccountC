const express = require('express');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { requireAuth, requireRoles } = require('../middleware/auth');
const { SELLER_ROLE } = require('../lib/roles');

const router = express.Router();

router.use(requireAuth, requireRoles(SELLER_ROLE));

function isValidOrderId(value) {
  return typeof value === 'string' && /^[A-Za-z0-9]{12}$/.test(value);
}

router.get('/', async (_req, res) => {
  const orders = await Order.find().sort({ createdAt: -1 });
  return res.json(orders);
});

router.post('/', async (req, res) => {
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

    const lineTotal = Number((product.price * quantity).toFixed(2));
    totalAmount = Number((totalAmount + lineTotal).toFixed(2));

    product.quantity -= quantity;
    await product.save();

    orderItems.push({
      productId: product._id,
      name: product.name,
      sku: product.sku,
      quantity,
      unitPrice: product.price,
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

module.exports = router;
