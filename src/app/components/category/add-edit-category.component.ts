import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-add-edit-category',
  templateUrl: './add-edit-category.component.html',
  styleUrls: ['./add-edit-category.component.css'],
  standalone: true,
  imports: [
    CommonModule,        // needed for ngClass, ngIf, ngFor
    ReactiveFormsModule  // needed for reactive forms
  ]
})
export class AddEditCategoryComponent implements OnInit {
  categoryForm: FormGroup;
  loading = false;
  isEditMode = false;
  categoryId?: number;
  errorMessage = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.categoryForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['']
    });
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.categoryId = +params['id'];
        this.loadCategory(this.categoryId);
      }
    });
  }

  loadCategory(id: number) {
    this.loading = true;
    this.http.get<any>(`${environment.apiUrl}/categories/${id}`)
      .subscribe({
        next: (category) => {
          this.categoryForm.patchValue({
            name: category.name,
            description: category.description
          });
          this.loading = false;
        },
        error: (error) => {
          this.errorMessage = 'Failed to load category.';
          this.loading = false;
          console.error('Error loading category:', error);
        }
      });
  }

  onSubmit() {
    if (this.categoryForm.invalid) return;

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const categoryData = this.categoryForm.value;

    if (this.isEditMode && this.categoryId) {
      this.http.put(`${environment.apiUrl}/categories/${this.categoryId}`, categoryData)
        .subscribe({
          next: () => {
            this.successMessage = 'Category updated successfully!';
            setTimeout(() => this.router.navigate(['/categories']), 1500);
          },
          error: (error) => {
            this.errorMessage = error.error?.message || 'Failed to update category.';
            this.loading = false;
          }
        });
    } else {
      this.http.post(`${environment.apiUrl}/categories`, categoryData)
        .subscribe({
          next: () => {
            this.successMessage = 'Category created successfully!';
            this.categoryForm.reset();
            setTimeout(() => this.router.navigate(['/categories']), 1500);
          },
          error: (error) => {
            this.errorMessage = error.error?.message || 'Failed to create category.';
            this.loading = false;
          }
        });
    }
  }

  onCancel() {
    this.router.navigate(['/categories']);
  }

  get f() {
    return this.categoryForm.controls;
  }
}
