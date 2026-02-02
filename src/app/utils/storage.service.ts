import { Injectable } from '@angular/core';
import { AppConstants } from './constants';

export interface StorageItem {
  value: any;
  expires?: number;
}

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  // Local Storage Methods
  set(key: string, value: any, ttl?: number): void {
    try {
      const item: StorageItem = {
        value,
        expires: ttl ? Date.now() + ttl : undefined
      };
      localStorage.setItem(key, JSON.stringify(item));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }
  
  get<T>(key: string): T | null {
    try {
      const itemStr = localStorage.getItem(key);
      if (!itemStr) return null;
      
      const item: StorageItem = JSON.parse(itemStr);
      
      // Check if item is expired
      if (item.expires && Date.now() > item.expires) {
        this.remove(key);
        return null;
      }
      
      return item.value as T;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  }
  
  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  }
  
  clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }
  
  // Session Storage Methods
  setSession(key: string, value: any): void {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error saving to sessionStorage:', error);
    }
  }
  
  getSession<T>(key: string): T | null {
    try {
      const item = sessionStorage.getItem(key);
      return item ? JSON.parse(item) as T : null;
    } catch (error) {
      console.error('Error reading from sessionStorage:', error);
      return null;
    }
  }
  
  removeSession(key: string): void {
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from sessionStorage:', error);
    }
  }
  
  clearSession(): void {
    try {
      sessionStorage.clear();
    } catch (error) {
      console.error('Error clearing sessionStorage:', error);
    }
  }
  
  // Auth Storage Methods
  setToken(token: string): void {
    this.set(AppConstants.AUTH_TOKEN_KEY, token);
  }
  
  getToken(): string | null {
    return this.get<string>(AppConstants.AUTH_TOKEN_KEY);
  }
  
  removeToken(): void {
    this.remove(AppConstants.AUTH_TOKEN_KEY);
  }
  
  setUser(user: any): void {
    this.set(AppConstants.USER_DATA_KEY, user);
  }
  
  getUser(): any {
    return this.get(AppConstants.USER_DATA_KEY);
  }
  
  removeUser(): void {
    this.remove(AppConstants.USER_DATA_KEY);
  }
  
  clearAuth(): void {
    this.removeToken();
    this.removeUser();
  }
  
  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.getToken();
  }
  
  // Get user role
  getUserRole(): string | null {
    const user = this.getUser();
    return user ? user.role : null;
  }
  
  // Check if user has specific role
  hasRole(role: string): boolean {
    const userRole = this.getUserRole();
    return userRole === role;
  }
  
  // Check if user has any of the specified roles
  hasAnyRole(roles: string[]): boolean {
    const userRole = this.getUserRole();
    return roles.includes(userRole || '');
  }
}