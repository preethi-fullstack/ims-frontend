import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { Supplier } from '../../models';

@Component({
  selector: 'app-add-edit-supplier',
  templateUrl: './add-edit-supplier.component.html',
  styleUrls: ['./add-edit-supplier.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink]
})
export class AddEditSupplierComponent implements OnInit {
  supplierForm: FormGroup;
  isEditMode = false;
  supplierId: number | null = null;
  loading = false;
  saving = false;
  errorMessage = '';
  successMessage = '';
  supplier: Supplier | null = null;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.supplierForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[\d\s\-\+\(\)]{10,15}$/)]],
      address: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(200)]]
    });
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.supplierId = +params['id'];
        this.loadSupplier();
      } else {
        this.isEditMode = false;
      }
    });
  }

  loadSupplier(): void {
    if (!this.supplierId) return;

    this.loading = true;
    this.apiService.getSupplier(this.supplierId).subscribe({
      next: (supplier) => {
        this.supplier = supplier;
        this.supplierForm.patchValue({
          name: supplier.name,
          email: supplier.email,
          phone: supplier.phone,
          address: supplier.address
        });
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading supplier:', error);
        this.errorMessage = 'Failed to load supplier details';
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.supplierForm.valid) {
      this.saving = true;
      this.errorMessage = '';
      this.successMessage = '';

      const supplierData = this.supplierForm.value;

      if (this.isEditMode && this.supplierId) {
        this.apiService.updateSupplier(this.supplierId, supplierData).subscribe({
          next: (updatedSupplier) => {
            this.successMessage = 'Supplier updated successfully!';
            this.saving = false;
            this.supplier = updatedSupplier;
            
            // Clear success message and redirect after 2 seconds
            setTimeout(() => {
              this.router.navigate(['/suppliers']);
            }, 2000);
          },
          error: (error) => {
            console.error('Error updating supplier:', error);
            this.errorMessage = error.message || 'Failed to update supplier';
            this.saving = false;
          }
        });
      } else {
        this.apiService.createSupplier(supplierData).subscribe({
          next: (newSupplier) => {
            this.successMessage = 'Supplier created successfully!';
            this.saving = false;
            this.supplier = newSupplier;
            
            // Clear success message and redirect after 2 seconds
            setTimeout(() => {
              this.router.navigate(['/suppliers']);
            }, 2000);
          },
          error: (error) => {
            console.error('Error creating supplier:', error);
            this.errorMessage = error.message || 'Failed to create supplier';
            this.saving = false;
          }
        });
      }
    } else {
      this.markFormGroupTouched(this.supplierForm);
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  getFormTitle(): string {
    return this.isEditMode ? 'Edit Supplier' : 'Add New Supplier';
  }

  getSubmitButtonText(): string {
    return this.saving ? 'Saving...' : (this.isEditMode ? 'Update Supplier' : 'Create Supplier');
  }

  // Form getters for easier access in template
  get name() { return this.supplierForm.get('name'); }
  get email() { return this.supplierForm.get('email'); }
  get phone() { return this.supplierForm.get('phone'); }
  get address() { return this.supplierForm.get('address'); }

  getFormErrors(controlName: string): string[] {
    const control = this.supplierForm.get(controlName);
    const errors: string[] = [];
    
    if (control?.errors && control.touched) {
      if (control.errors['required']) {
        errors.push('This field is required');
      }
      if (control.errors['minlength']) {
        errors.push(`Minimum ${control.errors['minlength'].requiredLength} characters required`);
      }
      if (control.errors['maxlength']) {
        errors.push(`Maximum ${control.errors['maxlength'].requiredLength} characters allowed`);
      }
      if (control.errors['email']) {
        errors.push('Please enter a valid email address');
      }
      if (control.errors['pattern']) {
        errors.push('Please enter a valid phone number');
      }
    }
    
    return errors;
  }

  cancel(): void {
    this.router.navigate(['/suppliers']);
  }
}