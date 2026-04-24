import express from 'express';
import { createServer as createHttpServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import dbConnect from '../src/lib/mongodb.ts';
import { tenantMiddleware } from '../src/middleware/tenant.ts';
import { initSocket } from '../src/lib/socketService.ts';
import productRoutes from '../src/routes/products.ts';
import orderRoutes from '../src/routes/orders.ts';
import tableRoutes from '../src/routes/tables.ts';
import settingsRoutes from '../src/routes/settings.ts';
import authRoutes from '../src/routes/auth.ts';
import shiftRoutes from '../src/routes/shifts.ts';

const app = express();
const httpServer = createHttpServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

// Initialize the singleton so routes can use it
initSocket(io);

const PORT = process.env.PORT || 3000;

// Socket.io logic (Tenant-based)
io.on('connection', (socket) => {
  const host = socket.handshake.headers.host || '';
  let tenantId = 'demo';
  if (host && !host.includes('localhost')) {
    const parts = host.split('.');
    if (parts.length > 2) tenantId = parts[0];
  }
  socket.join(tenantId);
  socket.on('disconnect', () => {});
});

// Middleware
app.use(express.json());
app.use(cookieParser());
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

app.use('/api/auth', authRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/settings', settingsRoutes);

// We don't need startServer or Vite middleware here because Vercel handles static 
// and calls this as a serverless function.
// But we still need to connect to DB.
// (handled by middleware above)

// For production on Vercel, we serve static files via vercel.json rewrites, 
// so we don't strictly need to handle static files here, 
// BUT if someone hits /api/ they should get something.
// However, vercel.json will route /api/* to this file.

export default app;
