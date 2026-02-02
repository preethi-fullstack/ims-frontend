
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { PermissionService } from '../../utils/permission.service';

@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule],
  providers: [PermissionService] 
})
export class NavigationComponent implements OnInit {
  isMenuCollapsed = true;
  accessibleModules: any[] = [];
  currentUser: any = null;
  isMainUser = false;

  constructor(
    private apiService: ApiService,
    public permissionService: PermissionService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.apiService.getCurrentUser();
    this.accessibleModules = this.permissionService.getAccessibleModules();
    this.isMainUser = this.permissionService.isMainUser();
    
    // Debug: Check permissions
    this.permissionService.debugPermissions();
  }

  isLoggedIn(): boolean {
    return this.apiService.isLoggedIn();
  }

  logout(): void {
    this.apiService.logout();
  }

  getUserInitials(): string {
    if (!this.currentUser?.name) return 'U';
    const parts = this.currentUser.name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return this.currentUser.name.substring(0, 2).toUpperCase();
  }

  getUserRoleBadgeClass(): string {
    switch (this.currentUser?.role) {
      case 'OWNER': return 'badge bg-danger';
      case 'ADMIN': return 'badge bg-primary';
      case 'STAFF': return 'badge bg-success';
      default: return 'badge bg-secondary';
    }
  }

  getUserRoleText(): string {
    switch (this.currentUser?.role) {
      case 'OWNER': return 'Owner';
      case 'ADMIN': return 'Admin';
      case 'STAFF': return 'Staff';
      default: return 'User';
    }
  }
}