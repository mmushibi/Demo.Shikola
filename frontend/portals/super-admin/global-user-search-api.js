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
// Global User Search API and Functions
function globalUserSearchData() {
    return {
        sidebarOpen: false,
        pageTitle: 'Global User Search',
        pageSubtitle: 'Search across all tenants and roles',

        loading: false,
        error: null,

        query: '',
        typeFilter: 'all',
        roleFilter: 'all',

        results: [],
        suggestions: [],
        showSuggestions: false,

        async initPage() {
            await this.searchUsers(true);
        },

        getApiAvailable() {
            return Boolean(window.ShikolaAPI);
        },

        async searchUsers(isInitial) {
            const term = String(this.query || '').trim();

            this.loading = true;
            this.error = null;

            try {
                if (this.getApiAvailable()) {
                    const payload = await window.ShikolaAPI.get('/api/frontend/portals/super-admin/global-user-search', {
                        search: term || null,
                        type: (this.typeFilter && this.typeFilter !== 'all') ? this.typeFilter : null,
                        role: (this.roleFilter && this.roleFilter !== 'all') ? this.roleFilter : null,
                        limit: 60,
                        offset: 0
                    });

                    if (payload.success && payload.data && Array.isArray(payload.data.data)) {
                        this.results = payload.data.data;
                        this.buildSuggestions();
                        return;
                    }

                    if (!payload.success) {
                        if (payload.status === 401 || payload.status === 403) {
                            window.location.href = '../frontend/public/signin.html';
                            return;
                        }
                        this.error = payload.error || 'Failed to load users';
                    }
                } else {
                    this.error = 'API client not available';
                }
                this.results = [];
                this.suggestions = [];
                this.showSuggestions = false;
            } catch (err) {
                console.error('Error searching users:', err);
                this.error = (err && err.message) ? err.message : 'Failed to load users';
                this.results = [];
                this.suggestions = [];
                this.showSuggestions = false;
            } finally {
                this.loading = false;
            }
        },

        filterLocal(list, term) {
            const q = String(term || '').trim().toLowerCase();
            return list
                .filter(u => this.typeFilter === 'all' ? true : (String(u.type || '').toLowerCase() === this.typeFilter))
                .filter(u => this.roleFilter === 'all' ? true : (String(u.role || '').toLowerCase() === this.roleFilter))
                .filter(u => {
                    if (!q) return true;
                    const hay = [u.name, u.email, u.schoolName, u.schoolCode, u.identifier]
                        .filter(Boolean)
                        .join(' ')
                        .toLowerCase();
                    return hay.includes(q);
                });
        },

        buildSuggestions() {
            const q = String(this.query || '').trim().toLowerCase();
            if (!q) {
                this.suggestions = [];
                this.showSuggestions = false;
                return;
            }

            const unique = new Set();
            const out = [];

            for (const u of (this.results || [])) {
                const candidates = [u.name, u.email, u.schoolName, u.schoolCode, u.identifier].filter(Boolean);
                for (const c of candidates) {
                    const text = String(c);
                    const key = text.toLowerCase();
                    if (key.includes(q) && !unique.has(key)) {
                        unique.add(key);
                        out.push(text);
                    }
                    if (out.length >= 8) break;
                }
                if (out.length >= 8) break;
            }

            this.suggestions = out;
            this.showSuggestions = out.length > 0;
        },

        pickSuggestion(value) {
            this.query = value || '';
            this.showSuggestions = false;
            this.searchUsers(false);
        },

        formatLastLogin(value) {
            if (!value) return '—';
            const d = new Date(value);
            if (Number.isNaN(d.getTime())) return '—';
            return d.toLocaleString();
        },

        statusLabel(user) {
            if (!user) return '—';
            return user && user.isActive ? 'Active' : 'Inactive';
        },

        statusClass(user) {
            if (!user) return 'bg-slate-50 text-slate-500';
            return user && user.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-500';
        },

        roleLabel(user) {
            if (!user) return '—';
            const role = String((user && (user.roleName || user.role)) || '').toLowerCase();
            const labels = {
                admin: 'School Admin',
                senior_teacher: 'Senior Teacher',
                teacher: 'Teacher',
                accountant: 'Accountant',
                pupil: 'Pupil',
                superadmin: 'Super Admin'
            };
            return labels[role] || (user.roleName || user.role || 'Unknown');
        },

        roleBadge(user) {
            if (!user) return 'bg-slate-50 text-slate-600';
            const role = String((user && (user.roleName || user.role)) || '').toLowerCase();
            const badge = {
                admin: 'bg-emerald-50 text-emerald-600',
                teacher: 'bg-sky-50 text-sky-600',
                senior_teacher: 'bg-indigo-50 text-indigo-600',
                accountant: 'bg-orange-50 text-orange-600',
                pupil: 'bg-slate-50 text-slate-600',
                superadmin: 'bg-slate-100 text-slate-700'
            };
            return badge[role] || 'bg-slate-50 text-slate-600';
        },

        goToUsersAndRoles() {
            window.location.href = 'users-and-roles.html';
        },

        viewUserDetails(user) {
            if (!user || !user.id) return;
            window.location.href = `user-details.html?id=${encodeURIComponent(user.id)}`;
        },

        editUser(user) {
            if (!user || !user.id) return;
            
            // Create edit modal
            const modal = document.createElement('div');
            modal.innerHTML = `
                <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                    <div class="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-100">
                        <div class="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                            <div>
                                <div class="text-sm font-semibold text-slate-800">Edit User</div>
                                <div class="text-xs text-slate-400">Update user information</div>
                            </div>
                            <button type="button" onclick="this.closest('.fixed').remove()" class="h-9 w-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600">
                                <i class="fas fa-xmark"></i>
                            </button>
                        </div>
                        <div class="px-5 py-5">
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
                                    <input type="text" id="edit-name" value="${user.name || user.fullName || ''}" class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
                                </div>
                                <div>
                                    <label class="block text-xs font-medium text-slate-700 mb-1">Email</label>
                                    <input type="email" id="edit-email" value="${user.email || ''}" class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
                                </div>
                                <div>
                                    <label class="block text-xs font-medium text-slate-700 mb-1">Phone</label>
                                    <input type="tel" id="edit-phone" value="${user.phone || ''}" class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
                                </div>
                                <div>
                                    <label class="block text-xs font-medium text-slate-700 mb-1">Status</label>
                                    <select id="edit-status" class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
                                        <option value="true" ${user.isActive ? 'selected' : ''}>Active</option>
                                        <option value="false" ${!user.isActive ? 'selected' : ''}>Inactive</option>
                                    </select>
                                </div>
                                <div class="sm:col-span-2">
                                    <label class="block text-xs font-medium text-slate-700 mb-1">Address</label>
                                    <textarea id="edit-address" rows="2" class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">${user.address || ''}</textarea>
                                </div>
                            </div>
                        </div>
                        <div class="px-5 py-4 border-t border-slate-100 flex justify-end gap-2">
                            <button type="button" onclick="this.closest('.fixed').remove()" class="px-4 py-2 rounded-xl bg-slate-50 border border-slate-100 text-sm text-slate-600">Cancel</button>
                            <button type="button" onclick="window.globalUserSearch.saveUserEdit('${user.id}')" class="px-4 py-2 rounded-xl bg-blue-500 text-white text-sm font-semibold">Save Changes</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        },

        async saveUserEdit(userId) {
            if (!userId) return;
            
            const updatedData = {
                name: document.getElementById('edit-name')?.value || '',
                email: document.getElementById('edit-email')?.value || '',
                phone: document.getElementById('edit-phone')?.value || '',
                isActive: document.getElementById('edit-status')?.value === 'true',
                address: document.getElementById('edit-address')?.value || ''
            };
            
            try {
                const result = await window.ShikolaAPI.put(`/api/frontend/portals/super-admin/users/${userId}`, updatedData);
                if (!result.success) {
                    this.notify(result.error || 'Failed to update user', 'error');
                    return;
                }
                
                this.notify('User updated successfully', 'success');
                // Close modal
                document.querySelector('.fixed').remove();
                // Refresh search results
                this.searchUsers(false);
            } catch (err) {
                this.notify('Failed to update user', 'error');
            }
        },

        async deleteUser(user) {
            if (!user || !user.id) return;
            
            const userName = user.name || user.fullName || 'this user';
            if (!confirm(`Are you sure you want to delete "${userName}"? This action cannot be undone and will remove all associated data.`)) {
                return;
            }
            
            try {
                const result = await window.ShikolaAPI.del(`/api/frontend/portals/super-admin/users/${user.id}`);
                if (!result.success) {
                    this.notify(result.error || 'Failed to delete user', 'error');
                    return;
                }
                
                this.notify('User deleted successfully', 'success');
                // Refresh search results
                this.searchUsers(false);
            } catch (err) {
                this.notify('Failed to delete user', 'error');
            }
        },

        notify(message, type) {
            try {
                if (window.shikolaButtons && typeof window.shikolaButtons.showNotification === 'function') {
                    window.shikolaButtons.showNotification(message, type || 'info');
                    return;
                }
            } catch (e) {}
            // Fallback to alert
            alert(message);
        }
    };
}
