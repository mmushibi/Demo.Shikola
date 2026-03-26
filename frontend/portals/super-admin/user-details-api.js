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
// User Details API and Functions
function userDetailsData() {
    return {
        sidebarOpen: false,
        pageTitle: 'User Details',
        pageSubtitle: 'Comprehensive user information and management',

        loading: false,
        error: null,
        userId: null,
        user: null,

        async initPage() {
            const params = new URLSearchParams(window.location.search || '');
            this.userId = params.get('id');
            if (!this.userId) {
                this.error = 'User ID not provided';
                return;
            }
            await this.loadUser();
        },

        async loadUser() {
            if (!this.userId) return;
            
            this.loading = true;
            this.error = null;

            try {
                if (window.ShikolaAPI) {
                    const result = await window.ShikolaAPI.get(`/api/frontend/portals/super-admin/users/${this.userId}`);
                    
                    if (result.success && result.data) {
                        this.user = result.data;
                        return;
                    }

                    if (!result.success) {
                        if (result.status === 401 || result.status === 403) {
                            window.location.href = '../frontend/public/signin.html';
                            return;
                        }
                        this.error = result.error || 'Failed to load user';
                    }
                } else {
                    this.error = 'API client not available';
                }
                this.user = null;
            } catch (err) {
                console.error('Error loading user:', err);
                this.error = (err && err.message) ? err.message : 'Failed to load user';
                this.user = null;
            } finally {
                this.loading = false;
            }
        },

        formatDate(dateValue) {
            if (!dateValue) return '—';
            try {
                const d = new Date(dateValue);
                if (Number.isNaN(d.getTime())) return '—';
                return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
            } catch (e) {
                return '';
            }
        },

        formatDateTime(dateValue) {
            if (!dateValue) return '—';
            try {
                const d = new Date(dateValue);
                if (Number.isNaN(d.getTime())) return '—';
                return d.toLocaleString();
            } catch (e) {
                return '';
            }
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

        goBack() {
            window.history.back();
        },

        async editUser() {
            if (!this.user || !this.user.id) return;
            
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
                                    <input type="text" id="edit-name" value="${this.user.name || this.user.fullName || ''}" class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
                                </div>
                                <div>
                                    <label class="block text-xs font-medium text-slate-700 mb-1">Email</label>
                                    <input type="email" id="edit-email" value="${this.user.email || ''}" class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
                                </div>
                                <div>
                                    <label class="block text-xs font-medium text-slate-700 mb-1">Phone</label>
                                    <input type="tel" id="edit-phone" value="${this.user.phone || ''}" class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
                                </div>
                                <div>
                                    <label class="block text-xs font-medium text-slate-700 mb-1">Status</label>
                                    <select id="edit-status" class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" aria-label="User status" title="Select user status">
                                        <option value="true" ${this.user.isActive ? 'selected' : ''}>Active</option>
                                        <option value="false" ${!this.user.isActive ? 'selected' : ''}>Inactive</option>
                                    </select>
                                </div>
                                <div class="sm:col-span-2">
                                    <label class="block text-xs font-medium text-slate-700 mb-1">Address</label>
                                    <textarea id="edit-address" rows="2" class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">${this.user.address || ''}</textarea>
                                </div>
                            </div>
                        </div>
                        <div class="px-5 py-4 border-t border-slate-100 flex justify-end gap-2">
                            <button type="button" onclick="this.closest('.fixed').remove()" class="px-4 py-2 rounded-xl bg-slate-50 border border-slate-100 text-sm text-slate-600">Cancel</button>
                            <button type="button" onclick="window.userDetails.saveUserEdit()" class="px-4 py-2 rounded-xl bg-blue-500 text-white text-sm font-semibold">Save Changes</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        },

        async saveUserEdit() {
            if (!this.user || !this.user.id) return;
            
            const updatedData = {
                name: document.getElementById('edit-name')?.value || '',
                email: document.getElementById('edit-email')?.value || '',
                phone: document.getElementById('edit-phone')?.value || '',
                isActive: document.getElementById('edit-status')?.value === 'true',
                address: document.getElementById('edit-address')?.value || ''
            };
            
            try {
                const result = await window.ShikolaAPI.put(`/api/frontend/portals/super-admin/users/${this.user.id}`, updatedData);
                if (!result.success) {
                    this.notify(result.error || 'Failed to update user', 'error');
                    return;
                }
                
                this.notify('User updated successfully', 'success');
                // Close modal
                document.querySelector('.fixed').remove();
                // Reload user data
                await this.loadUser();
            } catch (err) {
                this.notify('Failed to update user', 'error');
            }
        },

        async changePassword() {
            if (!this.user || !this.user.id) return;
            
            // Create change password modal
            const modal = document.createElement('div');
            modal.innerHTML = `
                <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                    <div class="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100">
                        <div class="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                            <div>
                                <div class="text-sm font-semibold text-slate-800">Change Password</div>
                                <div class="text-xs text-slate-400">Update password for ${this.user.name || this.user.fullName || 'user'}</div>
                            </div>
                            <button type="button" onclick="this.closest('.fixed').remove()" class="h-9 w-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600">
                                <i class="fas fa-xmark"></i>
                            </button>
                        </div>
                        <div class="px-5 py-5">
                            <div class="space-y-4">
                                <div>
                                    <label class="block text-xs font-medium text-slate-700 mb-1">New Password</label>
                                    <input type="password" id="new-password" class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="Enter new password" aria-label="New password" title="Enter new password">
                                </div>
                                <div>
                                    <label class="block text-xs font-medium text-slate-700 mb-1">Confirm Password</label>
                                    <input type="password" id="confirm-password" class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="Confirm new password" aria-label="Confirm password" title="Confirm new password">
                                </div>
                                <div class="rounded-xl bg-blue-50 border border-blue-100 p-3">
                                    <div class="flex items-start gap-2">
                                        <i class="fas fa-info-circle text-blue-500 text-xs mt-0.5"></i>
                                        <div class="text-xs text-blue-700">
                                            <div class="font-semibold mb-1">Password Requirements:</div>
                                            <div>• At least 8 characters long</div>
                                            <div>• Contains uppercase and lowercase letters</div>
                                            <div>• Contains at least one number</div>
                                            <div>• Contains at least one special character</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="px-5 py-4 border-t border-slate-100 flex justify-end gap-2">
                            <button type="button" onclick="this.closest('.fixed').remove()" class="px-4 py-2 rounded-xl bg-slate-50 border border-slate-100 text-sm text-slate-600">Cancel</button>
                            <button type="button" onclick="window.userDetails.savePasswordChange()" class="px-4 py-2 rounded-xl bg-blue-500 text-white text-sm font-semibold">Change Password</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        },

        async savePasswordChange() {
            if (!this.user || !this.user.id) return;
            
            const newPassword = document.getElementById('new-password')?.value || '';
            const confirmPassword = document.getElementById('confirm-password')?.value || '';
            
            // Validate passwords
            if (!newPassword || !confirmPassword) {
                this.notify('Please enter both password fields', 'error');
                return;
            }
            
            if (newPassword !== confirmPassword) {
                this.notify('Passwords do not match', 'error');
                return;
            }
            
            if (newPassword.length < 8) {
                this.notify('Password must be at least 8 characters long', 'error');
                return;
            }
            
            // Validate password complexity
            const hasUpperCase = /[A-Z]/.test(newPassword);
            const hasLowerCase = /[a-z]/.test(newPassword);
            const hasNumbers = /\d/.test(newPassword);
            const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
            
            if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
                this.notify('Password must meet all requirements', 'error');
                return;
            }
            
            try {
                const result = await window.ShikolaAPI.put(`/api/frontend/portals/super-admin/users/${this.user.id}/password`, {
                    password: newPassword
                });
                
                if (!result.success) {
                    this.notify(result.error || 'Failed to change password', 'error');
                    return;
                }
                
                this.notify('Password changed successfully', 'success');
                // Close modal
                document.querySelector('.fixed').remove();
            } catch (err) {
                this.notify('Failed to change password', 'error');
            }
        },

        async deleteUser() {
            if (!this.user || !this.user.id) return;
            
            const userName = this.user.name || this.user.fullName || 'this user';
            if (!confirm(`Are you sure you want to delete "${userName}"? This action cannot be undone and will remove all associated data.`)) {
                return;
            }
            
            try {
                const result = await window.ShikolaAPI.del(`/api/frontend/portals/super-admin/users/${this.user.id}`);
                if (!result.success) {
                    this.notify(result.error || 'Failed to delete user', 'error');
                    return;
                }
                
                this.notify('User deleted successfully', 'success');
                // Go back to search
                window.location.href = 'global-user-search.html';
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
