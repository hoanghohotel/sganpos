import express from 'express';
import Order from '../models/Order.js';
import Shift from '../models/Shift.js';
import Table from '../models/Table.js';
import { getTenantId } from '../lib/tenant.js';
import { emitToTenant } from '../lib/socketService.js';
import { authenticate } from '../middleware/auth.js';

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
    const orderNumber = req.body.orderNumber || req.body.orderCode || `ORD-${Date.now().toString().slice(-6)}`;
    
    // Find current open shift for this tenant
    let shiftId = req.body.shiftId;
    if (!shiftId) {
      const currentShift = await Shift.findOne({ tenantId, status: 'OPEN' });
      if (currentShift) {
        shiftId = currentShift._id;
      }
    }

    if (!shiftId) {
       return res.status(400).json({ error: 'Không có ca làm việc nào đang mở. Vui lòng mở ca để tiếp nhận đơn hàng.' });
    }

    const orderData = { 
      ...req.body, 
      orderNumber, 
      tenantId, 
      shiftId, 
      status: req.body.status || 'PENDING', 
      paymentStatus: req.body.paymentStatus || 'UNPAID' 
    };
    const order = new Order(orderData);
    await order.save();

    // If order is linked to a table
    if (req.body.tableId) {
      if (orderData.status === 'COMPLETED') {
        // If POS creates a completed order, ensure table is EMPTY
        await Table.findOneAndUpdate(
          { _id: req.body.tableId, tenantId },
          { $set: { status: 'EMPTY', currentOrderId: null } }
        );
        emitToTenant(tenantId, 'table:update', { _id: req.body.tableId, status: 'EMPTY' });
      } else {
        // If it's a PENDING order (e.g. from customer), mark table as OCCUPIED
        await Table.findOneAndUpdate(
          { _id: req.body.tableId, tenantId },
          { $set: { status: 'OCCUPIED', currentOrderId: order._id } }
        );
        // Notify about table update
        emitToTenant(tenantId, 'table:update', { _id: req.body.tableId, status: 'OCCUPIED' });
      }
    }
    
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
    const updateData: any = { ...req.body };
    delete updateData.tenantId; // Security check
    delete updateData._id;
    
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, tenantId },
      { $set: updateData },
      { new: true }
    );

    if (!order) return res.status(404).json({ error: 'Order not found' });

    // If order status is set to COMPLETED or paymentStatus to PAID, we might want to free the table
    // For simplicity, let's free the table when status is COMPLETED
    if (order.status === 'COMPLETED' && order.tableId) {
      await Table.findOneAndUpdate(
        { _id: order.tableId, tenantId },
        { $set: { status: 'EMPTY', currentOrderId: null } }
      );
      // Notify about table update
      emitToTenant(tenantId, 'table:update', { _id: order.tableId, status: 'EMPTY' });
    }

    // 🔥 REALTIME: Notify POS and Kitchen
    emitToTenant(tenantId, 'order:update', order);

    res.json(order);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update order' });
  }
});

// DELETE /api/orders/:id - Cancel/Delete order (Auth required)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const tenantId = getTenantId();
    const order = await Order.findOneAndDelete({ _id: req.params.id, tenantId });
    
    if (!order) return res.status(404).json({ error: 'Order not found' });

    // 🔥 REALTIME: Notify POS and Kitchen about removal
    // We send an update with a flag or just the order with a special status
    emitToTenant(tenantId, 'order:update', { ...order.toObject(), deleted: true });

    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: 'Failed to delete order' });
  }
});

export default router;
