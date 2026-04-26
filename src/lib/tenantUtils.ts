
export const SYSTEM_ROUTES = ['login', 'register', 'pos', 'shifts', 'kitchen', 'menu', 'tables', 'qr', 'settings', 'admin', 'develop', 'order', 'api', 'assets'];

export function getTenantFromHostname(): string | null {
  if (typeof window === 'undefined') return null;
  const host = window.location.hostname;
  
  // Specific support for monday.com.vn
  if (host.endsWith('monday.com.vn')) {
    const sub = host.replace('.monday.com.vn', '');
    if (sub && sub !== 'monday.com.vn' && sub !== 'www') {
      return sub;
    }
  }

  // Support for generic subdomains (excluding AI Studio temp domains if they are just one label)
  const parts = host.split('.');
  if (parts.length >= 3) {
    const sub = parts[0];
    if (
      !sub.startsWith('ais-dev-') && 
      !sub.startsWith('ais-pre-') && 
      sub !== 'www' &&
      !host.includes('localhost') &&
      !host.includes('0.0.0.0')
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
  return getTenantFromHostname() || (typeof window !== 'undefined' ? getTenantIdFromPath(window.location.pathname) : null);
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
  
  // If we are on a subdomain, we don't need to add the tenant to the path
  const fromHost = getTenantFromHostname();
  if (fromHost) {
    return normalizedPath;
  }

  // Don't prefix if it's already a system route or already prefixed
  const pathParts = normalizedPath.split('/');
  const firstPart = pathParts[1];
  if (SYSTEM_ROUTES.includes(firstPart)) {
    return normalizedPath;
  }
  
  return `${prefix}${normalizedPath}`;
}
