import { Request, Response, NextFunction } from 'express';
import { tenantStorage } from '../lib/tenant.js';

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
    
    // List of known public suffixes we use (like vercel.app, applet.run, etc.)
    const isPublicSuffix = host.includes('vercel.app') || 
                          host.includes('run.app') || 
                          host.includes('github.io');

    if (isPublicSuffix) {
      if (parts.length >= 3) {
        tenantId = parts[0];
      }
    } else {
      // For custom domains like "tenant.com" or "sub.tenant.com"
      if (parts.length >= 3) {
        tenantId = parts[0];
      } else if (parts.length === 2) {
        // If it's something like "mypos.vn", we treat "mypos" as the tenant
        // but only if it's not a common TLD we should ignore.
        const commonTlds = ['com', 'net', 'org', 'vn', 'biz', 'info'];
        if (!commonTlds.includes(parts[0])) {
          tenantId = parts[0];
        }
      }
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
