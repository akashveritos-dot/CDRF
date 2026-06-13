// Permission helper functions for role-based access control

export type UserRole = 'SUPERADMIN' | 'ADMIN' | 'MEMBER' | 'GUEST';

export interface SessionPayload {
  userId: number;
  email: string;
  name: string;
  role: UserRole;
}

/**
 * Check if user can delete content
 * Only SUPERADMIN can delete
 */
export function canDelete(role: UserRole): boolean {
  return role === 'SUPERADMIN';
}

/**
 * Check if user can manage other users
 * Only SUPERADMIN can manage users
 */
export function canManageUsers(role: UserRole): boolean {
  return role === 'SUPERADMIN';
}

/**
 * Check if user can create content
 * Both SUPERADMIN and ADMIN can create
 */
export function canCreate(role: UserRole): boolean {
  return role === 'SUPERADMIN' || role === 'ADMIN';
}

/**
 * Check if user can update content
 * Both SUPERADMIN and ADMIN can update
 */
export function canUpdate(role: UserRole): boolean {
  return role === 'SUPERADMIN' || role === 'ADMIN';
}

/**
 * Check if user can publish content
 * Both SUPERADMIN and ADMIN can publish
 */
export function canPublish(role: UserRole): boolean {
  return role === 'SUPERADMIN' || role === 'ADMIN';
}

/**
 * Check if user can access admin panel
 * Both SUPERADMIN and ADMIN can access
 */
export function canAccessAdmin(role: UserRole): boolean {
  return role === 'SUPERADMIN' || role === 'ADMIN';
}

/**
 * Check if user is authenticated as admin (ADMIN or SUPERADMIN)
 */
export function isAdmin(role: UserRole): boolean {
  return role === 'SUPERADMIN' || role === 'ADMIN';
}

/**
 * Check if user is SUPERADMIN
 */
export function isSuperAdmin(role: UserRole): boolean {
  return role === 'SUPERADMIN';
}
