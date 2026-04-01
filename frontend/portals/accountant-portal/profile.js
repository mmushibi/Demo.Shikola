/*
Copyright (c) 2026 Sepio Corp. All Rights Reserved.

This software and its associated documentation files (the "Software") 
are the sole and exclusive property of Sepio Corp. Unauthorized copying, 
modification, distribution, or use of this Software is strictly prohibited.

Sepio Corp retains all intellectual property rights to this Software.
No license is granted to use, reproduce, or distribute this Software 
without the express written consent of Sepio Corp.

For inquiries regarding licensing, please contact:
Sepio Corp
Email: legal@sepiocorp.com
*/
(function() {
    'use strict';

    function accountantProfile() {
        return {
            sidebarOpen: false,
            activeTab: 'personal',
            profileOpen: false,
            notificationsOpen: false,
            unreadNotifications: 0,
            notifications: [],
            
            // Profile data
            profile: {
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                department: 'Finance',
                avatar: null,
                signature: null
            },
            
            // Password form
            passwordForm: {
                current: '',
                new: '',
                confirm: ''
            },
            
            // Preferences
            preferences: {
                darkMode: false,
                compactView: false,
                autoSave: true,
                currency: 'ZMW',
                dateFormat: 'DD/MM/YYYY'
            },
            
            // Notification settings
            notificationSettings: {
                email: true,
                payments: true,
                system: true,
                reports: false
            },
            
            // User data
            user: {
                name: '',
                role: 'Accountant'
            },
            
            init() {
                this.loadProfileData();
                this.loadNotifications();
                this.initEventListeners();
            },
            
            loadProfileData() {
                // Load profile data from API or localStorage
                const savedProfile = localStorage.getItem('accountantProfile');
                if (savedProfile) {
                    this.profile = { ...this.profile, ...JSON.parse(savedProfile) };
                }
                
                const savedPreferences = localStorage.getItem('accountantPreferences');
                if (savedPreferences) {
                    this.preferences = { ...this.preferences, ...JSON.parse(savedPreferences) };
                }
                
                const savedNotifications = localStorage.getItem('accountantNotifications');
                if (savedNotifications) {
                    this.notificationSettings = { ...this.notificationSettings, ...JSON.parse(savedNotifications) };
                }
            },
            
            loadNotifications() {
                // Load notifications from API or localStorage
                const savedNotifications = localStorage.getItem('accountantNotificationsList');
                if (savedNotifications) {
                    this.notifications = JSON.parse(savedNotifications);
                } else {
                    this.notifications = [];
                }
                
                this.unreadNotifications = this.notifications.filter(n => !n.read).length;
            },
            
            initEventListeners() {
                // Initialize any event listeners
                document.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape') {
                        this.profileOpen = false;
                        this.notificationsOpen = false;
                    }
                });
            },
            
            // Profile management
            updatePersonalInfo() {
                // Validate required fields
                if (!this.profile.firstName || !this.profile.lastName || !this.profile.email) {
                    this.showError('Please fill in all required fields');
                    return;
                }
                
                // Validate email format
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(this.profile.email)) {
                    this.showError('Please enter a valid email address');
                    return;
                }
                
                // Show loading state
                const button = event.target;
                const originalText = button.textContent;
                button.textContent = 'Saving...';
                button.disabled = true;
                
                // Save to localStorage (replace with real API call)
                setTimeout(() => {
                    localStorage.setItem('accountantProfile', JSON.stringify(this.profile));
                    this.user.name = `${this.profile.firstName} ${this.profile.lastName}`;
                    this.showSuccess('Personal information updated successfully!');
                    button.textContent = 'Saved!';
                    setTimeout(() => {
                        button.textContent = originalText;
                        button.disabled = false;
                    }, 1000);
                }, 1000);
            },
            
            changePassword() {
                if (this.passwordForm.new !== this.passwordForm.confirm) {
                    this.showError('New passwords do not match');
                    return;
                }
                
                if (this.passwordForm.new.length < 8) {
                    this.showError('Password must be at least 8 characters long');
                    return;
                }
                
                if (!this.passwordForm.current) {
                    this.showError('Please enter your current password');
                    return;
                }
                
                // Show loading state
                const button = event.target;
                const originalText = button.textContent;
                button.textContent = 'Updating...';
                button.disabled = true;
                
                // Simulate API call (replace with real API call)
                setTimeout(() => {
                    this.passwordForm = { current: '', new: '', confirm: '' };
                    this.showSuccess('Password updated successfully!');
                    button.textContent = 'Updated!';
                    setTimeout(() => {
                        button.textContent = originalText;
                        button.disabled = false;
                    }, 1000);
                }, 1000);
            },
            
            // Preferences management
            savePreferences() {
                // Show loading state
                const button = event.target;
                const originalText = button.textContent;
                button.textContent = 'Saving...';
                button.disabled = true;
                
                // Save to localStorage (replace with real API call)
                setTimeout(() => {
                    localStorage.setItem('accountantPreferences', JSON.stringify(this.preferences));
                    
                    // Apply dark mode if enabled
                    if (this.preferences.darkMode) {
                        document.documentElement.classList.add('dark');
                    } else {
                        document.documentElement.classList.remove('dark');
                    }
                    
                    this.showSuccess('Preferences saved successfully!');
                    button.textContent = 'Saved!';
                    setTimeout(() => {
                        button.textContent = originalText;
                        button.disabled = false;
                    }, 1000);
                }, 1000);
            },
            
            // Notification settings
            saveNotificationSettings() {
                // Show loading state
                const button = event.target;
                const originalText = button.textContent;
                button.textContent = 'Saving...';
                button.disabled = true;
                
                // Save to localStorage (replace with real API call)
                setTimeout(() => {
                    localStorage.setItem('accountantNotifications', JSON.stringify(this.notificationSettings));
                    this.showSuccess('Notification settings saved successfully!');
                    button.textContent = 'Saved!';
                    setTimeout(() => {
                        button.textContent = originalText;
                        button.disabled = false;
                    }, 1000);
                }, 1000);
            },
            
            // Signature management
            handleSignatureUpload(event) {
                const file = event.target.files[0];
                if (!file) return;
                
                // Validate file type
                if (!file.type.startsWith('image/')) {
                    this.showError('Please select an image file');
                    return;
                }
                
                // Validate file size (2MB)
                if (file.size > 2 * 1024 * 1024) {
                    this.showError('File size must be less than 2MB');
                    return;
                }
                
                // Read and convert to base64
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.profile.signature = e.target.result;
                };
                reader.readAsDataURL(file);
            },
            
            saveSignature() {
                if (!this.profile.signature) {
                    this.showError('Please upload a signature first');
                    return;
                }
                
                // Show loading state
                const button = event.target;
                const originalText = button.textContent;
                button.textContent = 'Saving...';
                button.disabled = true;
                
                // Save to localStorage (replace with real API call)
                setTimeout(() => {
                    localStorage.setItem('accountantProfile', JSON.stringify(this.profile));
                    this.showSuccess('Signature saved successfully!');
                    button.textContent = 'Saved!';
                    setTimeout(() => {
                        button.textContent = originalText;
                        button.disabled = false;
                    }, 1000);
                }, 1000);
            },
            
            // Notification management
            markAsRead(notificationId) {
                const notification = this.notifications.find(n => n.id === notificationId);
                if (notification) {
                    notification.read = true;
                    this.unreadNotifications = this.notifications.filter(n => !n.read).length;
                }
            },
            
            clearAllNotifications() {
                this.notifications = [];
                this.unreadNotifications = 0;
            },
            
            // Utility functions
            logout() {
                if (confirm('Are you sure you want to logout?')) {
                    // Clear all localStorage data
                    localStorage.removeItem('accountantToken');
                    localStorage.removeItem('accountantProfile');
                    localStorage.removeItem('accountantPreferences');
                    localStorage.removeItem('accountantNotifications');
                    localStorage.removeItem('accountantNotificationsList');
                    
                    // Redirect to login
                    window.location.href = '../../public/index.html';
                }
            },
            
            formatCurrency(amount) {
                return new Intl.NumberFormat('en-ZM', {
                    style: 'currency',
                    currency: this.preferences.currency || 'ZMW'
                }).format(amount);
            },
            
            // Notification functions
            showSuccess(message) {
                if (window.showNotification) {
                    window.showNotification(message, 'success');
                } else {
                    alert(message);
                }
            },
            
            showError(message) {
                if (window.showNotification) {
                    window.showNotification(message, 'error');
                } else {
                    alert(message);
                }
            }
        };
    }

    // Initialize the component when DOM is ready
    if (typeof window !== 'undefined') {
        window.accountantProfile = accountantProfile;
    }

})();
