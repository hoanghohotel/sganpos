import express from 'express';
import Order from '../models/Order.ts';
import { getTenantId } from '../lib/tenant.ts';
import { emitToTenant } from '../lib/socketService.ts';
import { authenticate } from '../middleware/auth.ts';

const router = express.Router();

// GET /api/orders - List orders for the tenant (Auth required)
router.get('/', authenticate, async (req, res) => {
  try {
    const tenantId = getTenantId();
    const orders = await Order.find({ tenantId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// POST /api/orders - Create a new order
router.post('/', async (req, res) => {
  try {
    const tenantId = getTenantId();
    const orderNumber = req.body.orderNumber || `ORD-${Date.now().toString().slice(-6)}`;
    
    const orderData = { ...req.body, orderNumber, tenantId, status: 'PENDING', paymentStatus: 'UNPAID' };
    const order = new Order(orderData);
    await order.save();
    
    // 🔥 REALTIME: Notify kitchen
    emitToTenant(tenantId, 'order:new', order);
    
    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create order', details: error });
  }
});

// PATCH /api/orders/:id - Update order status (Auth required)
router.patch('/:id', authenticate, async (req, res) => {
  try {
    const tenantId = getTenantId();
    const { status, paymentStatus } = req.body;
    
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, tenantId },
      { $set: { status, paymentStatus } },
      { new: true }
    );

    if (!order) return res.status(404).json({ error: 'Order not found' });

    // 🔥 REALTIME: Notify POS and Kitchen
    emitToTenant(tenantId, 'order:update', order);

    res.json(order);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update order' });
  }
});

export default router;
