import { AbstractControl, ValidationErrors, ValidatorFn, FormGroup } from '@angular/forms';

export class CustomValidators {
  // Required Validator with custom message
  static required(message?: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (value === null || value === undefined || value === '') {
        return { required: { message: message || 'This field is required' } };
      }
      return null;
    };
  }
  
  // Email Validator
  static email(message?: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      
      const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      const isValid = emailPattern.test(control.value);
      
      return isValid ? null : { email: { message: message || 'Invalid email format' } };
    };
  }
  
  // Phone Validator
  static phone(message?: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      
      const phonePattern = /^[\+]?[1-9][\d]{0,15}$/;
      const isValid = phonePattern.test(control.value.replace(/[\s-]/g, ''));
      
      return isValid ? null : { phone: { message: message || 'Invalid phone number' } };
    };
  }
  
  // Password Validator
  static password(minLength: number = 6, message?: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      
      const password = control.value;
      const errors: ValidationErrors = {};
      
      if (password.length < minLength) {
        errors['minLength'] = { 
          message: message || `Password must be at least ${minLength} characters` 
        };
      }
      
      if (!/[A-Z]/.test(password)) {
        errors['uppercase'] = { message: 'Password must contain at least one uppercase letter' };
      }
      
      if (!/[a-z]/.test(password)) {
        errors['lowercase'] = { message: 'Password must contain at least one lowercase letter' };
      }
      
      if (!/\d/.test(password)) {
        errors['number'] = { message: 'Password must contain at least one number' };
      }
      
      return Object.keys(errors).length ? errors : null;
    };
  }
  
  // Confirm Password Validator
  static confirmPassword(passwordField: string, confirmField: string, message?: string): ValidatorFn {
    return (formGroup: AbstractControl): ValidationErrors | null => {
      const password = formGroup.get(passwordField)?.value;
      const confirmPassword = formGroup.get(confirmField)?.value;
      
      if (password !== confirmPassword) {
        formGroup.get(confirmField)?.setErrors({ 
          passwordMismatch: { message: message || 'Passwords do not match' } 
        });
        return { passwordMismatch: true };
      }
      
      return null;
    };
  }
  
  // Number Range Validator
  static numberRange(min: number, max: number, message?: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (control.value === null || control.value === undefined || control.value === '') {
        return null;
      }
      
      const value = parseFloat(control.value);
      if (isNaN(value)) {
        return { number: { message: 'Must be a valid number' } };
      }
      
      if (value < min || value > max) {
        return { 
          range: { 
            message: message || `Value must be between ${min} and ${max}`,
            min,
            max
          } 
        };
      }
      
      return null;
    };
  }
  
  // Positive Number Validator
  static positiveNumber(message?: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (control.value === null || control.value === undefined || control.value === '') {
        return null;
      }
      
      const value = parseFloat(control.value);
      if (isNaN(value)) {
        return { number: { message: 'Must be a valid number' } };
      }
      
      if (value < 0) {
        return { positive: { message: message || 'Value must be positive' } };
      }
      
      return null;
    };
  }
  
  // Integer Validator
  static integer(message?: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      
      const value = control.value.toString();
      const isValid = /^\d+$/.test(value);
      
      return isValid ? null : { integer: { message: message || 'Must be a whole number' } };
    };
  }
  
  // URL Validator
  static url(message?: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      
      try {
        new URL(control.value);
        return null;
      } catch {
        return { url: { message: message || 'Invalid URL format' } };
      }
    };
  }
  
  // File Type Validator
  static fileType(allowedTypes: string[], message?: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const file = control.value as File;
      if (!file) return null;
      
      const isValid = allowedTypes.includes(file.type);
      return isValid ? null : { 
        fileType: { 
          message: message || `File type must be: ${allowedTypes.join(', ')}` 
        } 
      };
    };
  }
  
  // File Size Validator
  static fileSize(maxSize: number, message?: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const file = control.value as File;
      if (!file) return null;
      
      const isValid = file.size <= maxSize;
      return isValid ? null : { 
        fileSize: { 
          message: message || `File size must be less than ${maxSize / 1024 / 1024}MB` 
        } 
      };
    };
  }
  
  // Date Range Validator
  static dateRange(startField: string, endField: string, message?: string): ValidatorFn {
    return (formGroup: AbstractControl): ValidationErrors | null => {
      const startDate = formGroup.get(startField)?.value;
      const endDate = formGroup.get(endField)?.value;
      
      if (!startDate || !endDate) return null;
      
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (start > end) {
        formGroup.get(endField)?.setErrors({ 
          dateRange: { message: message || 'End date must be after start date' } 
        });
        return { dateRange: true };
      }
      
      return null;
    };
  }
  
  // Custom Pattern Validator
  static pattern(pattern: RegExp, message?: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      
      const isValid = pattern.test(control.value);
      return isValid ? null : { 
        pattern: { 
          message: message || 'Invalid format' 
        } 
      };
    };
  }
  
  // Unique Values Validator (for arrays)
  static unique(message?: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value || !Array.isArray(control.value)) return null;
      
      const array = control.value;
      const uniqueSet = new Set(array);
      
      if (uniqueSet.size !== array.length) {
        return { unique: { message: message || 'All values must be unique' } };
      }
      
      return null;
    };
  }
}