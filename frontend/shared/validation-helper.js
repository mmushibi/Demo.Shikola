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
class ValidationHelper {
    constructor() {
        this.init();
    }

    init() {
        // Add validation to forms when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setupFormValidation();
            });
        } else {
            this.setupFormValidation();
        }
    }

    setupFormValidation() {
        // Find all forms with validation attributes
        const forms = document.querySelectorAll('form[data-validate="true"]');
        forms.forEach(form => {
            this.addFormValidation(form);
        });

        // Find individual inputs with validation
        const inputs = document.querySelectorAll('input[data-validate], select[data-validate], textarea[data-validate]');
        inputs.forEach(input => {
            this.addInputValidation(input);
        });
    }

    addFormValidation(form) {
        form.addEventListener('submit', async (e) => {
            const isValid = await this.validateForm(form);
            if (!isValid) {
                e.preventDefault();
                return false;
            }
        });

        // Add real-time validation
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                this.validateInput(input);
            });

            input.addEventListener('input', () => {
                // Clear error on input
                this.clearInputError(input);
            });
        });
    }

    addInputValidation(input) {
        input.addEventListener('blur', () => {
            this.validateInput(input);
        });

        input.addEventListener('input', () => {
            this.clearInputError(input);
        });
    }

    async validateForm(form) {
        let isValid = true;
        const inputs = form.querySelectorAll('input, select, textarea');
        
        for (const input of inputs) {
            const inputValid = await this.validateInput(input);
            if (!inputValid) {
                isValid = false;
            }
        }

        return isValid;
    }

    async validateInput(input) {
        const validationRules = input.dataset.validate?.split('|') || [];
        let isValid = true;

        for (const rule of validationRules) {
            const [ruleName, ...params] = rule.split(':');
            
            switch (ruleName) {
                case 'required':
                    if (!this.validateRequired(input)) {
                        isValid = false;
                    }
                    break;
                    
                case 'email':
                    if (!this.validateEmail(input)) {
                        isValid = false;
                    }
                    break;
                    
                case 'phone':
                    if (!this.validatePhone(input)) {
                        isValid = false;
                    }
                    break;
                    
                case 'unique':
                    if (!await this.validateUnique(input, params[0])) {
                        isValid = false;
                    }
                    break;
                    
                case 'minlength':
                    if (!this.validateMinLength(input, parseInt(params[0]))) {
                        isValid = false;
                    }
                    break;
                    
                case 'maxlength':
                    if (!this.validateMaxLength(input, parseInt(params[0]))) {
                        isValid = false;
                    }
                    break;
                    
                case 'pattern':
                    if (!this.validatePattern(input, params[0])) {
                        isValid = false;
                    }
                    break;
            }
        }

        return isValid;
    }

    validateRequired(input) {
        const value = input.value.trim();
        const isValid = value.length > 0;
        
        if (!isValid) {
            this.showInputError(input, 'This field is required');
        }
        
        return isValid;
    }

    validateEmail(input) {
        const value = input.value.trim();
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        const isValid = !value || emailRegex.test(value);
        
        if (!isValid) {
            this.showInputError(input, 'Please enter a valid email address');
        }
        
        return isValid;
    }

    validatePhone(input) {
        const value = input.value.trim();
        const phoneRegex = /^(\+260|0)[0-9]{9}$/;
        const isValid = !value || phoneRegex.test(value);
        
        if (!isValid) {
            this.showInputError(input, 'Please enter a valid Zambian phone number (e.g., +260123456789 or 0912345678)');
        }
        
        return isValid;
    }

    async validateUnique(input, fieldType) {
        const value = input.value.trim();
        if (!value) return true;

        try {
            const response = await fetch(`/api/validation/check-unique`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify({
                    field: fieldType,
                    value: value,
                    excludeId: input.dataset.excludeId || null
                })
            });

            const result = await response.json();
            const isValid = result.isUnique;
            
            if (!isValid) {
                this.showInputError(input, `This ${fieldType} is already in use`);
            }
            
            return isValid;
        } catch (error) {
            console.error('Error validating uniqueness:', error);
            return true; // Allow submission on error
        }
    }

    validateMinLength(input, minLength) {
        const value = input.value.trim();
        const isValid = value.length >= minLength;
        
        if (!isValid) {
            this.showInputError(input, `Minimum ${minLength} characters required`);
        }
        
        return isValid;
    }

    validateMaxLength(input, maxLength) {
        const value = input.value.trim();
        const isValid = value.length <= maxLength;
        
        if (!isValid) {
            this.showInputError(input, `Maximum ${maxLength} characters allowed`);
        }
        
        return isValid;
    }

    validatePattern(input, pattern) {
        const value = input.value.trim();
        const regex = new RegExp(pattern);
        const isValid = !value || regex.test(value);
        
        if (!isValid) {
            this.showInputError(input, 'Invalid format');
        }
        
        return isValid;
    }

    showInputError(input, message) {
        // Clear existing error
        this.clearInputError(input);

        // Add error styling
        input.classList.add('border-red-500', 'ring-red-500');

        // Create error message
        const errorElement = document.createElement('div');
        errorElement.className = 'text-red-500 text-sm mt-1 validation-error';
        errorElement.textContent = message;

        // Insert error after input
        input.parentNode.insertBefore(errorElement, input.nextSibling);

        // Mark input as having error
        input.dataset.hasError = 'true';
    }

    clearInputError(input) {
        // Remove error styling
        input.classList.remove('border-red-500', 'ring-red-500');

        // Remove error message
        const errorElement = input.parentNode.querySelector('.validation-error');
        if (errorElement) {
            errorElement.remove();
        }

        // Clear error marker
        delete input.dataset.hasError;
    }

    // School-specific validation
    async validateSchoolCreation(schoolData) {
        try {
            const response = await fetch('/api/validation/school', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify(schoolData)
            });

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error validating school creation:', error);
            return { isValid: false, errors: ['Validation service unavailable'] };
        }
    }

    async validateUserCreation(userData) {
        try {
            const response = await fetch('/api/validation/user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify(userData)
            });

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error validating user creation:', error);
            return { isValid: false, errors: ['Validation service unavailable'] };
        }
    }

    // Promo code validation
    async validatePromoCode(code, tierId = null) {
        try {
            const response = await fetch('/api/promo/validate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify({
                    code: code,
                    tierId: tierId
                })
            });

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error validating promo code:', error);
            return { isValid: false, message: 'Promo code validation unavailable' };
        }
    }

    // Real-time validation feedback
    setupRealtimeValidation() {
        // Add debounced validation for inputs
        const inputs = document.querySelectorAll('input[data-realtime="true"]');
        inputs.forEach(input => {
            let timeout;
            
            input.addEventListener('input', () => {
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    this.validateInput(input);
                }, 500);
            });
        });
    }

    // Helper methods
    getAuthToken() {
        if (window.authManager) {
            return window.authManager.getToken();
        }
        return localStorage.getItem('authToken');
    }

    // Public API
    showErrors(form, errors) {
        // Clear existing errors
        this.clearFormErrors(form);

        // Show new errors
        Object.keys(errors).forEach(fieldName => {
            const input = form.querySelector(`[name="${fieldName}"]`);
            if (input) {
                this.showInputError(input, errors[fieldName]);
            }
        });
    }

    clearFormErrors(form) {
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            this.clearInputError(input);
        });
    }

    isValid(form) {
        return this.validateForm(form);
    }
}

// Initialize validation helper
window.validationHelper = new ValidationHelper();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ValidationHelper;
}
