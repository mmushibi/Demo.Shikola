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
 * Error handling utilities for Shikola portals
 * Provides safe error message display without exposing sensitive information
 */

class ShikolaErrorHandler {
    constructor() {
        // Generic error messages that don't expose sensitive details
        this.genericMessages = {
            network: 'Unable to connect to the server. Please check your internet connection and try again.',
            server: 'Something went wrong. Please try again in a moment.',
            validation: 'Please check your input and try again.',
            authentication: 'Authentication required. Please log in again.',
            authorization: 'You do not have permission to perform this action.',
            notFound: 'The requested information was not found.',
            timeout: 'Request timed out. Please try again.',
            unknown: 'An unexpected error occurred. Please try again.'
        };

        // Error patterns that should be sanitized
        this.sensitivePatterns = [
            /sql/i,
            /database/i,
            /stack trace/i,
            /internal server error/i,
            /syntax error/i,
            /fatal error/i,
            /exception/i,
            /debug/i,
            /admin/i,
            /root/i,
            /password/i,
            /token/i,
            /secret/i,
            /key/i
        ];
    }

    /**
     * Sanitize error message for user display
     * @param {string|Error} error - Raw error message or Error object
     * @param {string} context - Context where error occurred (optional)
     * @returns {string} Safe error message for users
     */
    sanitizeError(error, context = null) {
        let message = '';

        // Extract message from Error object or string
        if (error instanceof Error) {
            message = error.message || String(error);
        } else if (typeof error === 'string') {
            message = error;
        } else {
            message = String(error);
        }

        // Check for sensitive information patterns
        const hasSensitiveInfo = this.sensitivePatterns.some(pattern => 
            pattern.test(message)
        );

        if (hasSensitiveInfo) {
            return this.getGenericMessage('server');
        }

        // Check for common HTTP status codes
        const statusMatch = message.match(/(\d{3})/);
        if (statusMatch) {
            const status = parseInt(statusMatch[1]);
            return this.getHttpErrorMessage(status);
        }

        // Check for network-related errors
        if (this.isNetworkError(message)) {
            return this.getGenericMessage('network');
        }

        // If message is too long or contains technical details, use generic message
        if (message.length > 200 || this.isTechnicalMessage(message)) {
            return this.getGenericMessage('server');
        }

        // Clean up any remaining sensitive parts
        message = this.cleanMessage(message);

        // Add context if provided and appropriate
        if (context && !hasSensitiveInfo) {
            message = `${context}: ${message}`;
        }

        return message || this.getGenericMessage('unknown');
    }

    /**
     * Get appropriate error message for HTTP status codes
     * @param {number} status - HTTP status code
     * @returns {string} User-friendly error message
     */
    getHttpErrorMessage(status) {
        const statusMessages = {
            400: 'Invalid request. Please check your input and try again.',
            401: 'Authentication required. Please log in again.',
            403: 'You do not have permission to perform this action.',
            404: 'The requested information was not found.',
            408: 'Request timed out. Please try again.',
            422: 'Invalid data provided. Please check your input and try again.',
            429: 'Too many requests. Please wait a moment and try again.',
            500: 'Server error. Please try again in a moment.',
            502: 'Server temporarily unavailable. Please try again in a moment.',
            503: 'Service unavailable. Please try again later.',
            504: 'Server timeout. Please try again.'
        };

        return statusMessages[status] || this.getGenericMessage('server');
    }

    /**
     * Get generic error message by type
     * @param {string} type - Type of error
     * @returns {string} Generic error message
     */
    getGenericMessage(type) {
        return this.genericMessages[type] || this.genericMessages.unknown;
    }

    /**
     * Check if error message contains technical details
     * @param {string} message - Error message to check
     * @returns {boolean} True if message is technical
     */
    isTechnicalMessage(message) {
        const technicalPatterns = [
            /undefined|null|cannot read property/i,
            /function|object|array|string|number/i,
            /\.js|\.html|\.css/i,
            /line \d+|column \d+/i,
            /at \w+|anonymous/i,
            /call stack|trace/i
        ];

        return technicalPatterns.some(pattern => pattern.test(message));
    }

    /**
     * Check if error is network-related
     * @param {string} message - Error message to check
     * @returns {boolean} True if network error
     */
    isNetworkError(message) {
        const networkPatterns = [
            /network|connection|offline|unreachable/i,
            /fetch|xhr|ajax/i,
            /cors|cross-origin/i,
            /timeout|timed out/i,
            /dns|host|server/i
        ];

        return networkPatterns.some(pattern => pattern.test(message));
    }

    /**
     * Clean up error message by removing sensitive parts
     * @param {string} message - Message to clean
     * @returns {string} Cleaned message
     */
    cleanMessage(message) {
        // Remove file paths and URLs
        message = message.replace(/\/[\w\/\-\.]+/g, '[path]');
        message = message.replace(/https?:\/\/[^\s]+/g, '[url]');
        
        // Remove IP addresses
        message = message.replace(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/g, '[address]');
        
        // Remove database details
        message = message.replace(/table\s+\w+/gi, 'table');
        message = message.replace(/column\s+\w+/gi, 'column');
        
        // Remove long numeric sequences (potential IDs)
        message = message.replace(/\b\d{8,}\b/g, '[id]');
        
        return message.trim();
    }

    /**
     * Display error message to user
     * @param {string} message - Error message to display
     * @param {string} type - Alert type (error, warning, info)
     * @param {number} duration - Auto-dismiss duration in milliseconds (0 for no auto-dismiss)
     */
    showError(message, type = 'error', duration = 5000) {
        // Try to use existing notification system
        if (window.shikolaNotifications && window.shikolaNotifications.show) {
            window.shikolaNotifications.show(message, type, duration);
            return;
        }

        // Fallback to alert for critical errors
        if (type === 'error') {
            alert(message);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }

    /**
     * Handle API response errors safely
     * @param {Response} response - Fetch API response object
     * @param {Object} errorData - Parsed error data from response
     * @returns {string} Safe error message
     */
    handleApiError(response, errorData = {}) {
        // Use status code for primary error classification
        const statusMessage = this.getHttpErrorMessage(response.status);
        
        // If server provides a safe error message, use it
        if (errorData.error && !this.containsSensitiveInfo(errorData.error)) {
            return errorData.error;
        }
        
        // Otherwise use the generic status message
        return statusMessage;
    }

    /**
     * Check if message contains sensitive information
     * @param {string} message - Message to check
     * @returns {boolean} True if contains sensitive info
     */
    containsSensitiveInfo(message) {
        return this.sensitivePatterns.some(pattern => pattern.test(message));
    }

    /**
     * Log error for debugging (without exposing to users)
     * @param {Error|string} error - Error to log
     * @param {string} context - Context where error occurred
     */
    logError(error, context = null) {
        const logMessage = context ? `[${context}] ${error}` : String(error);
        console.error('[ShikolaErrorHandler]', logMessage);
    }
}

// Global instance
window.shikolaErrorHandler = new ShikolaErrorHandler();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ShikolaErrorHandler;
}
