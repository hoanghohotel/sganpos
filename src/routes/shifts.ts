import express from 'express';
import Shift from '../models/Shift';
import Order from '../models/Order';
import { authenticate, AuthRequest } from '../middleware/auth';
import { getTenantId } from '../lib/tenant';

const router = express.Router();

// Get current open shift
router.get('/current', authenticate, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId();
    const shift = await Shift.findOne({ 
      tenantId, 
      userId: req.user._id, 
      status: 'OPEN' 
    });
    res.json(shift);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get current shift' });
  }
});

// Open a new shift
router.post('/open', authenticate, async (req: AuthRequest, res) => {
  try {
    const { openingBalance } = req.body;
    const tenantId = getTenantId();
    const userId = req.user._id;

    // Check if there's already an open shift for this user
    const existingShift = await Shift.findOne({ tenantId, userId, status: 'OPEN' });
    if (existingShift) {
      return res.status(400).json({ error: 'There is already an open shift' });
    }

    const shift = new Shift({
      tenantId,
      userId,
      userName: req.user.name,
      openingBalance: openingBalance || 0,
      status: 'OPEN'
    });

    await shift.save();
    res.status(201).json(shift);
  } catch (error) {
    res.status(500).json({ error: 'Failed to open shift' });
  }
});

// Close shift
router.post('/close', authenticate, async (req: AuthRequest, res) => {
  try {
    const { closingBalance } = req.body;
    const tenantId = getTenantId();
    const userId = req.user._id;

    const shift = await Shift.findOne({ tenantId, userId, status: 'OPEN' });
    if (!shift) {
      return res.status(404).json({ error: 'No open shift found' });
    }

    // Calculate total sales from orders during this shift
    const orders = await Order.find({
      tenantId,
      createdAt: { $gte: shift.startTime },
      status: 'COMPLETED' // Only count completed orders
    });
    
    const totalSales = orders.reduce((sum, order) => sum + order.total, 0);

    shift.status = 'CLOSED';
    shift.endTime = new Date();
    shift.closingBalance = closingBalance;
    shift.totalSales = totalSales;
    
    await shift.save();
    res.json(shift);
  } catch (error) {
    console.error('Close Shift Error:', error);
    res.status(500).json({ error: 'Failed to close shift' });
  }
});

export default router;
