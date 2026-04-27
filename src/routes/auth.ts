import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { getTenantId } from '../lib/tenant.js';
import { sendVerificationEmail } from '../lib/mail.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

// Register
router.post('/register', async (req: any, res) => {
  try {
    const { name, email, phone, password, tenantId: bodyTenantId } = req.body;
    const tenantId = bodyTenantId || getTenantId();

    console.log(`[Auth] Registration attempt for Name: ${name}, Email: ${email}, Phone: ${phone}, Tenant: ${tenantId}`);

    if (!name || (!email && !phone) || !password) {
      console.warn('[Auth] Registration failed: Missing required fields');
      return res.status(400).json({ error: 'Tên, mật khẩu và ít nhất một định danh (Email hoặc Số điện thoại) là bắt buộc' });
    }

    // Check existing email
    if (email) {
      const existingEmail = await User.findOne({ email, tenantId });
      if (existingEmail) {
        console.warn(`[Auth] Registration failed: Email ${email} already exists in tenant ${tenantId}`);
        return res.status(400).json({ error: 'Email đã tồn tại trong cửa hàng này' });
      }
    }

    // Check existing phone
    if (phone) {
      const existingPhone = await User.findOne({ phone, tenantId });
      if (existingPhone) {
        console.warn(`[Auth] Registration failed: Phone ${phone} already exists in tenant ${tenantId}`);
        return res.status(400).json({ error: 'Số điện thoại đã tồn tại trong cửa hàng này' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = email ? crypto.randomBytes(32).toString('hex') : undefined;

    const user = new User({
      tenantId,
      name,
      email: email ? email.trim() : undefined,
      phone: phone ? phone.trim() : undefined,
      password: hashedPassword,
      role: 'MANAGER',
      isActive: email ? false : true, // Require verification for email
      isVerified: email ? false : true,
      verificationToken
    });

    try {
      await user.save();
      console.log(`[Auth] Registration successful: ${user.email || user.phone}`);
      
      if (email && verificationToken) {
        const origin = `${req.protocol}://${req.get('host')}`;
        await sendVerificationEmail(email.trim(), verificationToken, tenantId, origin);
        return res.status(201).json({ 
          message: 'Tài khoản đã được tạo. Vui lòng kiểm tra email để xác thực và kích hoạt tài khoản.',
          requireVerification: true
        });
      }

      res.status(201).json({ message: 'User created successfully' });
    } catch (saveError: any) {
      console.error('[Auth] Mongoose Save Error:', saveError);
      if (saveError.code === 11000) {
        const field = Object.keys(saveError.keyPattern)[0];
        return res.status(400).json({ 
          error: `Trùng lặp: ${field === 'email' ? 'Email' : 'Số điện thoại'} đã được sử dụng.` 
        });
      }
      throw saveError;
    }
  } catch (error: any) {
    console.error('Registration Exception:', error);
    res.status(500).json({ 
      error: 'Đăng ký thất bại hệ thống', 
      details: error.message || String(error)
    });
  }
});

// Verify Email
router.get('/verify', async (req: any, res) => {
  try {
    const { token, tenantId } = req.query;

    if (!token || !tenantId) {
      return res.status(400).send('<h1>Lỗi xác thực</h1><p>Token hoặc TenantId không hợp lệ.</p>');
    }

    const user = await User.findOne({ verificationToken: token, tenantId });

    if (!user) {
      return res.status(400).send('<h1>Lỗi xác thực</h1><p>Token không hợp lệ hoặc đã hết hạn.</p>');
    }

    user.isVerified = true;
    user.isActive = true;
    user.verificationToken = undefined;
    await user.save();

    res.send(`
      <div style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
        <h1 style="color: #059669;">Xác thực thành công!</h1>
        <p>Tài khoản của bạn đã được kích hoạt. Bây giờ bạn có thể đăng nhập.</p>
        <a href="/" style="display: inline-block; margin-top: 20px; padding: 10px 20px; background-color: #059669; color: white; text-decoration: none; border-radius: 5px;">Quay lại trang chủ</a>
      </div>
    `);
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).send('<h1>Lỗi hệ thống</h1><p>Đã có lỗi xảy ra trong quá trình xác thực.</p>');
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
      return res.status(401).json({ error: 'Thông tin đăng nhập không chính xác' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Tài khoản chưa được kích hoạt hoặc đã bị khóa.' });
    }

    if (user.email && !user.isVerified) {
       return res.status(403).json({ 
         error: 'Vui lòng xác thực email của bạn trước khi đăng nhập.',
         requireVerification: true,
         email: user.email,
         tenantId: user.tenantId
       });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.warn(`[Auth] Password mismatch for ${loginId}.`);
      return res.status(401).json({ error: 'Thông tin đăng nhập không chính xác' });
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

// Resend Verification Email
router.post('/resend-verification', async (req: any, res) => {
  try {
    const { email, tenantId } = req.body;

    if (!email || !tenantId) {
      return res.status(400).json({ error: 'Email and Tenant ID are required' });
    }

    const user = await User.findOne({ email, tenantId, isVerified: false });

    if (!user) {
      return res.status(404).json({ error: 'Người dùng không tồn tại hoặc đã được xác thực.' });
    }

    // Generate new token if needed or reuse
    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.verificationToken = verificationToken;
    await user.save();

    const origin = `${req.protocol}://${req.get('host')}`;
    await sendVerificationEmail(email, verificationToken, tenantId, origin);

    res.json({ message: 'Email xác thực đã được gửi lại thành công.' });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Lỗi khi gửi lại email xác thực.' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
});

// Me
router.get('/me', authenticate, (req: AuthRequest, res) => {
  try {
    res.json(req.user);
  } catch (error) {
    console.error('Auth /me error:', error);
    res.status(500).json({ error: 'Auth failed internal' });
  }
});

export default router;
