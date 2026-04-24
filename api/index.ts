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

// Middleware
app.use(express.json());
app.use(cookieParser());

// Database connection middleware
app.use(async (req, res, next) => {
  try {
    await dbConnect();
    next();
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

app.use(tenantMiddleware);

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', database: 'connected' });
});

const apiRouter = express.Router();
apiRouter.use('/auth', authRoutes);
apiRouter.use('/shifts', shiftRoutes);
apiRouter.use('/products', productRoutes);
apiRouter.use('/orders', orderRoutes);
apiRouter.use('/tables', tableRoutes);
apiRouter.use('/settings', settingsRoutes);

// Mount under both to be safe
app.use('/api', apiRouter);
app.use(apiRouter); // Fallback

// Export the app for Vercel
export default app;
