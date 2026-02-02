import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

interface Product {
  id: number;
  name: string;
  price: number;
  categoryId: number;
  quantity: number;  // Changed from inStock to quantity
  description?: string;
}

interface Category {
  id: number;
  name: string;
}

@Component({
  selector: 'app-add-edit-product',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './add-edit-product.component.html',
  styleUrls: ['./add-edit-product.component.css']
})
export class AddEditProductComponent implements OnInit {
  productForm: FormGroup;
  isEditMode = false;
  editingProductId: number | null = null;
  
  // Data from API
  productList: Product[] = [];
  categoryList: Category[] = [];
  
  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient
  ) {
    this.productForm = this.fb.group({
      name: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(0)]],
      categoryId: [null, Validators.required],
      quantity: [0, [Validators.required, Validators.min(0)]],  // ✅ Quantity field
      description: ['']
    });
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadProducts();
  }

  loadCategories(): void {
    this.loading = true;
    this.http.get<Category[]>(`${environment.apiUrl}/categories`)
      .subscribe({
        next: (categories) => {
          this.categoryList = categories;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading categories:', error);
          this.errorMessage = 'Failed to load categories';
          this.loading = false;
        }
      });
  }

  loadProducts(): void {
    this.loading = true;
    this.http.get<Product[]>(`${environment.apiUrl}/products`)
      .subscribe({
        next: (products) => {
          this.productList = products;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading products:', error);
          this.errorMessage = 'Failed to load products';
          this.loading = false;
        }
      });
  }

  // Clear form method
  clearForm(): void {
    this.productForm.reset({ 
      name: '',
      price: 0,
      categoryId: null,
      quantity: 0,
      description: ''
    });
    this.isEditMode = false;
    this.editingProductId = null;
    this.errorMessage = '';
    this.successMessage = '';
  }

  // Get stock status based on quantity
  getStockStatus(quantity: number): { text: string; class: string } {
    if (quantity === 0) {
      return { text: 'Out of Stock', class: 'bg-danger' };
    } else if (quantity < 10) {
      return { text: 'Low Stock', class: 'bg-warning text-dark' };
    } else {
      return { text: 'In Stock', class: 'bg-success' };
    }
  }

  // Delete product from list method
  deleteProductFromList(product: Product): void {
    if (confirm(`Are you sure you want to delete "${product.name}"?`)) {
      this.loading = true;
      this.http.delete(`${environment.apiUrl}/products/${product.id}`)
        .subscribe({
          next: () => {
            this.productList = this.productList.filter(p => p.id !== product.id);
            this.successMessage = 'Product deleted successfully';
            this.loading = false;
          },
          error: (error) => {
            console.error('Error deleting product:', error);
            this.errorMessage = 'Failed to delete product';
            this.loading = false;
          }
        });
    }
  }

  // Save product (Create or Update)
  saveProduct(): void {
    if (this.productForm.invalid) {
      Object.keys(this.productForm.controls).forEach(key => {
        const control = this.productForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const productData = this.productForm.value;

    if (this.isEditMode && this.editingProductId !== null) {
      // Update existing product
      this.http.put<Product>(`${environment.apiUrl}/products/${this.editingProductId}`, productData)
        .subscribe({
          next: (updatedProduct) => {
            const index = this.productList.findIndex(p => p.id === this.editingProductId);
            if (index > -1) {
              this.productList[index] = updatedProduct;
            }
            this.successMessage = 'Product updated successfully';
            this.loading = false;
            this.clearForm();
          },
          error: (error) => {
            console.error('Error updating product:', error);
            this.errorMessage = 'Failed to update product';
            this.loading = false;
          }
        });
    } else {
      // Add new product
      this.http.post<Product>(`${environment.apiUrl}/products`, productData)
        .subscribe({
          next: (newProduct) => {
            this.productList.push(newProduct);
            this.successMessage = 'Product added successfully';
            this.loading = false;
            this.clearForm();
          },
          error: (error) => {
            console.error('Error adding product:', error);
            this.errorMessage = 'Failed to add product';
            this.loading = false;
          }
        });
    }
  }

  editProduct(product: Product): void {
    this.isEditMode = true;
    this.editingProductId = product.id;
    this.productForm.setValue({
      name: product.name,
      price: product.price,
      categoryId: product.categoryId,
      quantity: product.quantity,
      description: product.description || ''
    });
    
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  getCategoryName(categoryId: number): string {
    const category = this.categoryList.find(c => c.id === categoryId);
    return category ? category.name : 'Uncategorized';
  }

  // Optional: Track by function for better performance
  trackByProductId(index: number, product: Product): number {
    return product.id;
  }
}