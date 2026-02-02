import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { Supplier } from '../../models';

@Component({
  selector: 'app-supplier',
  templateUrl: './supplier.component.html',
  styleUrls: ['./supplier.component.css'],
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule]
})
export class SupplierComponent implements OnInit, OnDestroy {
  suppliers: Supplier[] = [];
  filteredSuppliers: Supplier[] = [];
  loading = false;
  errorMessage = '';
  deleteConfirmId: number | null = null;

  // Search and filter
  searchTerm = '';
  sortColumn = 'name';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;

  // Modal state
  showDeleteModal = false;

  private destroy$ = new Subject<void>();

  // Expose Math to template if needed
  Math = Math;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadSuppliers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadSuppliers(): void {
    this.loading = true;
    this.apiService.getSuppliers().subscribe({
      next: (suppliers) => {
        this.suppliers = suppliers;
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading suppliers:', error);
        this.errorMessage = 'Failed to load suppliers';
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.suppliers];

    // Apply search filter
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(supplier =>
        supplier.name.toLowerCase().includes(term) ||
        supplier.email.toLowerCase().includes(term) ||
        supplier.phone.toLowerCase().includes(term) ||
        supplier.address.toLowerCase().includes(term)
      );
    }

    // Apply sorting
    this.sortSuppliers(filtered);

    this.filteredSuppliers = filtered;
    this.totalItems = filtered.length;
    this.currentPage = 1; // Reset to first page after filtering
  }

  sortSuppliers(suppliers: Supplier[]): void {
    suppliers.sort((a, b) => {
      const aValue = (a as any)[this.sortColumn];
      const bValue = (b as any)[this.sortColumn];

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return this.sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return this.sortDirection === 'asc'
        ? Number(aValue) - Number(bValue)
        : Number(bValue) - Number(aValue);
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
    this.applyFilters();
  }

  confirmDelete(id: number): void {
    this.deleteConfirmId = id;
    this.showDeleteModal = true;
  }

  cancelDelete(): void {
    this.deleteConfirmId = null;
    this.showDeleteModal = false;
  }

  deleteSupplier(): void {
    if (!this.deleteConfirmId) return;

    this.loading = true;
    this.apiService.deleteSupplier(this.deleteConfirmId).subscribe({
      next: () => {
        this.suppliers = this.suppliers.filter(s => s.id !== this.deleteConfirmId);
        this.filteredSuppliers = this.filteredSuppliers.filter(s => s.id !== this.deleteConfirmId);
        this.totalItems = this.filteredSuppliers.length;
        this.deleteConfirmId = null;
        this.showDeleteModal = false;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error deleting supplier:', error);
        this.errorMessage = 'Failed to delete supplier';
        this.deleteConfirmId = null;
        this.showDeleteModal = false;
        this.loading = false;
      }
    });
  }

  // Pagination
  get paginatedSuppliers(): Supplier[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredSuppliers.slice(startIndex, startIndex + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  get pageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  getContactInfo(supplier: Supplier): string {
    const parts = [];
    if (supplier.email) parts.push(supplier.email);
    if (supplier.phone) parts.push(supplier.phone);
    return parts.join(' • ');
  }

  // Precompute supplier stats to avoid using Math in template
  getSupplierStats(supplier: Supplier): { label: string; value: number; class: string }[] {
    return [
      { label: 'Products', value: this.randomInt(1, 50), class: 'bg-primary' },
      { label: 'Orders', value: this.randomInt(1, 100), class: 'bg-success' },
      { label: 'Rating', value: this.randomInt(1, 5), class: 'bg-warning' }
    ];
  }

  private randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  copyToClipboard(text: string, type: string): void {
    navigator.clipboard.writeText(text).then(() => {
      console.log(`${type} copied to clipboard`);
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  }

  exportToCSV(): void {
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Address', 'Products', 'Orders', 'Rating'];
    const rows = this.filteredSuppliers.map(supplier => {
      const stats = this.getSupplierStats(supplier);
      return [
        supplier.id,
        supplier.name,
        supplier.email,
        supplier.phone,
        supplier.address,
        stats[0].value,
        stats[1].value,
        stats[2].value
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `suppliers_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }
}
