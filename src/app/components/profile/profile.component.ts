import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { User } from '../../models';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  passwordForm: FormGroup;
  loading = false;
  saving = false;
  changingPassword = false;
  errorMessage = '';
  successMessage = '';
  currentUser: User | null = null;
  showPasswordForm = false;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService
  ) {
    // Profile form
    this.profileForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]]
    });

    // Password form
    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required, Validators.minLength(6)]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.loadCurrentUser();
  }

  loadCurrentUser(): void {
    this.loading = true;
    this.currentUser = this.apiService.getCurrentUser();
    
    if (this.currentUser) {
      // Get fresh user data from API
      this.apiService.getUser(this.currentUser.id).subscribe({
        next: (user) => {
          this.currentUser = user;
          this.profileForm.patchValue({
            name: user.name,
            email: user.email
          });
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading user data:', error);
          this.errorMessage = 'Failed to load profile data';
          this.loading = false;
        }
      });
    } else {
      this.loading = false;
    }
  }

  onProfileSubmit(): void {
    if (this.profileForm.valid && this.currentUser) {
      this.saving = true;
      this.errorMessage = '';
      this.successMessage = '';

      const profileData: Partial<User> = {
        name: this.profileForm.value.name,
        email: this.profileForm.value.email
      };

      this.apiService.updateUser(this.currentUser.id, profileData).subscribe({
        next: (updatedUser) => {
          this.currentUser = updatedUser;
          this.apiService.setCurrentUser(updatedUser);
          this.successMessage = 'Profile updated successfully!';
          this.saving = false;
          
          // Clear success message after 3 seconds
          setTimeout(() => {
            this.successMessage = '';
          }, 3000);
        },
        error: (error) => {
          console.error('Error updating profile:', error);
          this.errorMessage = error.message || 'Failed to update profile';
          this.saving = false;
        }
      });
    } else {
      this.markFormGroupTouched(this.profileForm);
    }
  }

  onPasswordSubmit(): void {
    if (this.passwordForm.valid && this.currentUser) {
      this.changingPassword = true;
      this.errorMessage = '';
      this.successMessage = '';

      const passwordData = {
        currentPassword: this.passwordForm.value.currentPassword,
        newPassword: this.passwordForm.value.newPassword
      };

      //  Use the changePassword method instead of updateUser
      this.apiService.changePassword(passwordData).subscribe({
        next: () => {
          this.successMessage = 'Password changed successfully!';
          this.changingPassword = false;
          this.passwordForm.reset();
          this.showPasswordForm = false;
          
          // Clear success message after 3 seconds
          setTimeout(() => {
            this.successMessage = '';
          }, 3000);
        },
        error: (error) => {
          console.error('Error changing password:', error);
          this.errorMessage = error.message || 'Failed to change password';
          this.changingPassword = false;
        }
      });
    } else {
      this.markFormGroupTouched(this.passwordForm);
    }
  }

  togglePasswordForm(): void {
    this.showPasswordForm = !this.showPasswordForm;
    if (!this.showPasswordForm) {
      this.passwordForm.reset();
    }
  }

  // Custom validator to check if passwords match
  private passwordMatchValidator(form: FormGroup): { [key: string]: boolean } | null {
    const newPassword = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    
    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      return { passwordMismatch: true };
    }
    return null;
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'OWNER': 
        return 'badge bg-danger';
      case 'ADMIN': 
        return 'badge bg-warning';
      case 'STAFF': 
        return 'badge bg-primary';
      default: 
        return 'badge bg-secondary';
    }
  }
  
  getRoleDescription(role: string): string {
    const roleDescriptions: {[key: string]: string} = {
      'STAFF': 'Handles daily sales and customer transactions',
      'ADMIN': 'Manages daily operations and inventory orders',
      'OWNER': 'Monitors overall business performance'
    };
    return roleDescriptions[role] || 'User role';
  }

  get name() { return this.profileForm.get('name'); }
  get email() { return this.profileForm.get('email'); }
  get currentPassword() { return this.passwordForm.get('currentPassword'); }
  get newPassword() { return this.passwordForm.get('newPassword'); }
  get confirmPassword() { return this.passwordForm.get('confirmPassword'); }
}