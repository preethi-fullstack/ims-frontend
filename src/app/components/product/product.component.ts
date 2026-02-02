import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { Product, Category } from '../../models';

@Component({
  selector: 'app-product',
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink, CurrencyPipe]
})
export class ProductComponent implements OnInit, OnDestroy {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  categories: Category[] = [];
  loading = false;
  errorMessage = '';
  deleteConfirmId: number | null = null;

  // Search and filter
  searchTerm = '';
  selectedCategoryId: number | null = null;
  stockFilter: string = 'all';
  sortColumn = 'name';
  sortDirection = 'asc';

  // Pagination
  currentPage = 1;
  itemsPerPage = 12;
  totalItems = 0;

  // View mode
  viewMode: 'grid' | 'list' = 'grid';

  // Modal state
  showDeleteModal = false;
  selectedProduct: Product | null = null;

  private destroy$ = new Subject<void>();

  constructor(@Inject(ApiService) private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData(): void {
    this.loading = true;
    Promise.all([
      this.apiService.getProducts().toPromise(),
      this.apiService.getCategories().toPromise()
    ])
      .then(([products, categories]) => {
        this.products = products || [];
        this.categories = categories || [];
        this.applyFilters();
        this.loading = false;
      })
      .catch(error => {
        console.error(error);
        this.errorMessage = 'Failed to load data';
        this.loading = false;
      });
  }

  applyFilters(): void {
    let filtered = [...this.products];

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term) ||
        p.categoryName.toLowerCase().includes(term)
      );
    }

    if (this.selectedCategoryId) {
      filtered = filtered.filter(p => p.categoryId === this.selectedCategoryId);
    }

    switch (this.stockFilter) {
      case 'in-stock':
        filtered = filtered.filter(p => p.quantity >= 50);
        break;
      case 'low-stock':
        filtered = filtered.filter(p => p.quantity > 0 && p.quantity < 50);
        break;
      case 'out-of-stock':
        filtered = filtered.filter(p => p.quantity === 0);
        break;
    }

    this.sortProducts(filtered);
    this.filteredProducts = filtered;
    this.totalItems = filtered.length;
    this.currentPage = 1;
  }

  sortProducts(products: Product[]): void {
    products.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (this.sortColumn) {
        case 'name':
          aValue = a.name; bValue = b.name; break;
        case 'category':
          aValue = a.categoryName; bValue = b.categoryName; break;
        case 'price':
          aValue = a.price; bValue = b.price; break;
        case 'quantity':
          aValue = a.quantity; bValue = b.quantity; break;
        default:
          aValue = a.name; bValue = b.name;
      }

      if (typeof aValue === 'string') return this.sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      return this.sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });
  }

  onSort(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedCategoryId = null;
    this.stockFilter = 'all';
    this.applyFilters();
  }

  setViewMode(mode: 'grid' | 'list'): void {
    this.viewMode = mode;
  }

  confirmDelete(product: Product): void {
    this.selectedProduct = product;
    this.showDeleteModal = true;
  }

  cancelDelete(): void {
    this.selectedProduct = null;
    this.showDeleteModal = false;
  }

  deleteProduct(): void {
    if (!this.selectedProduct) return;
    this.loading = true;
    this.apiService.deleteProduct(this.selectedProduct.id).subscribe({
      next: () => {
        this.products = this.products.filter(p => p.id !== this.selectedProduct!.id);
        this.filteredProducts = this.filteredProducts.filter(p => p.id !== this.selectedProduct!.id);
        this.totalItems = this.filteredProducts.length;
        this.selectedProduct = null;
        this.showDeleteModal = false;
        this.loading = false;
      },
      error: err => {
        console.error(err);
        this.errorMessage = 'Failed to delete product';
        this.selectedProduct = null;
        this.showDeleteModal = false;
        this.loading = false;
      }
    });
  }

  // Pagination
  get paginatedProducts(): Product[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredProducts.slice(start, start + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  get pageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) this.currentPage = page;
  }

  // Utility
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  }

  getStockStatus(quantity: number) {
    if (quantity === 0) return { text: 'Out of Stock', class: 'danger', icon: 'bi-x-circle' };
    if (quantity < 10) return { text: 'Low Stock', class: 'warning', icon: 'bi-exclamation-triangle' };
    if (quantity < 50) return { text: 'Medium Stock', class: 'info', icon: 'bi-info-circle' };
    return { text: 'In Stock', class: 'success', icon: 'bi-check-circle' };
  }

  getCategoryName(categoryId: number): string {
    const category = this.categories.find(c => c.id === categoryId);
    return category ? category.name : 'Unknown';
  }

  getTotalValue(): number {
    return this.filteredProducts.reduce((sum, p) => sum + p.price * p.quantity, 0);
  }

  getLowStockCount(): number {
    return this.filteredProducts.filter(p => p.quantity > 0 && p.quantity < 10).length;
  }

  getOutOfStockCount(): number {
    return this.filteredProducts.filter(p => p.quantity === 0).length;
  }

  exportToCSV(): void {
    const headers = ['ID','Name','Category','Description','Price','Quantity','Stock Status','Total Value'];
    const rows = this.filteredProducts.map(p => {
      const status = this.getStockStatus(p.quantity);
      return [p.id, p.name, p.categoryName, p.description, this.formatCurrency(p.price), p.quantity, status.text, this.formatCurrency(p.price * p.quantity)];
    });
    const csvContent = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `products_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  // Quick actions (fixes your template error)
  quickAction(action: string, product: Product): void {
    switch (action) {
      case 'purchase': console.log('Purchase', product.name); break;
      case 'sell': console.log('Sell', product.name); break;
      case 'view': console.log('View', product.name); break;
    }
  }
}
