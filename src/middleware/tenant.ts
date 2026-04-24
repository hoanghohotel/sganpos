import { Request, Response, NextFunction } from 'express';
import { tenantStorage } from '../lib/tenant';

/**
 * Middleware to detect the tenant from the subdomain.
 * Examples:
 * - coffee1.app.com -> tenantId: coffee1
 * - localhost:3000 -> tenantId: demo
 */
export const tenantMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const host = (req.headers['x-forwarded-host'] as string) || req.headers.host || '';
  let tenantId = 'demo';

  // Check if it's not a local address
  const isLocal = host.includes('localhost') || host.includes('0.0.0.0') || host.includes('127.0.0.1') || host.includes('.internal');
  
  if (host && !isLocal) {
    const parts = host.split('.');
    
    // Subdomain detection logic:
    // sganpos.vercel.app -> parts: ['sganpos', 'vercel', 'app'] -> tenantId: 'sganpos'
    // coffee.my-app.com -> parts: ['coffee', 'my-app', 'com'] -> tenantId: 'coffee'
    if (parts.length >= 3) {
      tenantId = parts[0];
    } else if (parts.length === 2 && !host.includes('vercel.app')) {
      // Handle cases like "mytenant.com" if it's a custom domain mapped directly
      tenantId = parts[0];
    }
  }

  // Inject tenantId into request context for logs
  (req as any).tenantId = tenantId;
  res.setHeader('x-tenant-id', tenantId);

  // Run the rest of the request within the tenant context
  tenantStorage.run({ tenantId }, () => {
    next();
  });
};
