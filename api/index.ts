import express from 'express';
import cookieParser from 'cookie-parser';
import dbConnect from '../src/lib/mongodb';
import { tenantMiddleware } from '../src/middleware/tenant';
import productRoutes from '../src/routes/products';
import orderRoutes from '../src/routes/orders';
import tableRoutes from '../src/routes/tables';
import settingsRoutes from '../src/routes/settings';
import authRoutes from '../src/routes/auth';
import shiftRoutes from '../src/routes/shifts';

const app = express();

// Trust proxy for secure cookies
app.set('trust proxy', 1);

// Middleware
 app.use(express.json());
app.use(cookieParser());

// Database connection middleware
app.use(async (req, res, next) => {
  try {
    if (!process.env.MONGODB_URI) {
      console.error('MONGODB_URI is not defined');
      return res.status(500).json({ error: 'Database configuration missing' });
    }
    await dbConnect();
    next();
  } catch (error: any) {
    console.error('Database connection error:', error);
    res.status(500).json({ error: 'Database connection failed', details: error.message });
  }
});

app.use(tenantMiddleware);

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    database: 'connected',
    tenant: (req as any).headers['x-tenant-id'] || 'unknown',
    url: req.url,
    originalUrl: req.originalUrl
  });
});

const apiRouter = express.Router();
apiRouter.use('/auth', authRoutes);
apiRouter.use('/shifts', shiftRoutes);
apiRouter.use('/products', productRoutes);
apiRouter.use('/orders', orderRoutes);
apiRouter.use('/tables', tableRoutes);
apiRouter.use('/settings', settingsRoutes);

// Mounting configuration for Vercel
// On Vercel, when routed via /api/(.*), the original path /api/auth/register
// might be passed as /api/auth/register or just /auth/register depending on rewrite config.
app.use('/api', apiRouter);
app.use(apiRouter); // Fallback for when the /api prefix is stripped by Vercel

// Export the app for Vercel
export default app;
