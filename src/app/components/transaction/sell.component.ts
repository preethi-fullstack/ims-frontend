import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Product } from '../../models';

interface SaleItem {
  productId: number;
  productName: string;
  availableStock: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  customerPrice?: number; // Different price for B2B customers
}

@Component({
  selector: 'app-sell',
  templateUrl: './sell.component.html',
  styleUrls: ['./sell.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink]
})
export class SellComponent implements OnInit {
  saleForm: FormGroup;
  products: Product[] = [];
  filteredProducts: Product[] = [];
  loading = false;
  submitting = false;
  errorMessage = '';
  successMessage = '';
  
  saleItems: SaleItem[] = [];
  selectedProduct: Product | null = null;
  
  // Customer info - for B2B sales
  isB2BSale = false;
  customerName = '';
  customerEmail = '';
  customerPhone = '';
  customerCompany = '';
  customerAddress = '';
  
  // Summary
  subtotal = 0;
  discount = 0;
  taxRate = 0.08; // 8%
  taxAmount = 0;
  totalAmount = 0;
  
  // B2B Bulk settings
  bulkDiscountTiers = [
    { minAmount: 500, discount: 5 },
    { minAmount: 1000, discount: 10 },
    { minAmount: 5000, discount: 15 },
    { minAmount: 10000, discount: 20 }
  ];
  
  // Sale types
  saleType: 'retail' | 'b2b' = 'retail';

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private router: Router
  ) {
    this.saleForm = this.fb.group({
      saleType: ['retail', [Validators.required]],
      productSearch: [''],
      quantity: ['', [Validators.required, Validators.min(1)]],
      unitPrice: ['', [Validators.required, Validators.min(0.01)]],
      customerName: ['', [Validators.required, Validators.minLength(2)]],
      customerEmail: ['', [Validators.email]],
      customerPhone: [''],
      customerCompany: [''],
      customerAddress: [''],
      discount: [0, [Validators.min(0), Validators.max(100)]],
      notes: [''],
      isBulkOrder: [false],
      bulkDiscount: [0]
    });
  }

  ngOnInit(): void {
    console.log('=== SELL COMPONENT INIT ===');
    this.loadProducts();
    
    // Watch for sale type changes
    this.saleForm.get('saleType')?.valueChanges.subscribe(type => {
      this.saleType = type;
      this.isB2BSale = type === 'b2b';
      this.updateFormValidation();
    });
  }

  loadProducts(): void {
    this.loading = true;
    this.apiService.getProducts().subscribe({
      next: (products) => {
        // Filter only products with available stock
        this.products = products.filter(p => p.quantity > 0);
        this.filteredProducts = [...this.products];
        console.log(`✅ Loaded ${this.products.length} products with stock`);
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Error loading products:', error);
        this.errorMessage = 'Failed to load products: ' + error.message;
        this.loading = false;
      }
    });
  }

  updateFormValidation(): void {
    const customerNameControl = this.saleForm.get('customerName');
    const customerCompanyControl = this.saleForm.get('customerCompany');
    
    if (this.isB2BSale) {
      customerNameControl?.setValidators([Validators.required, Validators.minLength(2)]);
      customerCompanyControl?.setValidators([Validators.required]);
    } else {
      customerNameControl?.setValidators([Validators.required, Validators.minLength(2)]);
      customerCompanyControl?.clearValidators();
    }
    
    customerNameControl?.updateValueAndValidity();
    customerCompanyControl?.updateValueAndValidity();
  }

  onProductSearch(): void {
    const searchTerm = this.saleForm.get('productSearch')?.value.toLowerCase() || '';
    
    if (!searchTerm) {
      this.filteredProducts = [...this.products];
      this.selectedProduct = null;
      return;
    }
    
    this.filteredProducts = this.products.filter(product =>
      product.name.toLowerCase().includes(searchTerm) ||
      product.description?.toLowerCase().includes(searchTerm) ||
      product.categoryName?.toLowerCase().includes(searchTerm)
    );
  }

  selectProduct(product: Product): void {
    this.selectedProduct = product;
    const defaultPrice = this.isB2BSale ? product.price * 0.8 : product.price; // 20% discount for B2B
    
    this.saleForm.patchValue({
      productSearch: product.name,
      quantity: 1,
      unitPrice: defaultPrice.toFixed(2)
    });
    this.filteredProducts = [];
  }

  addItem(): void {
    if (!this.selectedProduct || !this.saleForm.valid) {
      this.errorMessage = 'Please select a product and enter valid quantity and price';
      return;
    }
    
    const quantity = this.saleForm.get('quantity')?.value;
    let unitPrice = this.saleForm.get('unitPrice')?.value;
    
    // Apply bulk discount for B2B
    if (this.isB2BSale && this.saleForm.get('isBulkOrder')?.value) {
      const bulkDiscount = this.saleForm.get('bulkDiscount')?.value || 0;
      unitPrice = unitPrice * (1 - bulkDiscount / 100);
    }
    
    // Check if we have enough stock
    const existingItem = this.saleItems.find(item => item.productId === this.selectedProduct!.id);
    const totalRequested = (existingItem?.quantity || 0) + quantity;
    
    if (totalRequested > this.selectedProduct.quantity) {
      this.errorMessage = `Insufficient stock! Only ${this.selectedProduct.quantity} units available.`;
      return;
    }
    
    const totalPrice = quantity * unitPrice;
    
    if (existingItem) {
      // Update existing item
      existingItem.quantity += quantity;
      existingItem.totalPrice += totalPrice;
      if (this.isB2BSale) {
        existingItem.customerPrice = unitPrice;
      }
      console.log(`📈 Updated item: ${existingItem.productName} (${existingItem.quantity} units)`);
    } else {
      // Add new item
      const newItem: SaleItem = {
        productId: this.selectedProduct.id,
        productName: this.selectedProduct.name,
        availableStock: this.selectedProduct.quantity,
        quantity: quantity,
        unitPrice: this.selectedProduct.price, // Original price
        totalPrice: totalPrice
      };
      
      if (this.isB2BSale) {
        newItem.customerPrice = unitPrice; // B2B discounted price
      }
      
      this.saleItems.push(newItem);
      console.log(`➕ Added item: ${this.selectedProduct.name} (${quantity} units)`);
    }
    
    this.clearItemForm();
    this.calculateSummary();
  }

  removeItem(index: number): void {
    console.log(`➖ Removing item: ${this.saleItems[index].productName}`);
    this.saleItems.splice(index, 1);
    this.calculateSummary();
  }

  updateItemQuantity(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const newQuantity = parseInt(input.value) || 1;
    
    if (newQuantity < 1) {
      input.value = '1';
      return;
    }
    
    if (newQuantity > this.saleItems[index].availableStock) {
      this.errorMessage = `Cannot exceed available stock of ${this.saleItems[index].availableStock} units`;
      input.value = this.saleItems[index].quantity.toString();
      return;
    }
    
    const unitPrice = this.saleItems[index].customerPrice || this.saleItems[index].unitPrice;
    this.saleItems[index].quantity = newQuantity;
    this.saleItems[index].totalPrice = newQuantity * unitPrice;
    this.calculateSummary();
  }

  clearItemForm(): void {
    this.selectedProduct = null;
    this.saleForm.patchValue({
      productSearch: '',
      quantity: '',
      unitPrice: ''
    });
    this.filteredProducts = [...this.products];
    this.errorMessage = '';
  }

  calculateSummary(): void {
    this.subtotal = this.saleItems.reduce((sum, item) => sum + item.totalPrice, 0);
    
    // Apply bulk discount tiers for B2B
    let autoDiscount = 0;
    if (this.isB2BSale) {
      for (const tier of this.bulkDiscountTiers.sort((a, b) => b.minAmount - a.minAmount)) {
        if (this.subtotal >= tier.minAmount) {
          autoDiscount = tier.discount;
          break;
        }
      }
    }
    
    const manualDiscount = this.saleForm.get('discount')?.value || 0;
    this.discount = Math.max(autoDiscount, manualDiscount);
    
    const discountedAmount = this.subtotal * (1 - this.discount / 100);
    this.taxAmount = discountedAmount * this.taxRate;
    this.totalAmount = discountedAmount + this.taxAmount;
    
    // Update bulk discount field
    if (this.isB2BSale && autoDiscount > 0) {
      this.saleForm.patchValue({ bulkDiscount: autoDiscount });
    }
  }

  updateDiscount(): void {
    this.discount = this.saleForm.get('discount')?.value || 0;
    this.calculateSummary();
  }

  // ✅ FIXED: Get actual numeric user ID
  getCurrentUserId(): number {
    const currentUser = this.apiService.getCurrentUser();
    
    if (!currentUser || !currentUser.id) {
      console.error('❌ No user found');
      return 1; // Default fallback ID
    }
    
    // Check if ID is a number
    const userId = Number(currentUser.id);
    
    if (isNaN(userId)) {
      console.error('❌ User ID is not a number:', currentUser.id);
      
      // Try to decode from token
      const token = this.apiService.getToken();
      if (token) {
        try {
          const payload = token.split('.')[1];
          const decoded = JSON.parse(atob(payload));
          const tokenUserId = Number(decoded.userId || decoded.sub || decoded.id);
          if (!isNaN(tokenUserId)) {
            console.log('✅ Got user ID from token:', tokenUserId);
            return tokenUserId;
          }
        } catch (e) {
          console.error('❌ Error decoding token:', e);
        }
      }
      
      // Default user IDs based on role (from your database)
      if (currentUser.role === 'OWNER') return 1;
      if (currentUser.role === 'ADMIN') return 2;
      if (currentUser.role === 'STAFF') return 3;
      return 1; // Default fallback
    }
    
    console.log('✅ User ID is valid number:', userId);
    return userId;
  }

  onSubmit(): void {
    console.log(' === SUBMITTING SALE ===');
    console.log('Sale Type:', this.saleType);
    console.log('Is B2B:', this.isB2BSale);
    console.log('Items:', this.saleItems);
    
    if (this.saleItems.length === 0) {
      this.errorMessage = 'Please add at least one product to the sale';
      return;
    }
    
    if (!this.saleForm.get('customerName')?.valid) {
      this.errorMessage = 'Please enter customer name';
      return;
    }
    
    if (this.isB2BSale && !this.saleForm.get('customerCompany')?.valid) {
      this.errorMessage = 'Please enter company name for B2B sale';
      return;
    }
    
    if (this.submitting) {
      console.log('⚠️ Already submitting, skipping...');
      return;
    }
    
    this.submitting = true;
    this.errorMessage = '';
    this.successMessage = '';
    
    //  FIXED: Get numeric user ID
    const userId = this.getCurrentUserId();
    console.log(' Using User ID:', userId);
    
    // Create transactions for each item
    const transactionPromises = this.saleItems.map(item => {
      const transactionData: any = {
        userId: userId, //  Now this is a number, not email
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.customerPrice || item.unitPrice,
        totalPrice: item.totalPrice,
        type: 'SALE',
        customerName: this.saleForm.get('customerName')?.value,
        customerEmail: this.saleForm.get('customerEmail')?.value,
        notes: this.saleForm.get('notes')?.value || ''
      };
      
      // Add B2B information if applicable
      if (this.isB2BSale) {
        transactionData.customerCompany = this.saleForm.get('customerCompany')?.value;
        transactionData.customerPhone = this.saleForm.get('customerPhone')?.value;
        transactionData.customerAddress = this.saleForm.get('customerAddress')?.value;
        transactionData.isBulkOrder = this.saleForm.get('isBulkOrder')?.value;
        transactionData.bulkDiscount = this.discount;
      }
      
      console.log('📦 Creating sale transaction:', transactionData);
      return this.apiService.createTransaction(transactionData).toPromise();
    });
    
    // Execute all transactions
    Promise.all(transactionPromises)
      .then((responses) => {
        console.log('✅ All sale transactions created:', responses);
        this.successMessage = this.isB2BSale 
          ? 'B2B Sale completed successfully! Invoice will be generated.' 
          : 'Sale completed successfully! Stock has been updated.';
        this.submitting = false;
        
        // Generate invoice for B2B
        if (this.isB2BSale) {
          this.generateB2BInvoice();
        }
        
        // Clear form after successful submission
        setTimeout(() => {
          this.router.navigate(['/transactions']);
        }, 3000);
      })
      .catch(error => {
        console.error('❌ Error creating sale:', error);
        this.errorMessage = error.error?.message || error.message || 'Failed to complete sale';
        this.submitting = false;
      });
  }

  generateB2BInvoice(): void {
    const invoiceData = {
      customerName: this.saleForm.get('customerName')?.value,
      customerCompany: this.saleForm.get('customerCompany')?.value,
      customerEmail: this.saleForm.get('customerEmail')?.value,
      customerPhone: this.saleForm.get('customerPhone')?.value,
      customerAddress: this.saleForm.get('customerAddress')?.value,
      items: this.saleItems.map(item => ({
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.customerPrice || item.unitPrice,
        totalPrice: item.totalPrice
      })),
      subtotal: this.subtotal,
      discount: this.discount,
      taxAmount: this.taxAmount,
      totalAmount: this.totalAmount,
      invoiceNumber: 'INV-' + Date.now(),
      date: new Date().toISOString()
    };
    
    console.log('🧾 B2B Invoice Generated:', invoiceData);
    //  send this to a backend endpoint to generate PDF invoice
  }

  // B2B Bulk Order Methods
  addBulkOrderTemplate(): void {
    // Template for common B2B orders
    const bulkTemplates = [
      { name: 'Corporate Gifts', items: [
        { productId: 10, quantity: 50, discount: 15 }, // T-Shirts
        { productId: 26, quantity: 50, discount: 10 }  // Water Bottles
      ]},
      { name: 'Office Supplies', items: [
        { productId: 31, quantity: 20, discount: 10 }, // Lamps
        { productId: 33, quantity: 30, discount: 15 }  // Blankets
      ]},
      { name: 'Fitness Center', items: [
        { productId: 23, quantity: 25, discount: 20 }, // Yoga Mats
        { productId: 29, quantity: 15, discount: 15 }  // Resistance Bands
      ]}
    ];
    
    // You can implement a UI to select from templates
    console.log('Available bulk templates:', bulkTemplates);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  getStockStatus(stock: number): string {
    if (stock === 0) return 'Out of Stock';
    if (stock < 10) return 'Low Stock';
    if (stock < 50) return 'Medium Stock';
    return 'In Stock';
  }

  getStockStatusClass(stock: number): string {
    if (stock === 0) return 'badge bg-danger';
    if (stock < 10) return 'badge bg-warning';
    if (stock < 50) return 'badge bg-info';
    return 'badge bg-success';
  }

  getNewStockAfterSale(currentStock: number, saleQuantity: number): number {
    return currentStock - saleQuantity;
  }

  clearForm(): void {
    this.saleItems = [];
    this.saleForm.reset({
      saleType: 'retail',
      productSearch: '',
      quantity: '',
      unitPrice: '',
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      customerCompany: '',
      customerAddress: '',
      discount: 0,
      notes: '',
      isBulkOrder: false,
      bulkDiscount: 0
    });
    this.selectedProduct = null;
    this.filteredProducts = [...this.products];
    this.errorMessage = '';
    this.successMessage = '';
    this.calculateSummary();
  }

  // Form control getters
  get saleTypeField() { return this.saleForm.get('saleType'); }
  get customerNameField() { return this.saleForm.get('customerName'); }
  get customerEmailField() { return this.saleForm.get('customerEmail'); }
  get customerCompanyField() { return this.saleForm.get('customerCompany'); }
  get quantity() { return this.saleForm.get('quantity'); }
  get unitPrice() { return this.saleForm.get('unitPrice'); }
  get discountField() { return this.saleForm.get('discount'); }
  get isBulkOrderField() { return this.saleForm.get('isBulkOrder'); }
}