import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Transaction, Product } from '../../models';
import { PermissionService } from 'src/app/utils/permission.service';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class ReportsComponent implements OnInit {
  transactions: Transaction[] = [];
  products: Product[] = [];
  loading = false;
  errorMessage = '';
  
  // Report types
  reportType = 'sales';
  startDate = '';
  endDate = '';
  
  // Report data
  salesData: any[] = [];
  inventoryData: any[] = [];
  performanceData: any[] = [];

  constructor(
    @Inject(ApiService) private apiService: ApiService
  ) {}

  ngOnInit(): void {
    this.setDefaultDateRange();
    this.loadData();
  }

  setDefaultDateRange(): void {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30); // Monthly view
    this.endDate = end.toISOString().split('T')[0];
    this.startDate = start.toISOString().split('T')[0];
  }

  loadData(): void {
    this.loading = true;
    Promise.all([
      this.apiService.getTransactions().toPromise(),
      this.apiService.getProducts().toPromise()
    ]).then(([transactions, products]) => {
      if (transactions) {
        this.transactions = transactions;
        this.generateSalesReport();
      }
      if (products) {
        this.products = products;
        this.generateInventoryReport();
      }
      this.generatePerformanceReport();
      this.loading = false;
    }).catch(error => {
      console.error('Error loading report data:', error);
      this.errorMessage = 'Failed to load report data';
      this.loading = false;
    });
  }

  generateSalesReport(): void {
    const filtered = this.filterByDateRange(this.transactions);
    
    // Group by day
    const dailySales = new Map<string, { date: string; sales: number; purchases: number }>();
    
    filtered.forEach(transaction => {
      const date = new Date(transaction.transactionDate).toLocaleDateString();
      const isSale = !transaction.supplierName || transaction.supplierName === 'N/A';
      
      const current = dailySales.get(date) || { date, sales: 0, purchases: 0 };
      
      if (isSale) {
        current.sales += transaction.totalPrice;
      } else {
        current.purchases += transaction.totalPrice;
      }
      
      dailySales.set(date, current);
    });
    
    this.salesData = Array.from(dailySales.values())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  generateInventoryReport(): void {
    this.inventoryData = this.products.map(product => ({
      name: product.name,
      category: product.categoryName,
      quantity: product.quantity,
      price: product.price,
      totalValue: product.quantity * product.price,
      status: this.getStockStatus(product.quantity)
    })).sort((a, b) => b.totalValue - a.totalValue);
  }

  generatePerformanceReport(): void {
    // Group transactions by user
    const userPerformance = new Map<string, { name: string; sales: number; transactions: number }>();
    
    this.transactions.forEach(transaction => {
      if (!transaction.supplierName || transaction.supplierName === 'N/A') {
        const current = userPerformance.get(transaction.userName) || {
          name: transaction.userName,
          sales: 0,
          transactions: 0
        };
        current.sales += transaction.totalPrice;
        current.transactions += 1;
        userPerformance.set(transaction.userName, current);
      }
    });
    
    this.performanceData = Array.from(userPerformance.values())
      .sort((a, b) => b.sales - a.sales);
  }

  filterByDateRange(items: any[]): any[] {
    if (!this.startDate || !this.endDate) return items;
    
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    end.setHours(23, 59, 59, 999);
    
    return items.filter(item => {
      const itemDate = new Date(item.transactionDate || new Date());
      return itemDate >= start && itemDate <= end;
    });
  }

  getStockStatus(quantity: number): string {
    if (quantity === 0) return 'Out of Stock';
    if (quantity < 10) return 'Low Stock';
    if (quantity < 50) return 'Medium Stock';
    return 'In Stock';
  }

  exportReport(): void {
    let csvContent = '';
    let filename = '';
    
    switch (this.reportType) {
      case 'sales':
        csvContent = this.generateSalesCSV();
        filename = `sales-report-${this.startDate}-to-${this.endDate}.csv`;
        break;
      case 'inventory':
        csvContent = this.generateInventoryCSV();
        filename = `inventory-report-${new Date().toISOString().split('T')[0]}.csv`;
        break;
      case 'performance':
        csvContent = this.generatePerformanceCSV();
        filename = `performance-report-${this.startDate}-to-${this.endDate}.csv`;
        break;
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  generateSalesCSV(): string {
    const headers = ['Date', 'Sales', 'Purchases', 'Net'];
    const rows = this.salesData.map(data => [
      data.date,
      data.sales.toFixed(2),
      data.purchases.toFixed(2),
      (data.sales - data.purchases).toFixed(2)
    ]);
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  generateInventoryCSV(): string {
    const headers = ['Product', 'Category', 'Quantity', 'Price', 'Total Value', 'Status'];
    const rows = this.inventoryData.map(data => [
      data.name,
      data.category,
      data.quantity,
      data.price.toFixed(2),
      data.totalValue.toFixed(2),
      data.status
    ]);
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  generatePerformanceCSV(): string {
    const headers = ['Employee', 'Total Sales', 'Transactions', 'Average Sale'];
    const rows = this.performanceData.map(data => [
      data.name,
      data.sales.toFixed(2),
      data.transactions,
      (data.sales / data.transactions).toFixed(2)
    ]);
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }
// Add these helper methods to your class
getReportTypeName(): string {
  switch (this.reportType) {
    case 'sales': return 'Sales Report';
    case 'inventory': return 'Inventory Report';
    case 'performance': return 'Performance Report';
    default: return 'Report';
  }
}

getTotalSales(): number {
  return this.salesData.reduce((sum, data) => sum + data.sales, 0);
}

getTotalPurchases(): number {
  return this.salesData.reduce((sum, data) => sum + data.purchases, 0);
}

getStockStatusSummary(): Array<{ status: string; count: number }> {
  const statusCounts = new Map<string, number>();
  this.inventoryData.forEach(item => {
    const count = statusCounts.get(item.status) || 0;
    statusCounts.set(item.status, count + 1);
  });
  
  return Array.from(statusCounts.entries()).map(([status, count]) => ({
    status,
    count
  }));
}

getTotalInventoryValue(): number {
  return this.inventoryData.reduce((sum, item) => sum + item.totalValue, 0);
}

getTopPerformer(): any {
  return this.performanceData[0];
}

getTotalPerformanceSales(): number {
  return this.performanceData.reduce((sum, data) => sum + data.sales, 0);
}

getAverageSalePerEmployee(): number {
  if (this.performanceData.length === 0) return 0;
  return this.getTotalPerformanceSales() / this.performanceData.length;
}
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }
}