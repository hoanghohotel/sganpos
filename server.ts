import express from 'express';
import { createServer as createHttpServer } from 'http';
import { Server } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import dbConnect from './src/lib/mongodb';
import User from './src/models/User';
import mongoose from 'mongoose';
import { tenantMiddleware } from './src/middleware/tenant';
import { initSocket } from './src/lib/socketService'; // Add this
import productRoutes from './src/routes/products';
import orderRoutes from './src/routes/orders';
import tableRoutes from './src/routes/tables';
import settingsRoutes from './src/routes/settings';
import authRoutes from './src/routes/auth';
import shiftRoutes from './src/routes/shifts';

const app = express();

// Logging buffer for development
const systemLogs: any[] = [];
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (!req.path.startsWith('/api/dev')) {
      systemLogs.push({
        timestamp: new Date(),
        method: req.method,
        path: req.path,
        status: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip
      });
      if (systemLogs.length > 200) systemLogs.shift();
    }
  });
  next();
});

app.set('trust proxy', 1);
const httpServer = createHttpServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

// Initialize the singleton so routes can use it
initSocket(io);

const PORT = 3000;

// Socket.io Multi-tenant logic
io.on('connection', (socket) => {
  // Extract tenant from host or query
  const host = socket.handshake.headers.host || '';
  let tenantId = 'demo';
  
  if (host && !host.includes('localhost')) {
    const parts = host.split('.');
    if (parts.length > 2) tenantId = parts[0];
  }

  // Join the tenant-specific room
  socket.join(tenantId);
  console.log(`[Socket] User ${socket.id} joined room: ${tenantId}`);

  socket.on('disconnect', () => {
    console.log(`[Socket] User ${socket.id} disconnected`);
  });
});

// Middleware
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[Request] ${req.method} ${req.originalUrl}`);
  }
  next();
});

app.use(express.json());
app.use(cookieParser());
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

// --- Development & Admin APIs ---
app.get('/api/dev/logs', (req, res) => res.json(systemLogs.slice().reverse()));
app.get('/api/dev/db-status', async (req, res) => {
  const state = mongoose.connection.readyState;
  const states = ['Disconnected', 'Connected', 'Connecting', 'Disconnecting'];
  res.json({ 
    status: states[state], 
    atlas: (process.env.MONGODB_URI || '').includes('mongodb+srv') 
  });
});

app.get('/api/admin/users', async (req, res) => {
  try {
    const users = await User.find({}, '-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.post('/api/admin/users', async (req, res) => {
  try {
    const user = new User({ ...req.body, password: 'password@123' }); // Default password for new users
    await user.save();
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

app.put('/api/admin/users/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

app.delete('/api/admin/users/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});
// --------------------------------

app.post('/api/dev/seed', async (req, res) => {
  try {
    const { tenantId } = req.body;
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required' });

    // Seed Tables if empty
    const Table = (await import('./src/models/Table')).default;
    const existingTables = await Table.find({ tenantId });
    if (existingTables.length === 0) {
      const demoTables = [];
      for (let i = 1; i <= 10; i++) demoTables.push({ name: `Bàn ${String(i).padStart(2, '0')}`, tenantId, isActive: true });
      for (let i = 1; i <= 5; i++) demoTables.push({ name: `Mang về ${String(i).padStart(2, '0')}`, tenantId, isActive: true });
      for (let i = 1; i <= 5; i++) demoTables.push({ name: `Ship ${String(i).padStart(2, '0')}`, tenantId, isActive: true });
      await Table.insertMany(demoTables);
    }

    // Seed Products if empty
    const Product = (await import('./src/models/Product')).default;
    const existingProducts = await Product.find({ tenantId });
    if (existingProducts.length === 0) {
      const demoProducts = [
        { name: 'Cà phê Đen', price: 25000, category: 'Đồ uống', tenantId, description: 'Cà phê nguyên chất', image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500' },
        { name: 'Cà phê Sữa', price: 29000, category: 'Đồ uống', tenantId, description: 'Cà phê sữa pha máy', image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=500' },
        { name: 'Bạc Xỉu', price: 32000, category: 'Đồ uống', tenantId, image: 'https://images.unsplash.com/photo-1544787210-22dbce921500?w=500' },
        { name: 'Trà Đào Cam Sả', price: 45000, category: 'Trà', tenantId, image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500' }
      ];
      await Product.insertMany(demoProducts);
    }

    res.json({ success: true, message: 'Data seeded successfully' });
  } catch (err) {
    console.error('Seed failed:', err);
    res.status(500).json({ error: 'Seed failed' });
  }
});

async function startServer() {
  // Connect to Database
  dbConnect().catch(err => console.error('Failed to connect to MongoDB:', err));

  // Vite integration
  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    
    // Explicitly handle SPA fallback for development
    app.get('*', async (req, res, next) => {
      const url = req.originalUrl;
      
      // Skip API routes and files with extensions (assets)
      if (url.startsWith('/api') || url.includes('.')) {
        return next();
      }

      try {
        const fs = await import('fs');
        const templateFile = path.resolve(process.cwd(), 'index.html');
        let template = fs.readFileSync(templateFile, 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        console.error('Vite SPA Fallback Error:', e);
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else if (!process.env.VERCEL) {
    // Only serve static files if NOT on Vercel (e.g. Docker, manual VPS)
    // On Vercel, we let Vercel framework serve the dist folder.
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      res.sendFile(indexPath);
    });
  }

  if (!process.env.VERCEL) {
    httpServer.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  }
}

startServer();

export default app;
