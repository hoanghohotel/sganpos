import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.ts';
import { authenticate, AuthRequest } from '../middleware/auth.ts';
import { getTenantId } from '../lib/tenant.ts';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

// Register
router.post('/register', async (req: any, res) => {
  try {
    const { name, email, password } = req.body;
    const tenantId = getTenantId();

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    const existingUser = await User.findOne({ email, tenantId });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists in this store' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      tenantId,
      name,
      email,
      password: hashedPassword
    });

    await user.save();
    res.status(201).json({ message: 'User created successfully' });
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
    const { email, password } = req.body;
    const tenantId = getTenantId();

    const user = await User.findOne({ email, tenantId });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id, tenantId }, JWT_SECRET, { expiresIn: '7d' });

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
