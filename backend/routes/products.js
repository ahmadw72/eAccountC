const express = require('express');
const Product = require('../models/Product');
const { requireAuth, requireRoles } = require('../middleware/auth');
const { SELLER_ROLE } = require('../lib/roles');

const router = express.Router();

router.use(requireAuth);

router.get('/', async (_req, res) => {
  const products = await Product.find().sort({ createdAt: -1 });
  res.json(products);
});

router.post('/', requireRoles('super', 'supervisor'), async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.patch('/:id', requireRoles('super', 'supervisor'), async (req, res) => {
  try {
    const updates = {
      price: req.body.price,
      quantity: req.body.quantity,
      reorderLevel: req.body.reorderLevel,
      category: req.body.category,
      supplier: req.body.supplier,
      manufacturer: req.body.manufacturer,
      name: req.body.name,
      sku: req.body.sku,
    };

    Object.keys(updates).forEach((key) => {
      if (updates[key] === undefined) {
        delete updates[key];
      }
    });

    const product = await Product.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    return res.json(product);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.post('/:id/sell', requireRoles(SELLER_ROLE), async (req, res) => {
  const quantity = Number(req.body.quantity || 1);

  if (!Number.isFinite(quantity) || quantity <= 0) {
    return res.status(400).json({ message: 'Sale quantity must be greater than zero' });
  }

  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  if (product.quantity < quantity) {
    return res.status(400).json({ message: 'Not enough stock to complete sale' });
  }

  product.quantity -= quantity;
  await product.save();

  return res.json(product);
});

router.delete('/:id', requireRoles('super', 'supervisor'), async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);

  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  return res.status(204).send();
});

module.exports = router;
