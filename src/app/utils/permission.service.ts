import { Injectable } from '@angular/core';
import { ApiService } from '../services/api.service';
import { UserRole } from '../models';

export interface ModulePermission {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean | ((targetUserId: string, currentUserId: string) => boolean);
  canDelete: boolean | ((targetUserId: string, currentUserId: string) => boolean);
  canAccess?: boolean;
  scope?: 'all' | 'own' | 'team' | 'none';
}

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  // Define the 4 main users by email (since your ID is email)
  private readonly MAIN_USER_EMAILS: readonly string[] = [
    'owner@ims.com',
    'admin@ims.com', 
    'staff1@ims.com',
    'staff2@ims.com'
  ];

  // Type-safe user display names
  private readonly USER_DISPLAY_NAMES: Record<string, string> = {
    'owner@ims.com': 'Owner',
    'admin@ims.com': 'Administrator',
    'staff1@ims.com': 'Staff Member 1',
    'staff2@ims.com': 'Staff Member 2'
  };

  // Type-safe user info
  private readonly MAIN_USER_INFO: Record<string, { role: UserRole, name: string }> = {
    'owner@ims.com': { role: 'OWNER' as UserRole, name: 'Owner' },
    'admin@ims.com': { role: 'ADMIN' as UserRole, name: 'Administrator' },
    'staff1@ims.com': { role: 'STAFF' as UserRole, name: 'Staff Member 1' },
    'staff2@ims.com': { role: 'STAFF' as UserRole, name: 'Staff Member 2' }
  };

  constructor(private apiService: ApiService) {}

  // ================== USER METHODS ==================
  getCurrentUser() {
    return this.apiService.getCurrentUser();
  }

  getCurrentUserId(): string {
    const user = this.getCurrentUser();
    // Return email as ID since that's what you're using
    return user?.email || user?.id?.toString() || '';
  }

  getCurrentUserRole(): UserRole {
    const user = this.getCurrentUser();
    return user?.role || 'STAFF';
  }

  getCurrentUserName(): string {
    const user = this.getCurrentUser();
    const email = this.getCurrentUserId();
    return user?.name || this.USER_DISPLAY_NAMES[email] || 'User';
  }

  isOwner(): boolean {
    return this.getCurrentUserRole() === 'OWNER';
  }

  isAdmin(): boolean {
    return this.getCurrentUserRole() === 'ADMIN';
  }

  isStaff(): boolean {
    return this.getCurrentUserRole() === 'STAFF';
  }

  // Check if current user is one of the 4 main users
  isMainUser(): boolean {
    const userId = this.getCurrentUserId();
    if (!userId) {
      console.log('❌ No user ID found');
      return false;
    }
    
    // Check if userId matches any of the main user emails
    const isMain = this.MAIN_USER_EMAILS.includes(userId);
    console.log('🔍 isMainUser check:', { 
      userId, 
      mainUsers: this.MAIN_USER_EMAILS,
      isMain 
    });
    return isMain;
  }

  // Check if a user ID belongs to the 4 main users
  isMainUserId(userId: string): boolean {
    return this.MAIN_USER_EMAILS.includes(userId);
  }

  // Get main user by email
  getMainUserByEmail(email: string): { role: UserRole, name: string } | null {
    return this.MAIN_USER_INFO[email] || null;
  }

  // ================== PERMISSION DEFINITIONS ==================
  private getPermissions(): Record<UserRole, Record<string, ModulePermission>> {
    return {
      OWNER: {
        dashboard: { canView: true, canCreate: true, canEdit: true, canDelete: true, canAccess: true, scope: 'all' },
        products: { canView: true, canCreate: true, canEdit: true, canDelete: true, canAccess: true, scope: 'all' },
        categories: { canView: true, canCreate: true, canEdit: true, canDelete: true, canAccess: true, scope: 'all' },
        suppliers: { canView: true, canCreate: true, canEdit: true, canDelete: true, canAccess: true, scope: 'all' },
        transactions: { canView: true, canCreate: true, canEdit: true, canDelete: true, canAccess: true, scope: 'all' },
        purchase: { canView: true, canCreate: true, canEdit: true, canDelete: true, canAccess: true, scope: 'all' },
        sale: { canView: true, canCreate: true, canEdit: true, canDelete: true, canAccess: true, scope: 'all' },
        profile: { canView: true, canCreate: false, canEdit: true, canDelete: false, canAccess: true, scope: 'own' },
        users: { 
          canView: true, 
          canCreate: false, 
          canEdit: true, 
          canDelete: false, 
          canAccess: true, 
          scope: 'all' 
        },
        reports: { 
          canView: true, 
          canCreate: true, 
          canEdit: true, 
          canDelete: true, 
          canAccess: true, 
          scope: 'all' 
        },
        settings: { 
          canView: true, 
          canCreate: true, 
          canEdit: true, 
          canDelete: true, 
          canAccess: true, 
          scope: 'all' 
        }
      },
      ADMIN: {
        dashboard: { canView: true, canCreate: true, canEdit: true, canDelete: true, canAccess: true, scope: 'all' },
        products: { canView: true, canCreate: true, canEdit: true, canDelete: true, canAccess: true, scope: 'all' },
        categories: { canView: true, canCreate: true, canEdit: true, canDelete: true, canAccess: true, scope: 'all' },
        suppliers: { canView: true, canCreate: true, canEdit: true, canDelete: true, canAccess: true, scope: 'all' },
        transactions: { canView: true, canCreate: true, canEdit: true, canDelete: true, canAccess: true, scope: 'all' },
        purchase: { canView: true, canCreate: true, canEdit: true, canDelete: true, canAccess: true, scope: 'all' },
        sale: { canView: true, canCreate: true, canEdit: true, canDelete: true, canAccess: true, scope: 'all' },
        profile: { canView: true, canCreate: false, canEdit: true, canDelete: false, canAccess: true, scope: 'own' },
        users: { 
          canView: true, 
          canCreate: false,
          canEdit: (targetUserId: string) => {
            // ADMIN can view all users but only edit staff users and self
            const currentUserId = this.getCurrentUserId();
            return targetUserId === 'staff1@ims.com' || 
                   targetUserId === 'staff2@ims.com' || 
                   targetUserId === currentUserId;
          },
          canDelete: false,
          canAccess: true,
          scope: 'all'
        },
        reports: { 
          canView: true, 
          canCreate: true, 
          canEdit: true, 
          canDelete: true, 
          canAccess: true, 
          scope: 'all' 
        },
        settings: { 
          canView: true, 
          canCreate: false, 
          canEdit: false, 
          canDelete: false, 
          canAccess: true, 
          scope: 'all' 
        }
      },
      STAFF: {
        dashboard: { canView: false, canCreate: false, canEdit: false, canDelete: false, canAccess: false, scope: 'none' },
        products: { canView: true, canCreate: false, canEdit: false, canDelete: false, canAccess: true, scope: 'all' },
        categories: { canView: true, canCreate: false, canEdit: false, canDelete: false, canAccess: true, scope: 'all' },
        suppliers: { canView: true, canCreate: false, canEdit: false, canDelete: false, canAccess: true, scope: 'all' },
        transactions: { canView: false, canCreate: false, canEdit: false, canDelete: false, canAccess: false, scope: 'none' },
        purchase: { canView: false, canCreate: false, canEdit: false, canDelete: false, canAccess: false, scope: 'none' },
        sale: { canView: true, canCreate: true, canEdit: true, canDelete: false, canAccess: true, scope: 'own' },
        profile: { 
          canView: true, 
          canCreate: false, 
          canEdit: (targetUserId: string, currentUserId: string) => targetUserId === currentUserId,
          canDelete: false,
          canAccess: true,
          scope: 'own'
        },
        users: { canView: false, canCreate: false, canEdit: false, canDelete: false, canAccess: false, scope: 'none' },
        reports: { canView: false, canCreate: false, canEdit: false, canDelete: false, canAccess: false, scope: 'none' },
        settings: { canView: false, canCreate: false, canEdit: false, canDelete: false, canAccess: false, scope: 'none' }
      }
    };
  }

  // ================== PERMISSION CHECK METHODS ==================
  private getModulePermission(role: UserRole, module: string): ModulePermission | undefined {
    const permissions = this.getPermissions()[role];
    return permissions[module];
  }

  private checkScope(scope: string = 'none', targetId?: string, currentUserId?: string): boolean {
    switch (scope) {
      case 'all':
        return true;
      case 'own':
        return targetId === currentUserId;
      case 'team':
        // Team includes everyone except owner
        return targetId !== 'owner@ims.com';
      case 'none':
        return false;
      default:
        return false;
    }
  }

  // Public permission checking methods
  canAccessModule(module: string): boolean {
    const role = this.getCurrentUserRole();
    const permission = this.getModulePermission(role, module);
    
    if (!permission) {
      console.warn(`No permission configuration found for module: ${module}`);
      return false;
    }
    
    const canAccess = permission.canAccess !== false;
    console.log(`🔍 canAccessModule: ${module} for ${role} = ${canAccess}`);
    return canAccess;
  }

  canView(module: string, targetId?: string): boolean {
    return this.checkPermission(module, 'view', targetId);
  }

  canCreate(module: string): boolean {
    return this.checkPermission(module, 'create');
  }

  canEdit(module: string, targetId?: string): boolean {
    return this.checkPermission(module, 'edit', targetId);
  }

  canDelete(module: string, targetId?: string): boolean {
    return this.checkPermission(module, 'delete', targetId);
  }

  private checkPermission(module: string, action: 'view' | 'create' | 'edit' | 'delete', targetId?: string): boolean {
    const role = this.getCurrentUserRole();
    const userId = this.getCurrentUserId();
    const permission = this.getModulePermission(role, module);

    if (!permission) {
      console.log(`❌ No permission found for ${module} with role ${role}`);
      return false;
    }

    // Get action permission
    const actionKey = `can${action.charAt(0).toUpperCase() + action.slice(1)}` as keyof ModulePermission;
    const actionPermission = permission[actionKey];

    // Check if action is allowed
    let actionAllowed = false;
    if (typeof actionPermission === 'boolean') {
      actionAllowed = actionPermission;
    } else if (typeof actionPermission === 'function') {
      const func = actionPermission as Function;
      actionAllowed = func(targetId, userId);
    }

    if (!actionAllowed) {
      console.log(`❌ Action ${action} not allowed for ${module} for role ${role}`);
      return false;
    }

    // Check scope
    const scopeAllowed = this.checkScope(permission.scope, targetId, userId);
    if (!scopeAllowed) {
      console.log(`❌ Scope check failed for ${module}: scope=${permission.scope}, target=${targetId}, user=${userId}`);
    }

    return scopeAllowed;
  }

  // ================== NAVIGATION & UI HELPERS ==================
  getAccessibleModules(): { name: string; path: string; icon: string }[] {
    const modules: { name: string; path: string; icon: string }[] = [];

    // Only show navigation if user is one of the 4 main users
    if (!this.isMainUser()) {
      console.log('🚫 User is not a main user, returning empty modules');
      console.log('Current user:', this.getCurrentUserId());
      console.log('Main users:', this.MAIN_USER_EMAILS);
      return modules;
    }

    const availableModules = [
      { name: 'Dashboard', module: 'dashboard', path: '/dashboard', icon: 'bi-speedometer2' },
      { name: 'Products', module: 'products', path: '/products', icon: 'bi-box-seam' },
      { name: 'Categories', module: 'categories', path: '/categories', icon: 'bi-tags' },
      { name: 'Suppliers', module: 'suppliers', path: '/suppliers', icon: 'bi-truck' },
      { name: 'Transactions', module: 'transactions', path: '/transactions', icon: 'bi-arrow-left-right' },
      { name: 'Purchase', module: 'purchase', path: '/purchase', icon: 'bi-cart-plus' },
      { name: 'Sell', module: 'sale', path: '/sell', icon: 'bi-cart-check' },
      { name: 'Users', module: 'users', path: '/users', icon: 'bi-people' },
      { name: 'Reports', module: 'reports', path: '/reports', icon: 'bi-graph-up' },
      { name: 'Settings', module: 'settings', path: '/settings', icon: 'bi-gear' },
      { name: 'Profile', module: 'profile', path: '/profile', icon: 'bi-person' }
    ];

    availableModules.forEach(item => {
      if (this.canAccessModule(item.module)) {
        modules.push({ name: item.name, path: item.path, icon: item.icon });
      }
    });

    console.log('📍 Accessible modules for', this.getCurrentUserId(), ':', modules.map(m => m.name));
    return modules;
  }

  // ================== USER MANAGEMENT HELPERS ==================
  canManageUsers(): boolean {
    return this.canAccessModule('users');
  }

  canCreateNewUser(): boolean {
    return false;
  }

  canEditUser(targetUserId: string): boolean {
    // OWNER: Can edit everyone
    if (this.isOwner()) {
      return this.isMainUserId(targetUserId);
    }
    
    // ADMIN: Can edit staff users and self
    if (this.isAdmin()) {
      const currentUserId = this.getCurrentUserId();
      return targetUserId === 'staff1@ims.com' || 
             targetUserId === 'staff2@ims.com' || 
             targetUserId === currentUserId;
    }
    
    // STAFF: Can only edit own profile
    return targetUserId === this.getCurrentUserId();
  }

  canDeleteUser(targetUserId: string): boolean {
    return false;
  }

  canPromoteDemoteUser(targetUserId: string): boolean {
    return false;
  }

  // ================== DEBUG METHODS ==================
  debugPermissions(): void {
    console.log('🔐 === PERMISSION DEBUG ===');
    const user = this.getCurrentUser();
    console.log('👤 Current User:', user);
    console.log('📧 Current User Email/ID:', this.getCurrentUserId());
    console.log('🎭 Current Role:', this.getCurrentUserRole());
    console.log('📋 Is Main User:', this.isMainUser());
    console.log('📍 Available Modules:', this.getAccessibleModules().map(m => m.name));
    
    // Check specific module access
    const modulesToCheck = ['users', 'reports', 'settings'];
    modulesToCheck.forEach(module => {
      console.log(`🔍 ${module} access:`, this.canAccessModule(module));
    });
    
    console.log('\n🔚 === END DEBUG ===');
  }

  debugUserInfo(): void {
    console.log('🔍 === USER INFO DEBUG ===');
    const user = this.getCurrentUser();
    console.log('User object:', user);
    console.log('User Email/ID:', this.getCurrentUserId());
    console.log('Main Users List:', this.MAIN_USER_EMAILS);
    console.log('Is Main User Check:', this.isMainUser());
    
    // Check each main user
    this.MAIN_USER_EMAILS.forEach((email) => {
      console.log(`Email: ${email} vs Current: ${this.getCurrentUserId()} - Match: ${email === this.getCurrentUserId()}`);
    });
    
    console.log('🔚 === END DEBUG ===');
  }

  // Get all main users for display
  getMainUsers(): Array<{ email: string; role: UserRole; name: string }> {
    return [
      { email: 'owner@ims.com', role: 'OWNER' as UserRole, name: 'Owner' },
      { email: 'admin@ims.com', role: 'ADMIN' as UserRole, name: 'Administrator' },
      { email: 'staff1@ims.com', role: 'STAFF' as UserRole, name: 'Staff Member 1' },
      { email: 'staff2@ims.com', role: 'STAFF' as UserRole, name: 'Staff Member 2' }
    ];
  }

  // Helper method to get role by email
  getRoleByEmail(email: string): UserRole | null {
    const userInfo = this.MAIN_USER_INFO[email];
    return userInfo ? userInfo.role : null;
  }
}