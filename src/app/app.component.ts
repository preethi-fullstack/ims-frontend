import { Component, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from './services/api.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterOutlet, RouterLink, RouterLinkActive]
})
export class AppComponent implements OnInit {
  title = 'Inventory Management System';
  isLoggedIn = false;
  isMenuCollapsed = true;
  currentUser: any = null;
  
  constructor(
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.checkLoginStatus();
    
    // Listen for login/logout events (optional - you can implement event emitters if needed)
    // This will check login status whenever the route changes
    this.router.events.subscribe(() => {
      this.checkLoginStatus();
    });
  }

  checkLoginStatus(): void {
    this.isLoggedIn = this.apiService.isLoggedIn();
    if (this.isLoggedIn) {
      this.loadCurrentUser();
    } else {
      this.currentUser = null;
    }
  }

  loadCurrentUser(): void {
    const userData = localStorage.getItem("currentUser");
    if (userData) {
      try {
        this.currentUser = JSON.parse(userData);
        console.log('Current user loaded:', this.currentUser);
      } catch (error) {
        console.error('Error parsing user data:', error);
        this.currentUser = null;
      }
    } else {
      // Try to get user from token
      const token = this.apiService.getToken();
      if (token) {
        const decoded = this.apiService.decodeToken(token);
        if (decoded) {
          this.currentUser = {
            name: decoded.name || decoded.sub || 'User',
            email: decoded.sub,
            role: decoded.role || 'STAFF',
            id: decoded.id || 0
          };
          this.apiService.setCurrentUser(this.currentUser);
        }
      }
    }
  }

  logout(): void {
    this.apiService.logout();
    this.isLoggedIn = false;
    this.currentUser = null;
    this.isMenuCollapsed = true;
    this.router.navigate(['/login']);
  }

  toggleMenu(): void {
    this.isMenuCollapsed = !this.isMenuCollapsed;
  }

  // Helper method to check user role
  hasRole(role: string): boolean {
    if (!this.currentUser) return false;
    return this.currentUser.role === role;
  }

  // Helper method to check if user has any of the given roles
  hasAnyRole(roles: string[]): boolean {
    if (!this.currentUser) return false;
    return roles.includes(this.currentUser.role);
  }

  // Get user role display name
  getRoleDisplayName(): string {
    if (!this.currentUser) return '';
    
    switch(this.currentUser.role) {
      case 'OWNER': return 'Owner';
      case 'ADMIN': return 'Administrator';
      case 'STAFF': return 'Staff';
      default: return this.currentUser.role;
    }
  }

  // Check if user can access certain features based on role
  canManageUsers(): boolean {
    return this.hasAnyRole(['OWNER', 'ADMIN']);
  }

  canViewReports(): boolean {
    return this.hasAnyRole(['OWNER', 'ADMIN']);
  }

  canManageSettings(): boolean {
    return this.hasRole('OWNER');
  }
}