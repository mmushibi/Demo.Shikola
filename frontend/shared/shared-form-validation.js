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
/**
 * Client-side form validation utilities for Shikola portals
 * Provides consistent validation across all forms without exposing sensitive details
 */

class ShikolaFormValidator {
    constructor() {
        this.rules = {
            email: {
                pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Please enter a valid email address'
            },
            phone: {
                pattern: /^[\+]?[1-9][\d]{0,15}$/,
                message: 'Please enter a valid phone number'
            },
            name: {
                pattern: /^[a-zA-Z\s\-'\.]{2,50}$/,
                message: 'Name must be 2-50 characters and contain only letters, spaces, hyphens, apostrophes, or periods'
            },
            password: {
                minLength: 8,
                pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                message: 'Password must be at least 8 characters with uppercase, lowercase, and numbers'
            },
            required: {
                message: 'This field is required'
            },
            number: {
                pattern: /^\d+$/,
                message: 'Please enter a valid number'
            },
            decimal: {
                pattern: /^\d+(\.\d{1,2})?$/,
                message: 'Please enter a valid amount'
            },
            alphanumeric: {
                pattern: /^[a-zA-Z0-9]+$/,
                message: 'Only letters and numbers are allowed'
            },
            address: {
                minLength: 5,
                maxLength: 200,
                message: 'Address must be 5-200 characters'
            },
            zipcode: {
                pattern: /^\d{5}(-\d{4})?$|^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/,
                message: 'Please enter a valid ZIP/postal code'
            }
        };
    }

    /**
     * Validate a single field value against rules
     * @param {string} value - Field value to validate
     * @param {Array} rules - Array of rule names to apply
     * @returns {Object} { isValid: boolean, message: string }
     */
    validateField(value, rules) {
        if (!rules || !Array.isArray(rules)) {
            return { isValid: true, message: '' };
        }

        const trimmedValue = String(value || '').trim();

        for (const rule of rules) {
            // Handle required rule first
            if (rule === 'required') {
                if (!trimmedValue) {
                    return { isValid: false, message: this.rules.required.message };
                }
                continue;
            }

            // Skip other validations if field is empty and not required
            if (!trimmedValue) {
                continue;
            }

            const ruleConfig = this.rules[rule];
            if (!ruleConfig) {
                continue; // Skip unknown rules
            }

            // Pattern validation
            if (ruleConfig.pattern && !ruleConfig.pattern.test(trimmedValue)) {
                return { isValid: false, message: ruleConfig.message };
            }

            // Length validation
            if (ruleConfig.minLength && trimmedValue.length < ruleConfig.minLength) {
                return { isValid: false, message: ruleConfig.message };
            }

            if (ruleConfig.maxLength && trimmedValue.length > ruleConfig.maxLength) {
                return { isValid: false, message: ruleConfig.message };
            }
        }

        return { isValid: true, message: '' };
    }

    /**
     * Validate an entire form
     * @param {HTMLFormElement} form - Form element to validate
     * @param {Object} fieldRules - Object mapping field names to rule arrays
     * @returns {Object} { isValid: boolean, errors: Object, firstErrorField: string }
     */
    validateForm(form, fieldRules) {
        const errors = {};
        let firstErrorField = null;

        for (const fieldName in fieldRules) {
            const field = form.elements[fieldName];
            if (!field) continue;

            const value = field.value;
            const validation = this.validateField(value, fieldRules[fieldName]);

            if (!validation.isValid) {
                errors[fieldName] = validation.message;
                if (!firstErrorField) {
                    firstErrorField = fieldName;
                }
            }
        }

        return {
            isValid: Object.keys(errors).length === 0,
            errors,
            firstErrorField
        };
    }

    /**
     * Display validation errors on form
     * @param {HTMLFormElement} form - Form element
     * @param {Object} errors - Errors object from validateForm
     */
    displayErrors(form, errors) {
        // Clear previous errors
        this.clearErrors(form);

        for (const fieldName in errors) {
            const field = form.elements[fieldName];
            if (!field) continue;

            // Add error class to field
            field.classList.add('border-red-500', 'focus:border-red-500');

            // Find or create error message element
            let errorElement = field.parentNode.querySelector('.field-error');
            if (!errorElement) {
                errorElement = document.createElement('div');
                errorElement.className = 'field-error text-sm text-red-600 mt-1';
                field.parentNode.appendChild(errorElement);
            }

            errorElement.textContent = errors[fieldName];
        }
    }

    /**
     * Clear all validation errors from form
     * @param {HTMLFormElement} form - Form element
     */
    clearErrors(form) {
        // Remove error classes from fields
        const fields = form.querySelectorAll('.border-red-500');
        fields.forEach(field => {
            field.classList.remove('border-red-500', 'focus:border-red-500');
        });

        // Remove error message elements
        const errorElements = form.querySelectorAll('.field-error');
        errorElements.forEach(element => element.remove());
    }

    /**
     * Setup real-time validation for a form
     * @param {HTMLFormElement} form - Form element
     * @param {Object} fieldRules - Field validation rules
     */
    setupRealtimeValidation(form, fieldRules) {
        for (const fieldName in fieldRules) {
            const field = form.elements[fieldName];
            if (!field) continue;

            // Validate on blur
            field.addEventListener('blur', () => {
                const validation = this.validateField(field.value, fieldRules[fieldName]);
                if (!validation.isValid) {
                    this.displayErrors(form, { [fieldName]: validation.message });
                } else {
                    // Clear error for this field
                    field.classList.remove('border-red-500', 'focus:border-red-500');
                    const errorElement = field.parentNode.querySelector('.field-error');
                    if (errorElement) errorElement.remove();
                }
            });

            // Clear error on input if it was previously invalid
            field.addEventListener('input', () => {
                if (field.classList.contains('border-red-500')) {
                    field.classList.remove('border-red-500', 'focus:border-red-500');
                    const errorElement = field.parentNode.querySelector('.field-error');
                    if (errorElement) errorElement.remove();
                }
            });
        }
    }

    /**
     * Sanitize user input to prevent XSS
     * @param {string} input - User input to sanitize
     * @returns {string} Sanitized input
     */
    sanitize(input) {
        if (!input) return '';
        
        return String(input)
            .replace(/[<>]/g, '') // Remove potential HTML tags
            .replace(/javascript:/gi, '') // Remove javascript: protocol
            .replace(/on\w+\s*=/gi, '') // Remove event handlers
            .trim();
    }

    /**
     * Get common validation rule sets for typical form fields
     */
    getCommonRules() {
        return {
            userRegistration: {
                email: ['required', 'email'],
                password: ['required', 'password'],
                firstName: ['required', 'name'],
                lastName: ['required', 'name'],
                phone: ['phone']
            },
            pupilRegistration: {
                firstName: ['required', 'name'],
                lastName: ['required', 'name'],
                email: ['email'],
                phone: ['phone'],
                address: ['address'],
                emergencyContact: ['name'],
                emergencyPhone: ['required', 'phone']
            },
            schoolSetup: {
                schoolName: ['required', 'name'],
                adminEmail: ['required', 'email'],
                adminPhone: ['required', 'phone'],
                address: ['required', 'address']
            },
            feePayment: {
                amount: ['required', 'decimal'],
                paymentMethod: ['required'],
                referenceNumber: ['alphanumeric']
            }
        };
    }
}

// Global instance
window.shikolaFormValidator = new ShikolaFormValidator();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ShikolaFormValidator;
}
