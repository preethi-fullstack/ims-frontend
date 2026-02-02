import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from 'src/environments/environment';

interface Category {
  id: number;
  name: string;
  description: string;
}

@Component({
  selector: 'app-category',
  templateUrl: './category.component.html',
  styleUrls: ['./category.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule] // <-- important for ngIf, ngFor, ngModel
})
export class CategoryComponent implements OnInit {
  categories: Category[] = [];
  loading = false;
  errorMessage = '';
  searchTerm = '';

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadCategories();
  }

  loadCategories() {
    this.loading = true;
    this.errorMessage = '';

    this.http.get<Category[]>(`${environment.apiUrl}/categories`)
      .subscribe({
        next: (data) => {
          this.categories = data;
          this.loading = false;
        },
        error: (error) => {
          this.errorMessage = 'Failed to load categories. Please try again.';
          this.loading = false;
          console.error('Error loading categories:', error);
        }
      });
  }

  get filteredCategories(): Category[] {
    if (!this.searchTerm) return this.categories;

    const term = this.searchTerm.toLowerCase();
    return this.categories.filter(category =>
      category.name.toLowerCase().includes(term) ||
      category.description.toLowerCase().includes(term)
    );
  }

  editCategory(id: number) {
    this.router.navigate(['/categories/edit', id]);
  }

  deleteCategory(id: number) {
    if (confirm('Are you sure you want to delete this category?')) {
      this.http.delete(`${environment.apiUrl}/categories/${id}`)
        .subscribe({
          next: () => {
            this.categories = this.categories.filter(cat => cat.id !== id);
          },
          error: (error) => {
            alert('Failed to delete category. Please try again.');
            console.error('Error deleting category:', error);
          }
        });
    }
  }

  addNewCategory() {
    this.router.navigate(['/categories/add']);
  }
}
