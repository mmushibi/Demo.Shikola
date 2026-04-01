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
// Main JavaScript functionality for Shikola Admin Console

// Global utilities
window.Shikola = {
    // API configuration
    api: {
        baseUrl: window.location.origin + '/api',
        headers: {
            'Content-Type': 'application/json'
        }
    },

    // Authentication utilities
    auth: {
        getToken() {
            return localStorage.getItem('shikola_admin_token');
        },
        
        setToken(token) {
            localStorage.setItem('shikola_admin_token', token);
        },
        
        removeToken() {
            localStorage.removeItem('shikola_admin_token');
        },
        
        isAuthenticated() {
            return !!this.getToken();
        },
        
        getRole() {
            const token = this.getToken();
            if (token) {
                try {
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    return payload.role;
                } catch (e) {
                    return null;
                }
            }
            return null;
        }
    },

    // UI utilities
    ui: {
        showLoading(element) {
            if (element) {
                element.disabled = true;
                element.classList.add('opacity-50', 'cursor-not-allowed');
            }
        },
        
        hideLoading(element) {
            if (element) {
                element.disabled = false;
                element.classList.remove('opacity-50', 'cursor-not-allowed');
            }
        },
        
        showToast(message, type = 'info') {
            // Simple toast implementation
            const toast = document.createElement('div');
            toast.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
                type === 'success' ? 'bg-green-500' : 
                type === 'error' ? 'bg-red-500' : 
                type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
            } text-white transform transition-all duration-300 translate-x-full`;
            toast.textContent = message;
            
            document.body.appendChild(toast);
            
            setTimeout(() => {
                toast.classList.remove('translate-x-full');
            }, 100);
            
            setTimeout(() => {
                toast.classList.add('translate-x-full');
                setTimeout(() => {
                    document.body.removeChild(toast);
                }, 300);
            }, 3000);
        }
    },

    // Form utilities
    forms: {
        serialize(form) {
            const formData = new FormData(form);
            const data = {};
            for (let [key, value] of formData.entries()) {
                data[key] = value;
            }
            return data;
        },
        
        validate(form, rules) {
            const errors = {};
            const data = this.serialize(form);
            
            for (const [field, rule] of Object.entries(rules)) {
                if (rule.required && !data[field]) {
                    errors[field] = `${field} is required`;
                }
                if (rule.email && data[field] && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data[field])) {
                    errors[field] = `${field} must be a valid email`;
                }
                if (rule.minLength && data[field] && data[field].length < rule.minLength) {
                    errors[field] = `${field} must be at least ${rule.minLength} characters`;
                }
            }
            
            return { isValid: Object.keys(errors).length === 0, errors, data };
        }
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('Shikola Admin Console initialized');
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.Shikola;
}
