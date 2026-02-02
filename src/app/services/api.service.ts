import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, throwError, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  User,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  Category,
  CategoryRequest,
  Product,
  ProductRequest,
  Supplier,
  SupplierRequest,
  Transaction,
  TransactionRequest,
  ApiResponse
} from '../models';


interface DashboardStats {
  totalProducts: number;
  totalCategories: number;
  totalSuppliers: number;
  totalTransactions: number;
  totalUsers: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalInventoryValue: number;
  monthlySales: number;
  monthlyPurchases: number;
  recentTransactions: Transaction[];
}

interface ReportData {
  title: string;
  period: string;
  data: any[];
  summary: {
    total: number;
    average: number;
    count: number;
  };
}

interface Settings {
  id: number;
  companyName: string;
  currency: string;
  taxRate: number;
  lowStockThreshold: number;
  defaultUnitPrice: number;
  emailNotifications: boolean;
  autoReorder: boolean;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;
  private tokenKey = 'auth_token';
  private userKey = 'currentUser';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    });
  }

  // ==================== DEBUG METHODS ====================
  testUserPermissions(): void {
    console.log(' === USER PERMISSIONS CHECK ===');
    const user = this.getCurrentUser();
    const token = this.getToken();
    
    console.log(' Current User:', user);
    console.log(' User Role:', user?.role);
    console.log(' User ID:', user?.id);
    console.log(' Token exists:', !!token);
    
    if (token) {
      try {
        const decoded = this.decodeToken(token);
        console.log(' Decoded Token:', decoded);
        if (decoded?.exp) {
          const expDate = new Date(decoded.exp * 1000);
          const now = new Date();
          console.log(' Token expiration:', expDate);
          console.log(' Current time:', now);
          console.log(' Token expired?', now > expDate);
        }
        console.log(' Token roles/perms:', decoded?.role || decoded?.roles || 'Not specified');
      } catch (e) {
        console.error(' Error decoding token:', e);
      }
    }
    
    console.log(' Required for purchases: OWNER or ADMIN role');
    console.log(' User can create purchases?', user?.role === 'OWNER' || user?.role === 'ADMIN');
    console.log(' === END PERMISSIONS CHECK ===');
  }

  // ==================== AUTH METHODS ====================
  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, credentials)
      .pipe(
        map(response => {
          console.log(' Login successful, setting token');
          this.setToken(response.token);
          // Decode token to get user info
          const userInfo = this.decodeToken(response.token);
          if (userInfo) {
            // Create user object from token
            const user: User = {
              id: userInfo.userId || userInfo.sub || 1, // Fallback to 1 if not found
              name: userInfo.name || 'User',
              email: userInfo.email || credentials.email,
              role: userInfo.role || 'STAFF'
            };
            console.log(' User from token:', user);
            this.setCurrentUser(user);
          }
          return response;
        }),
        catchError(this.handleError)
      );
  }

  register(userData: RegisterRequest): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/auth/register`, userData)
      .pipe(
        map(user => {
          // If backend returns token in response, auto-login
          const token = (user as any).token; 
          if (token) {
            this.setToken(token);
            this.setCurrentUser(user);
          }
          return user;
        }),
        catchError(this.handleError)
      );
  }

  // ==================== TOKEN & USER MANAGEMENT ====================
  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
    console.log(' Token saved to localStorage');
  }

  getToken(): string | null {
    const token = localStorage.getItem(this.tokenKey);
    return token;
  }

  removeToken(): void {
    localStorage.removeItem(this.tokenKey);
  }

  decodeToken(token: string): any {
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload));
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  setCurrentUser(user: User): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));
    console.log('👤 User saved to localStorage:', user);
  }

  getCurrentUser(): User | null {
    const userData = localStorage.getItem(this.userKey);
    return userData ? JSON.parse(userData) : null;
  }

  removeCurrentUser(): void {
    localStorage.removeItem(this.userKey);
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) {
      console.log(' No token found');
      return false;
    }
    
    // Check if token is expired
    const user = this.decodeToken(token);
    if (!user || !user.exp) {
      console.log(' No user or exp in token');
      return false;
    }
    
    const isExpired = Date.now() >= user.exp * 1000;
    if (isExpired) {
      console.log(' Token expired');
      this.logout();
      return false;
    }
    console.log(' Token valid');
    return true;
  }

  logout(): void {
    console.log(' Logging out user');
    this.removeToken();
    this.removeCurrentUser();
  }

  // ==================== DASHBOARD METHODS ====================
  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/dashboard/stats`, { 
      headers: this.getHeaders() 
    }).pipe(catchError(this.handleError));
  }

  getRecentTransactions(limit: number = 10): Observable<Transaction[]> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<Transaction[]>(`${this.apiUrl}/transactions/recent`, { 
      headers: this.getHeaders(),
      params: params
    }).pipe(catchError(this.handleError));
  }

  getLowStockProducts(threshold: number = 10): Observable<Product[]> {
    const params = new HttpParams().set('threshold', threshold.toString());
    return this.http.get<Product[]>(`${this.apiUrl}/products/low-stock`, { 
      headers: this.getHeaders(),
      params: params
    }).pipe(catchError(this.handleError));
  }

  // ==================== CATEGORY METHODS ====================
  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.apiUrl}/categories`, { 
      headers: this.getHeaders() 
    }).pipe(catchError(this.handleError));
  }

  getCategory(id: number): Observable<Category> {
    return this.http.get<Category>(`${this.apiUrl}/categories/${id}`, { 
      headers: this.getHeaders() 
    }).pipe(catchError(this.handleError));
  }

  createCategory(category: CategoryRequest): Observable<Category> {
    return this.http.post<Category>(`${this.apiUrl}/categories`, category, { 
      headers: this.getHeaders() 
    }).pipe(catchError(this.handleError));
  }

  updateCategory(id: number, category: CategoryRequest): Observable<Category> {
    return this.http.put<Category>(`${this.apiUrl}/categories/${id}`, category, { 
      headers: this.getHeaders() 
    }).pipe(catchError(this.handleError));
  }

  deleteCategory(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/categories/${id}`, { 
      headers: this.getHeaders() 
    }).pipe(catchError(this.handleError));
  }

  // ==================== PRODUCT METHODS ====================
  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/products`, { 
      headers: this.getHeaders() 
    }).pipe(catchError(this.handleError));
  }

  getProduct(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/products/${id}`, { 
      headers: this.getHeaders() 
    }).pipe(catchError(this.handleError));
  }

  searchProducts(query: string): Observable<Product[]> {
    const params = new HttpParams().set('query', query);
    return this.http.get<Product[]>(`${this.apiUrl}/products/search`, { 
      headers: this.getHeaders(),
      params: params
    }).pipe(catchError(this.handleError));
  }

  createProduct(product: ProductRequest): Observable<Product> {
    return this.http.post<Product>(`${this.apiUrl}/products`, product, { 
      headers: this.getHeaders() 
    }).pipe(catchError(this.handleError));
  }

  updateProduct(id: number, product: ProductRequest): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/products/${id}`, product, { 
      headers: this.getHeaders() 
    }).pipe(catchError(this.handleError));
  }

  deleteProduct(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/products/${id}`, { 
      headers: this.getHeaders() 
    }).pipe(catchError(this.handleError));
  }

  // ==================== SUPPLIER METHODS ====================
  getSuppliers(): Observable<Supplier[]> {
    return this.http.get<Supplier[]>(`${this.apiUrl}/suppliers`, { 
      headers: this.getHeaders() 
    }).pipe(catchError(this.handleError));
  }

  getSupplier(id: number): Observable<Supplier> {
    return this.http.get<Supplier>(`${this.apiUrl}/suppliers/${id}`, { 
      headers: this.getHeaders() 
    }).pipe(catchError(this.handleError));
  }

  createSupplier(supplier: SupplierRequest): Observable<Supplier> {
    return this.http.post<Supplier>(`${this.apiUrl}/suppliers`, supplier, { 
      headers: this.getHeaders() 
    }).pipe(catchError(this.handleError));
  }

  updateSupplier(id: number, supplier: SupplierRequest): Observable<Supplier> {
    return this.http.put<Supplier>(`${this.apiUrl}/suppliers/${id}`, supplier, { 
      headers: this.getHeaders() 
    }).pipe(catchError(this.handleError));
  }

  deleteSupplier(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/suppliers/${id}`, { 
      headers: this.getHeaders() 
    }).pipe(catchError(this.handleError));
  }

  // ==================== TRANSACTION METHODS ====================
  getTransactions(): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(`${this.apiUrl}/transactions`, { 
      headers: this.getHeaders() 
    }).pipe(catchError(this.handleError));
  }

  getTransaction(id: number): Observable<Transaction> {
    return this.http.get<Transaction>(`${this.apiUrl}/transactions/${id}`, { 
      headers: this.getHeaders() 
    }).pipe(catchError(this.handleError));
  }

  createTransaction(transaction: TransactionRequest & { type?: string; customerName?: string; customerEmail?: string }): Observable<Transaction> {
    console.log(' === CREATE TRANSACTION DEBUG ===');
    console.log(' Endpoint:', `${this.apiUrl}/transactions`);
    console.log(' Transaction payload:', JSON.stringify(transaction, null, 2));
    console.log(' Headers:', this.getHeaders());
    console.log(' Token exists:', !!this.getToken());
    console.log(' Current user:', this.getCurrentUser());
    console.log(' === END DEBUG ===');
    
    return this.http.post<Transaction>(`${this.apiUrl}/transactions`, transaction, { 
      headers: this.getHeaders() 
    }).pipe(
      tap(response => {
        console.log(' Transaction created successfully:', response);
      }),
      catchError(error => {
        console.error(' Transaction creation failed:');
        console.error('Status:', error.status);
        console.error('Status Text:', error.statusText);
        console.error('Error:', error.error);
        return this.handleError(error);
      })
    );
  }

  getTransactionsByDateRange(startDate: string, endDate: string): Observable<Transaction[]> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);
    
    return this.http.get<Transaction[]>(`${this.apiUrl}/transactions/range`, { 
      headers: this.getHeaders(),
      params: params
    }).pipe(catchError(this.handleError));
  }

  // ==================== USER METHODS ====================
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users`, { 
      headers: this.getHeaders() 
    }).pipe(catchError(this.handleError));
  }

  getUser(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/${id}`, { 
      headers: this.getHeaders() 
    }).pipe(catchError(this.handleError));
  }

  getCurrentUserProfile(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/profile`, { 
      headers: this.getHeaders() 
    }).pipe(catchError(this.handleError));
  }

  updateUser(id: number, userData: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/users/${id}`, userData, { 
      headers: this.getHeaders() 
    }).pipe(catchError(this.handleError));
  }

  updateProfile(userData: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/users/profile`, userData, { 
      headers: this.getHeaders() 
    }).pipe(catchError(this.handleError));
  }

  changePassword(passwordData: { currentPassword: string; newPassword: string }): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/change-password`, passwordData, { 
      headers: this.getHeaders() 
    }).pipe(catchError(this.handleError));
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/${id}`, { 
      headers: this.getHeaders() 
    }).pipe(catchError(this.handleError));
  }

  // ==================== REPORT METHODS ====================
  getSalesReport(startDate: string, endDate: string): Observable<ReportData> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);
    
    return this.http.get<ReportData>(`${this.apiUrl}/reports/sales`, { 
      headers: this.getHeaders(),
      params: params
    }).pipe(catchError(this.handleError));
  }

  getInventoryReport(): Observable<ReportData> {
    return this.http.get<ReportData>(`${this.apiUrl}/reports/inventory`, { 
      headers: this.getHeaders() 
    }).pipe(catchError(this.handleError));
  }

  getPurchaseReport(startDate: string, endDate: string): Observable<ReportData> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);
    
    return this.http.get<ReportData>(`${this.apiUrl}/reports/purchases`, { 
      headers: this.getHeaders(),
      params: params
    }).pipe(catchError(this.handleError));
  }

  // ==================== SETTINGS METHODS ====================
  getSettings(): Observable<Settings> {
    return this.http.get<Settings>(`${this.apiUrl}/settings`, { 
      headers: this.getHeaders() 
    }).pipe(catchError(this.handleError));
  }

  updateSettings(settings: Settings): Observable<Settings> {
    return this.http.put<Settings>(`${this.apiUrl}/settings`, settings, { 
      headers: this.getHeaders() 
    }).pipe(catchError(this.handleError));
  }

  // ==================== FILE UPLOAD METHODS ====================
  uploadProductImage(productId: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.http.post(`${this.apiUrl}/products/${productId}/upload-image`, formData, {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${this.getToken()}`
      })
    }).pipe(catchError(this.handleError));
  }

  importProducts(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.http.post(`${this.apiUrl}/products/import`, formData, {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${this.getToken()}`
      })
    }).pipe(catchError(this.handleError));
  }

  exportTransactions(format: 'csv' | 'excel' = 'csv'): Observable<Blob> {
    const params = new HttpParams().set('format', format);
    
    return this.http.get(`${this.apiUrl}/transactions/export`, {
      headers: this.getHeaders(),
      params: params,
      responseType: 'blob'
    }).pipe(catchError(this.handleError));
  }

  // ==================== ERROR HANDLING ====================
  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error(' === FULL ERROR DETAILS ===');
    console.error(' Status:', error.status);
    console.error(' Status Text:', error.statusText);
    console.error(' URL:', error.url);
    console.error(' Request method:', error.name || 'Unknown');
    console.error(' Error message:', error.message);
    console.error(' Error object:', error.error);
    
    let errorMessage = 'An error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
      console.error(' Client-side error:', error.error);
    } else {
      // Server-side error
      switch (error.status) {
        case 0:
          errorMessage = 'Network error. Please check your connection.';
          console.error(' Network error - server unreachable');
          break;
        case 400:
          errorMessage = error.error?.message || 'Bad request. Please check your data.';
          console.error(' Bad request details:', error.error);
          break;
        case 401:
          errorMessage = 'Unauthorized access. Please login again.';
          console.error(' Unauthorized - token invalid or missing');
          console.log(' Current user at 401:', this.getCurrentUser());
          console.log(' Token at 401:', this.getToken() ? 'Present' : 'Missing');
          // Auto logout on 401
          this.logout();
          break;
        case 403:
          errorMessage = 'Access forbidden. You do not have permission.';
          console.error(' Forbidden - User details:');
          console.error('   User:', this.getCurrentUser());
          console.error('   Token:', this.getToken() ? 'Present' : 'Missing');
          console.error('   User Role:', this.getCurrentUser()?.role);
          console.error('   Required Role for transactions: ADMIN or OWNER');
          break;
        case 404:
          errorMessage = 'Resource not found.';
          console.error(' Not found - URL might be wrong:', error.url);
          break;
        case 409:
          errorMessage = error.error?.message || 'Conflict. Resource already exists.';
          console.error(' Conflict error:', error.error);
          break;
        case 422:
          errorMessage = error.error?.message || 'Validation error. Please check your input.';
          console.error(' Validation error:', error.error);
          break;
        case 500:
          errorMessage = 'Server error. Please try again later.';
          console.error(' Server error:', error.error);
          break;
        default:
          errorMessage = error.error?.message || error.message || `Error Code: ${error.status}`;
          console.error(' Unknown error:', error);
      }
    }
    
    console.error(' === END ERROR DETAILS ===');
    
    return throwError(() => new Error(errorMessage));
  }

  // ==================== UTILITY METHODS ====================
  getApiStatus(): Observable<{ status: string; version: string }> {
    return this.http.get<{ status: string; version: string }>(`${this.apiUrl}/health`)
      .pipe(catchError(this.handleError));
  }

  clearCache(): void {
  
    localStorage.removeItem('products_cache');
    localStorage.removeItem('categories_cache');
  
  }

  // ==================== TEST METHODS ====================
  testSimpleTransaction(): Observable<any> {
    console.log(' Testing simple transaction...');
    
    const testData = {
      userId: 1,
      productId: 1,
      quantity: 1,
      unitPrice: 10,
      totalPrice: 10,
      type: 'PURCHASE',
      transactionDate: new Date().toISOString(),
      notes: 'Test transaction'
    };
    
    console.log('Test payload:', testData);
    
    return this.createTransaction(testData);
  }
}