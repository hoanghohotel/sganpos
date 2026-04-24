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
    console.error('Get Current Shift Error:', error);
    res.status(500).json({ error: 'Failed to get current shift' });
  }
});

// Open a new shift
router.post('/open', authenticate, async (req: AuthRequest, res) => {
  try {
    const { openingBalance } = req.body;
    const tenantId = getTenantId();
    const userId = req.user._id;
    const generateShiftCode = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    };

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
      code: generateShiftCode(),
      status: 'OPEN'
    });

    await shift.save();

    // Carry over active orders (not COMPLETED) from previous shifts to this new one
    await Order.updateMany(
      { tenantId, status: { $ne: 'COMPLETED' } },
      { $set: { shiftId: shift._id } }
    );

    res.status(201).json(shift);
  } catch (error) {
    console.error('Open Shift Error:', error);
    res.status(500).json({ error: 'Failed to open shift' });
  }
});

// Get summary of current shift (for pre-closing display)
router.get('/summary', authenticate, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId();
    const userId = req.user._id;

    const shift = await Shift.findOne({ tenantId, userId, status: 'OPEN' });
    if (!shift) {
      return res.status(404).json({ error: 'No open shift found' });
    }

    const orders = await Order.find({
      tenantId,
      shiftId: shift._id,
      paymentStatus: 'PAID'
    });

    let totalSales = 0;
    let cashSales = 0;
    let transferSales = 0;
    const productMap = new Map<string, { quantity: number; amount: number }>();

    orders.forEach(order => {
      totalSales += order.total;
      if (order.paymentMethod === 'CASH') {
        cashSales += order.total;
      } else if (order.paymentMethod === 'TRANSFER') {
        transferSales += order.total;
      }

      order.items.forEach((item: any) => {
        const existing = productMap.get(item.name);
        if (existing) {
          existing.quantity += item.quantity;
          existing.amount += item.price * item.quantity;
        } else {
          productMap.set(item.name, {
            quantity: item.quantity,
            amount: item.price * item.quantity
          });
        }
      });
    });

    const productSales = Array.from(productMap.entries()).map(([name, data]) => ({
      name,
      quantity: data.quantity,
      amount: data.amount
    }));

    res.json({
      openingBalance: shift.openingBalance,
      totalSales,
      cashSales,
      transferSales,
      expectedBalance: shift.openingBalance + cashSales,
      productSales
    });
  } catch (error) {
    console.error('Get Shift Summary Error:', error);
    res.status(500).json({ error: 'Failed to get shift summary' });
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

    // Calculate total sales from orders linked to this shift
    const orders = await Order.find({
      tenantId,
      shiftId: shift._id,
      paymentStatus: 'PAID' // Only count paid orders
    });
    
    let totalSales = 0;
    let cashSales = 0;
    let transferSales = 0;
    const productMap = new Map<string, { quantity: number; amount: number }>();

    orders.forEach(order => {
      totalSales += order.total;
      if (order.paymentMethod === 'CASH') {
        cashSales += order.total;
      } else if (order.paymentMethod === 'TRANSFER') {
        transferSales += order.total;
      }

      order.items.forEach((item: any) => {
        const existing = productMap.get(item.name);
        if (existing) {
          existing.quantity += item.quantity;
          existing.amount += item.price * item.quantity;
        } else {
          productMap.set(item.name, {
            quantity: item.quantity,
            amount: item.price * item.quantity
          });
        }
      });
    });

    const productSales = Array.from(productMap.entries()).map(([name, data]) => ({
      name,
      quantity: data.quantity,
      amount: data.amount
    }));
    
    // Generate code if missing (legacy shifts)
    if (!shift.code) {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      shift.code = code;
    }

    shift.status = 'CLOSED';
    shift.endTime = new Date();
    shift.closingBalance = closingBalance;
    shift.totalSales = totalSales;
    shift.cashSales = cashSales;
    shift.transferSales = transferSales;
    shift.productSales = productSales;
    shift.notes = req.body.notes || '';
    
    await shift.save();
    res.json(shift);
  } catch (error) {
    console.error('Close Shift Error:', error);
    res.status(500).json({ error: 'Failed to close shift' });
  }
});

export default router;
