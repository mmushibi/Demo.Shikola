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
(function () {
    var FEES_INVOICES_KEY = 'shikola_fees_invoices_v1';
    var FEES_PAYMENTS_KEY = 'shikola_fees_payments_v1';
    var FEES_SETTINGS_KEY = 'shikola_fees_settings_v1';

    // Use shared API client
    function canUseApi() {
        return !!(window.SHIKOLA_API_BASE && window.ShikolaAPI);
    }

    async function apiRequest(endpoint, options) {
        if (!window.ShikolaAPI) {
            return { success: false, error: 'API client not available' };
        }
        
        var method = (options && options.method) || 'GET';
        var body = options && options.body;
        
        switch (method) {
            case 'GET':
                return await window.ShikolaAPI.get(endpoint);
            case 'POST':
                return await window.ShikolaAPI.post(endpoint, body ? JSON.parse(body) : {});
            case 'PUT':
                return await window.ShikolaAPI.put(endpoint, body ? JSON.parse(body) : {});
            case 'DELETE':
                return await window.ShikolaAPI.delete(endpoint);
            default:
                return await window.ShikolaAPI.request(endpoint, options);
        }
    }

    function loadLocalInvoices() {
        try {
            var raw = localStorage.getItem(FEES_INVOICES_KEY);
            if (!raw) return [];
            var data = JSON.parse(raw);
            return Array.isArray(data) ? data : [];
        } catch (e) {
            return [];
        }
    }

    function saveLocalInvoices(list) {
        try {
            localStorage.setItem(FEES_INVOICES_KEY, JSON.stringify(Array.isArray(list) ? list : []));
        } catch (e) {
        }
    }

    function loadLocalPayments() {
        try {
            var raw = localStorage.getItem(FEES_PAYMENTS_KEY);
            if (!raw) return [];
            var data = JSON.parse(raw);
            return Array.isArray(data) ? data : [];
        } catch (e) {
            return [];
        }
    }

    function saveLocalPayments(list) {
        try {
            localStorage.setItem(FEES_PAYMENTS_KEY, JSON.stringify(Array.isArray(list) ? list : []));
        } catch (e) {
        }
    }

    function loadFeesSettings() {
        try {
            var raw = localStorage.getItem(FEES_SETTINGS_KEY);
            if (!raw) return {};
            var data = JSON.parse(raw);
            return data && typeof data === 'object' ? data : {};
        } catch (e) {
            return {};
        }
    }

    function saveFeesSettings(settings) {
        try {
            localStorage.setItem(FEES_SETTINGS_KEY, JSON.stringify(settings || {}));
        } catch (e) {
        }
    }

    async function listInvoices(params) {
        var local = loadLocalInvoices();
        
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

        var result = await apiRequest('/api/admin/fees/invoices' + queryString, { method: 'GET' });
        
        if (result.success && result.data && Array.isArray(result.data.data)) {
            saveLocalInvoices(result.data.data);
        }
        
        return result;
    }

    async function createInvoice(payload) {
        var localInvoices = loadLocalInvoices();
        var invoice = Object.assign({}, payload, {
            id: 'INV-' + Date.now().toString(36).toUpperCase(),
            status: 'Pending',
            createdAt: new Date().toISOString(),
            amountPaid: 0,
            balanceAmount: payload.totalAmount || 0
        });
        
        localInvoices.push(invoice);
        saveLocalInvoices(localInvoices);

        if (!canUseApi()) {
            return { success: true, data: invoice };
        }

        var result = await apiRequest('/api/admin/fees/invoices', {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        if (result.success && result.data) {
            var updatedInvoices = loadLocalInvoices();
            var index = updatedInvoices.findIndex(function (inv) { return inv.id === invoice.id; });
            if (index >= 0) {
                updatedInvoices[index] = result.data;
                saveLocalInvoices(updatedInvoices);
            }
            return result;
        }

        return { success: true, data: invoice, source: 'local' };
    }

    async function updateInvoice(id, payload) {
        var localInvoices = loadLocalInvoices();
        var index = localInvoices.findIndex(function (inv) { return inv.id === id; });
        
        if (index >= 0) {
            localInvoices[index] = Object.assign({}, localInvoices[index], payload);
            saveLocalInvoices(localInvoices);
        }

        if (!canUseApi()) {
            return { success: true, data: localInvoices[index] || payload };
        }

        var result = await apiRequest('/api/admin/fees/invoices/' + encodeURIComponent(id), {
            method: 'PUT',
            body: JSON.stringify(payload)
        });

        if (result.success && result.data) {
            var updatedInvoices = loadLocalInvoices();
            var idx = updatedInvoices.findIndex(function (inv) { return inv.id === id; });
            if (idx >= 0) {
                updatedInvoices[idx] = result.data;
                saveLocalInvoices(updatedInvoices);
            }
            return result;
        }

        return { success: true, data: localInvoices[index] || payload };
    }

    async function deleteInvoice(id) {
        var localInvoices = loadLocalInvoices();
        var filtered = localInvoices.filter(function (inv) { return inv.id !== id; });
        saveLocalInvoices(filtered);

        if (!canUseApi()) {
            return { success: true };
        }

        return await apiRequest('/api/admin/fees/invoices/' + encodeURIComponent(id), {
            method: 'DELETE'
        });
    }

    async function listPayments(params) {
        var local = loadLocalPayments();
        
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

        var result = await apiRequest('/api/admin/fees/payments' + queryString, { method: 'GET' });
        
        if (result.success && result.data && Array.isArray(result.data.data)) {
            saveLocalPayments(result.data.data);
        }
        
        return result;
    }

    async function recordPayment(payload) {
        var localPayments = loadLocalPayments();
        var payment = Object.assign({}, payload, {
            id: 'PAY-' + Date.now().toString(36).toUpperCase(),
            status: 'Completed',
            createdAt: new Date().toISOString()
        });
        
        localPayments.push(payment);
        saveLocalPayments(localPayments);

        if (!canUseApi()) {
            return { success: true, data: payment };
        }

        var result = await apiRequest('/api/admin/fees/payments', {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        if (result.success && result.data) {
            var updatedPayments = loadLocalPayments();
            var index = updatedPayments.findIndex(function (pay) { return pay.id === payment.id; });
            if (index >= 0) {
                updatedPayments[index] = result.data;
                saveLocalPayments(updatedPayments);
            }
            return result;
        }

        return { success: true, data: payment, source: 'local' };
    }

    async function getFeesSummary() {
        var localInvoices = loadLocalInvoices();
        var localPayments = loadLocalPayments();
        
        var totalInvoiced = 0;
        var totalPaid = 0;
        var totalOutstanding = 0;

        localInvoices.forEach(function (invoice) {
            var amount = Number(invoice.totalAmount) || 0;
            var paid = Number(invoice.amountPaid) || 0;
            totalInvoiced += amount;
            totalPaid += paid;
        });

        localPayments.forEach(function (payment) {
            var amount = Number(payment.amount) || 0;
            totalPaid += amount;
        });

        totalOutstanding = totalInvoiced - totalPaid;

        var summary = {
            totalInvoiced: totalInvoiced,
            totalPaid: totalPaid,
            totalOutstanding: totalOutstanding,
            invoiceCount: localInvoices.length,
            paymentCount: localPayments.length
        };

        if (!canUseApi()) {
            return { success: true, data: summary };
        }

        var result = await apiRequest('/api/admin/fees/summary', { method: 'GET' });
        return result.success ? result : { success: true, data: summary };
    }

    async function getFeesReports(params) {
        if (!canUseApi()) {
            var localInvoices = loadLocalInvoices();
            var localPayments = loadLocalPayments();
            
            var reportData = {
                invoices: localInvoices,
                payments: localPayments,
                summary: {
                    totalInvoices: localInvoices.length,
                    totalPayments: localPayments.length,
                    totalAmount: localInvoices.reduce(function (sum, inv) { return sum + (Number(inv.totalAmount) || 0); }, 0),
                    totalPaid: localPayments.reduce(function (sum, pay) { return sum + (Number(pay.amount) || 0); }, 0)
                }
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

        return await apiRequest('/api/admin/fees/reports' + queryString, { method: 'GET' });
    }

    window.ShikolaFeesApi = {
        listInvoices: listInvoices,
        createInvoice: createInvoice,
        updateInvoice: updateInvoice,
        deleteInvoice: deleteInvoice,
        listPayments: listPayments,
        recordPayment: recordPayment,
        getFeesSummary: getFeesSummary,
        getFeesReports: getFeesReports,
        getLocalInvoices: loadLocalInvoices,
        getLocalPayments: loadLocalPayments,
        canUseApi: canUseApi
    };

    window.ShikolaFeesStore = {
        getInvoices: loadLocalInvoices,
        getPayments: loadLocalPayments,
        getSettings: loadFeesSettings,
        saveSettings: saveFeesSettings
    };

})();
