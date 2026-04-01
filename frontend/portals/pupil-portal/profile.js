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
 * Pupil Profile Module
 * Handles profile loading, display, photo upload, and password change.
 */
(function (window) {
    'use strict';

    // ─────────────────────────────────────────────────────────────────────────────
    // State
    // ─────────────────────────────────────────────────────────────────────────────
    var PROFILE_STORAGE_KEY = 'shikola_profile_cache_v1';
    var PHOTO_STORAGE_KEY = 'shikola_profile_photo_v1';
    var NOTIFICATION_STORAGE_KEY = 'shikola_notification_prefs_v1';
    var PRIVACY_STORAGE_KEY = 'shikola_privacy_prefs_v1';

    var state = {
        loading: true,
        error: null,
        profile: null,
        isEmpty: false,
        notifications: null,
        privacy: null
    };

    // ─────────────────────────────────────────────────────────────────────────────
    // DOM Helpers
    // ─────────────────────────────────────────────────────────────────────────────
    function setText(selector, value) {
        var els = document.querySelectorAll(selector);
        els.forEach(function (el) {
            el.textContent = value || '—';
        });
    }

    function setStatus(selector, message, isError) {
        var el = document.querySelector(selector);
        if (!el) return;
        el.textContent = message || '';
        if (isError) {
            el.classList.remove('text-slate-400');
            el.classList.add('text-red-500');
        } else {
            el.classList.remove('text-red-500');
            el.classList.add('text-slate-400');
        }
    }

    function normalizeMeResponse(response) {
        var body = response && response.data ? response.data : null;
        if (response && response.success && body && body.success && body.data) {
            return body.data;
        }
        return null;
    }

    async function fetchLoginProfile() {
        if (!window.ShikolaAPI || typeof window.ShikolaAPI.get !== 'function') {
            return null;
        }
        try {
            var resp = await window.ShikolaAPI.get('/api/pupilportal/profile');
            return normalizeMeResponse(resp);
        } catch (_err) {
            return null;
        }
    }

    function updateThemeButtons(activeMode) {
        var buttons = document.querySelectorAll('[data-theme-mode]');
        buttons.forEach(function (btn) {
            var mode = btn.getAttribute('data-theme-mode');
            var isActive = mode === activeMode;

            btn.classList.remove('bg-slate-900', 'text-white', 'shadow-sm');
            btn.classList.remove('bg-slate-50', 'text-slate-600', 'hover:bg-slate-100');

            if (isActive) {
                btn.classList.add('bg-slate-900', 'text-white', 'shadow-sm');
            } else {
                btn.classList.add('bg-slate-50', 'text-slate-600', 'hover:bg-slate-100');
            }
        });
    }

    async function setThemePreference(mode) {
        if (window.ShikolaTheme && typeof window.ShikolaTheme.setTheme === 'function') {
            window.ShikolaTheme.setTheme(mode);
        }
        updateThemeButtons(mode);

        if (!window.ShikolaAPI || typeof window.ShikolaAPI.patch !== 'function') {
            return;
        }

        try {
            var resp = await window.ShikolaAPI.patch('/api/pupilportal/profile', { themePreference: mode });
            var body = resp && resp.data ? resp.data : null;
            if (resp && resp.success && body && body.success) {
                setStatus('[data-theme-status]', 'Saved.', false);
            } else {
                setStatus('[data-theme-status]', 'Could not save.', true);
            }
        } catch (_err) {
            setStatus('[data-theme-status]', 'Could not save.', true);
        }
    }

    function setProfileEditMode(editing) {
        var fullNameInput = document.querySelector('[data-profile-edit-full-name]');
        var phoneInput = document.querySelector('[data-profile-edit-phone]');
        var editBtn = document.querySelector('[data-action="edit-profile"]');
        var saveBtn = document.querySelector('[data-action="save-profile"]');
        var cancelBtn = document.querySelector('[data-action="cancel-profile"]');

        if (fullNameInput) {
            fullNameInput.readOnly = !editing;
            fullNameInput.classList.remove('bg-white', 'bg-slate-50');
            fullNameInput.classList.add(editing ? 'bg-white' : 'bg-slate-50');
        }
        if (phoneInput) {
            phoneInput.readOnly = !editing;
            phoneInput.classList.remove('bg-white', 'bg-slate-50');
            phoneInput.classList.add(editing ? 'bg-white' : 'bg-slate-50');
        }

        if (editBtn) editBtn.classList.toggle('hidden', editing);
        if (saveBtn) saveBtn.classList.toggle('hidden', !editing);
        if (cancelBtn) cancelBtn.classList.toggle('hidden', !editing);
    }

    async function saveLoginProfileEdits() {
        if (!window.ShikolaAPI || typeof window.ShikolaAPI.patch !== 'function') {
            return null;
        }

        var fullNameInput = document.querySelector('[data-profile-edit-full-name]');
        var phoneInput = document.querySelector('[data-profile-edit-phone]');
        var payload = {
            fullName: fullNameInput ? fullNameInput.value : '',
            phone: phoneInput ? phoneInput.value : ''
        };

        try {
            var resp = await window.ShikolaAPI.patch('/api/pupilportal/profile', payload);
            var body = resp && resp.data ? resp.data : null;
            if (resp && resp.success && body && body.success && body.data) {
                setStatus('[data-profile-edit-status]', 'Saved.', false);
                return body.data;
            }
            setStatus('[data-profile-edit-status]', 'Could not save.', true);
            return null;
        } catch (_err) {
            setStatus('[data-profile-edit-status]', 'Could not save.', true);
            return null;
        }
    }

    function setupThemeButtons() {
        var buttons = document.querySelectorAll('[data-theme-mode]');
        if (!buttons.length) return;

        buttons.forEach(function (btn) {
            btn.addEventListener('click', function () {
                var mode = btn.getAttribute('data-theme-mode') || 'light';
                setStatus('[data-theme-status]', '', false);
                setThemePreference(mode);
            });
        });

        if (window.ShikolaTheme && typeof window.ShikolaTheme.getPreferredTheme === 'function') {
            updateThemeButtons(window.ShikolaTheme.getPreferredTheme());
        }
    }

    function setupProfileEdit() {
        var editBtn = document.querySelector('[data-action="edit-profile"]');
        var saveBtn = document.querySelector('[data-action="save-profile"]');
        var cancelBtn = document.querySelector('[data-action="cancel-profile"]');
        var fullNameInput = document.querySelector('[data-profile-edit-full-name]');
        var phoneInput = document.querySelector('[data-profile-edit-phone]');

        if (!fullNameInput && !phoneInput) return;

        var original = {
            fullName: fullNameInput ? fullNameInput.value : '',
            phone: phoneInput ? phoneInput.value : ''
        };

        if (editBtn) {
            editBtn.addEventListener('click', function () {
                setStatus('[data-profile-edit-status]', '', false);
                original.fullName = fullNameInput ? fullNameInput.value : '';
                original.phone = phoneInput ? phoneInput.value : '';
                setProfileEditMode(true);
            });
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', function () {
                if (fullNameInput) fullNameInput.value = original.fullName;
                if (phoneInput) phoneInput.value = original.phone;
                setProfileEditMode(false);
                setStatus('[data-profile-edit-status]', '', false);
            });
        }

        if (saveBtn) {
            saveBtn.addEventListener('click', function () {
                saveLoginProfileEdits().then(function (me) {
                    if (me) {
                        if (fullNameInput) fullNameInput.value = me.fullName || fullNameInput.value;
                        if (phoneInput) phoneInput.value = me.phone || phoneInput.value;
                        original.fullName = fullNameInput ? fullNameInput.value : original.fullName;
                        original.phone = phoneInput ? phoneInput.value : original.phone;
                    }
                    setProfileEditMode(false);
                });
            });
        }
    }

    async function hydrateLoginProfileAndTheme() {
        var me = await fetchLoginProfile();
        if (!me) return;

        var fullNameInput = document.querySelector('[data-profile-edit-full-name]');
        var phoneInput = document.querySelector('[data-profile-edit-phone]');
        if (fullNameInput && !fullNameInput.value) fullNameInput.value = me.fullName || '';
        if (phoneInput && !phoneInput.value) phoneInput.value = me.phone || '';

        if ((state.isEmpty || !state.profile) && me.fullName) {
            setFieldValue('full-name', me.fullName);
        }
        if ((state.isEmpty || !state.profile) && me.email) {
            setFieldValue('email', me.email);
        }
        if ((state.isEmpty || !state.profile) && me.phone) {
            setFieldValue('phone', me.phone);
        }

        if (me.themePreference && window.ShikolaTheme && typeof window.ShikolaTheme.setTheme === 'function') {
            window.ShikolaTheme.setTheme(me.themePreference);
            updateThemeButtons(me.themePreference);
        }

        if (fullNameInput && phoneInput) {
            var shouldEdit = !String(fullNameInput.value || '').trim() || !String(phoneInput.value || '').trim();
            setProfileEditMode(shouldEdit);
        }
    }

    async function handlePhotoUpload(file) {
        if (window.ShikolaAPI && window.ShikolaAPI.upload) {
            var formData = new FormData();
            formData.append('file', file);
            
            var result = await window.ShikolaAPI.upload('/api/pupilportal/upload-photo', formData);
            if (!result.success) {
                throw new Error(result.message || 'Upload failed');
            }
            var preview = result.data && result.data.photoUrl ? result.data.photoUrl : await readFile(file);
            cachePhoto(preview);
            return preview;
        }

        var fallbackPreview = await readFile(file);
        cachePhoto(fallbackPreview);
        return fallbackPreview;
    }

    function cachePhoto(src) {
        try {
            localStorage.setItem(PHOTO_STORAGE_KEY, src || '');
        } catch (e) {}
    }

    function readFile(file) {
        return new Promise(function (resolve, reject) {
            var reader = new FileReader();
            reader.onload = function (ev) {
                resolve(ev.target.result);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    function setFieldValue(field, value) {
        setText('[data-profile-field="' + field + '"]', value);
    }

    function setInitials(name) {
        if (!name) return '--';
        var parts = name.split(' ').filter(Boolean);
        var initials = '';
        for (var i = 0; i < Math.min(parts.length, 2); i++) {
            initials += parts[i].charAt(0).toUpperCase();
        }
        return initials || '--';
    }

    function formatDate(dateStr) {
        if (!dateStr) return '—';
        try {
            var d = new Date(dateStr);
            if (!isFinite(d.getTime())) return dateStr;
            return d.toLocaleDateString('en-ZM', { year: 'numeric', month: 'long', day: 'numeric' });
        } catch (e) {
            return dateStr;
        }
    }

    function formatDateTime(isoStr) {
        if (!isoStr) return '—';
        try {
            var d = new Date(isoStr);
            if (!isFinite(d.getTime())) return isoStr;
            return d.toLocaleDateString('en-ZM', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return isoStr;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Render Profile
    // ─────────────────────────────────────────────────────────────────────────────
    function renderProfile(profile) {
        if (!profile) {
            showEmptyState();
            return;
        }

        // Personal Information
        setFieldValue('full-name', profile.fullName);
        setFieldValue('preferred-name', profile.preferredName);
        setFieldValue('email', profile.email);
        setFieldValue('phone', profile.phone);
        setFieldValue('dob', formatDate(profile.dateOfBirth));
        setFieldValue('gender', profile.gender);

        // Academic Information
        setFieldValue('pupil-id', profile.pupilId);
        setFieldValue('admission-no', profile.admissionNumber);
        setFieldValue('class-label', profile.classLabel);
        setFieldValue('academic-year', profile.academicYear);
        setFieldValue('admission-date', formatDate(profile.admissionDate));
        setFieldValue('status', profile.status);

        // Guardian Information
        setFieldValue('guardian-name', profile.guardianName);
        setFieldValue('guardian-relationship', profile.guardianRelationship);
        setFieldValue('guardian-email', profile.guardianEmail);
        setFieldValue('guardian-phone', profile.guardianPhone);

        // Account Snapshot
        setFieldValue('member-since', formatDate(profile.memberSince));
        setFieldValue('last-login', formatDateTime(profile.lastLogin));

        // Avatar
        var initials = setInitials(profile.fullName);
        var avatarInitials = document.querySelectorAll('[data-profile-avatar-initials]');
        avatarInitials.forEach(function (el) {
            el.textContent = initials;
        });

        var avatarPlaceholder = document.querySelector('[data-profile-avatar-placeholder]');
        var avatarImg = document.querySelector('[data-profile-avatar-img]');

        if (profile.photoUrl) {
            if (avatarImg) {
                avatarImg.src = profile.photoUrl;
                avatarImg.classList.remove('hidden');
            }
            if (avatarPlaceholder) {
                avatarPlaceholder.classList.add('hidden');
            }
        } else {
            if (avatarPlaceholder) {
                avatarPlaceholder.textContent = initials;
                avatarPlaceholder.classList.remove('hidden');
            }
            if (avatarImg) {
                avatarImg.classList.add('hidden');
            }
        }

        // Hide empty state
        var emptyEl = document.querySelector('[data-profile-empty]');
        if (emptyEl) emptyEl.classList.add('hidden');
    }

    function showEmptyState() {
        var emptyEl = document.querySelector('[data-profile-empty]');
        if (emptyEl) emptyEl.classList.remove('hidden');
    }

    function showLoading() {
        // Could add a loading spinner overlay if needed
        setFieldValue('full-name', 'Loading profile…');
    }

    function showError(message) {
        var statusEl = document.querySelector('[data-profile-status]');
        if (statusEl) {
            statusEl.textContent = message || 'Failed to load profile';
            statusEl.classList.remove('hidden');
        }
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // API Calls
    // ─────────────────────────────────────────────────────────────────────────────
    async function loadProfile() {
        state.loading = true;
        state.error = null;

        showLoading();

        try {
            // Use ShikolaAPI if available, otherwise fall back to fetch
            var profile = await fetchProfileFromSources();
            if (profile) {
                cacheProfile(profile);
                state.profile = profile;
                state.isEmpty = false;
                renderProfile(profile);
            } else {
                state.error = 'No profile data available';
                showEmptyState();
            }
        } catch (err) {
            console.error('[profile.js] Error loading profile:', err);
            state.error = err.message || 'An error occurred';
            var fallback = readCachedProfile();
            if (fallback) {
                state.profile = fallback;
                state.isEmpty = false;
                renderProfile(fallback);
            } else {
                loadFallbackProfile();
            }
        } finally {
            state.loading = false;
        }
    }

    async function fetchProfileFromSources() {
        // 1. Try dedicated pupil profile endpoint
        if (window.ShikolaAPI && window.ShikolaAPI.pupil) {
            try {
                var response = await window.ShikolaAPI.pupil.getProfile();
                var body = response && response.data ? response.data : null;
                if (response && response.success && body && body.success && body.data) {
                    return normalizeProfile(body.data);
                }

                if (response && !response.success && response.data && response.data.data) {
                    return normalizeProfile(response.data.data);
                }
            } catch (apiErr) {
                console.warn('[profile.js] Failed to fetch profile via API:', apiErr);
            }
        }

        // 2. Fallbacks handled separately
        return null;
    }

    function normalizeProfile(data) {
        if (!data) return null;
        return {
            id: data.id || data.pupilId || data.admissionNo || data.email || null,
            fullName: data.fullName || [data.firstName, data.lastName].filter(Boolean).join(' ') || data.name || 'Pupil',
            preferredName: data.preferredName || data.nickName || data.fullName || data.name || 'Pupil',
            email: data.email || '—',
            phone: data.phone || data.mobile || '—',
            dateOfBirth: data.dateOfBirth || data.dob || null,
            gender: data.gender || '—',
            pupilId: data.pupilId || data.id || '—',
            admissionNumber: data.admissionNo || data.registrationNo || data.pupilId || '—',
            classLabel: data.classLabel || data.classGrade || data.className || '—',
            academicYear: data.academicYear || data.sessionYear || '—',
            admissionDate: data.admissionDate || data.enrollmentDate || null,
            status: data.status || 'Active',
            guardianName: data.guardianName || data.parentName || '—',
            guardianRelationship: data.guardianRelationship || data.relationship || '—',
            guardianEmail: data.guardianEmail || '—',
            guardianPhone: data.guardianPhone || '—',
            memberSince: data.memberSince || data.admissionDate || data.createdAt || null,
            lastLogin: data.lastLogin || new Date().toISOString(),
            photoUrl: data.photoUrl || data.avatarUrl || readCachedPhoto(),
            notifications: data.notifications || null,
            privacy: data.privacy || null
        };
    }

    function resolvePupilFromList(list) {
        if (!Array.isArray(list) || !list.length) return null;

        var user = null;
        try {
            if (window.shikolaAuth && typeof window.shikolaAuth.getCurrentUser === 'function') {
                user = window.shikolaAuth.getCurrentUser();
            }
        } catch (e) {}

        if (user) {
            var email = (user.email || '').toLowerCase();
            var userId = String(user.id || '').toLowerCase();
            var username = email.split('@')[0];

            var exact = list.find(function (pupil) {
                if (!pupil) return false;
                var login = (pupil.loginUsername || '').toLowerCase();
                var pupilEmail = (pupil.email || '').toLowerCase();
                var pupilId = String(pupil.id || pupil.pupilId || pupil.admissionNo || '').toLowerCase();
                return (pupilEmail && pupilEmail === email) ||
                    (login && (login === email || login === username)) ||
                    (pupilId && pupilId === userId);
            });
            if (exact) {
                return normalizeProfile(exact);
            }
        }

        var active = list.find(function (pupil) {
            return pupil && (pupil.status === 'Admitted' || pupil.status === 'Active');
        }) || list[0];

        return normalizeProfile(active);
    }

    function cacheProfile(profile) {
        try {
            localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
            if (profile.photoUrl) {
                localStorage.setItem(PHOTO_STORAGE_KEY, profile.photoUrl);
            }
        } catch (e) {}
    }

    function readCachedProfile() {
        try {
            var raw = localStorage.getItem(PROFILE_STORAGE_KEY);
            if (!raw) return null;
            var parsed = JSON.parse(raw);
            if (!parsed) return null;

            var user = null;
            try {
                if (window.shikolaAuth && typeof window.shikolaAuth.getCurrentUser === 'function') {
                    user = window.shikolaAuth.getCurrentUser();
                }
            } catch (e) {}

            if (user) {
                var userId = String(user.id || '').toLowerCase();
                var email = String(user.email || '').toLowerCase();
                var cachedId = String(parsed.id || '').toLowerCase();
                var cachedEmail = String(parsed.email || '').toLowerCase();
                if ((userId && cachedId && userId === cachedId) || (email && cachedEmail && email === cachedEmail)) {
                    return parsed;
                }
                return null;
            }

            return null;
        } catch (e) {
            return null;
        }
    }

    function readCachedPhoto() {
        try {
            return localStorage.getItem(PHOTO_STORAGE_KEY) || null;
        } catch (e) {
            return null;
        }
    }

    function loadFallbackProfile() {
        var profile = null;

        // Try shikolaAuth
        try {
            if (window.shikolaAuth && typeof window.shikolaAuth.getCurrentUser === 'function') {
                var user = window.shikolaAuth.getCurrentUser();
                if (user && user.role === 'pupil') {
                    profile = {
                        id: user.id,
                        fullName: user.name || user.fullName || 'Pupil',
                        preferredName: user.name || 'Pupil',
                        email: user.email || '—',
                        classLabel: user.className || user.classLabel || 'Class',
                        status: 'Active',
                        pupilId: user.id || '—',
                        lastLogin: new Date().toISOString()
                    };
                }
            }
        } catch (e) {
            console.warn('[profile.js] Failed to get user from shikolaAuth:', e);
        }

        if (profile) {
            state.profile = profile;
            state.isEmpty = false;
            renderProfile(profile);
            cacheProfile(profile);
        } else {
            state.isEmpty = true;
            showEmptyState();
        }
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Photo Upload
    // ─────────────────────────────────────────────────────────────────────────────
    function setupPhotoUpload() {
        var uploadBtn = document.querySelector('[data-action="upload-photo"]');
        var fileInput = document.querySelector('[data-profile-photo-input]');
        var statusEl = document.querySelector('[data-profile-photo-status]');

        if (!uploadBtn || !fileInput) return;

        uploadBtn.addEventListener('click', function () {
            fileInput.click();
        });

        fileInput.addEventListener('change', async function (e) {
            var file = e.target.files && e.target.files[0];
            if (!file) return;

            // Validate file type
            if (!file.type.startsWith('image/')) {
                if (statusEl) {
                    statusEl.textContent = 'Please select an image file';
                    statusEl.classList.remove('hidden', 'text-emerald-600');
                    statusEl.classList.add('text-red-600');
                }
                return;
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                if (statusEl) {
                    statusEl.textContent = 'Image must be less than 5MB';
                    statusEl.classList.remove('hidden', 'text-emerald-600');
                    statusEl.classList.add('text-red-600');
                }
                return;
            }

            uploadBtn.disabled = true;
            uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';

            try {
                var previewSrc = await handlePhotoUpload(file);
                if (previewSrc) {
                    var avatarImg = document.querySelector('[data-profile-avatar-img]');
                    var avatarPlaceholder = document.querySelector('[data-profile-avatar-placeholder]');
                    if (avatarImg) {
                        avatarImg.src = previewSrc;
                        avatarImg.classList.remove('hidden');
                    }
                    if (avatarPlaceholder) {
                        avatarPlaceholder.classList.add('hidden');
                    }
                }

                if (statusEl) {
                    statusEl.textContent = 'Photo updated successfully';
                    statusEl.classList.remove('hidden', 'text-red-600');
                    statusEl.classList.add('text-emerald-600');
                }
            } catch (err) {
                console.error('[profile.js] Photo upload error:', err);
                if (statusEl) {
                    statusEl.textContent = 'Upload failed: ' + (err.message || 'Unknown error');
                    statusEl.classList.remove('hidden', 'text-emerald-600');
                    statusEl.classList.add('text-red-600');
                }
            } finally {
                uploadBtn.disabled = false;
                uploadBtn.innerHTML = '<i class="fas fa-camera text-slate-500"></i> <span>Upload Photo</span>';
                fileInput.value = '';
            }
        });
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Password Change
    // ─────────────────────────────────────────────────────────────────────────────
    function setupPasswordForm() {
        var form = document.querySelector('[data-password-form]');
        var statusEl = document.querySelector('[data-password-status]');

        if (!form) return;

        form.addEventListener('submit', async function (e) {
            e.preventDefault();

            var currentPassword = form.querySelector('[name="currentPassword"]').value;
            var newPassword = form.querySelector('[name="newPassword"]').value;
            var confirmPassword = form.querySelector('[name="confirmPassword"]').value;

            // Validation
            if (!currentPassword || !newPassword || !confirmPassword) {
                if (statusEl) {
                    statusEl.textContent = 'Please fill in all password fields';
                    statusEl.classList.add('text-red-600');
                }
                return;
            }

            if (newPassword !== confirmPassword) {
                if (statusEl) {
                    statusEl.textContent = 'New passwords do not match';
                    statusEl.classList.add('text-red-600');
                }
                return;
            }

            if (newPassword.length < 6) {
                if (statusEl) {
                    statusEl.textContent = 'Password must be at least 6 characters';
                    statusEl.classList.add('text-red-600');
                }
                return;
            }

            var submitBtn = form.querySelector('[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Updating...';
            }

            try {
                var resp = await window.ShikolaAPI.post('/api/pupilportal/change-password', {
                    currentPassword: currentPassword,
                    newPassword: newPassword,
                    confirmPassword: confirmPassword
                });
                
                if (resp && resp.success) {
                    setStatus('[data-password-status]', resp.message || 'Password changed successfully', false);
                    form.reset();
                } else {
                    setStatus('[data-password-status]', resp.message || 'Failed to change password', true);
                }
            } catch (err) {
                console.error('[profile.js] Password change error:', err);
                setStatus('[data-password-status]', 'Error: ' + (err.message || 'Unknown error'), true);
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Update Password';
                }
            }
        });
    }

    async function submitPasswordChange(currentPassword, newPassword, statusEl) {
        if (!window.ShikolaAPI || typeof window.ShikolaAPI.patch !== 'function') {
            throw new Error('API not available');
        }

        var resp = await window.ShikolaAPI.patch('/api/pupilportal/profile', {
            currentPassword: currentPassword,
            newPassword: newPassword
        });

        var body = resp && resp.data ? resp.data : null;
        if (!(resp && resp.success && body && body.success)) {
            throw new Error(body && body.error ? body.error : 'Failed to update password');
        }

        if (statusEl) {
            statusEl.textContent = 'Password updated successfully';
            statusEl.classList.remove('text-red-600');
            statusEl.classList.add('text-emerald-600');
        }

        return body.data;
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Notification Settings
    // ─────────────────────────────────────────────────────────────────────────────
    function setupNotificationSettings() {
        var saveBtn = document.querySelector('[data-action="save-notifications"]');
        if (!saveBtn) return;

        saveBtn.addEventListener('click', async function () {
            var notificationSettings = {};
            
            // Collect all notification settings from checkboxes
            var checkboxes = document.querySelectorAll('[data-notification-key]');
            checkboxes.forEach(function (checkbox) {
                var key = checkbox.getAttribute('data-notification-key');
                if (key) {
                    notificationSettings[key] = checkbox.checked;
                }
            });

            saveBtn.disabled = true;
            saveBtn.textContent = 'Saving...';

            try {
                await saveNotificationSettings(notificationSettings);
                showNotificationStatus('Preferences saved successfully', false);
            } catch (err) {
                console.error('[profile.js] Notification settings error:', err);
                showNotificationStatus('Error: ' + (err.message || 'Unknown error'), true);
            } finally {
                saveBtn.disabled = false;
                saveBtn.textContent = 'Save Preferences';
            }
        });

        // Load current settings
        loadNotificationSettings();
    }

    async function loadNotificationSettings() {
        if (!window.ShikolaAPI || typeof window.ShikolaAPI.get !== 'function') {
            return;
        }

        try {
            var resp = await window.ShikolaAPI.get('/api/pupilportal/preferences');
            var body = resp && resp.data ? resp.data : null;
            if (resp && resp.success && body && body.success && body.data) {
                var settings = body.data.notificationSettings || {};
                applyNotificationSettings(settings);
            }
        } catch (err) {
            console.warn('[profile.js] Failed to load notification settings:', err);
        }
    }

    function applyNotificationSettings(settings) {
        // Apply settings to all notification checkboxes
        var checkboxes = document.querySelectorAll('[data-notification-key]');
        checkboxes.forEach(function (checkbox) {
            var key = checkbox.getAttribute('data-notification-key');
            if (key && settings.hasOwnProperty(key)) {
                checkbox.checked = settings[key];
            }
        });
    }

    async function saveNotificationSettings(settings) {
        if (!window.ShikolaAPI || typeof window.ShikolaAPI.patch !== 'function') {
            throw new Error('API not available');
        }

        var resp = await window.ShikolaAPI.patch('/api/pupilportal/profile', {
            notificationSettings: settings
        });

        var body = resp && resp.data ? resp.data : null;
        if (!(resp && resp.success && body && body.success)) {
            throw new Error(body && body.error ? body.error : 'Failed to save settings');
        }

        return body.data;
    }

    function showNotificationStatus(message, isError) {
        var statusEl = document.querySelector('[data-notification-status]');
        if (!statusEl) return;

        statusEl.textContent = message || '';
        statusEl.classList.remove('hidden', 'text-red-600', 'text-emerald-600');
        statusEl.classList.add(isError ? 'text-red-600' : 'text-emerald-600');
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Privacy Settings
    // ─────────────────────────────────────────────────────────────────────────────
    function setupPrivacySettings() {
        var saveBtn = document.querySelector('[data-action="save-privacy"]');
        if (!saveBtn) return;

        saveBtn.addEventListener('click', async function () {
            var privacySettings = {};
            
            // Collect all privacy settings
            var selects = document.querySelectorAll('[data-privacy-key]');
            selects.forEach(function (select) {
                var key = select.getAttribute('data-privacy-key');
                if (key) {
                    if (select.type === 'checkbox') {
                        privacySettings[key] = select.checked;
                    } else if (select.tagName === 'SELECT') {
                        privacySettings[key] = select.value;
                    }
                }
            });

            saveBtn.disabled = true;
            saveBtn.textContent = 'Saving...';

            try {
                await savePrivacySettings(privacySettings);
                showPrivacyStatus('Settings saved successfully', false);
            } catch (err) {
                console.error('[profile.js] Privacy settings error:', err);
                showPrivacyStatus('Error: ' + (err.message || 'Unknown error'), true);
            } finally {
                saveBtn.disabled = false;
                saveBtn.textContent = 'Save Settings';
            }
        });

        // Load current settings
        loadPrivacySettings();
    }

    async function loadPrivacySettings() {
        if (!window.ShikolaAPI || typeof window.ShikolaAPI.get !== 'function') {
            return;
        }

        try {
            var resp = await window.ShikolaAPI.get('/api/pupilportal/preferences');
            var body = resp && resp.data ? resp.data : null;
            if (resp && resp.success && body && body.success && body.data) {
                var settings = body.data.privacySettings || {};
                applyPrivacySettings(settings);
            }
        } catch (err) {
            console.warn('[profile.js] Failed to load privacy settings:', err);
        }
    }

    function applyPrivacySettings(settings) {
        // Apply settings to all privacy controls
        var controls = document.querySelectorAll('[data-privacy-key]');
        controls.forEach(function (control) {
            var key = control.getAttribute('data-privacy-key');
            if (key && settings.hasOwnProperty(key)) {
                if (control.type === 'checkbox') {
                    control.checked = settings[key];
                } else if (control.tagName === 'SELECT') {
                    control.value = settings[key] || 'Everyone';
                }
            } else if (key === 'dataCollection' || key === 'marketing') {
                // Default to checked for data collection and marketing if no settings exist
                if (control.type === 'checkbox') {
                    control.checked = true;
                }
            }
        });
    }

    async function savePrivacySettings(settings) {
        if (!window.ShikolaAPI || typeof window.ShikolaAPI.patch !== 'function') {
            throw new Error('API not available');
        }

        var resp = await window.ShikolaAPI.patch('/api/pupilportal/profile', {
            privacySettings: settings
        });

        var body = resp && resp.data ? resp.data : null;
        if (!(resp && resp.success && body && body.success)) {
            throw new Error(body && body.error ? body.error : 'Failed to save settings');
        }

        return body.data;
    }

    function showPrivacyStatus(message, isError) {
        var statusEl = document.querySelector('[data-privacy-status]');
        if (!statusEl) return;

        statusEl.textContent = message || '';
        statusEl.classList.remove('hidden', 'text-red-600', 'text-emerald-600');
        statusEl.classList.add(isError ? 'text-red-600' : 'text-emerald-600');
    }

    function hydratePrefsFromState(profile) {
        if (!profile) return;
        
        // Hydrate notification preferences
        if (profile.notifications) {
            applyNotificationSettings(profile.notifications);
        }
        
        // Hydrate privacy preferences
        if (profile.privacy) {
            applyPrivacySettings(profile.privacy);
        }
    }

    function setupDeleteAccount() {
        var deleteBtn = document.querySelector('[data-action="delete-account"]');
        var infoPanel = document.querySelector('[data-delete-account-info]');
        
        if (!deleteBtn || !infoPanel) return;

        deleteBtn.addEventListener('click', function () {
            // Toggle the information panel
            var isHidden = infoPanel.classList.contains('hidden');
            
            if (isHidden) {
                infoPanel.classList.remove('hidden');
                deleteBtn.textContent = 'Hide Information';
                deleteBtn.classList.remove('border-red-300', 'bg-white', 'text-red-600', 'hover:bg-red-50');
                deleteBtn.classList.add('bg-red-600', 'text-white', 'hover:bg-red-700');
            } else {
                infoPanel.classList.add('hidden');
                deleteBtn.textContent = 'Delete Account';
                deleteBtn.classList.remove('bg-red-600', 'text-white', 'hover:bg-red-700');
                deleteBtn.classList.add('border-red-300', 'bg-white', 'text-red-600', 'hover:bg-red-50');
            }
        });
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Initialize
    // ─────────────────────────────────────────────────────────────────────────────
    function init() {
        loadProfile().then(function () {
            hydratePrefsFromState(state.profile);
            hydrateLoginProfileAndTheme();
        });
        setupPhotoUpload();
        setupPasswordForm();
        setupNotificationSettings();
        setupPrivacySettings();
        setupThemeButtons();
        setupProfileEdit();
        setupDeleteAccount();
    }

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Export for debugging
    window.ShikolaProfile = {
        state: state,
        loadProfile: loadProfile,
        renderProfile: renderProfile
    };

})(window);
