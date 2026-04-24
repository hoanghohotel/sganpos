import express from 'express';
import Product from '../models/Product';
import { getTenantId } from '../lib/tenant';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// GET /api/products - List all products for the current tenant
router.get('/', async (req, res) => {
  try {
    const tenantId = getTenantId();
    const products = await Product.find({ tenantId }).sort({ name: 1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// POST /api/products - Create a new product (Auth required)
router.post('/', authenticate, async (req, res) => {
  try {
    const tenantId = getTenantId();
    const productData = { 
      ...req.body, 
      tenantId // Force the tenantId from context
    };
    
    const product = new Product(productData);
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create product', details: error });
  }
});

export default router;
