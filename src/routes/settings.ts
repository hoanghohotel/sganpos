import express from 'express';
import Settings from '../models/Settings.js';
import { getTenantId } from '../lib/tenant.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// GET /api/settings - Fetch current settings
router.get('/', async (req, res) => {
  try {
    const tenantId = getTenantId();
    let settings = await Settings.findOne({ tenantId });
    
    if (!settings) {
      // Create default settings if not exists
      settings = new Settings({ tenantId });
      await settings.save();
    }
    
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// PUT /api/settings - Update settings (Auth required)
router.put('/', authenticate, async (req, res) => {
  try {
    const tenantId = getTenantId();
    const updateData = req.body;
    
    const settings = await Settings.findOneAndUpdate(
      { tenantId },
      { $set: updateData },
      { new: true, upsert: true }
    );
    
    res.json(settings);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update settings' });
  }
});

export default router;
