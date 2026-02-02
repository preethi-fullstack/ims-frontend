import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Transaction } from '../../models';

@Component({
  selector: 'app-transaction',
  templateUrl: './transaction.component.html',
  styleUrls: ['./transaction.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class TransactionComponent implements OnInit {
  transactions: Transaction[] = [];
  filteredTransactions: Transaction[] = [];
  loading = false;
  errorMessage = '';

  // Search and filter
  searchTerm = '';
  filterType = 'all';
  startDate: string = '';
  endDate: string = '';

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;

  // Sorting
  sortColumn = 'transactionDate';
  sortDirection = 'desc';

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadTransactions();
    this.setDefaultDateRange();
  }

  setDefaultDateRange(): void {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);

    this.endDate = end.toISOString().split('T')[0];
    this.startDate = start.toISOString().split('T')[0];
  }

  loadTransactions(): void {
    this.loading = true;
    this.apiService.getTransactions().subscribe({
      next: (transactions) => {
        this.transactions = transactions;
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading transactions:', error);
        this.errorMessage = 'Failed to load transactions';
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.transactions];

    // Date filter
    if (this.startDate && this.endDate) {
      const start = new Date(this.startDate);
      const end = new Date(this.endDate);
      end.setHours(23, 59, 59, 999);

      filtered = filtered.filter(transaction => {
        const transDate = new Date(transaction.transactionDate);
        return transDate >= start && transDate <= end;
      });
    }

    // Type filter (UPDATED: Now uses type field)
    if (this.filterType !== 'all') {
      filtered = filtered.filter(transaction => {
        if (this.filterType === 'purchase') {
          return transaction.type === 'PURCHASE';
        } else {
          return transaction.type === 'SALE';
        }
      });
    }

    // Search filter
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(transaction =>
        transaction.userName?.toLowerCase().includes(term) ||
        transaction.productName?.toLowerCase().includes(term) ||
        transaction.supplierName?.toLowerCase().includes(term) ||
        transaction.customerName?.toLowerCase().includes(term) ||
        transaction.id.toString().includes(term)
      );
    }

    // Sorting
    this.sortTransactions(filtered);

    this.filteredTransactions = filtered;
    this.totalItems = filtered.length;
    this.currentPage = 1;
  }

  sortTransactions(transactions: Transaction[]): void {
    transactions.sort((a, b) => {
      const aValue = this.getSortValue(a, this.sortColumn);
      const bValue = this.getSortValue(b, this.sortColumn);

      if (this.sortColumn === 'transactionDate') {
        return this.sortDirection === 'asc'
          ? new Date(aValue).getTime() - new Date(bValue).getTime()
          : new Date(bValue).getTime() - new Date(aValue).getTime();
      }

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

  getSortValue(transaction: Transaction, column: string): any {
    switch (column) {
      case 'id': return transaction.id;
      case 'userName': return transaction.userName;
      case 'productName': return transaction.productName;
      case 'supplierName': return transaction.supplierName || '';
      case 'customerName': return transaction.customerName || '';
      case 'type': return transaction.type || '';
      case 'quantity': return transaction.quantity;
      case 'totalPrice': return transaction.totalPrice;
      case 'transactionDate': return transaction.transactionDate;
      default: return transaction[column as keyof Transaction];
    }
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
    this.filterType = 'all';
    this.setDefaultDateRange();
    this.applyFilters();
  }

  // Pagination
  get paginatedTransactions(): Transaction[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredTransactions.slice(startIndex, startIndex + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredTransactions.length / this.itemsPerPage);
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

  // ========================
  // Utility & Formatting
  // ========================

  formatDate(dateString: string | Date): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDateSafe(date: string | Date): string {
    return this.formatDate(date);
  }

  formatTime(date: string | Date): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  // Transaction helpers (UPDATED: Now uses type field)
  getTransactionType(transaction: Transaction): string {
    return transaction.type === 'PURCHASE' ? 'Purchase' : 'Sale';
  }

  getTransactionTypeClass(transaction: Transaction): string {
    return transaction.type === 'PURCHASE' 
      ? 'badge bg-success' 
      : 'badge bg-primary';
  }

  getTransactionIcon(transaction: Transaction): string {
    return transaction.type === 'PURCHASE' 
      ? 'bi-arrow-down-circle' 
      : 'bi-arrow-up-circle';
  }

  // Pagination index helpers
  getStartIndex(): number {
    return this.filteredTransactions.length === 0
      ? 0
      : (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  getEndIndex(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.filteredTransactions.length);
  }

  // Totals
  getTotalPurchases(): number {
    return this.filteredTransactions.filter(t => t.type === 'PURCHASE').length;
  }

  getTotalSales(): number {
    return this.filteredTransactions.filter(t => t.type === 'SALE').length;
  }

  getTotalValue(): number {
    return this.filteredTransactions.reduce((sum, t) => sum + t.totalPrice, 0);
  }

  getTotalItems(): number {
    return this.filteredTransactions.reduce((sum, t) => sum + t.quantity, 0);
  }

  getPurchaseValue(): number {
    return this.filteredTransactions
      .filter(t => t.type === 'PURCHASE')
      .reduce((sum, t) => sum + t.totalPrice, 0);
  }

  getSaleValue(): number {
    return this.filteredTransactions
      .filter(t => t.type === 'SALE')
      .reduce((sum, t) => sum + t.totalPrice, 0);
  }

  // Export
  exportToCSV(): void {
    const headers = ['ID', 'Type', 'User', 'Product', 'Supplier', 'Customer', 'Quantity', 'Total Price', 'Date'];
    const rows = this.filteredTransactions.map(trans => [
      trans.id,
      this.getTransactionType(trans),
      trans.userName,
      trans.productName,
      trans.supplierName || 'N/A',
      trans.customerName || 'N/A',
      trans.quantity,
      this.formatCurrency(trans.totalPrice),
      this.formatDate(trans.transactionDate)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  // Refresh transactions
  refreshTransactions(): void {
    this.loadTransactions();
  }
}