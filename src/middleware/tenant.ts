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
  const headerTenantId = req.headers['x-tenant-id'] as string;
  let tenantId = 'demo';

  if (headerTenantId) {
    tenantId = headerTenantId;
  } else {
    // 2. Fallback: Check path prefix (e.g., domain.com/TenantId/...)
    const pathParts = req.path.split('/');
    const systemRoutes = ['login', 'register', 'pos', 'shifts', 'kitchen', 'menu', 'tables', 'qr', 'settings', 'admin', 'develop', 'order', 'api', 'assets'];
    
    if (pathParts[1] && !systemRoutes.includes(pathParts[1])) {
      tenantId = pathParts[1];
    } else {
      // 3. Fallback: Check Referer
      const referer = req.headers.referer;
      if (referer) {
        try {
          const url = new URL(referer);
          const refererParts = url.pathname.split('/');
          if (refererParts[1] && !systemRoutes.includes(refererParts[1])) {
            tenantId = refererParts[1];
          } else {
            const refHost = url.hostname;
            if (!refHost.includes('localhost') && !refHost.includes('0.0.0.0')) {
              const refParts = refHost.split('.');
              if (refParts.length >= 3) tenantId = refParts[0];
            }
          }
        } catch (e) { /* ignore */ }
      }

      // 4. Default: Subdomain detection from Host if still demo
      if (tenantId === 'demo') {
        const isLocal = host.includes('localhost') || host.includes('0.0.0.0') || host.includes('127.0.0.1') || host.includes('.internal');
        if (host && !isLocal) {
          const parts = host.split('.');
          const isPublicSuffix = host.includes('vercel.app') || host.includes('run.app') || host.includes('github.io');
          if (isPublicSuffix) {
            if (parts.length >= 3) tenantId = parts[0];
          } else {
            if (parts.length >= 3) {
              tenantId = parts[0];
            } else if (parts.length === 2) {
              const commonTlds = ['com', 'net', 'org', 'vn', 'biz', 'info'];
              if (!commonTlds.includes(parts[0])) tenantId = parts[0];
            }
          }
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
