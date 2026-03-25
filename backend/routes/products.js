const express = require('express');
const Product = require('../models/Product');
const { requireAuth, requireAnyPermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../lib/permissions');

const router = express.Router();

router.use(requireAuth);

router.get('/', async (_req, res) => {
  const products = await Product.find().sort({ createdAt: -1 });
  res.json(products);
});

router.post(
  '/',
  requireAnyPermission(PERMISSIONS.ADD_PRODUCTS_NO_PRICING, PERMISSIONS.MANAGE_PRODUCT_PRICING),
  async (req, res) => {
  try {
    const canManageProductPricing = (req.auth.permissions || []).includes(PERMISSIONS.MANAGE_PRODUCT_PRICING);
    const payload = { ...req.body };

    if (!canManageProductPricing) {
      payload.purchasePrice = 0;
      payload.salePrice = 0;
    }

    const product = await Product.create(payload);
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.patch(
  '/:id',
  requireAnyPermission(PERMISSIONS.ADD_PRODUCTS_NO_PRICING, PERMISSIONS.MANAGE_PRODUCT_PRICING),
  async (req, res) => {
  try {
    const canManageProductPricing = (req.auth.permissions || []).includes(PERMISSIONS.MANAGE_PRODUCT_PRICING);
    const updates = {
      purchasePrice: req.body.purchasePrice,
      salePrice: req.body.salePrice,
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

    if (!canManageProductPricing) {
      delete updates.purchasePrice;
      delete updates.salePrice;
    }

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

router.post('/:id/sell', requireAnyPermission(PERMISSIONS.SELL_PRODUCTS), async (req, res) => {
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

router.delete('/:id', requireAnyPermission(PERMISSIONS.ADD_PRODUCTS_NO_PRICING, PERMISSIONS.MANAGE_PRODUCT_PRICING), async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);

  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  return res.status(204).send();
});

module.exports = router;
