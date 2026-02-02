import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, timeout, retry } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { AppConstants } from './constants';
import { StorageService } from './storage.service';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  statusCode: number;
}

export interface ApiError {
  status: number;
  message: string;
  errors?: any;
}

@Injectable({
  providedIn: 'root'
})
export class HttpService {
  private apiUrl = environment.apiUrl;
  
  constructor(
    private http: HttpClient,
    private storageService: StorageService
  ) {}
  
  // Create default headers
  private getHeaders(includeAuth: boolean = true): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
    
    if (includeAuth) {
      const token = this.storageService.getToken();
      if (token) {
        headers = headers.set('Authorization', `Bearer ${token}`);
      }
    }
    
    return headers;
  }
  
  // Handle API errors
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = AppConstants.ERROR_MESSAGES.SERVER_ERROR;
    let errorDetails: ApiError = {
      status: error.status,
      message: errorMessage
    };
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorDetails.message = error.error.message;
    } else {
      // Server-side error
      switch (error.status) {
        case 0:
          errorDetails.message = 'Network error. Please check your connection.';
          break;
        case 400:
          errorDetails.message = error.error?.message || 'Bad request. Please check your input.';
          errorDetails.errors = error.error?.errors;
          break;
        case 401:
          errorDetails.message = 'Unauthorized. Please login again.';
          this.storageService.clearAuth();
          // Redirect to login page if not already there
          if (!window.location.pathname.includes('/login')) {
            window.location.href = AppConstants.ROUTES.LOGIN;
          }
          break;
        case 403:
          errorDetails.message = 'Forbidden. You do not have permission to access this resource.';
          break;
        case 404:
          errorDetails.message = error.error?.message || 'Resource not found.';
          break;
        case 409:
          errorDetails.message = error.error?.message || 'Conflict. Resource already exists.';
          break;
        case 422:
          errorDetails.message = 'Validation failed.';
          errorDetails.errors = error.error?.errors;
          break;
        case 500:
          errorDetails.message = 'Internal server error. Please try again later.';
          break;
        default:
          errorDetails.message = error.error?.message || `Error ${error.status}: ${error.statusText}`;
      }
    }
    
    console.error('API Error:', errorDetails);
    return throwError(() => errorDetails);
  }
  
  // HTTP GET
  get<T>(endpoint: string, params?: any, includeAuth: boolean = true): Observable<T> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key].toString());
        }
      });
    }
    
    return this.http.get<T>(`${this.apiUrl}${endpoint}`, {
      headers: this.getHeaders(includeAuth),
      params: httpParams
    }).pipe(
      timeout(AppConstants.API_TIMEOUT),
      retry(1),
      catchError(this.handleError.bind(this))
    );
  }
  
  // HTTP POST
  post<T>(endpoint: string, data: any, includeAuth: boolean = true): Observable<T> {
    return this.http.post<T>(`${this.apiUrl}${endpoint}`, data, {
      headers: this.getHeaders(includeAuth)
    }).pipe(
      timeout(AppConstants.API_TIMEOUT),
      catchError(this.handleError.bind(this))
    );
  }
  
  // HTTP PUT
  put<T>(endpoint: string, data: any, includeAuth: boolean = true): Observable<T> {
    return this.http.put<T>(`${this.apiUrl}${endpoint}`, data, {
      headers: this.getHeaders(includeAuth)
    }).pipe(
      timeout(AppConstants.API_TIMEOUT),
      catchError(this.handleError.bind(this))
    );
  }
  
  // HTTP PATCH
  patch<T>(endpoint: string, data: any, includeAuth: boolean = true): Observable<T> {
    return this.http.patch<T>(`${this.apiUrl}${endpoint}`, data, {
      headers: this.getHeaders(includeAuth)
    }).pipe(
      timeout(AppConstants.API_TIMEOUT),
      catchError(this.handleError.bind(this))
    );
  }
  
  // HTTP DELETE
  delete<T>(endpoint: string, includeAuth: boolean = true): Observable<T> {
    return this.http.delete<T>(`${this.apiUrl}${endpoint}`, {
      headers: this.getHeaders(includeAuth)
    }).pipe(
      timeout(AppConstants.API_TIMEOUT),
      catchError(this.handleError.bind(this))
    );
  }
  
  // File Upload
  upload<T>(endpoint: string, file: File, formData?: FormData): Observable<T> {
    const uploadFormData = formData || new FormData();
    if (file) {
      uploadFormData.append('file', file, file.name);
    }
    
    const headers = new HttpHeaders();
    const token = this.storageService.getToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    
    return this.http.post<T>(`${this.apiUrl}${endpoint}`, uploadFormData, {
      headers
    }).pipe(
      timeout(AppConstants.API_TIMEOUT * 2), // Longer timeout for uploads
      catchError(this.handleError.bind(this))
    );
  }
  
  // Download file
  download(endpoint: string, params?: any): Observable<Blob> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key].toString());
        }
      });
    }
    
    return this.http.get(`${this.apiUrl}${endpoint}`, {
      headers: this.getHeaders(),
      params: httpParams,
      responseType: 'blob'
    }).pipe(
      timeout(AppConstants.API_TIMEOUT),
      catchError(this.handleError.bind(this))
    );
  }
}