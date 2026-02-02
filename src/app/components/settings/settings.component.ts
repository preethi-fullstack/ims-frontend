import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule]
})
export class SettingsComponent implements OnInit {
  loading = false;
  saving = false;
  successMessage = '';
  errorMessage = '';
  
  // Active tab
  activeTab = 'general';
  
  // General Settings Form
  generalForm: FormGroup;
  
  // System Settings
  systemSettings = {
    companyName: 'Inventory Management System',
    companyEmail: 'info@inventory.com',
    companyPhone: '+1 (555) 123-4567',
    companyAddress: '123 Business St, City, State 12345',
    currency: 'USD',
    timezone: 'America/New_York',
    dateFormat: 'MM/DD/YYYY',
    enableNotifications: true,
    autoBackup: true,
    backupFrequency: 'daily',
    lowStockThreshold: 10,
    taxRate: 8.0,
    language: 'en'
  };

  // Security Settings
  securitySettings = {
    twoFactorAuth: false,
    sessionTimeout: 30,
    passwordExpiry: 90,
    maxLoginAttempts: 5,
    ipWhitelist: '',
    auditLogging: true,
    enableApiAccess: false,
    apiKey: '********'
  };

  // Email Settings
  emailSettings = {
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUsername: '',
    smtpPassword: '',
    smtpSecurity: 'tls',
    fromEmail: 'noreply@inventory.com',
    fromName: 'IMS System',
    enableEmailNotifications: true,
    sendLowStockAlerts: true,
    sendDailyReports: false
  };

  // User Permissions
  userPermissions = {
    allowStaffAddProducts: true,
    allowStaffEditProducts: true,
    allowStaffDeleteProducts: false,
    allowStaffViewReports: false,
    allowStaffManageCategories: true,
    allowStaffManageSuppliers: false,
    requireApprovalForPurchases: false,
    requireApprovalForSales: false
  };

  // Backup History
  backupHistory = [
    { date: '2024-01-15 02:00', type: 'Automatic', size: '45.2 MB', status: 'Success' },
    { date: '2024-01-14 02:00', type: 'Automatic', size: '44.8 MB', status: 'Success' },
    { date: '2024-01-13 14:30', type: 'Manual', size: '45.5 MB', status: 'Success' },
    { date: '2024-01-12 02:00', type: 'Automatic', size: '44.9 MB', status: 'Success' }
  ];

  // System Info
  systemInfo = {
    appVersion: '1.0.0',
    lastBackup: '2024-01-15 02:00',
    totalUsers: 4,
    totalProducts: 156,
    totalTransactions: 1245,
    databaseSize: '45.2 MB',
    serverUptime: '15 days, 6 hours',
    lastUpdated: '2024-01-15'
  };

  // Available options
  currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'];
  timezones = [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Asia/Tokyo',
    'Asia/Dubai'
  ];
  dateFormats = ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD', 'DD Month YYYY'];
  languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' }
  ];
  backupFrequencies = ['hourly', 'daily', 'weekly', 'monthly'];

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService
  ) {
    this.generalForm = this.fb.group({
      companyName: ['', [Validators.required, Validators.minLength(2)]],
      companyEmail: ['', [Validators.required, Validators.email]],
      companyPhone: [''],
      companyAddress: [''],
      currency: ['USD', [Validators.required]],
      timezone: ['America/New_York', [Validators.required]],
      dateFormat: ['MM/DD/YYYY', [Validators.required]],
      enableNotifications: [true],
      autoBackup: [true],
      backupFrequency: ['daily', [Validators.required]],
      lowStockThreshold: [10, [Validators.required, Validators.min(1)]],
      taxRate: [8.0, [Validators.required, Validators.min(0), Validators.max(100)]],
      language: ['en', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.loadSettings();
  }

  loadSettings(): void {
    this.loading = true;
    // In a real app, this would load from API
    setTimeout(() => {
      this.generalForm.patchValue(this.systemSettings);
      this.loading = false;
    }, 500);
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  onGeneralSubmit(): void {
    if (this.generalForm.invalid) {
      this.markFormGroupTouched(this.generalForm);
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Simulate API call
    setTimeout(() => {
      this.systemSettings = { ...this.systemSettings, ...this.generalForm.value };
      this.successMessage = 'General settings saved successfully!';
      this.saving = false;
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        this.successMessage = '';
      }, 3000);
    }, 1000);
  }

  onSecuritySubmit(): void {
    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Simulate API call
    setTimeout(() => {
      this.successMessage = 'Security settings saved successfully!';
      this.saving = false;
      
      setTimeout(() => {
        this.successMessage = '';
      }, 3000);
    }, 1000);
  }

  onEmailSubmit(): void {
    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Simulate API call
    setTimeout(() => {
      this.successMessage = 'Email settings saved successfully!';
      this.saving = false;
      
      setTimeout(() => {
        this.successMessage = '';
      }, 3000);
    }, 1000);
  }

  onPermissionsSubmit(): void {
    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Simulate API call
    setTimeout(() => {
      this.successMessage = 'Permission settings saved successfully!';
      this.saving = false;
      
      setTimeout(() => {
        this.successMessage = '';
      }, 3000);
    }, 1000);
  }

  // Backup Functions
  createBackup(): void {
    this.loading = true;
    this.errorMessage = '';
    
    // Simulate backup creation
    setTimeout(() => {
      const now = new Date();
      const newBackup = {
        date: now.toISOString().split('T')[0] + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'Manual',
        size: '45.8 MB',
        status: 'Success'
      };
      
      this.backupHistory.unshift(newBackup);
      this.systemInfo.lastBackup = newBackup.date;
      this.loading = false;
      this.successMessage = 'Backup created successfully!';
      
      setTimeout(() => {
        this.successMessage = '';
      }, 3000);
    }, 2000);
  }

  restoreBackup(backup: any): void {
    if (confirm(`Are you sure you want to restore from backup ${backup.date}? This will replace all current data.`)) {
      this.loading = true;
      this.errorMessage = '';
      
      // Simulate restore
      setTimeout(() => {
        this.loading = false;
        this.successMessage = `System restored from backup ${backup.date} successfully!`;
        
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      }, 2000);
    }
  }

  deleteBackup(backup: any): void {
    if (confirm(`Are you sure you want to delete backup ${backup.date}?`)) {
      const index = this.backupHistory.indexOf(backup);
      if (index > -1) {
        this.backupHistory.splice(index, 1);
        this.successMessage = 'Backup deleted successfully!';
        
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      }
    }
  }

  // System Functions
  clearCache(): void {
    if (confirm('Are you sure you want to clear all cache? This may improve performance.')) {
      this.loading = true;
      
      setTimeout(() => {
        this.loading = false;
        this.successMessage = 'Cache cleared successfully!';
        
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      }, 1000);
    }
  }

  regenerateApiKey(): void {
    if (confirm('Are you sure you want to regenerate API key? All existing API connections will be invalidated.')) {
      // Generate random API key
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let newKey = '';
      for (let i = 0; i < 32; i++) {
        newKey += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      
      this.securitySettings.apiKey = newKey;
      this.successMessage = 'API key regenerated successfully!';
      
      setTimeout(() => {
        this.successMessage = '';
      }, 3000);
    }
  }

  showApiKey(): void {
    // Toggle API key visibility
    const apiKeyField = document.getElementById('apiKey') as HTMLInputElement;
    if (apiKeyField) {
      if (apiKeyField.type === 'password') {
        apiKeyField.type = 'text';
      } else {
        apiKeyField.type = 'password';
      }
    }
  }

  copyApiKey(): void {
    navigator.clipboard.writeText(this.securitySettings.apiKey).then(() => {
      this.successMessage = 'API key copied to clipboard!';
      
      setTimeout(() => {
        this.successMessage = '';
      }, 2000);
    });
  }

  testEmailSettings(): void {
    this.loading = true;
    this.errorMessage = '';
    
    // Simulate email test
    setTimeout(() => {
      this.loading = false;
      this.successMessage = 'Test email sent successfully! Check your inbox.';
      
      setTimeout(() => {
        this.successMessage = '';
      }, 3000);
    }, 2000);
  }

  exportSettings(): void {
    const settingsData = {
      general: this.systemSettings,
      security: this.securitySettings,
      email: this.emailSettings,
      permissions: this.userPermissions,
      exportedAt: new Date().toISOString()
    };
    
    const json = JSON.stringify(settingsData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `settings_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  importSettings(event: any): void {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e: any) => {
      try {
        const data = JSON.parse(e.target.result);
        
        // Validate imported data
        if (data.general && data.security && data.email && data.permissions) {
          if (confirm('Import settings? This will overwrite all current settings.')) {
            this.systemSettings = data.general;
            this.securitySettings = data.security;
            this.emailSettings = data.email;
            this.userPermissions = data.permissions;
            this.generalForm.patchValue(data.general);
            
            this.successMessage = 'Settings imported successfully!';
            
            setTimeout(() => {
              this.successMessage = '';
            }, 3000);
          }
        } else {
          this.errorMessage = 'Invalid settings file format';
        }
      } catch (error) {
        this.errorMessage = 'Error reading settings file';
      }
    };
    reader.readAsText(file);
    
    // Reset file input
    event.target.value = '';
  }

  resetSettings(): void {
    if (confirm('Are you sure you want to reset all settings to default? This action cannot be undone.')) {
      this.loading = true;
      
      // Simulate reset
      setTimeout(() => {
        // Reset to default values
        this.systemSettings = {
          companyName: 'Inventory Management System',
          companyEmail: 'info@inventory.com',
          companyPhone: '+1 (555) 123-4567',
          companyAddress: '123 Business St, City, State 12345',
          currency: 'USD',
          timezone: 'America/New_York',
          dateFormat: 'MM/DD/YYYY',
          enableNotifications: true,
          autoBackup: true,
          backupFrequency: 'daily',
          lowStockThreshold: 10,
          taxRate: 8.0,
          language: 'en'
        };
        
        this.securitySettings = {
          twoFactorAuth: false,
          sessionTimeout: 30,
          passwordExpiry: 90,
          maxLoginAttempts: 5,
          ipWhitelist: '',
          auditLogging: true,
          enableApiAccess: false,
          apiKey: '********'
        };
        
        this.emailSettings = {
          smtpHost: 'smtp.gmail.com',
          smtpPort: 587,
          smtpUsername: '',
          smtpPassword: '',
          smtpSecurity: 'tls',
          fromEmail: 'noreply@inventory.com',
          fromName: 'IMS System',
          enableEmailNotifications: true,
          sendLowStockAlerts: true,
          sendDailyReports: false
        };
        
        this.userPermissions = {
          allowStaffAddProducts: true,
          allowStaffEditProducts: true,
          allowStaffDeleteProducts: false,
          allowStaffViewReports: false,
          allowStaffManageCategories: true,
          allowStaffManageSuppliers: false,
          requireApprovalForPurchases: false,
          requireApprovalForSales: false
        };
        
        this.generalForm.patchValue(this.systemSettings);
        this.loading = false;
        this.successMessage = 'All settings reset to default values!';
        
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      }, 1000);
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

  // Form getters for easier template access
  get generalFormControls() {
    return this.generalForm.controls;
  }

  get companyName() { return this.generalForm.get('companyName'); }
  get companyEmail() { return this.generalForm.get('companyEmail'); }
  get lowStockThreshold() { return this.generalForm.get('lowStockThreshold'); }
  get taxRate() { return this.generalForm.get('taxRate'); }

  // Helper methods
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatFileSize(bytes: string): string {
    return bytes; // Already formatted
  }

  getBackupStatusClass(status: string): string {
    switch(status) {
      case 'Success': return 'badge bg-success';
      case 'Failed': return 'badge bg-danger';
      case 'Pending': return 'badge bg-warning';
      default: return 'badge bg-secondary';
    }
  }
}