import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot } from '@angular/router';
import { PermissionService } from '../utils/permission.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  
  constructor(
    private permissionService: PermissionService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    // Get module from route data or URL
    const module = route.data['module'] || this.getModuleFromUrl(route.url);
    
    console.log('🔒 Role Guard activated for:', {
      url: route.url,
      module,
      userRole: this.permissionService.getCurrentUserRole(),
      userId: this.permissionService.getCurrentUserId(),
      isMainUser: this.permissionService.isMainUser()
    });

    // Run debug to see what's happening
    this.permissionService.debugUserInfo();
    
    // Check if user is one of the 4 main users
    if (!this.permissionService.isMainUser()) {
      console.log('🚫 Access denied: User is not one of the 4 main users');
      console.log('User ID/Email:', this.permissionService.getCurrentUserId());
      console.log('Main users list:', this.permissionService.getMainUsers());
      
      // Redirect to login
      this.router.navigate(['/login']);
      return false;
    }
    
    // Check if user can access this module
    if (!this.permissionService.canAccessModule(module)) {
      console.log(` Access denied to ${module} for role ${this.permissionService.getCurrentUserRole()}`);
      
      // Debug permission check
      this.permissionService.debugPermissions();
      
      // Redirect to first accessible module
      const accessibleModules = this.permissionService.getAccessibleModules();
      console.log('Available modules:', accessibleModules);
      
      if (accessibleModules.length > 0) {
        this.router.navigate([accessibleModules[0].path]);
      } else {
        this.router.navigate(['/login']);
      }
      return false;
    }

    console.log(`✅ Access granted to ${module}`);
    return true;
  }

  private getModuleFromUrl(url: any[]): string {
    if (!url || url.length === 0) return 'dashboard';
    
    const path = url[0].path;
    
    // Map URL paths to module names
    const urlToModule: { [key: string]: string } = {
      'dashboard': 'dashboard',
      'products': 'products',
      'categories': 'categories',
      'suppliers': 'suppliers',
      'transactions': 'transactions',
      'purchase': 'purchase',
      'sell': 'sale',
      'users': 'users',
      'reports': 'reports',
      'settings': 'settings',
      'profile': 'profile'
    };

    const module = urlToModule[path] || path;
    console.log(` URL path "${path}" mapped to module: "${module}"`);
    return module;
  }
}