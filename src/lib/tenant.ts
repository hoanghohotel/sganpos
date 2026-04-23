import { AsyncLocalStorage } from 'async_hooks';

// This mimics the behavior of next/headers by providing a server-side 
// context for the current request.
export const tenantStorage = new AsyncLocalStorage<{ tenantId: string }>();

/**
 * Gets the current tenant ID from the request context.
 * Useful for Mongoose queries and business logic.
 */
export function getTenantId(): string {
  const store = tenantStorage.getStore();
  return store?.tenantId || 'demo';
}
