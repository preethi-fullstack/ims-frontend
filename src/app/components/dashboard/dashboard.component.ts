import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Category, Product, Supplier, Transaction } from '../../models';

interface DashboardStats {
  totalProducts: number;
  totalCategories: number;
  totalSuppliers: number;
  totalTransactions: number;
  lowStockProducts: number;
  recentTransactions: Transaction[];
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  standalone: true,
  imports: [CommonModule, RouterLink]
})
export class DashboardComponent implements OnInit {
  loading = true;

  stats: DashboardStats = {
    totalProducts: 0,
    totalCategories: 0,
    totalSuppliers: 0,
    totalTransactions: 0,
    lowStockProducts: 0,
    recentTransactions: [] as Transaction[]
  };

  recentProducts: Product[] = [];

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loading = true;

    // Load all data in parallel
    Promise.all([
      this.apiService.getProducts().toPromise(),
      this.apiService.getCategories().toPromise(),
      this.apiService.getSuppliers().toPromise(),
      this.apiService.getTransactions().toPromise()
    ])
      .then(([products, categories, suppliers, transactions]) => {
        if (products) {
          this.stats.totalProducts = products.length;
          this.stats.lowStockProducts = products.filter(p => p.quantity < 10).length;
          this.recentProducts = products.slice(0, 5);
        }

        if (categories) {
          this.stats.totalCategories = categories.length;
        }

        if (suppliers) {
          this.stats.totalSuppliers = suppliers.length;
        }

        if (transactions) {
          this.stats.totalTransactions = transactions.length;
          this.stats.recentTransactions = transactions.slice(0, 5);
        }

        this.loading = false;
      })
      .catch(error => {
        console.error('Error loading dashboard data:', error);
        this.loading = false;
      });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  formatDate(date: string | Date): string {
    if (!date) return 'N/A';
    
    // Handle both string and Date types
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date';
    }
    
    return dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  getStockStatus(quantity: number): string {
    if (quantity === 0) return 'Out of Stock';
    if (quantity < 10) return 'Low Stock';
    if (quantity < 50) return 'Medium Stock';
    return 'In Stock';
  }

  getStockStatusClass(quantity: number): string {
    if (quantity === 0) return 'bg-danger';
    if (quantity < 10) return 'bg-warning';
    if (quantity < 50) return 'bg-info';
    return 'bg-success';
  }
}