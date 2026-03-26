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
    function getApiBase() {
        return window.SHIKOLA_API_BASE || 'http://localhost:3000';
    }

    function getAuthToken() {
        try {
            return localStorage.getItem('authToken') || localStorage.getItem('shikola_token') || null;
        } catch (e) {
            return null;
        }
    }

    function buildAuthHeaders() {
        var headers = { 'Content-Type': 'application/json' };
        var token = getAuthToken();
        if (token) {
            headers['Authorization'] = 'Bearer ' + token;
        }
        return headers;
    }

    function canUseApi() {
        var base = getApiBase();
        var token = getAuthToken();
        return !!(base && token);
    }

    function isUuid(value) {
        if (!value) return false;
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i.test(String(value));
    }

    async function apiRequestJson(endpoint, options) {
        var base = getApiBase();
        if (!base) return null;
        try {
            var response = await fetch(base + endpoint, Object.assign({
                headers: buildAuthHeaders()
            }, options || {}));
            var data = await response.json().catch(function () { return null; });
            if (!response.ok) {
                return null;
            }
            return data;
        } catch (e) {
            return null;
        }
    }

    // Branch management functions
    async function listBranches() {
        if (!canUseApi()) return [];
        
        try {
            const response = await apiRequestJson('/api/admin/branches');
            return response ? response.branches || [] : [];
        } catch (error) {
            console.error('Failed to load branches:', error);
            return [];
        }
    }

    async function createBranch(branchData) {
        if (!canUseApi()) return { error: 'API not available' };
        
        try {
            const response = await apiRequestJson('/api/admin/branches', {
                method: 'POST',
                body: JSON.stringify(branchData)
            });
            
            if (!response || response.error) {
                return { error: response?.error || 'Failed to create branch' };
            }
            
            return { success: true, branch: response.branch };
        } catch (error) {
            console.error('Failed to create branch:', error);
            return { error: 'Failed to create branch' };
        }
    }

    async function updateBranch(branchId, branchData) {
        if (!canUseApi()) return { error: 'API not available' };
        
        try {
            const response = await apiRequestJson(`/api/admin/branches/${branchId}`, {
                method: 'PUT',
                body: JSON.stringify(branchData)
            });
            
            if (!response || response.error) {
                return { error: response?.error || 'Failed to update branch' };
            }
            
            return { success: true, branch: response.branch };
        } catch (error) {
            console.error('Failed to update branch:', error);
            return { error: 'Failed to update branch' };
        }
    }

    async function deleteBranch(branchId) {
        if (!canUseApi()) return { error: 'API not available' };
        
        try {
            const response = await apiRequestJson(`/api/admin/branches/${branchId}`, {
                method: 'DELETE'
            });
            
            return !response || response.error ? { error: response?.error || 'Failed to delete branch' } : { success: true };
        } catch (error) {
            console.error('Failed to delete branch:', error);
            return { error: 'Failed to delete branch' };
        }
    }

    // School profile management functions
    async function updateSchoolProfile(profileData) {
        if (!canUseApi()) return { error: 'API not available' };
        
        try {
            const response = await apiRequestJson('/api/school/profile', {
                method: 'PUT',
                body: JSON.stringify(profileData)
            });
            
            if (!response || response.error) {
                return { error: response?.error || 'Failed to update school profile' };
            }
            
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Failed to update school profile:', error);
            return { error: 'Failed to update school profile' };
        }
    }

    // Make functions available globally
    window.ShiikolaBranchesAPI = {
        listBranches,
        createBranch,
        updateBranch,
        deleteBranch,
        updateSchoolProfile
    };

    function getAuthToken() {
        try {
            return localStorage.getItem('authToken') || localStorage.getItem('shikola_token') || null;
        } catch (e) {
            return null;
        }
    }

    function buildAuthHeaders() {
        var headers = { 'Content-Type': 'application/json' };
        var token = getAuthToken();
        if (token) {
            headers['Authorization'] = 'Bearer ' + token;
        }
        return headers;
    }

    function canUseApi() {
        var base = getApiBase();
        var token = getAuthToken();
        return !!(base && token);
    }

    function isUuid(value) {
        if (!value) return false;
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value));
    }

    async function apiRequestJson(endpoint, options) {
        var base = getApiBase();
        if (!base) return null;
        try {
            var response = await fetch(base + endpoint, Object.assign({
                headers: buildAuthHeaders()
            }, options || {}));
            var data = await response.json().catch(function () { return null; });
            if (!response.ok) {
                return null;
            }
            return data;
        } catch (e) {
            return null;
        }
    }

    async function listBranches(options) {
        if (!canUseApi()) return [];
        var opts = options || {};
        var params = [];
        if (opts.limit) params.push('limit=' + encodeURIComponent(opts.limit));
        if (opts.offset) params.push('offset=' + encodeURIComponent(opts.offset));
        if (opts.search) params.push('search=' + encodeURIComponent(opts.search));
        if (opts.active != null) params.push('active=' + encodeURIComponent(opts.active));
        var query = params.length ? '?' + params.join('&') : '';
        var data = await apiRequestJson('/api/admin/branches' + query, { method: 'GET' });
        if (!data || !data.data) return [];
        return data.data;
    }

    async function getBranch(id) {
        if (!canUseApi() || !isUuid(id)) return null;
        var data = await apiRequestJson('/api/admin/branches/' + encodeURIComponent(id), { method: 'GET' });
        return data || null;
    }

    async function createBranch(branchData) {
        if (!canUseApi()) return null;
        var payload = {
            name: String(branchData.name || '').trim(),
            address: String(branchData.address || '').trim(),
            phone: String(branchData.phone || '').trim(),
            email: String(branchData.email || '').trim(),
            isActive: branchData.isActive !== undefined ? !!branchData.isActive : true,
            isMain: branchData.isMain !== undefined ? !!branchData.isMain : false
        };
        var data = await apiRequestJson('/api/admin/branches', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        return data || null;
    }

    async function updateBranch(id, branchData) {
        if (!canUseApi() || !isUuid(id)) return null;
        var payload = {};
        if (branchData.name != null) payload.name = String(branchData.name).trim();
        if (branchData.address != null) payload.address = String(branchData.address).trim();
        if (branchData.phone != null) payload.phone = String(branchData.phone).trim();
        if (branchData.email != null) payload.email = String(branchData.email).trim();
        if (branchData.isActive != null) payload.isActive = !!branchData.isActive;
        if (branchData.isMain != null) payload.isMain = !!branchData.isMain;
        var data = await apiRequestJson('/api/admin/branches/' + encodeURIComponent(id), {
            method: 'PUT',
            body: JSON.stringify(payload)
        });
        return data || null;
    }

    async function deleteBranch(id) {
        if (!canUseApi() || !isUuid(id)) return false;
        var response = await fetch(getApiBase() + '/api/admin/branches/' + encodeURIComponent(id), {
            method: 'DELETE',
            headers: buildAuthHeaders()
        });
        return response.ok;
    }

    async function getBranchLimits() {
        if (!canUseApi()) return null;
        var data = await apiRequestJson('/api/admin/branches/limits', { method: 'GET' });
        return data || null;
    }

    async function requestBranchAddition(requestData) {
        if (!canUseApi()) return null;
        var payload = {
            reason: String(requestData.reason || '').trim(),
            requestedBranches: parseInt(requestData.requestedBranches) || 1,
            additionalInfo: String(requestData.additionalInfo || '').trim()
        };
        var data = await apiRequestJson('/api/admin/branches/request-addition', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        return data || null;
    }

    async function getBranchRequests() {
        if (!canUseApi()) return [];
        var data = await apiRequestJson('/api/admin/branches/requests', { method: 'GET' });
        if (!data || !data.data) return [];
        return data.data;
    }

    window.ShikolaBranchesAPI = {
        listBranches: listBranches,
        getBranch: getBranch,
        createBranch: createBranch,
        updateBranch: updateBranch,
        deleteBranch: deleteBranch,
        getBranchLimits: getBranchLimits,
        requestBranchAddition: requestBranchAddition,
        getBranchRequests: getBranchRequests
    };

    // Global functions for Alpine.js compatibility
    window.addBranchRow = function() {
        // Implementation for adding branch row
        console.log('addBranchRow called');
    };

    window.removeBranchRow = function(index) {
        // Implementation for removing branch row
        console.log('removeBranchRow called with index:', index);
    };

    window.saveBranches = async function() {
        // Implementation for saving branches
        console.log('saveBranches called');
        try {
            const branches = await listBranches();
            console.log('Branches saved:', branches);
            return true;
        } catch (error) {
            console.error('Failed to save branches:', error);
            return false;
        }
    };
})();
