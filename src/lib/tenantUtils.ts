
export const SYSTEM_ROUTES = ['login', 'register', 'pos', 'shifts', 'kitchen', 'menu', 'tables', 'qr', 'settings', 'admin', 'develop', 'order', 'api', 'assets'];

export function getTenantFromHostname(): string | null {
  if (typeof window === 'undefined') return null;
  const host = window.location.hostname;
  
  // Specific support for monday.com.vn
  if (host.endsWith('monday.com.vn')) {
    const sub = host.replace('.monday.com.vn', '').replace('monday.com.vn', '');
    if (sub && sub !== 'www' && sub !== '') {
      return sub;
    }
    return null;
  }

  // Support for generic subdomains (excluding AI Studio temp domains)
  const parts = host.split('.');
  if (parts.length >= 3) {
    const sub = parts[0];
    const domain = parts.slice(1).join('.');
    
    // Skip known landing page domains and local hosts
    if (
      sub !== 'www' && 
      !sub.startsWith('ais-dev-') && 
      !sub.startsWith('ais-pre-') &&
      !host.includes('localhost') &&
      !host.includes('0.0.0.0') &&
      !domain.includes('vercel.app') // Vercel branch URLs are not tenants
    ) {
      return sub;
    }
  }
  
  return null;
}

export function getTenantIdFromPath(pathname: string): string | null {
  const parts = pathname.split('/');
  const firstPart = parts[1];
  if (firstPart && !SYSTEM_ROUTES.includes(firstPart)) {
    return firstPart;
  }
  return null;
}

export function getTenantId(): string | null {
  const fromHost = getTenantFromHostname();
  if (fromHost) return fromHost;
  
  return typeof window !== 'undefined' ? getTenantIdFromPath(window.location.pathname) : null;
}

export function getTenantPrefix(): string {
  if (typeof window === 'undefined') return '';
  
  // If we have a subdomain, the prefix in URL path is empty
  const fromHost = getTenantFromHostname();
  if (fromHost) return '';

  const tenantId = getTenantIdFromPath(window.location.pathname);
  return tenantId ? `/${tenantId}` : '';
}

export function tenantLink(path: string): string {
  const prefix = getTenantPrefix();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  // If we are on a subdomain, the path in URL should NOT include the tenant
  const fromHost = getTenantFromHostname();
  if (fromHost) {
    return normalizedPath;
  }

  if (!prefix) return normalizedPath;

  // Don't prefix if it's already prefixed
  if (normalizedPath.startsWith(`${prefix}/`) || normalizedPath === prefix) {
    return normalizedPath;
  }

  // Define routes that should NOT be prefixed (truly global)
  const GLOBAL_ROUTES = ['api', 'assets'];
  const firstPart = normalizedPath.split('/')[1];
  if (GLOBAL_ROUTES.includes(firstPart)) {
    return normalizedPath;
  }
  
  return `${prefix}${normalizedPath}`;
}
