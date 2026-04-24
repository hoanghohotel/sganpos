import { AsyncLocalStorage } from 'async_hooks';

// This mimics the behavior of next/headers by providing a server-side 
// context for the current request.
export const tenantStorage = new AsyncLocalStorage<{ tenantId: string }>();

/**
 * Gets the current tenant ID from the request context.
 * Useful for Mongoose queries and business logic.
 */
export function getTenantId(): string {
  // If we are in a request context with AsyncLocalStorage
  const store = tenantStorage.getStore();
  if (store?.tenantId) return store.tenantId;

  // Fallback: If AsyncLocalStorage is lost (e.g. on serverless sometimes)
  // we might have it on req.headers if we follow that pattern, 
  // but getTenantId is often called without req object.
  
  return 'demo';
}
