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
// General utility functions and page initialization
class ShikolaUtils {
    constructor() {
        this.init();
    }

    init() {
        // Initialize global error handling
        window.addEventListener('error', this.handleGlobalError.bind(this));
        window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));

        // Initialize console logging for debugging
        this.setupConsoleLogging();

        console.log('Shikola Utils initialized');
    }

    handleGlobalError(event) {
        const error = event.error || event.message || 'Unknown error';
        
        // Filter out expected demo mode errors
        if (error && (
            error.message === 'API disabled in demo mode' ||
            error.message === 'API disabled in demo mode' ||
            (typeof error === 'string' && error.includes('API disabled in demo mode'))
        )) {
            return; // Silently ignore demo mode errors
        }
        
        // Only log if we have meaningful error information
        if (error && error !== 'null' && error !== null) {
            console.error('Global error:', error);
            console.error('Error details:', {
                message: error.message || error,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                stack: error.stack
            });
        }
    }

    handleUnhandledRejection(event) {
        const reason = event.reason || 'Unknown promise rejection';
        
        // Filter out expected demo mode errors
        if (reason && (
            reason.message === 'API disabled in demo mode' ||
            (typeof reason === 'string' && reason.includes('API disabled in demo mode')) ||
            reason === 'API disabled in demo mode'
        )) {
            return; // Silently ignore demo mode errors
        }
        
        // Only log meaningful rejections, filter out null/undefined
        if (reason && reason !== 'null' && reason !== null && reason !== undefined) {
            console.error('Unhandled promise rejection:', reason);
        }
    }

    setupConsoleLogging() {
        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;

        console.log = (...args) => {
            originalLog.apply(console, ['[INFO]', new Date().toISOString(), ...args]);
        };

        console.error = (...args) => {
            originalError.apply(console, ['[ERROR]', new Date().toISOString(), ...args]);
        };

        console.warn = (...args) => {
            originalWarn.apply(console, ['[WARN]', new Date().toISOString(), ...args]);
        };
    }

    // Utility functions
    static formatDate(date) {
        if (!date) return '';
        return new Date(date).toLocaleDateString();
    }

    static formatDateTime(date) {
        if (!date) return '';
        return new Date(date).toLocaleString();
    }

    static capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }

    static truncate(str, length = 50) {
        if (!str) return '';
        return str.length > length ? str.substring(0, length) + '...' : str;
    }

    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    static isValidPhone(phone) {
        const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
        return phoneRegex.test(phone);
    }

    static showNotification(message, type = 'info') {
        // Create a simple notification system
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
            </div>
        `;

        // Add some basic styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#fee' : type === 'success' ? '#efe' : '#eff'};
            border: 1px solid ${type === 'error' ? '#fcc' : type === 'success' ? '#cfc' : '#ccf'};
            border-radius: 4px;
            padding: 12px 16px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            z-index: 10000;
            max-width: 400px;
        `;

        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func.apply(this, args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Form validation helpers
    static validateRequired(value, fieldName) {
        if (!value || value.toString().trim() === '') {
            return `${fieldName} is required`;
        }
        return null;
    }

    static validateEmail(email) {
        if (!email) return 'Email is required';
        if (!this.isValidEmail(email)) {
            return 'Please enter a valid email address';
        }
        return null;
    }

    static validatePhone(phone) {
        if (!phone) return 'Phone number is required';
        if (!this.isValidPhone(phone)) {
            return 'Please enter a valid phone number';
        }
        return null;
    }

    static validatePassword(password) {
        if (!password) return 'Password is required';
        if (password.length < 8) {
            return 'Password must be at least 8 characters long';
        }
        return null;
    }

    // Local storage helpers
    static setStorageItem(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error('Failed to save to localStorage:', error);
        }
    }

    static getStorageItem(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Failed to read from localStorage:', error);
            return defaultValue;
        }
    }

    static removeStorageItem(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error('Failed to remove from localStorage:', error);
        }
    }

    // URL and navigation helpers
    static getQueryParam(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    }

    static setQueryParam(name, value) {
        const url = new URL(window.location);
        url.searchParams.set(name, value);
        window.history.replaceState({}, '', url);
    }

    static removeQueryParam(name) {
        const url = new URL(window.location);
        url.searchParams.delete(name);
        window.history.replaceState({}, '', url);
    }

    // Device detection
    static isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    static isIOS() {
        return /iPad|iPhone|iPod/.test(navigator.userAgent);
    }

    static isAndroid() {
        return /Android/.test(navigator.userAgent);
    }
}

// Initialize utils when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.shikolaUtils = new ShikolaUtils();
    console.log('Shikola utilities loaded');
});

// Global error handler for fetch requests
window.addEventListener('unhandledrejection', event => {
    if (event.reason && event.reason.message && event.reason.message.includes('Failed to fetch')) {
        console.error('Network error - API may not be running or accessible');
        // Backend/network errors should not show as frontend toasts
        // ShikolaUtils.showNotification('Unable to connect to server. Please check your connection and try again.', 'error');
    }
});
