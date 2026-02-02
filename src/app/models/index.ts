
export interface User {
  id: number;
  name: string;
  email: string;
  role: 'OWNER' | 'ADMIN' | 'STAFF';
  createdAt?: string; 
  updatedAt?: string;  
}

// Add UserRole type if not exists
export type UserRole = 'OWNER' | 'ADMIN' | 'STAFF';

// Add UserRole enum for convenience
export enum UserRoleEnum {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  STAFF = 'STAFF'
}

// Rest of your existing models...
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface Category {
  id: number;
  name: string;
  description: string;
}

export interface CategoryRequest {
  name: string;
  description: string;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  quantity: number;
  categoryId: number;
  categoryName: string;
}

export interface ProductRequest {
  name: string;
  description: string;
  price: number;
  quantity: number;
  categoryId: number;
}

export interface Supplier {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
}

export interface SupplierRequest {
  name: string;
  email: string;
  phone: string;
  address: string;
}

export interface Transaction {
  id: number;
  userName: string;
  productName: string;
  supplierName: string;
  quantity: number;
  totalPrice: number;
  transactionDate: string | Date;
  type: string;
  customerName?: string;
}

export interface TransactionRequest {
  userId: number;
  productId: number;
  supplierId?: number | null;
  quantity: number;
  type?: string;
  customerName?: string;
  customerEmail?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export const ROLE_DESCRIPTIONS = {
  'STAFF': 'Handles daily sales and customer transactions',
  'ADMIN': 'Manages daily operations and inventory orders',
  'OWNER': 'Monitors overall business performance'
};