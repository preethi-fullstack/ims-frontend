// Application Constants
export class AppConstants {
  // API Configuration
  static readonly API_TIMEOUT = 30000; // 30 seconds
  static readonly MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
  static readonly ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
  
  // Pagination
  static readonly DEFAULT_PAGE_SIZE = 10;
  static readonly PAGE_SIZES = [5, 10, 20, 50, 100];
  
  // Date Formats
  static readonly DATE_FORMAT = 'yyyy-MM-dd';
  static readonly DATE_TIME_FORMAT = 'yyyy-MM-dd HH:mm:ss';
  static readonly DISPLAY_DATE_FORMAT = 'MMM dd, yyyy';
  static readonly DISPLAY_TIME_FORMAT = 'hh:mm a';
  
  // Validation Patterns
  static readonly EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  static readonly PHONE_PATTERN = /^[\+]?[1-9][\d]{0,15}$/;
  static readonly NAME_PATTERN = /^[a-zA-Z\s.'-]+$/;
  static readonly PRICE_PATTERN = /^\d+(\.\d{1,2})?$/;
  static readonly QUANTITY_PATTERN = /^[0-9]+$/;
  
  // Storage Keys
  static readonly AUTH_TOKEN_KEY = 'ims_auth_token';
  static readonly USER_DATA_KEY = 'ims_user_data';
  static readonly REMEMBER_ME_KEY = 'ims_remember_me';
  static readonly THEME_KEY = 'ims_theme';
  static readonly LANGUAGE_KEY = 'ims_language';
  
  // User Roles
  static readonly USER_ROLES = {
    OWNER: 'OWNER',
    ADMIN: 'ADMIN',
    STAFF: 'STAFF',
  };
  
  // Application Routes - Update to match your backend
  static readonly ROUTES = {
    LOGIN: '/login',
    REGISTER: '/register',
    DASHBOARD: '/dashboard',
    CATEGORIES: '/categories',
    PRODUCTS: '/products',
    SUPPLIERS: '/suppliers',
    TRANSACTIONS: '/transactions',
    PROFILE: '/profile',
    SETTINGS: '/settings'
  };
  
  // API Endpoints - Update to match your backend
  static readonly API_ENDPOINTS = {
    LOGIN: '/auth/login',
    REGISTER: '/users/register',
    USERS: '/users',
    CATEGORIES: '/categories',
    PRODUCTS: '/products',
    SUPPLIERS: '/suppliers',
    TRANSACTIONS: '/transactions'
  };
  
  // Error Messages - Complete set
  static readonly ERROR_MESSAGES = {
    SERVER_ERROR: 'An unexpected server error occurred. Please try again later.',
    NETWORK_ERROR: 'Network error. Please check your internet connection.',
    UNAUTHORIZED: 'Unauthorized access. Please login again.',
    FORBIDDEN: 'You do not have permission to access this resource.',
    TOKEN_EXPIRED: 'Your session has expired. Please login again.',
    BAD_REQUEST: 'Bad request. Please check your input.',
    NOT_FOUND: 'Resource not found.',
    CONFLICT: 'Conflict. Resource already exists.',
    VALIDATION_FAILED: 'Validation failed. Please check your input.',
    INTERNAL_SERVER_ERROR: 'Internal server error. Please try again later.',
    DEFAULT: 'An error occurred. Please try again.'
  };
  
  // Success Messages
  static readonly SUCCESS_MESSAGES = {
    SAVED: 'Saved successfully',
    UPDATED: 'Updated successfully',
    DELETED: 'Deleted successfully',
    CREATED: 'Created successfully',
    LOGGED_IN: 'Logged in successfully',
    REGISTERED: 'Registered successfully',
    PASSWORD_CHANGED: 'Password changed successfully'
  };
  
  // Local Storage Helper
  static setItem(key: string, value: any): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }
  
  static getItem(key: string): any {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  }
  
  static removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  }
  
  static clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }
}