import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { authenticate, AuthRequest } from '../middleware/auth';
import { getTenantId } from '../lib/tenant';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

// Register
router.post('/register', async (req: any, res) => {
  try {
    const { name, email, phone, password, tenantId: bodyTenantId } = req.body;
    const tenantId = bodyTenantId || getTenantId();

    if (!name || (!email && !phone) || !password) {
      return res.status(400).json({ error: 'Name, password and at least one identifier (email or phone) are required' });
    }

    // Check existing email
    if (email) {
      const existingEmail = await User.findOne({ email, tenantId });
      if (existingEmail) {
        return res.status(400).json({ error: 'Email already exists in this store' });
      }
    }

    // Check existing phone
    if (phone) {
      const existingPhone = await User.findOne({ phone, tenantId });
      if (existingPhone) {
        return res.status(400).json({ error: 'Phone number already exists in this store' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      tenantId,
      name,
      email: email || undefined,
      phone: phone || undefined,
      password: hashedPassword
    });

    try {
      await user.save();
      res.status(201).json({ message: 'User created successfully' });
    } catch (saveError: any) {
      if (saveError.code === 11000) {
        const field = Object.keys(saveError.keyPattern)[0];
        return res.status(400).json({ 
          error: `Trùng thông tin đăng ký: ${field === 'email' ? 'Email' : 'Số điện thoại'} đã được sử dụng.` 
        });
      }
      throw saveError;
    }
  } catch (error: any) {
    console.error('Registration Error:', error);
    res.status(500).json({ 
      error: 'Registration failed', 
      details: error.message || String(error)
    });
  }
});

// Login
router.post('/login', async (req: any, res) => {
  try {
    const { email, phone, identifier, password } = req.body;
    const loginId = identifier || email || phone;
    const tenantId = getTenantId();

    if (!loginId || !password) {
      return res.status(400).json({ error: 'Identifier (email/phone) and password are required' });
    }

    console.log(`[Auth] Login attempt: ${loginId} (Tenant: ${tenantId})`);

    // Search by email or phone in the current tenant
    let user = await User.findOne({ 
      tenantId, 
      $or: [
        { email: loginId },
        { phone: loginId }
      ]
    });
    
    // If not found in tenant, check global ADMINs by either email or phone
    if (!user) {
      console.log(`[Auth] User not found in tenant ${tenantId}, checking global...`);
      user = await User.findOne({ 
        $or: [
          { email: loginId },
          { phone: loginId }
        ]
      });
    }
    
    if (user) {
      console.log(`[Auth] Found user: ${user.email || user.phone} in tenant ${user.tenantId} with role ${user.role}`);
    } else {
      console.warn(`[Auth] No user found for: ${loginId}`);
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials - user not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.warn(`[Auth] Password mismatch for ${loginId}.`);
      return res.status(401).json({ error: 'Invalid credentials - password mismatch' });
    }
    
    console.log(`[Auth] Login successful: ${loginId} (${user.role}) mapping to ID: ${user._id}`);

    const token = jwt.sign({ id: user._id, tenantId: user.tenantId }, JWT_SECRET, { expiresIn: '7d' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      },
      token
    });
  } catch (error: any) {
    console.error('Login Error:', error);
    res.status(500).json({ 
      error: 'Login failed',
      details: error.message || String(error)
    });
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
});

// Me
router.get('/me', authenticate, (req: AuthRequest, res) => {
  res.json(req.user);
});

export default router;
