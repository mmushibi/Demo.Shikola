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
 * Shikola Shared API Client
 * Centralized API calls with authentication, error handling, and loading states.
 */
(function (window) {
    'use strict';

    // Prevent double initialization
    if (window.ShikolaAPI) return;

    // ─────────────────────────────────────────────────────────────────────────────
    // Configuration
    // ─────────────────────────────────────────────────────────────────────────────
    function getBaseUrl() {
        return window.SHIKOLA_API_BASE || '/api';
    }

    function getAuthToken() {
        try {
            return localStorage.getItem('authToken') || localStorage.getItem('shikola_token') || null;
        } catch (e) {
            return null;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Core Request Function
    // ─────────────────────────────────────────────────────────────────────────────
    async function request(endpoint, options) {
        var url = getBaseUrl() + endpoint;
        var token = getAuthToken();

        var headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };

        if (token) {
            headers['Authorization'] = 'Bearer ' + token;
        }

        var config = Object.assign({
            method: 'GET',
            headers: headers
        }, options || {});

        // Merge headers
        if (options && options.headers) {
            config.headers = Object.assign({}, headers, options.headers);
        }

        try {
            var response = await fetch(url, config);
            var data = null;

            var contentType = response.headers.get('content-type') || '';
            if (contentType.indexOf('application/json') !== -1) {
                data = await response.json();
            } else if (contentType.indexOf('text/') !== -1) {
                data = await response.text();
            } else {
                data = await response.blob();
            }

            if (!response.ok) {
                var errorMessage = (data && data.error) || ('Request failed with status ' + response.status);
                var error = new Error(errorMessage);
                error.status = response.status;
                error.data = data;
                throw error;
            }

            return { success: true, data: data, status: response.status };
        } catch (err) {
            if (err.status) {
                // Already processed error from response
                return { success: false, error: err.message, status: err.status, data: err.data };
            }
            // Network or other error
            console.error('[ShikolaAPI] Request failed:', err);
            return { success: false, error: 'Network error: Unable to reach server', status: 0 };
        }
    }

    // Convenience methods
    async function get(endpoint, params) {
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
        return request(endpoint + queryString, { method: 'GET' });
    }

    async function post(endpoint, body) {
        return request(endpoint, {
            method: 'POST',
            body: JSON.stringify(body || {})
        });
    }

    async function put(endpoint, body) {
        return request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(body || {})
        });
    }

    async function patch(endpoint, body) {
        return request(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(body || {})
        });
    }

    async function del(endpoint) {
        return request(endpoint, { method: 'DELETE' });
    }

    // File upload with multipart form data
    async function upload(endpoint, formData) {
        var url = getBaseUrl() + endpoint;
        var token = getAuthToken();

        var headers = {};
        if (token) {
            headers['Authorization'] = 'Bearer ' + token;
        }

        try {
            var response = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: formData
            });

            var data = await response.json();

            if (!response.ok) {
                return { success: false, error: (data && data.error) || 'Upload failed', status: response.status };
            }

            return { success: true, data: data, status: response.status };
        } catch (err) {
            console.error('[ShikolaAPI] Upload failed:', err);
            return { success: false, error: 'Network error: Unable to upload file', status: 0 };
        }
    }

    // Download file as blob
    async function download(endpoint, filename) {
        var result = await request(endpoint, { method: 'GET' });
        if (result.success && result.data instanceof Blob) {
            try {
                var url = URL.createObjectURL(result.data);
                var a = document.createElement('a');
                a.href = url;
                a.download = filename || 'download';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                return { success: true };
            } catch (e) {
                return { success: false, error: 'Failed to download file' };
            }
        }
        return result;
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Auth API
    // ─────────────────────────────────────────────────────────────────────────────
    var auth = {
        login: function (email, password) {
            var identifier = (email == null) ? '' : String(email).trim();
            var pw = (password == null) ? '' : String(password);
            if (!identifier || !pw) {
                return Promise.resolve({ success: false, error: 'Login and password are required', status: 400 });
            }
            return post('/api/auth/login', { identifier: identifier, email: identifier, password: pw });
        },
        getProfile: function () {
            return get('/api/auth/profile');
        },
        logout: function () {
            try {
                if (window.shikolaAuth && typeof window.shikolaAuth.clearClientData === 'function') {
                    return window.shikolaAuth.clearClientData().then(function () {
                        return { success: true };
                    }).catch(function () {
                        return { success: true };
                    });
                }
            } catch (e) {}

            try {
                localStorage.removeItem('authToken');
                localStorage.removeItem('shikola_session');
                sessionStorage.clear();
            } catch (e) {}
            return Promise.resolve({ success: true });
        },
        changePassword: function (currentPassword, newPassword) {
            return post('/api/auth/change-password', {
                currentPassword: currentPassword,
                newPassword: newPassword
            });
        }
    };

    // ─────────────────────────────────────────────────────────────────────────────
    // Pupil Profile API
    // ─────────────────────────────────────────────────────────────────────────────
    var pupil = {
        getProfile: function () {
            return get('/api/pupil/profile');
        },
        updateProfile: function (data) {
            return patch('/api/pupil/profile', data);
        },
        uploadPhoto: function (file) {
            var formData = new FormData();
            formData.append('photo', file);
            return upload('/api/pupil/profile/photo', formData);
        },
        getAttendance: function (params) {
            return get('/api/pupil/attendance', params);
        },
        getReportCard: function (params) {
            return get('/api/pupil/report-card', params);
        },
        getDashboard: function () {
            return get('/api/pupil/dashboard');
        }
    };

    // ─────────────────────────────────────────────────────────────────────────────
    // Assignments API
    // ─────────────────────────────────────────────────────────────────────────────
    var assignments = {
        list: function (params) {
            return get('/api/pupil/assignments', params);
        },
        get: function (id) {
            return get('/api/pupil/assignments/' + id);
        },
        submit: function (id, formData) {
            return upload('/api/pupil/assignments/' + id + '/submit', formData);
        },
        downloadAttachment: function (id, filename) {
            return download('/api/pupil/assignments/' + id + '/attachment', filename);
        },
        getSubmission: function (id) {
            return get('/api/pupil/assignments/' + id + '/submission');
        }
    };

    // ─────────────────────────────────────────────────────────────────────────────
    // Class Tests API
    // ─────────────────────────────────────────────────────────────────────────────
    var classTests = {
        list: function (params) {
            return get('/api/pupil/class-tests', params);
        }
    };

    // ─────────────────────────────────────────────────────────────────────────────
    // Live Classes API
    // ─────────────────────────────────────────────────────────────────────────────
    var liveClasses = {
        list: function () {
            return get('/api/pupil/live-classes');
        },
        join: function (sessionId) {
            return post('/api/pupil/live-classes/' + sessionId + '/join');
        },
        leave: function (sessionId) {
            return post('/api/pupil/live-classes/' + sessionId + '/leave');
        },
        getRecordings: function () {
            return get('/api/pupil/live-classes/recordings');
        }
    };

    // ─────────────────────────────────────────────────────────────────────────────
    // Messaging API
    // ─────────────────────────────────────────────────────────────────────────────
    var messages = {
        getThreads: function () {
            return get('/api/communication/threads');
        },
        getMessages: function (threadId) {
            return get('/api/communication/threads/' + threadId + '/messages');
        },
        send: function (payload) {
            return post('/api/communication/messages', payload);
        },
        markRead: function (messageId) {
            return patch('/api/communication/messages/' + messageId + '/read');
        },
        getContacts: function () {
            return get('/api/communication/contacts');
        },
        uploadAttachment: function (messageId, file) {
            var formData = new FormData();
            formData.append('file', file);
            return upload('/api/communication/messages/' + messageId + '/attachments', formData);
        },
        downloadAttachment: function (attachmentId, filename) {
            return download('/api/communication/attachments/' + attachmentId, filename);
        }
    };

    // ─────────────────────────────────────────────────────────────────────────────
    // Fees / Payments API
    // ─────────────────────────────────────────────────────────────────────────────
    var fees = {
        getSummary: function () {
            return get('/api/pupil/fees/summary');
        },
        getInvoices: function (params) {
            return get('/api/pupil/fees/invoices', params);
        },
        getPayments: function (params) {
            return get('/api/pupil/fees/payments', params);
        },
        getReceipt: function (paymentId) {
            return get('/api/pupil/fees/payments/' + paymentId + '/receipt');
        },
        downloadReceipt: function (paymentId, filename) {
            return download('/api/pupil/fees/payments/' + paymentId + '/receipt/pdf', filename || 'receipt.pdf');
        }
    };

    var adminFees = {
        listInvoices: function (params) {
            return get('/api/admin/fees/invoices', params);
        },
        createInvoice: function (payload) {
            return post('/api/admin/fees/invoices', payload);
        },
        listPayments: function (params) {
            return get('/api/admin/fees/payments', params);
        },
        recordPayment: function (payload) {
            return post('/api/admin/fees/payments', payload);
        },
        getPaymentReceipt: function (paymentId) {
            return get('/api/admin/fees/payments/' + paymentId + '/receipt');
        }
    };

    // ─────────────────────────────────────────────────────────────────────────────
    // Timetable API
    // ─────────────────────────────────────────────────────────────────────────────
    var timetable = {
        get: function (classId) {
            if (classId) {
                return get('/api/timetables/class/' + classId);
            }
            return get('/api/pupil/timetable');
        }
    };

    // ─────────────────────────────────────────────────────────────────────────────
    // Notifications API
    // ─────────────────────────────────────────────────────────────────────────────
    var notifications = {
        list: function () {
            return get('/api/pupil/notifications');
        },
        markRead: function (id) {
            return patch('/api/pupil/notifications/' + id + '/read');
        },
        markAllRead: function () {
            return post('/api/pupil/notifications/mark-all-read');
        }
    };

    // ─────────────────────────────────────────────────────────────────────────────
    // Loading State Helper (Alpine.js compatible)
    // ─────────────────────────────────────────────────────────────────────────────
    function createLoadingState() {
        return {
            loading: false,
            error: null,
            data: null,
            isEmpty: true,

            async load(apiCall) {
                this.loading = true;
                this.error = null;
                try {
                    var result = await apiCall();
                    if (result.success) {
                        this.data = result.data;
                        this.isEmpty = !result.data || (Array.isArray(result.data) && result.data.length === 0);
                    } else {
                        this.error = result.error || 'Failed to load data';
                    }
                } catch (err) {
                    this.error = err.message || 'An unexpected error occurred';
                } finally {
                    this.loading = false;
                }
                return this;
            },

            reset: function () {
                this.loading = false;
                this.error = null;
                this.data = null;
                this.isEmpty = true;
            }
        };
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Export API
    // ─────────────────────────────────────────────────────────────────────────────
    window.ShikolaAPI = {
        // Core methods
        request: request,
        get: get,
        post: post,
        put: put,
        patch: patch,
        delete: del,
        upload: upload,
        download: download,

        // Domain APIs
        auth: auth,
        pupil: pupil,
        assignments: assignments,
        classTests: classTests,
        liveClasses: liveClasses,
        messages: messages,
        fees: fees,
        adminFees: adminFees,
        timetable: timetable,
        notifications: notifications,

        // Helpers
        createLoadingState: createLoadingState,
        getBaseUrl: getBaseUrl,
        getAuthToken: getAuthToken
    };

})(window);
