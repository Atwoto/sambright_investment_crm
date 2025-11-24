import { User, UserRole } from '../contexts/AuthContext';

/**
 * Defines the navigation items accessible to each user role.
 * The strings correspond to the 'id' of the nav items in Sidebar.tsx
 * and the route paths in App.tsx.
 */
export const navPermissions: Record<UserRole, string[]> = {
  super_admin: [
    'dashboard',
    'products',
    'clients',
    'projects',
    'suppliers',
    'orders',
    'inventory',
    'ai-advisor',
    'reports',
    'users'
  ],
  production: [
    'dashboard',
    'products',
    'inventory',
    'suppliers'
  ],
  field: [
    'dashboard',
    'projects',
    'clients'
  ],
  customer_service: [
    'dashboard',
    'projects',
    'orders',
    'clients'
  ],
  client: [
    'dashboard' // As per App.tsx, clients are redirected to a separate portal.
  ]
};

/**
 * Checks if a user with a given role can access a specific path.
 * @param role The user's role.
 * @param path The path to check (e.g., '/products').
 * @returns True if the user has permission, false otherwise.
 */
export const canAccess = (role: UserRole | undefined, path: string): boolean => {
  if (!role) {
    return false;
  }
  
  // Normalize path by removing leading slash and handling root path
  const normalizedPath = path.startsWith('/') ? path.substring(1) : path;
  const targetPath = normalizedPath === '' ? 'dashboard' : normalizedPath;

  const allowedPaths = navPermissions[role];
  
  if (!allowedPaths) {
    return false;
  }
  
  return allowedPaths.includes(targetPath);
};
