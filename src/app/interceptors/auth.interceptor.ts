import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const apiService = inject(ApiService);
  const router = inject(Router);
  
  // Only add token to non-auth requests
  if (!req.url.includes('/auth/') && !req.url.includes('/users/register')) {
    const token = apiService.getToken();
    
    if (token) {
      // Clone request and add authorization header
      const authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
      return next(authReq);
    } else {
      // User is not logged in, redirect to login
      console.warn('User not logged in, redirecting to login');
      apiService.logout();
      router.navigate(['/login'], { 
        queryParams: { returnUrl: router.url } 
      });
      return next(req);
    }
  }
  
  return next(req);
};