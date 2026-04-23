import express from 'express';
import { createServer as createHttpServer } from 'http';
import { Server } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import dbConnect from './src/lib/mongodb.ts';
import { tenantMiddleware } from './src/middleware/tenant.ts';
import { initSocket } from './src/lib/socketService.ts'; // Add this
import productRoutes from './src/routes/products.ts';
import orderRoutes from './src/routes/orders.ts';
import tableRoutes from './src/routes/tables.ts';
import settingsRoutes from './src/routes/settings.ts';

const app = express();
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
app.use(express.json());
app.use(tenantMiddleware);

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', database: 'connected' });
});

app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/settings', settingsRoutes);

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
    
    // Explicitly handle SPA fallback for development if vite middleware doesn't catch it
    app.get('*', async (req, res, next) => {
      const url = req.originalUrl;
      if (url.startsWith('/api')) return next();
      try {
        const fs = await import('fs');
        const templateFile = path.resolve(process.cwd(), 'index.html');
        let template = fs.readFileSync(templateFile, 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
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
