import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';
import { LoginComponent } from './components/auth/login/login.component';
import { RegisterComponent } from './components/auth/login/register/register.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ProductComponent } from './components/product/product.component';
import { AddEditProductComponent } from './components/product/add-edit-product.component';
import { CategoryComponent } from './components/category/category.component';
import { AddEditCategoryComponent } from './components/category/add-edit-category.component';
import { SupplierComponent } from './components/supplier/supplier.component';
import { AddEditSupplierComponent } from './components/supplier/add-edit-supplier.component';
import { TransactionComponent } from './components/transaction/transaction.component';
import { PurchaseComponent } from './components/transaction/purchase.component';
import { SellComponent } from './components/transaction/sell.component';
import { ProfileComponent } from './components/profile/profile.component';
import { UsersComponent } from './components/users/users.component'; 
import { ReportsComponent } from './components/reports/reports.component'; 
import { SettingsComponent } from './components/settings/settings.component'; 

export const routes: Routes = [
  // Public routes
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  
  // Protected routes
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  
  { path: 'products', component: ProductComponent, canActivate: [AuthGuard] },
  { path: 'products/add', component: AddEditProductComponent, canActivate: [AuthGuard] },
  { path: 'products/edit/:id', component: AddEditProductComponent, canActivate: [AuthGuard] },
  
  { path: 'categories', component: CategoryComponent, canActivate: [AuthGuard] },
  { path: 'categories/add', component: AddEditCategoryComponent, canActivate: [AuthGuard] },
  { path: 'categories/edit/:id', component: AddEditCategoryComponent, canActivate: [AuthGuard] },
  
  { path: 'suppliers', component: SupplierComponent, canActivate: [AuthGuard] },
  { path: 'suppliers/add', component: AddEditSupplierComponent, canActivate: [AuthGuard] },
  { path: 'suppliers/edit/:id', component: AddEditSupplierComponent, canActivate: [AuthGuard] },
  
  { path: 'transactions', component: TransactionComponent, canActivate: [AuthGuard] },
  { path: 'purchase', component: PurchaseComponent, canActivate: [AuthGuard] },
  { path: 'sell', component: SellComponent, canActivate: [AuthGuard] },
  
  { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard] },
  
  // Role-based protected routes

{ 
  path: 'users', 
  component: UsersComponent, 
  canActivate: [AuthGuard, RoleGuard], // Use both guards
  data: { roles: ['OWNER', 'ADMIN'] }
},
{ 
  path: 'reports', 
  component: ReportsComponent, 
  canActivate: [AuthGuard, RoleGuard],
  data: { roles: ['OWNER', 'ADMIN'] }
},
{ 
  path: 'settings', 
  component: SettingsComponent, 
  canActivate: [AuthGuard, RoleGuard],
  data: { roles: ['OWNER'] }
},
  // Redirects
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: '/dashboard' }
];