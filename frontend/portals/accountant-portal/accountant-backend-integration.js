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
 * Accountant Portal Backend Integration
 * Replaces localStorage with real API calls, RBAC, and real-time sync
 */
(function(window) {
    'use strict';

    if (!window.ShikolaAPI) {
        console.error('ShikolaAPI not found');
        return;
    }

    class AccountantManager {
        constructor() {
            this.cache = new Map();
            this.initialized = false;
        }

        async init() {
            if (this.initialized) return;
            
            const user = await window.ShikolaAPI.auth.getCurrentUser();
            if (!user || !window.ShikolaAPI.auth.canAccessResource('fees', 'read')) {
                throw new Error('Insufficient permissions for accounting functions');
            }

            this.setupRealtimeSync();
            this.initialized = true;
        }

        setupRealtimeSync() {
            window.ShikolaAPI.ws.subscribe('fees', (data) => {
                this.cache.clear();
                window.dispatchEvent(new CustomEvent('shikola:fees-updated', { detail: data }));
            });
        }

        async getFees(params = {}) {
            try {
                const response = await window.ShikolaAPI.fees.list(params);
                return response.success ? response.data : [];
            } catch (e) {
                console.error('Failed to fetch fees:', e);
                return [];
            }
        }

        async createFee(data) {
            try {
                const response = await window.ShikolaAPI.fees.create(data);
                if (response.success) {
                    this.cache.clear();
                    return response.data;
                }
                throw new Error(response.error || 'Failed to create fee');
            } catch (e) {
                console.error('Failed to create fee:', e);
                throw e;
            }
        }

        async getPayments(params = {}) {
            try {
                const response = await window.ShikolaAPI.fees.payments(params);
                return response.success ? response.data : [];
            } catch (e) {
                console.error('Failed to fetch payments:', e);
                return [];
            }
        }

        async recordPayment(data) {
            try {
                const response = await window.ShikolaAPI.fees.payment(data);
                if (response.success) {
                    this.cache.clear();
                    return response.data;
                }
                throw new Error(response.error || 'Failed to record payment');
            } catch (e) {
                console.error('Failed to record payment:', e);
                throw e;
            }
        }

        async getFinancialReports(params = {}) {
            try {
                const response = await window.ShikolaAPI.reports.generate('financial', params);
                return response.success ? response.data : [];
            } catch (e) {
                console.error('Failed to generate reports:', e);
                return [];
            }
        }
    }

    const accountantManager = new AccountantManager();

    window.AccountantAPI = {
        init: () => accountantManager.init(),
        getFees: (params) => accountantManager.getFees(params),
        createFee: (data) => accountantManager.createFee(data),
        getPayments: (params) => accountantManager.getPayments(params),
        recordPayment: (data) => accountantManager.recordPayment(data),
        getReports: (params) => accountantManager.getFinancialReports(params)
    };

    console.log('Accountant Backend Integration loaded');
})(window);
