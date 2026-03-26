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
 * Shikola Accountant Portal API Integration
 * Provides unified API access for all accountant portal functionality
 */
(function () {
    'use strict';

    var INCOMES_KEY = 'shikola_accountant_incomes_v1';
    var EXPENSES_KEY = 'shikola_accountant_expenses_v1';
    var CHART_ACCOUNTS_KEY = 'shikola_chart_accounts_v1';

    function getAuthToken() {
        try {
            return localStorage.getItem('authToken') || localStorage.getItem('shikola_token') || null;
        } catch (e) {
            return null;
        }
    }

    function buildAuthHeaders() {
        var headers = { 'Content-Type': 'application/json' };
        // Auth disabled for accountant portal - no auth headers needed
        return headers;
    }

    function canUseApi() {
        var base = window.SHIKOLA_API_BASE;
        // Auth disabled for accountant portal - only need API base URL
        return !!base;
    }

    async function apiRequest(endpoint, options) {
        var base = window.SHIKOLA_API_BASE;
        if (!base) return { success: false, error: 'API not configured' };
        
        try {
            var response = await fetch(base + endpoint, Object.assign({
                headers: buildAuthHeaders()
            }, options || {}));
            
            var data = await response.json().catch(function () { return null; });
            
            if (!response.ok) {
                return { success: false, error: data?.error || 'Request failed', status: response.status };
            }
            
            return { success: true, data: data, status: response.status };
        } catch (e) {
            return { success: false, error: 'Network error: ' + e.message };
        }
    }

    // Local Storage Helpers
    function loadLocalIncomes() {
        try {
            var raw = localStorage.getItem(INCOMES_KEY);
            if (!raw) return [];
            var data = JSON.parse(raw);
            return Array.isArray(data) ? data : [];
        } catch (e) {
            return [];
        }
    }

    function saveLocalIncomes(list) {
        try {
            localStorage.setItem(INCOMES_KEY, JSON.stringify(Array.isArray(list) ? list : []));
        } catch (e) {
        }
    }

    function loadLocalExpenses() {
        try {
            var raw = localStorage.getItem(EXPENSES_KEY);
            if (!raw) return [];
            var data = JSON.parse(raw);
            return Array.isArray(data) ? data : [];
        } catch (e) {
            return [];
        }
    }

    function saveLocalExpenses(list) {
        try {
            localStorage.setItem(EXPENSES_KEY, JSON.stringify(Array.isArray(list) ? list : []));
        } catch (e) {
        }
    }

    function loadLocalChartAccounts() {
        try {
            var raw = localStorage.getItem(CHART_ACCOUNTS_KEY);
            if (!raw) return getDefaultChartAccounts();
            var data = JSON.parse(raw);
            return Array.isArray(data) ? data : getDefaultChartAccounts();
        } catch (e) {
            return getDefaultChartAccounts();
        }
    }

    function saveLocalChartAccounts(list) {
        try {
            localStorage.setItem(CHART_ACCOUNTS_KEY, JSON.stringify(Array.isArray(list) ? list : []));
        } catch (e) {
        }
    }

    function getDefaultChartAccounts() {
        return [];
    }

    // Income Management
    async function getIncomes(params) {
        var local = loadLocalIncomes();
        
        if (!canUseApi()) {
            return { success: true, data: { data: local } };
        }

        var queryString = '';
        if (params && typeof params === 'object') {
            var parts = [];
            for (var key in params) {
                if (Object.prototype.hasOwnProperty.call(params, key) && params[key] != null) {
                    parts.push(encodeURIComponent(key) + '=' + encodeURIComponent(params[key]));
                }
            }
            if (parts.length) {
                queryString = '?' + parts.join('&');
            }
        }

        var result = await apiRequest('/api/accountant/incomes' + queryString, { method: 'GET' });
        
        if (result.success && result.data && Array.isArray(result.data.data)) {
            saveLocalIncomes(result.data.data);
        }
        
        return result;
    }

    async function createIncome(payload) {
        var localIncomes = loadLocalIncomes();
        var income = Object.assign({}, payload, {
            id: 'INC-' + Date.now().toString(36).toUpperCase(),
            createdAt: new Date().toISOString(),
            status: 'Completed'
        });
        
        localIncomes.push(income);
        saveLocalIncomes(localIncomes);

        if (!canUseApi()) {
            return { success: true, data: income };
        }

        var result = await apiRequest('/api/accountant/incomes', {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        if (result.success && result.data) {
            var updatedIncomes = loadLocalIncomes();
            var index = updatedIncomes.findIndex(function (inc) { return inc.id === income.id; });
            if (index >= 0) {
                updatedIncomes[index] = result.data;
                saveLocalIncomes(updatedIncomes);
            }
            return result;
        }

        return { success: true, data: income, source: 'local' };
    }

    async function updateIncome(id, payload) {
        var localIncomes = loadLocalIncomes();
        var index = localIncomes.findIndex(function (inc) { return inc.id === id; });
        
        if (index >= 0) {
            localIncomes[index] = Object.assign({}, localIncomes[index], payload);
            saveLocalIncomes(localIncomes);
        }

        if (!canUseApi()) {
            return { success: true, data: localIncomes[index] || payload };
        }

        var result = await apiRequest('/api/accountant/incomes/' + encodeURIComponent(id), {
            method: 'PUT',
            body: JSON.stringify(payload)
        });

        if (result.success && result.data) {
            var updatedIncomes = loadLocalIncomes();
            var idx = updatedIncomes.findIndex(function (inc) { return inc.id === id; });
            if (idx >= 0) {
                updatedIncomes[idx] = result.data;
                saveLocalIncomes(updatedIncomes);
            }
            return result;
        }

        return { success: true, data: localIncomes[index] || payload };
    }

    async function deleteIncome(id) {
        var localIncomes = loadLocalIncomes();
        var filtered = localIncomes.filter(function (inc) { return inc.id !== id; });
        saveLocalIncomes(filtered);

        if (!canUseApi()) {
            return { success: true };
        }

        return await apiRequest('/api/accountant/incomes/' + encodeURIComponent(id), {
            method: 'DELETE'
        });
    }

    // Expense Management
    async function getExpenses(params) {
        var local = loadLocalExpenses();
        
        if (!canUseApi()) {
            return { success: true, data: { data: local } };
        }

        var queryString = '';
        if (params && typeof params === 'object') {
            var parts = [];
            for (var key in params) {
                if (Object.prototype.hasOwnProperty.call(params, key) && params[key] != null) {
                    parts.push(encodeURIComponent(key) + '=' + encodeURIComponent(params[key]));
                }
            }
            if (parts.length) {
                queryString = '?' + parts.join('&');
            }
        }

        var result = await apiRequest('/api/accountant/expenses' + queryString, { method: 'GET' });
        
        if (result.success && result.data && Array.isArray(result.data.data)) {
            saveLocalExpenses(result.data.data);
        }
        
        return result;
    }

    async function createExpense(payload) {
        var localExpenses = loadLocalExpenses();
        var expense = Object.assign({}, payload, {
            id: 'EXP-' + Date.now().toString(36).toUpperCase(),
            createdAt: new Date().toISOString(),
            status: 'Pending'
        });
        
        localExpenses.push(expense);
        saveLocalExpenses(localExpenses);

        if (!canUseApi()) {
            return { success: true, data: expense };
        }

        var result = await apiRequest('/api/accountant/expenses', {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        if (result.success && result.data) {
            var updatedExpenses = loadLocalExpenses();
            var index = updatedExpenses.findIndex(function (exp) { return exp.id === expense.id; });
            if (index >= 0) {
                updatedExpenses[index] = result.data;
                saveLocalExpenses(updatedExpenses);
            }
            return result;
        }

        return { success: true, data: expense, source: 'local' };
    }

    async function updateExpense(id, payload) {
        var localExpenses = loadLocalExpenses();
        var index = localExpenses.findIndex(function (exp) { return exp.id === id; });
        
        if (index >= 0) {
            localExpenses[index] = Object.assign({}, localExpenses[index], payload);
            saveLocalExpenses(localExpenses);
        }

        if (!canUseApi()) {
            return { success: true, data: localExpenses[index] || payload };
        }

        var result = await apiRequest('/api/accountant/expenses/' + encodeURIComponent(id), {
            method: 'PUT',
            body: JSON.stringify(payload)
        });

        if (result.success && result.data) {
            var updatedExpenses = loadLocalExpenses();
            var idx = updatedExpenses.findIndex(function (exp) { return exp.id === id; });
            if (idx >= 0) {
                updatedExpenses[idx] = result.data;
                saveLocalExpenses(updatedExpenses);
            }
            return result;
        }

        return { success: true, data: localExpenses[index] || payload };
    }

    async function deleteExpense(id) {
        var localExpenses = loadLocalExpenses();
        var filtered = localExpenses.filter(function (exp) { return exp.id !== id; });
        saveLocalExpenses(filtered);

        if (!canUseApi()) {
            return { success: true };
        }

        return await apiRequest('/api/accountant/expenses/' + encodeURIComponent(id), {
            method: 'DELETE'
        });
    }

    async function approveExpense(id) {
        return await updateExpense(id, { status: 'Approved' });
    }

    // Chart of Accounts
    async function getChartAccounts() {
        var local = loadLocalChartAccounts();
        
        if (!canUseApi()) {
            return { success: true, data: local };
        }

        var result = await apiRequest('/api/accountant/chart-of-accounts', { method: 'GET' });
        
        if (result.success && Array.isArray(result.data)) {
            saveLocalChartAccounts(result.data);
        }
        
        return result;
    }

    async function createChartAccount(payload) {
        var localAccounts = loadLocalChartAccounts();
        var account = Object.assign({}, payload, {
            id: 'ACC-' + Date.now().toString(36).toUpperCase(),
            createdAt: new Date().toISOString()
        });
        
        localAccounts.push(account);
        saveLocalChartAccounts(localAccounts);

        if (!canUseApi()) {
            return { success: true, data: account };
        }

        var result = await apiRequest('/api/accountant/chart-of-accounts', {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        if (result.success && result.data) {
            var updatedAccounts = loadLocalChartAccounts();
            var index = updatedAccounts.findIndex(function (acc) { return acc.id === account.id; });
            if (index >= 0) {
                updatedAccounts[index] = result.data;
                saveLocalChartAccounts(updatedAccounts);
            }
            return result;
        }

        return { success: true, data: account, source: 'local' };
    }

    async function updateChartAccount(id, payload) {
        var localAccounts = loadLocalChartAccounts();
        var index = localAccounts.findIndex(function (acc) { return acc.id === id; });
        
        if (index >= 0) {
            localAccounts[index] = Object.assign({}, localAccounts[index], payload);
            saveLocalChartAccounts(localAccounts);
        }

        if (!canUseApi()) {
            return { success: true, data: localAccounts[index] || payload };
        }

        var result = await apiRequest('/api/accountant/chart-of-accounts/' + encodeURIComponent(id), {
            method: 'PUT',
            body: JSON.stringify(payload)
        });

        if (result.success && result.data) {
            var updatedAccounts = loadLocalChartAccounts();
            var idx = updatedAccounts.findIndex(function (acc) { return acc.id === id; });
            if (idx >= 0) {
                updatedAccounts[idx] = result.data;
                saveLocalChartAccounts(updatedAccounts);
            }
            return result;
        }

        return { success: true, data: localAccounts[index] || payload };
    }

    async function deleteChartAccount(id) {
        var localAccounts = loadLocalChartAccounts();
        var filtered = localAccounts.filter(function (acc) { return acc.id !== id; });
        saveLocalChartAccounts(filtered);

        if (!canUseApi()) {
            return { success: true };
        }

        return await apiRequest('/api/accountant/chart-of-accounts/' + encodeURIComponent(id), {
            method: 'DELETE'
        });
    }

    // Invoices (using existing adminFees API)
    async function getInvoices(params) {
        if (window.ShikolaAPI && window.ShikolaAPI.adminFees) {
            return await window.ShikolaAPI.adminFees.listInvoices(params);
        }

        return { success: false, error: 'Invoices API not available' };
    }

    async function createInvoice(payload) {
        if (window.ShikolaAPI && window.ShikolaAPI.adminFees) {
            return await window.ShikolaAPI.adminFees.createInvoice(payload);
        }

        return { success: false, error: 'Invoices API not available' };
    }

    // Financial Reports
    async function getFinancialReports(params) {
        if (!canUseApi()) {
            var localIncomes = loadLocalIncomes();
            var localExpenses = loadLocalExpenses();
            
            var totalIncome = localIncomes.reduce(function (sum, inc) { return sum + (Number(inc.amount) || 0); }, 0);
            var totalExpenses = localExpenses.reduce(function (sum, exp) { return sum + (Number(exp.amount) || 0); }, 0);
            var netProfit = totalIncome - totalExpenses;

            var reportData = {
                summary: {
                    totalIncome: totalIncome,
                    totalExpenses: totalExpenses,
                    netProfit: netProfit,
                    period: params.period || 'monthly'
                },
                incomeBreakdown: localIncomes,
                expenseBreakdown: localExpenses,
                profitLossTrend: []
            };
            
            return { success: true, data: reportData };
        }

        var queryString = '';
        if (params && typeof params === 'object') {
            var parts = [];
            for (var key in params) {
                if (Object.prototype.hasOwnProperty.call(params, key) && params[key] != null) {
                    parts.push(encodeURIComponent(key) + '=' + encodeURIComponent(params[key]));
                }
            }
            if (parts.length) {
                queryString = '?' + parts.join('&');
            }
        }

        return await apiRequest('/api/accountant/reports/financial' + queryString, { method: 'GET' });
    }


    // Bank Reconciliation


    // Export API
    window.ShikolaAccountantApi = {
        // Income Management
        getIncomes: getIncomes,
        createIncome: createIncome,
        updateIncome: updateIncome,
        deleteIncome: deleteIncome,

        // Expense Management
        getExpenses: getExpenses,
        createExpense: createExpense,
        updateExpense: updateExpense,
        deleteExpense: deleteExpense,
        approveExpense: approveExpense,

        // Chart of Accounts
        getChartAccounts: getChartAccounts,
        createChartAccount: createChartAccount,
        updateChartAccount: updateChartAccount,
        deleteChartAccount: deleteChartAccount,

        // Invoices
        getInvoices: getInvoices,
        createInvoice: createInvoice,

        // Reports
        getFinancialReports: getFinancialReports,

        // Utility
        canUseApi: canUseApi,
        apiRequest: apiRequest
    };

    window.ShikolaAccountantStore = {
        getIncomes: loadLocalIncomes,
        getExpenses: loadLocalExpenses,
        getChartAccounts: loadLocalChartAccounts,
        saveIncomes: saveLocalIncomes,
        saveExpenses: saveLocalExpenses,
        saveChartAccounts: saveLocalChartAccounts
    };

})();
