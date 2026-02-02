import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Product, Supplier, User } from '../../models';

interface PurchaseItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  currentStock: number;
}

@Component({
  selector: 'app-purchase',
  templateUrl: './purchase.component.html',
  styleUrls: ['./purchase.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink]
})
export class PurchaseComponent implements OnInit {
  purchaseForm: FormGroup;
  products: Product[] = [];
  suppliers: Supplier[] = [];
  filteredProducts: Product[] = [];
  loading = false;
  submitting = false;
  errorMessage = '';
  successMessage = '';

  purchaseItems: PurchaseItem[] = [];
  selectedProduct: Product | null = null;

  // Summary
  subtotal = 0;
  taxRate = 0.08; // 8%
  taxAmount = 0;
  totalAmount = 0;

  constructor(
    private fb: FormBuilder,
    public apiService: ApiService,
    private router: Router
  ) {
    this.purchaseForm = this.fb.group({
      supplierId: ['', [Validators.required]],
      productSearch: [''],
      quantity: ['', [Validators.required, Validators.min(1)]],
      unitPrice: ['', [Validators.required, Validators.min(0.01)]],
      notes: ['']
    });
  }

  ngOnInit(): void {
    console.log('=== PURCHASE COMPONENT INIT ===');

    const user = this.apiService.getCurrentUser();
    if (!user || !user.id) {
      console.warn('❌ No user found, redirecting to login');
      this.router.navigate(['/login']);
      return;
    }

    console.log('🔍 Current User Details:');
    console.log('🆔 User ID:', user.id);
    console.log('📧 User Email:', user.email);
    console.log('🎭 User Role:', user.role);

    if (user.role !== 'OWNER' && user.role !== 'ADMIN') {
      this.errorMessage = `Your role (${user.role}) cannot create purchases. Only OWNER or ADMIN can create purchases.`;
      this.loading = false;
      return;
    }

    console.log('✅ User has permission to create purchases');
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.errorMessage = '';

    console.log('📥 Loading products and suppliers...');

    Promise.all([
      this.apiService.getProducts().toPromise(),
      this.apiService.getSuppliers().toPromise()
    ]).then(([products, suppliers]) => {
      if (products) {
        this.products = products;
        this.filteredProducts = [...products];
        console.log(`✅ Loaded ${products.length} products`);
      }
      if (suppliers) {
        this.suppliers = suppliers;
        console.log(`✅ Loaded ${suppliers.length} suppliers`);
      }
      this.loading = false;
    }).catch(error => {
      console.error('❌ Error loading data:', error);
      this.errorMessage = 'Failed to load data: ' + error.message;
      this.loading = false;
    });
  }

  onProductSearch(): void {
    const searchTerm = this.purchaseForm.get('productSearch')?.value.toLowerCase() || '';

    if (!searchTerm) {
      this.filteredProducts = [...this.products];
      this.selectedProduct = null;
      return;
    }

    this.filteredProducts = this.products.filter(product =>
      product.name.toLowerCase().includes(searchTerm) ||
      product.description?.toLowerCase().includes(searchTerm)
    );
  }

  selectProduct(product: Product): void {
    this.selectedProduct = product;
    this.purchaseForm.patchValue({
      productSearch: product.name,
      unitPrice: product.price * 0.7 // Default to 70% of retail price for purchase
    });
    this.filteredProducts = [];
  }

  addItem(): void {
    if (!this.selectedProduct || !this.purchaseForm.valid) {
      this.errorMessage = 'Please select a product and enter valid quantity and price';
      return;
    }

    const quantity = this.purchaseForm.get('quantity')?.value;
    const unitPrice = this.purchaseForm.get('unitPrice')?.value;
    const totalPrice = quantity * unitPrice;

    const existingItemIndex = this.purchaseItems.findIndex(
      item => item.productId === this.selectedProduct!.id
    );

    if (existingItemIndex > -1) {
      this.purchaseItems[existingItemIndex].quantity += quantity;
      this.purchaseItems[existingItemIndex].totalPrice += totalPrice;
    } else {
      this.purchaseItems.push({
        productId: this.selectedProduct.id,
        productName: this.selectedProduct.name,
        quantity: quantity,
        unitPrice: unitPrice,
        totalPrice: totalPrice,
        currentStock: this.selectedProduct.quantity
      });
    }

    this.clearItemForm();
    this.calculateSummary();
  }

  removeItem(index: number): void {
    this.purchaseItems.splice(index, 1);
    this.calculateSummary();
  }

  updateItemQuantity(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const newQuantity = parseInt(input.value) || 1;

    if (newQuantity < 1) {
      input.value = '1';
      return;
    }

    this.purchaseItems[index].quantity = newQuantity;
    this.purchaseItems[index].totalPrice = newQuantity * this.purchaseItems[index].unitPrice;
    this.calculateSummary();
  }

  clearItemForm(): void {
    this.selectedProduct = null;
    this.purchaseForm.patchValue({
      productSearch: '',
      quantity: '',
      unitPrice: ''
    });
    this.filteredProducts = [...this.products];
  }

  calculateSummary(): void {
    this.subtotal = this.purchaseItems.reduce((sum, item) => sum + item.totalPrice, 0);
    this.taxAmount = this.subtotal * this.taxRate;
    this.totalAmount = this.subtotal + this.taxAmount;
  }

  onSubmit(): void {
    console.log('📤 === SUBMITTING PURCHASE ===');

    if (this.purchaseItems.length === 0) {
      this.errorMessage = 'Please add at least one product to the purchase order';
      return;
    }

    if (!this.purchaseForm.get('supplierId')?.value) {
      this.errorMessage = 'Please select a supplier';
      return;
    }

    if (this.submitting) {
      console.log('⚠️ Already submitting, skipping duplicate submission');
      return;
    }

    this.submitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const currentUser = this.apiService.getCurrentUser() as User;
    if (!currentUser || !currentUser.id) {
      this.errorMessage = 'User not found. Please login again.';
      this.submitting = false;
      setTimeout(() => this.router.navigate(['/login']), 3000);
      return;
    }

    const selectedSupplierId = Number(this.purchaseForm.get('supplierId')?.value);
    const selectedSupplier = this.suppliers.find(s => s.id === selectedSupplierId);

    const purchaseData = {
      userId: Number(currentUser.id),
      supplierId: selectedSupplierId,
      supplierName: selectedSupplier?.name || '',
      items: this.purchaseItems,
      subtotal: this.subtotal,
      taxAmount: this.taxAmount,
      totalAmount: this.totalAmount,
      notes: this.purchaseForm.get('notes')?.value || '',
      userName: currentUser.name || 'System User'
    };

    console.log('📤 Purchase data:', purchaseData);
    this.createTransactions(purchaseData);
  }

  private createTransactions(purchaseData: any): void {
    console.log('🧾 Creating transactions for all items...');
    console.log(`📦 Total items to process: ${this.purchaseItems.length}`);

    if (this.purchaseItems.length === 0) {
      this.errorMessage = 'No items to process';
      this.submitting = false;
      return;
    }

    // Create all transactions at once
    const transactionPromises = this.purchaseItems.map((item, index) => {
      const transactionData = {
        userId: purchaseData.userId,
        productId: item.productId,
        supplierId: purchaseData.supplierId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        type: 'PURCHASE',
        notes: purchaseData.notes || 'Purchase order'
      };

      console.log(` [${index + 1}/${this.purchaseItems.length}] Creating transaction for: ${item.productName}`);
      return this.apiService.createTransaction(transactionData).toPromise();
    });

    // Execute all promises
    Promise.all(transactionPromises)
      .then((responses) => {
        console.log('✅ All transactions created successfully');
        this.handlePurchaseSuccess(responses);
      })
      .catch(error => {
        console.error(' Error creating transactions:', error);
        this.handlePurchaseError(error);
      });
  }

  private handlePurchaseSuccess(response: any): void {
    console.log(' Purchase completed successfully');
    
    this.successMessage = 'Purchase order created successfully! Stock has been updated.';
    this.submitting = false;
    
    // Reset form
    this.purchaseItems = [];
    this.calculateSummary();
    this.purchaseForm.reset({
      supplierId: '',
      productSearch: '',
      quantity: '',
      unitPrice: '',
      notes: ''
    });
    this.selectedProduct = null;
    this.filteredProducts = [...this.products];
    
    // Navigate to transactions page after delay
    setTimeout(() => {
      this.router.navigate(['/transactions']);
    }, 2000);
  }

  private handlePurchaseError(error: any): void {
    console.error(' Purchase error:');
    console.error('Status:', error.status);
    console.error('Message:', error.message);
    console.error('Full error:', error);

    this.submitting = false;

    if (error.status === 401) {
      this.errorMessage = 'Session expired. Please login again.';
      setTimeout(() => this.router.navigate(['/login']), 3000);
    } else if (error.status === 403) {
      this.errorMessage = 'Access forbidden. You do not have permission to create purchases.';
    } else if (error.error && error.error.message) {
      this.errorMessage = error.error.message;
    } else if (error.message) {
      this.errorMessage = error.message;
    } else {
      this.errorMessage = 'Failed to create purchase order. Please try again.';
    }
  }

  // Form control getters for template
  get supplierId() { 
    return this.purchaseForm.get('supplierId'); 
  }

  get quantity() { 
    return this.purchaseForm.get('quantity'); 
  }

  get unitPrice() { 
    return this.purchaseForm.get('unitPrice'); 
  }

  // Test methods (optional)
  testSimpleTransaction(): void {
    console.log('🧪 Testing simple transaction...');
    this.apiService.testSimpleTransaction().subscribe({
      next: (response) => {
        console.log(' Test transaction successful:', response);
        alert('Test transaction successful!');
      },
      error: (error) => {
        console.error(' Test transaction failed:', error);
        alert(`Test failed: ${error.message}`);
      }
    });
  }

  checkPermissions(): void {
    console.log(' Checking permissions...');
    this.apiService.testUserPermissions();
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  getNewStockAfterPurchase(currentStock: number, purchaseQuantity: number): number {
    return currentStock + purchaseQuantity;
  }

  // Add a method to clear error messages
  clearError(): void {
    this.errorMessage = '';
  }

  // Add a method to clear success messages
  clearSuccess(): void {
    this.successMessage = '';
  }
}