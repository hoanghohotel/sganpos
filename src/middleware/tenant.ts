import { Request, Response, NextFunction } from 'express';
import { tenantStorage } from '../lib/tenant.ts';

/**
 * Middleware to detect the tenant from the subdomain.
 * Examples:
 * - coffee1.app.com -> tenantId: coffee1
 * - localhost:3000 -> tenantId: demo
 */
export const tenantMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const host = req.headers.host || '';
  let tenantId = 'demo';

  // Check if it's not a local address
  if (host && !host.includes('localhost') && !host.includes('0.0.0.0') && !host.includes('127.0.0.1')) {
    const parts = host.split('.');
    
    // Subdomain detection logic:
    // For local dev/custom domains: first part is tenant
    // For Cloud Run/Vercel (e.g. tenant1.project.vercel.app): first part is tenant
    if (parts.length > 2) {
      tenantId = parts[0];
    }
  }

  // Attach to headers as requested
  req.headers['x-tenant-id'] = tenantId;

  // Run the rest of the request within the tenant context
  // This makes getTenantId() work in sub-functions
  tenantStorage.run({ tenantId }, () => {
    next();
  });
};
