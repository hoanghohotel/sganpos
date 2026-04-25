
export const SYSTEM_ROUTES = ['login', 'register', 'pos', 'shifts', 'kitchen', 'menu', 'tables', 'qr', 'settings', 'admin', 'develop', 'order', 'api', 'assets'];

export function getTenantIdFromPath(pathname: string): string | null {
  const parts = pathname.split('/');
  const firstPart = parts[1];
  if (firstPart && !SYSTEM_ROUTES.includes(firstPart)) {
    return firstPart;
  }
  return null;
}

export function getTenantPrefix(): string {
  if (typeof window === 'undefined') return '';
  const tenantId = getTenantIdFromPath(window.location.pathname);
  return tenantId ? `/${tenantId}` : '';
}

export function tenantLink(path: string): string {
  const prefix = getTenantPrefix();
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  // Don't prefix if it's already a system route or already prefixed
  const pathParts = normalizedPath.split('/');
  const firstPart = pathParts[1];
  if (SYSTEM_ROUTES.includes(firstPart)) {
    return `${prefix}${normalizedPath}`;
  }
  
  return normalizedPath;
}
