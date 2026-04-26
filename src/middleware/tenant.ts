import { Request, Response, NextFunction } from 'express';
import { tenantStorage } from '../lib/tenant.js';
import jwt from 'jsonwebtoken';

/**
 * Middleware to detect the tenant from the subdomain.
 * Examples:
 * - coffee1.app.com -> tenantId: coffee1
 * - localhost:3000 -> tenantId: demo
 */
export const tenantMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const host = (req.headers['x-forwarded-host'] as string) || req.headers.host || '';
  const headerTenantId = req.headers['x-tenant-id'] as string;
  let tenantId = '';

  if (headerTenantId) {
    tenantId = headerTenantId;
  } else {
    // 2. Fallback: Check path prefix (e.g., domain.com/TenantId/...)
    const pathParts = req.path.split('/');
    const systemRoutes = ['login', 'register', 'pos', 'shifts', 'kitchen', 'menu', 'tables', 'qr', 'settings', 'admin', 'develop', 'order', 'api', 'assets'];
    
    if (pathParts[1] && !systemRoutes.includes(pathParts[1])) {
      tenantId = pathParts[1];
    } else {
      // 3. Fallback: Check Referer (Very important for F5 and API calls from SPA)
      const referer = req.headers.referer;
      if (referer) {
        try {
          const url = new URL(referer);
          const refererParts = url.pathname.split('/');
          
          // Case: domain.com/TenantId/something
          if (refererParts[1] && !systemRoutes.includes(refererParts[1])) {
            tenantId = refererParts[1];
          } else {
            // Case: TenantId.domain.com
            const refHost = url.hostname;
            const refParts = refHost.split('.');
            if (refParts.length >= 3) {
              // Only pick subdomain if it's not 'www' or local dev
              if (refParts[0] !== 'www') {
                tenantId = refParts[0];
              }
            }
          }
        } catch (e) { /* ignore URL parse error */ }
      }

      // 4. Default: Subdomain detection from Host
      if (!tenantId) {
        const isLocal = host.includes('localhost') || host.includes('0.0.0.0') || host.includes('127.0.0.1') || host.includes('.internal');
        if (host && !isLocal) {
          const parts = host.split('.');
          const isPublicSuffix = host.includes('vercel.app') || host.includes('run.app') || host.includes('github.io');
          if (isPublicSuffix) {
            if (parts.length >= 3) {
              const sub = parts[0];
              // Skip AI Studio system subdomains
              if (!sub.startsWith('ais-dev-') && !sub.startsWith('ais-pre-')) {
                tenantId = sub;
              }
            }
          } else {
            if (parts.length >= 3) {
              const sub = parts[0];
              if (sub !== 'www' && !sub.startsWith('ais-dev-') && !sub.startsWith('ais-pre-')) {
                tenantId = sub;
              }
            } else if (parts.length === 2) {
              const commonTlds = ['com', 'net', 'org', 'vn', 'biz', 'info'];
              if (!commonTlds.includes(parts[0])) tenantId = parts[0];
            }
          }
        }
      }
      
      // 5. Ultimate Fallback: JWT Token peeking (Decode without verify just to guess tenant context)
      if (!tenantId) {
        try {
          const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
          if (token) {
            const decoded: any = jwt.decode(token);
            if (decoded && decoded.tenantId) {
              tenantId = decoded.tenantId;
            }
          }
        } catch (e) { /* ignore jwt decode error */ }
      }
    }
  }

  // Final fallback to 'demo'
  if (!tenantId) tenantId = 'demo';

  // Inject tenantId into request context for logs
  (req as any).tenantId = tenantId;
  res.setHeader('x-tenant-id', tenantId);

  // Run the rest of the request within the tenant context
  tenantStorage.run({ tenantId }, () => {
    next();
  });
};
