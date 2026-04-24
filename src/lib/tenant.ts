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

  // Fallback: This is not ideal but can help if context is lost
  // However, getTenantId is often called from services without access to req.
  // In our app, we usually call it within a route handler.
  
  return 'demo';
}
