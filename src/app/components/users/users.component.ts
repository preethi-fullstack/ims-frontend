
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { PermissionService } from '../../utils/permission.service';
import { User } from '../../models';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class UsersComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  loading = false;
  errorMessage = '';
  successMessage = '';
  showExtraUsers = false;
  
  // Define the 4 main user IDs
  private readonly MAIN_USER_IDS = [1, 2, 5, 6];

  constructor(
    private apiService: ApiService,
    private permissionService: PermissionService
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.errorMessage = '';
    
    this.apiService.getUsers().subscribe({
      next: (users) => {
        this.users = users;
        
        // Filter to show only the 4 main users by default
        this.filteredUsers = users.filter(user => this.isMainUser(user));
        
        console.log('Loaded users:', {
          total: users.length,
          mainUsers: this.filteredUsers.length,
          extraUsers: users.length - this.filteredUsers.length
        });
        
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        
        if (error.status === 403) {
          this.errorMessage = 'You do not have permission to view users.';
        } else if (error.status === 401) {
          this.errorMessage = 'Session expired. Please login again.';
        } else {
          this.errorMessage = error.message || 'Failed to load users.';
        }
        
        this.loading = false;
      }
    });
  }

  // Check if user is one of the 4 main users
  isMainUser(user: User): boolean {
    return this.MAIN_USER_IDS.includes(user.id);
  }

  // Toggle between showing only main users or all users
  toggleExtraUsers(): void {
    this.showExtraUsers = !this.showExtraUsers;
    this.filteredUsers = this.showExtraUsers 
      ? this.users 
      : this.users.filter(user => this.isMainUser(user));
  }

  // Check if current user can edit a specific user
  canEditUser(user: User): boolean {
    return this.permissionService.canEditUser(user.id.toString());
  }

  // No one can delete users (fixed 4 users)
  canDeleteUser(user: User): boolean {
    return false;
  }

  // No one can promote/demote users (fixed roles)
  canPromoteDemoteUser(user: User): boolean {
    return false;
  }

  // Delete user (disabled in frontend)
  deleteUser(user: User): void {
    this.errorMessage = 'User deletion is disabled. System is configured for 4 fixed users.';
  }

  // Promote user (disabled in frontend)
  promoteUser(user: User): void {
    this.errorMessage = 'User promotion is disabled. Roles are fixed for the 4 main users.';
  }

  // Demote user (disabled in frontend)
  demoteUser(user: User): void {
    this.errorMessage = 'User demotion is disabled. Roles are fixed for the 4 main users.';
  }

  getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'OWNER': return 'badge bg-danger';
      case 'ADMIN': return 'badge bg-primary';
      case 'STAFF': return 'badge bg-success';
      default: return 'badge bg-secondary';
    }
  }

  getRoleDisplayName(role: string): string {
    switch(role) {
      case 'OWNER': return 'Owner';
      case 'ADMIN': return 'Administrator';
      case 'STAFF': return 'Staff';
      default: return role;
    }
  }

  getRoleDescription(role: string): string {
    const descriptions: Record<string, string> = {
      'STAFF': 'Handles daily sales and customer transactions',
      'ADMIN': 'Manages daily operations and inventory orders',
      'OWNER': 'Monitors overall business performance'
    };
    return descriptions[role] || 'No description available';
  }

  formatDate(dateString?: string): string {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'N/A';
      }
      return date.toLocaleDateString();
    } catch {
      return 'N/A';
    }
  }

  getUserInitials(name: string): string {
    if (!name) return '??';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  getUserColor(userId: number): string {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'];
    return colors[userId % colors.length];
  }

  // Get user type badge
  getUserTypeBadge(user: User): string {
    return this.isMainUser(user) 
      ? 'badge bg-primary' 
      : 'badge bg-secondary';
  }

  getUserTypeText(user: User): string {
    return this.isMainUser(user) ? 'Main User' : 'Extra User';
  }
}