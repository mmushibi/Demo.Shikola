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
    var STORAGE_KEY = 'shikola_pupils';
    var LAYOUT_STORAGE_KEY = 'shikola_pupil_form_layout_v1';
    var CUSTOM_FIELDS_KEY = 'shikola_pupil_custom_fields_v1';
    var REQUIRED_FIELDS_KEY = 'shikola_pupil_required_fields_v1';
    var FAMILIES_KEY = 'shikola_families_v1';

    var __classesSyncInFlight = null;
    var __classesLastOkAt = 0;

    var __listPupilsInFlight = null;
    var __listPupilsLastOkAt = 0;
    var __listPupils429Until = 0;

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

    function listConfiguredClassNames() {
        try {
            if (window.ShikolaClassesStore && typeof window.ShikolaClassesStore.listClassNames === 'function') {
                var names = window.ShikolaClassesStore.listClassNames();
                if (Array.isArray(names)) {
                    return names.filter(function (n) { return n && String(n).trim(); }).map(function (n) { return String(n).trim(); });
                }
            }
        } catch (e) {
        }
        return [];
    }

    async function syncClassesIfPossible(force) {
        var now = Date.now();
        if (!force && __classesLastOkAt && (now - __classesLastOkAt) < 5000) {
            return;
        }
        if (__classesSyncInFlight) {
            return __classesSyncInFlight;
        }
        __classesSyncInFlight = (async function () {
            try {
                if (window.ShikolaClassesApi && typeof window.ShikolaClassesApi.syncFromServer === 'function') {
                    var can = true;
                    if (typeof window.ShikolaClassesApi.canUseApi === 'function') {
                        can = window.ShikolaClassesApi.canUseApi();
                    }
                    if (can) {
                        await window.ShikolaClassesApi.syncFromServer();
                    }
                }
            } catch (e) {
            }
            __classesLastOkAt = Date.now();
        })();

        try {
            return await __classesSyncInFlight;
        } finally {
            __classesSyncInFlight = null;
        }
    }
    function loadLocalPupils() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return [];
            var data = JSON.parse(raw);
            return Array.isArray(data) ? data : [];
        } catch (e) {
            return [];
        }
    }
    function saveLocalPupils(list) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
        } catch (e) {
        }
    }
    function addLocalPupil(pupil) {
        var list = loadLocalPupils();
        var index = list.findIndex(function (p) { return p.id === pupil.id; });
        if (index >= 0) {
            list[index] = pupil;
        } else {
            list.push(pupil);
        }
        saveLocalPupils(list);
    }
    function saveLocalPupil(pupil) {
        if (!pupil) return;
        if (!pupil.id) {
            pupil.id = 'LOCAL-' + Date.now().toString();
        }
        addLocalPupil(pupil);
    }
    function loadFamilies() {
        try {
            var raw = localStorage.getItem(FAMILIES_KEY);
            if (!raw) return [];
            var data = JSON.parse(raw);
            return Array.isArray(data) ? data : [];
        } catch (e) {
            return [];
        }
    }
    function saveFamilies(list) {
        try {
            localStorage.setItem(FAMILIES_KEY, JSON.stringify(Array.isArray(list) ? list : []));
        } catch (e) {
        }
    }
    function generateFamilyId() {
        return 'FAM-' + Date.now().toString(36).toUpperCase();
    }
    function listFamilies() {
        return loadFamilies();
    }
    function upsertFamily(family) {
        var list = loadFamilies();
        if (!family) return list;
        var id = family.id || generateFamilyId();
        var index = list.findIndex(function (f) { return f && f.id === id; });
        var payload = {
            id: id,
            familyName: (family.familyName || '').trim(),
            guardianName: (family.guardianName || '').trim(),
            guardianPhone: (family.guardianPhone || '').trim(),
            notes: (family.notes || '').trim(),
            createdAt: family.createdAt || new Date().toISOString()
        };
        if (index >= 0) {
            list[index] = payload;
        } else {
            list.push(payload);
        }
        saveFamilies(list);
        return list;
    }
    function deleteFamily(id) {
        if (!id) return loadFamilies();
        var list = loadFamilies().filter(function (f) {
            return f && f.id !== id;
        });
        saveFamilies(list);
        return list;
    }
    function buildAdmissionLetterHtml(pupil, rulesHtml) {
        if (!pupil) {
            return '';
        }
        var name = pupil.fullName || ((pupil.firstName || '') + ' ' + (pupil.lastName || ''));
        var classLabel = pupil.classGrade || pupil.classLabel || '';
        var sessionYear = pupil.sessionYear || '';
        var admissionNo = pupil.admissionNo || pupil.admissionNoFallback || '';
        var guardian = pupil.guardianName || '';
        var phone = pupil.guardianPhone || '';
        var today = new Date();
        var dateStr = today.toLocaleDateString();
        var header = '<p>Date: ' + dateStr + '</p>' +
            '<p>Dear ' + (guardian || 'Parent/Guardian') + ',</p>' +
            '<p>We are pleased to confirm the admission of <strong>' + name + '</strong> into <strong>' + (classLabel || 'the assigned class') + '</strong> for the academic session <strong>' + (sessionYear || '') + '</strong>.</p>' +
            '<p>Admission Number: <strong>' + (admissionNo || 'To be allocated') + '</strong></p>' +
            '<p>Primary contact: <strong>' + (guardian || '') + '</strong> (' + (phone || 'no phone recorded') + ')</p>' +
            '<p>Please review the rules and regulations below, which apply to all enrolled pupils.</p>';
        var loginSection = '';
        var hasLogin = !!(pupil.studentId || pupil.loginUsername || pupil.loginPassword);
        if (hasLogin) {
            loginSection = '<div class="mt-3 text-xs text-slate-700">' +
                '<p><strong>Pupil Portal Login Details</strong></p>' +
                (pupil.studentId ? '<p>Pupil ID: <strong>' + escapeHtml(pupil.studentId) + '</strong></p>' : '') +
                (pupil.loginUsername ? '<p>Username: <strong>' + escapeHtml(pupil.loginUsername) + '</strong></p>' : '') +
                (pupil.loginPassword ? '<p>Password: <strong>' + escapeHtml(pupil.loginPassword) + '</strong></p>' : '') +
                '<p class="mt-1 text-slate-500">Please keep these credentials safe. They will be used to access the pupil portal.</p>' +
                '</div>';
        }
        var rulesBlock = rulesHtml ? '<div class="mt-3 border-t border-slate-200 pt-2 text-xs text-slate-700">' + rulesHtml + '</div>' : '';
        var closing = '<p class="mt-3">We look forward to a successful partnership with you and your child.</p>' +
            '<p>Yours faithfully,</p>' +
            '<p><strong>School Administration</strong></p>';
        return '<div class="space-y-2 text-xs text-slate-700">' + header + loginSection + rulesBlock + closing + '</div>';
    }
    function escapeHtml(value) {
        if (value === null || value === undefined) return '';
        return String(value).replace(/[&<>"']/g, function (ch) {
            switch (ch) {
                case '&': return '&amp;';
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '"': return '&quot;';
                case "'": return '&#39;';
                default: return ch;
            }
        });
    }
    async function createPupil(pupil) {
        var base = window.SHIKOLA_API_BASE;
        var payload = pupil;
        var token = getAuthToken();

        // Offline/static mode: no backend configured, so store locally only
        if (!base || !token) {
            var offline = Object.assign({}, payload);
            if (!offline.id) {
                offline.id = 'LOCAL-' + Date.now().toString();
            }
            addLocalPupil(offline);
            return { success: true, pupil: offline, source: 'local' };
        }

        try {
            var response = await fetch(base + '/api/admin/pupils', {
                method: 'POST',
                headers: buildAuthHeaders(),
                body: JSON.stringify(payload)
            });
            if (response.ok) {
                var data = await response.json().catch(function () { return null; });
                var saved = data && (data.pupil || data) ? (data.pupil || data) : payload;
                if (!saved.id) {
                    saved.id = id;
                }
                addLocalPupil(saved);
                return { success: true, pupil: saved, source: 'backend' };
            }
            var text = await response.text().catch(function () { return ''; });
            addLocalPupil(payload);
            return { success: false, pupil: payload, error: text || 'Unable to update pupil on server.' };
            return { success: false, error: text || 'Unable to save pupil on server.' };
        } catch (e) {
            var fallback = Object.assign({}, payload);
            if (!fallback.id) {
                fallback.id = 'LOCAL-' + Date.now().toString();
            }
            addLocalPupil(fallback);
            return { success: true, pupil: fallback, source: 'local' };
        }
    }
    async function updatePupil(pupil) {
        if (!pupil) {
            return { success: false, error: 'No pupil data provided.' };
        }
        var base = window.SHIKOLA_API_BASE || 'http://localhost:3000';
        var token = getAuthToken();
        var payload = pupil;
        var id = pupil.id;
        var canSendToServer = base && token && id && String(id).indexOf('LOCAL-') !== 0;
        try {
            if (canSendToServer) {
                var response = await fetch(base + '/api/admin/pupils/' + encodeURIComponent(String(id)), {
                    method: 'PUT',
                    headers: buildAuthHeaders(),
                    body: JSON.stringify(payload)
                });
                if (response.ok) {
                    var data = await response.json().catch(function () { return null; });
                    var saved = data && data.data ? data.data : (data && (data.pupil || data) ? (data.pupil || data) : payload);
                    if (!saved.id) {
                        saved.id = id;
                    }
                    addLocalPupil(saved);
                    
                    // Trigger real-time sync
                    if (window.shikolaRealtime && window.shikolaRealtime.isConnectionActive()) {
                        console.log('Pupil updated - real-time updates will sync automatically');
                    }
                    
                    return { success: true, pupil: saved, source: 'backend' };
                }
                var text = await response.text().catch(function () { return ''; });
                addLocalPupil(payload);
                return { success: false, pupil: payload, error: text || 'Unable to update pupil on server.' };
            }
        } catch (e) {
        }
        addLocalPupil(payload);
        return { success: true, pupil: payload, source: 'local' };
    }
    
    async function deletePupil(pupilId) {
        if (!pupilId) {
            return { success: false, error: 'No pupil ID provided.' };
        }
        var base = window.SHIKOLA_API_BASE || 'http://localhost:3000';
        var token = getAuthToken();
        var canSendToServer = base && token && pupilId && String(pupilId).indexOf('LOCAL-') !== 0;
        
        try {
            if (canSendToServer) {
                var response = await fetch(base + '/api/admin/pupils/' + encodeURIComponent(String(pupilId)), {
                    method: 'DELETE',
                    headers: buildAuthHeaders()
                });
                if (response.ok) {
                    // Remove from local storage
                    removePupilFromLocalStorage(pupilId);
                    
                    // Trigger real-time sync
                    if (window.shikolaRealtime && window.shikolaRealtime.isConnectionActive()) {
                        console.log('Pupil deleted - real-time updates will sync automatically');
                    }
                    
                    return { success: true, pupilId: pupilId, source: 'backend' };
                }
                var text = await response.text().catch(function () { return ''; });
                return { success: false, error: text || 'Unable to delete pupil on server.' };
            }
        } catch (e) {
        }
        
        // Fallback: remove from local storage
        removePupilFromLocalStorage(pupilId);
        return { success: true, pupilId: pupilId, source: 'local' };
    }
    
    async function bulkImportPupils(pupils) {
        if (!Array.isArray(pupils) || pupils.length === 0) {
            return { success: false, error: 'No pupils provided for import.' };
        }
        var base = window.SHIKOLA_API_BASE || 'http://localhost:3000';
        var token = getAuthToken();
        
        // Offline/static mode: store locally only
        if (!base || !token) {
            pupils.forEach(function(pupil) {
                if (!pupil.id) {
                    pupil.id = 'LOCAL-' + Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9);
                }
                addLocalPupil(pupil);
            });
            return { success: true, pupils: pupils, source: 'local' };
        }

        try {
            var response = await fetch(base + '/api/admin/pupils/bulk-import', {
                method: 'POST',
                headers: buildAuthHeaders(),
                body: JSON.stringify(pupils)
            });
            if (response.ok) {
                var data = await response.json().catch(function () { return null; });
                var result = data && data.data ? data.data : data;
                
                // Add successful pupils to local storage
                if (result && result.success && Array.isArray(result.success)) {
                    result.success.forEach(function(pupil) {
                        addLocalPupil(pupil);
                    });
                }
                
                // Trigger real-time sync
                if (window.shikolaRealtime && window.shikolaRealtime.isConnectionActive()) {
                    console.log('Bulk import completed - real-time updates will sync automatically');
                }
                
                return { success: true, result: result, source: 'backend' };
            }
            var text = await response.text().catch(function () { return ''; });
            return { success: false, error: text || 'Unable to bulk import pupils on server.' };
        } catch (e) {
            // Fallback: store locally
            pupils.forEach(function(pupil) {
                if (!pupil.id) {
                    pupil.id = 'LOCAL-' + Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9);
                }
                addLocalPupil(pupil);
            });
            return { success: true, pupils: pupils, source: 'local' };
        }
    }
    function getLocalPupils() {
        return loadLocalPupils();
    }
    function searchLocalPupils(query) {
        var q = (query || '').toLowerCase().trim();
        if (!q) {
            return [];
        }
        var list = loadLocalPupils();
        return list.filter(function (p) {
            return (p.fullName && p.fullName.toLowerCase().includes(q)) ||
                (p.admissionNo && p.admissionNo.toLowerCase().includes(q)) ||
                (p.classLabel && p.classLabel.toLowerCase().includes(q)) ||
                (p.guardianName && p.guardianName.toLowerCase().includes(q));
        }).slice(0, 10);
    }
    async function searchPupils(query) {
        var local = searchLocalPupils(query);
        if (local.length) return local;
        var base = window.SHIKOLA_API_BASE || 'http://localhost:3000';
        try {
            var response = await fetch(base + '/api/pupils/search?q=' + encodeURIComponent(query || ''), {
                headers: buildAuthHeaders()
            });
            if (!response.ok) return [];
            var data = await response.json().catch(function () { return []; });
            if (!Array.isArray(data)) return [];
            return data;
        } catch (e) {
            return [];
        }
    }
    async function listPupils() {
        var local = getLocalPupils();
        var base = window.SHIKOLA_API_BASE;
        var token = getAuthToken();

        var now = Date.now();

        if (__listPupils429Until && now < __listPupils429Until) {
            return local;
        }

        if (__listPupilsInFlight) {
            return __listPupilsInFlight;
        }

        if (__listPupilsLastOkAt && (now - __listPupilsLastOkAt) < 5000) {
            return local;
        }

        // Offline/static mode: no backend configured, so rely entirely on local storage
        if (!base || !token) {
            return local;
        }

        __listPupilsInFlight = (async function () {
            try {
                var response = await fetch(base + '/api/admin/pupils', {
                    headers: buildAuthHeaders()
                });
                if (response.status === 429) {
                    __listPupils429Until = Date.now() + 15000;
                    return local;
                }
                if (!response.ok) {
                    return local;
                }
                var data = await response.json().catch(function () { return null; });
                var list = Array.isArray(data) ? data : (data && data.data && Array.isArray(data.data.items) ? data.data.items : (data && Array.isArray(data.pupils) ? data.pupils : null));
                if (Array.isArray(list)) {
                    saveLocalPupils(list);
                    __listPupilsLastOkAt = Date.now();
                    return list;
                }
            } catch (e) {
            }
            return local;
        })();

        try {
            return await __listPupilsInFlight;
        } finally {
            __listPupilsInFlight = null;
        }
    }
    window.ShikolaPupilsApi = {
        createPupil: createPupil,
        updatePupil: updatePupil,
        deletePupil: deletePupil,
        bulkImportPupils: bulkImportPupils,
        getLocalPupils: getLocalPupils,
        searchPupils: searchPupils,
        listPupils: listPupils,
        saveLocalPupil: saveLocalPupil
    };
    window.ShikolaPupilsStore = {
        list: getLocalPupils,
        search: searchLocalPupils
    };
    window.ShikolaFamiliesStore = {
        listFamilies: listFamilies,
        saveFamilies: saveFamilies,
        upsertFamily: upsertFamily,
        deleteFamily: deleteFamily
    };

    function getPupilClassLabel(pupil) {
        if (!pupil) return '';
        return pupil.classGrade || pupil.classLabel || pupil.className || '';
    }

    function getPupilFullName(pupil) {
        if (!pupil) return '';
        var fullName = (pupil.fullName || ((pupil.firstName || '') + ' ' + (pupil.lastName || ''))).trim();
        if (!fullName) {
            fullName = pupil.admissionNo || pupil.id || 'Pupil';
        }
        return fullName;
    }

    function getPupilUiId(pupil) {
        if (!pupil) return '';
        return pupil.id || pupil.studentId || pupil.admissionNo || pupil.registrationNo || getPupilFullName(pupil);
    }

    function normalizePupilForUi(pupil) {
        if (!pupil) return null;
        return {
            id: getPupilUiId(pupil),
            fullName: getPupilFullName(pupil),
            classLabel: getPupilClassLabel(pupil),
            status: pupil.status || 'Active',
            raw: pupil
        };
    }

    function groupPupilsByClassForAttendance(list) {
        var grouped = {};
        var namesForAll = [];
        (list || []).forEach(function (p) {
            var norm = normalizePupilForUi(p);
            if (!norm) return;
            var cls = norm.classLabel || 'Unassigned';
            if (!grouped[cls]) {
                grouped[cls] = [];
            }
            grouped[cls].push({
                id: norm.id,
                name: norm.fullName,
                status: 'P',
                remark: ''
            });
            namesForAll.push(norm.fullName + ' - ' + cls);
        });
        return {
            studentsByClass: grouped,
            allStudents: namesForAll
        };
    }

    window.ShikolaPupilsHelpers = {
        getClassLabel: getPupilClassLabel,
        getFullName: getPupilFullName,
        getUiId: getPupilUiId,
        normalizeForUi: normalizePupilForUi,
        groupByClassForAttendance: groupPupilsByClassForAttendance
    };

    window.pupilAdmissionForm = function () {
        return {
            showCustomize: false,
            extraFields: {
                religion: true,
                previousSchool: true,
                photo: true,
                section: true,
                rollNumber: true,
                guardianEmail: true,
                guardianId: true,
                guardianOccupation: true,
                guardianAddress: true,
                transport: true,
                hostel: true,
                medicalDetails: true,
                feeCategory: true
            },
            requiredConfig: {
                dob: false,
                nationality: false,
                address: false,
                guardianName: false,
                guardianPhone: false
            },
            newFieldLabel: '',
            newFieldType: 'text',
            customFields: [],
            loading: false,
            errorMessage: '',
            successMessage: '',
            validationErrors: [],
            showAdmissionModal: false,
            admissionLetterHtml: '',
            rulesHtml: '',
            siblingSearchQuery: '',
            siblingSearchResults: [],
            linkedSiblings: [],
            classNames: [],
            classSections: [],
            selectedClassSections: [],
            form: {
                firstName: '',
                lastName: '',
                gender: '',
                dob: '',
                religion: '',
                nationality: '',
                address: '',
                previousSchool: '',
                studentPhotoName: '',
                classGrade: '',
                section: '',
                sessionYear: '',
                rollNumber: '',
                admissionDate: '',
                guardianName: '',
                guardianRelation: '',
                guardianPhone: '',
                guardianEmail: '',
                guardianId: '',
                guardianOccupation: '',
                guardianAddress: '',
                registrationNo: '',
                studentId: '',
                admissionNo: '',
                status: 'Active',
                notes: '',
                transportRoute: '',
                hostelInfo: '',
                medicalDetails: '',
                feeCategory: 'Standard fees',
                loginUsername: '',
                loginPassword: ''
            },
            init: async function () {
                this.loadRules();
                this.loadLayoutSettings();
                this.loadCustomFields();
                this.loadRequiredConfig();
                this.setupClassListeners();
                this.loadClasses();
                await this.ensureClassesLoaded(false);
            },
            setupClassListeners: function () {
                var self = this;
                try {
                    window.addEventListener('shikola:classes-updated', function () {
                        self.loadClasses();
                    });
                } catch (e) {
                }
            },
            ensureClassesLoaded: async function (force) {
                if (!force) {
                    try {
                        if (Array.isArray(this.classNames) && this.classNames.length) {
                            return;
                        }
                    } catch (e) {
                    }
                }

                try {
                    if (window.ShikolaClassesApi && typeof window.ShikolaClassesApi.syncFromServer === 'function') {
                        var can = true;
                        if (typeof window.ShikolaClassesApi.canUseApi === 'function') {
                            can = window.ShikolaClassesApi.canUseApi();
                        }
                        if (can) {
                            await window.ShikolaClassesApi.syncFromServer();
                        }
                    }
                } catch (e) {
                }

                this.loadClasses();
            },
            loadRules: function () {
                try {
                    var stored = localStorage.getItem('shikola_rules_regulations_html');
                    if (stored) {
                        this.rulesHtml = stored;
                    }
                } catch (e) {
                    this.rulesHtml = '';
                }
            },
            loadLayoutSettings: function () {
                try {
                    var raw = localStorage.getItem(LAYOUT_STORAGE_KEY);
                    if (!raw) return;
                    var parsed = JSON.parse(raw);
                    if (parsed && typeof parsed === 'object') {
                        this.extraFields = Object.assign({}, this.extraFields, parsed);
                    }
                } catch (e) {
                }
            },
            saveLayoutSettings: function () {
                try {
                    localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(this.extraFields));
                } catch (e) {
                }
            },
            loadRequiredConfig: function () {
                try {
                    var raw = localStorage.getItem(REQUIRED_FIELDS_KEY);
                    if (!raw) return;
                    var parsed = JSON.parse(raw);
                    if (parsed && typeof parsed === 'object') {
                        this.requiredConfig = Object.assign({}, this.requiredConfig, parsed);
                    }
                } catch (e) {
                }
            },
            saveRequiredConfig: function () {
                try {
                    localStorage.setItem(REQUIRED_FIELDS_KEY, JSON.stringify(this.requiredConfig || {}));
                } catch (e) {
                }
            },
            loadClasses: function () {
                this.classNames = [];
                try {
                    if (window.ShikolaClassesStore && typeof window.ShikolaClassesStore.listClassNames === 'function') {
                        var names = window.ShikolaClassesStore.listClassNames();
                        if (Array.isArray(names) && names.length) {
                            this.classNames = names.slice();
                        }
                    }
                } catch (e) {
                    this.classNames = [];
                }
            },
            loadClassSections: async function () {
                this.classSections = [];
                this.selectedClassSections = [];
                if (!this.form.classGrade) {
                    return;
                }

                try {
                    // Try to fetch from server first
                    var base = window.SHIKOLA_API_BASE;
                    var token = getAuthToken();
                    if (base && token) {
                        var response = await fetch(base + '/api/admin/classes/' + encodeURIComponent(this.form.classGrade) + '/sections', {
                            headers: buildAuthHeaders()
                        });
                        if (response.ok) {
                            var data = await response.json();
                            if (Array.isArray(data)) {
                                this.classSections = data.map(function(section) {
                                    return {
                                        id: section.id,
                                        name: section.section_name || section.name,
                                        capacity: section.max_capacity,
                                        currentEnrollment: section.current_enrollment || 0,
                                        teacher: section.teacher_name || '',
                                        room: section.room_location || ''
                                    };
                                });
                                return;
                            }
                        }
                    }
                } catch (e) {
                    console.warn('Failed to fetch class sections from server:', e);
                }

                // Fallback: check if class has sections in local storage or use default sections
                try {
                    // For now, use default sections A, B, C if no server data
                    if (this.extraFields.section) {
                        this.classSections = [
                            { id: 'A', name: 'Section A', capacity: 30, currentEnrollment: 0, teacher: '', room: '' },
                            { id: 'B', name: 'Section B', capacity: 30, currentEnrollment: 0, teacher: '', room: '' },
                            { id: 'C', name: 'Section C', capacity: 30, currentEnrollment: 0, teacher: '', room: '' }
                        ];
                    }
                } catch (e) {
                    this.classSections = [];
                }
            },
            onClassChange: async function () {
                // Reset section when class changes
                this.form.section = '';
                await this.loadClassSections();
            },
            isFieldRequired: function (key) {
                if (!key) return false;
                if (key === 'firstName' || key === 'lastName' || key === 'gender' || key === 'classGrade' || key === 'registrationNo') {
                    return true;
                }
                var cfg = this.requiredConfig || {};
                return !!cfg[key];
            },
            loadCustomFields: function () {
                try {
                    var raw = localStorage.getItem(CUSTOM_FIELDS_KEY);
                    if (!raw) return;
                    var parsed = JSON.parse(raw);
                    if (Array.isArray(parsed)) {
                        this.customFields = parsed.map(function (f, index) {
                            var type = f && f.type;
                            if (type !== 'number' && type !== 'date') {
                                type = 'text';
                            }
                            return {
                                id: (f && f.id) || ('CF-' + Date.now().toString(36) + '-' + index.toString(36)),
                                label: (f && f.label) || '',
                                type: type,
                                value: ''
                            };
                        });
                    }
                } catch (e) {
                }
            },
            saveCustomFields: function () {
                try {
                    var simple = (this.customFields || []).map(function (f) {
                        if (!f) return null;
                        return {
                            id: f.id,
                            label: f.label || '',
                            type: f.type === 'number' || f.type === 'date' ? f.type : 'text'
                        };
                    }).filter(function (f) { return !!f && f.label; });
                    localStorage.setItem(CUSTOM_FIELDS_KEY, JSON.stringify(simple));
                } catch (e) {
                }
            },
            addCustomField: function () {
                var label = (this.newFieldLabel || '').trim();
                var type = this.newFieldType || 'text';
                if (!label) {
                    return;
                }
                if (type !== 'number' && type !== 'date') {
                    type = 'text';
                }
                var id = 'CF-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
                this.customFields.push({
                    id: id,
                    label: label,
                    type: type,
                    value: ''
                });
                this.newFieldLabel = '';
                this.newFieldType = 'text';
                this.saveCustomFields();
            },
            removeCustomField: function (id) {
                if (!id) return;
                this.customFields = (this.customFields || []).filter(function (f) {
                    return f && f.id !== id;
                });
                this.saveCustomFields();
            },
            onPhotoSelected: function (event) {
                var file = event.target.files && event.target.files[0];
                this.form.studentPhotoName = file ? file.name : '';
            },
            resetForm: function () {
                this.form.firstName = '';
                this.form.lastName = '';
                this.form.gender = '';
                this.form.dob = '';
                this.form.religion = '';
                this.form.nationality = '';
                this.form.address = '';
                this.form.previousSchool = '';
                this.form.studentPhotoName = '';
                this.form.classGrade = '';
                this.form.section = '';
                this.form.sessionYear = '';
                this.form.rollNumber = '';
                this.form.admissionDate = '';
                this.form.guardianName = '';
                this.form.guardianRelation = '';
                this.form.guardianPhone = '';
                this.form.guardianEmail = '';
                this.form.guardianId = '';
                this.form.guardianOccupation = '';
                this.form.guardianAddress = '';
                this.form.registrationNo = '';
                this.form.studentId = '';
                this.form.admissionNo = '';
                this.form.status = 'Active';
                this.form.notes = '';
                this.form.transportRoute = '';
                this.form.hostelInfo = '';
                this.form.medicalDetails = '';
                this.form.feeCategory = 'Standard fees';
                this.form.loginUsername = '';
                this.form.loginPassword = '';
                this.classSections = [];
                this.selectedClassSections = [];
                this.siblingSearchQuery = '';
                this.siblingSearchResults = [];
                this.linkedSiblings = [];
                (this.customFields || []).forEach(function (f) {
                    if (f) {
                        f.value = '';
                    }
                });
                this.errorMessage = '';
                this.successMessage = '';
                this.validationErrors = [];
            },
            validate: function () {
                var missing = [];
                if (!this.form.firstName) missing.push('First Name');
                if (!this.form.lastName) missing.push('Last Name');
                if (!this.form.gender) missing.push('Gender');
                if (!this.form.classGrade) missing.push('Class / Grade');
                if (!this.form.registrationNo) missing.push('Registration Number');
                
                // Check if section is required when class has sections
                if (this.form.classGrade && this.classSections.length > 0 && !this.form.section) {
                    missing.push('Section (required for this class)');
                }
                
                var cfg = this.requiredConfig || {};
                if (cfg.dob && !this.form.dob) missing.push('Date of Birth');
                if (cfg.nationality && !this.form.nationality) missing.push('Nationality');
                if (cfg.address && !this.form.address) missing.push('Address');
                if (cfg.guardianName && !this.form.guardianName) missing.push('Guardian Name');
                if (cfg.guardianPhone && !this.form.guardianPhone) missing.push('Guardian Phone');
                this.validationErrors = missing;
                return missing.length === 0;
            },
            buildPayload: function () {
                var fullName = this.form.firstName.trim() + ' ' + this.form.lastName.trim();
                return {
                    firstName: this.form.firstName,
                    lastName: this.form.lastName,
                    fullName: fullName.trim(),
                    gender: this.form.gender,
                    dob: this.form.dob,
                    religion: this.form.religion,
                    nationality: this.form.nationality,
                    address: this.form.address,
                    previousSchool: this.form.previousSchool,
                    studentPhotoName: this.form.studentPhotoName,
                    classGrade: this.form.classGrade,
                    section: this.form.section,
                    sessionYear: this.form.sessionYear,
                    rollNumber: this.form.rollNumber,
                    admissionDate: this.form.admissionDate,
                    guardianName: this.form.guardianName,
                    guardianRelation: this.form.guardianRelation,
                    guardianPhone: this.form.guardianPhone,
                    guardianEmail: this.form.guardianEmail,
                    guardianId: this.form.guardianId,
                    guardianOccupation: this.form.guardianOccupation,
                    guardianAddress: this.form.guardianAddress,
                    registrationNo: this.form.registrationNo,
                    studentId: this.form.studentId,
                    admissionNo: this.form.admissionNo,
                    status: this.form.status || 'Active',
                    notes: this.form.notes,
                    transportRoute: this.form.transportRoute,
                    hostelInfo: this.form.hostelInfo,
                    medicalDetails: this.form.medicalDetails,
                    feeCategory: this.form.feeCategory,
                    customFields: (this.customFields || []).map(function (f) {
                        return {
                            id: f.id,
                            label: f.label || '',
                            type: f.type || 'text',
                            value: f.value
                        };
                    }),
                    linkedSiblingIds: this.linkedSiblings.map(function (s) { return s.id; }),
                    classLabel: this.form.classGrade,
                    admissionNoFallback: this.form.admissionNo,
                    loginUsername: this.form.loginUsername,
                    loginPassword: this.form.loginPassword
                };
            },
            generateAdmissionNo: function () {
                var existing = {};
                try {
                    if (window.ShikolaPupilsApi && typeof window.ShikolaPupilsApi.getLocalPupils === 'function') {
                        var list = window.ShikolaPupilsApi.getLocalPupils() || [];
                        for (var i = 0; i < list.length; i++) {
                            if (!list[i]) continue;
                            var a = list[i].admissionNo || list[i].admissionNoFallback;
                            if (a) {
                                existing[String(a)] = true;
                            }
                        }
                    }
                } catch (e) {
                }
                function makeNo(sessionYear) {
                    var year = (sessionYear || new Date().getFullYear()).toString();
                    var rand = Math.floor(1000 + Math.random() * 9000);
                    return 'ADM/' + year + '/' + rand;
                }
                var adm = makeNo(this.form.sessionYear);
                var guard = 0;
                while (existing[adm] && guard < 5) {
                    adm = makeNo(this.form.sessionYear);
                    guard++;
                }
                return adm;
            },
            generateSystemPupilId: function () {
                var prefix = 'PUP-';
                var existingIds = [];
                try {
                    if (window.ShikolaPupilsApi && typeof window.ShikolaPupilsApi.getLocalPupils === 'function') {
                        var list = window.ShikolaPupilsApi.getLocalPupils() || [];
                        for (var i = 0; i < list.length; i++) {
                            if (list[i] && list[i].studentId) {
                                existingIds.push(String(list[i].studentId));
                            }
                        }
                    }
                } catch (e) {
                }
                function makeId() {
                    var ts = Date.now().toString(36).toUpperCase();
                    var rand = Math.floor(Math.random() * 1679616).toString(36).toUpperCase();
                    while (rand.length < 4) {
                        rand = '0' + rand;
                    }
                    return prefix + ts.slice(-4) + '-' + rand.slice(0, 4);
                }
                var candidate = makeId();
                var guard = 0;
                while (existingIds.indexOf(candidate) !== -1 && guard < 5) {
                    candidate = makeId();
                    guard++;
                }
                return candidate;
            },
            buildDefaultLoginUsername: function (pupil) {
                if (!pupil) return '';
                var id = pupil.admissionNo || pupil.registrationNo || pupil.studentId || pupil.admissionNoFallback;
                if (id) return String(id);
                var first = (pupil.firstName || '').toLowerCase();
                var last = (pupil.lastName || '').toLowerCase();
                var combined = (first + '.' + last).replace(/\s+/g, '');
                return combined || '';
            },
            generateRandomPassword: function () {
                return Math.random().toString(36).slice(2, 10);
            },
            submit: async function () {
                this.errorMessage = '';
                this.successMessage = '';
                if (!Array.isArray(this.classNames) || !this.classNames.length) {
                    await this.ensureClassesLoaded(true);
                }
                if (!Array.isArray(this.classNames) || !this.classNames.length) {
                    this.errorMessage = 'Classes have not been set up yet. Please configure classes in the Classes page before admitting pupils.';
                    this.validationErrors = [];
                    return;
                }
                if (!this.validate()) {
                    this.errorMessage = 'Please fill in all required fields.';
                    return;
                }
                if (!this.form.admissionNo) {
                    var generatedAdm = this.generateAdmissionNo();
                    this.form.admissionNo = generatedAdm;
                }
                var payload = this.buildPayload();
                if (!payload.studentId) {
                    var sysId = this.generateSystemPupilId();
                    payload.studentId = sysId;
                    this.form.studentId = sysId;
                }
                if (!payload.loginUsername) {
                    var username = this.buildDefaultLoginUsername(payload);
                    payload.loginUsername = username;
                    this.form.loginUsername = username;
                }
                if (!payload.loginPassword) {
                    var pwd = this.generateRandomPassword();
                    payload.loginPassword = pwd;
                    this.form.loginPassword = pwd;
                }
                this.loading = true;
                var result;
                try {
                    if (window.ShikolaPupilsApi && typeof window.ShikolaPupilsApi.createPupil === 'function') {
                        result = await window.ShikolaPupilsApi.createPupil(payload);
                    } else {
                        result = { success: true, pupil: payload, source: 'local' };
                    }
                } catch (e) {
                    result = { success: false, error: 'Unexpected error while saving pupil.' };
                }
                this.loading = false;
                if (!result || !result.success) {
                    this.errorMessage = (result && result.error) || 'Unable to save pupil.';
                    return;
                }
                var saved = result.pupil || payload;
                this.successMessage = 'Pupil saved successfully.';
                if (window.showNotification) {
                    window.showNotification('Pupil ' + (saved.fullName || '') + ' saved.', 'success');
                }
                try {
                    window.dispatchEvent(new CustomEvent('shikola:pupil-created', { detail: saved }));
                } catch (e) {
                }
                this.buildAdmissionLetter(saved);
                this.showAdmissionModal = true;
            },
            buildAdmissionLetter: function (pupil) {
                this.admissionLetterHtml = buildAdmissionLetterHtml(pupil, this.rulesHtml);
            },
            searchSiblings: async function () {
                var query = this.siblingSearchQuery;
                if (!query || !query.trim()) {
                    this.siblingSearchResults = [];
                    return;
                }
                if (window.ShikolaPupilsApi && typeof window.ShikolaPupilsApi.searchPupils === 'function') {
                    var results = await window.ShikolaPupilsApi.searchPupils(query);
                    if (Array.isArray(results)) {
                        this.siblingSearchResults = results;
                        return;
                    }
                }
                if (window.ShikolaPupilsStore && typeof window.ShikolaPupilsStore.search === 'function') {
                    this.siblingSearchResults = window.ShikolaPupilsStore.search(query);
                }
            },
            toggleSibling: function (pupil) {
                var id = pupil.id;
                if (!id) return;
                var index = this.linkedSiblings.findIndex(function (s) { return s.id === id; });
                if (index === -1) {
                    this.linkedSiblings.push({
                        id: id,
                        name: pupil.fullName || pupil.name || '',
                        admissionNo: pupil.admissionNo || pupil.admissionNoFallback || ''
                    });
                } else {
                    this.linkedSiblings.splice(index, 1);
                }
            },
            isSiblingSelected: function (id) {
                return this.linkedSiblings.some(function (s) { return s.id === id; });
            },
            removeSibling: function (id) {
                var index = this.linkedSiblings.findIndex(function (s) { return s.id === id; });
                if (index !== -1) {
                    this.linkedSiblings.splice(index, 1);
                }
            },
            closeAdmissionModal: function () {
                this.showAdmissionModal = false;
            },
            printAdmissionForm: function () {
                try {
                    var body = document.body;
                    if (!body) {
                        window.print();
                        return;
                    }
                    body.classList.add('print-admission-form');
                    var cleanup = function () {
                        body.classList.remove('print-admission-form');
                        try {
                            window.removeEventListener('afterprint', cleanup);
                        } catch (e) {
                        }
                    };
                    try {
                        window.addEventListener('afterprint', cleanup);
                    } catch (e) {
                    }
                    window.print();
                    setTimeout(cleanup, 1000);
                } catch (e) {
                    try {
                        window.print();
                    } catch (e2) {
                    }
                }
            }
        };
    };

    window.pupilStatusManager = function () {
        return {
            loading: false,
            errorMessage: '',
            successMessage: '',
            classOptions: [],
            selectedClass: '',
            selectedStatus: '',
            history: [],
            init: async function () {
                this.loadClassOptions();
                await this.ensureClassesLoaded(false);
                this.loadClassOptions();
                this.setupClassListeners();
            },
            setupClassListeners: function () {
                var self = this;
                try {
                    window.addEventListener('shikola:classes-updated', function () {
                        self.loadClassOptions();
                    });
                } catch (e) {
                }
            },
            ensureClassesLoaded: async function (force) {
                try {
                    await syncClassesIfPossible(!!force);
                } catch (e) {
                }
            },
            loadClassOptions: function () {
                this.classOptions = listConfiguredClassNames();
            },
            applyStatus: async function () {
                this.errorMessage = '';
                this.successMessage = '';
                var cls = (this.selectedClass || '').trim();
                var status = (this.selectedStatus || '').trim();
                if (!cls || !status) {
                    this.errorMessage = 'Please select a class and status before applying.';
                    return;
                }
                this.loading = true;
                var pupils = [];
                try {
                    if (window.ShikolaPupilsApi && typeof window.ShikolaPupilsApi.listPupils === 'function') {
                        pupils = await window.ShikolaPupilsApi.listPupils();
                    } else if (window.ShikolaPupilsApi && typeof window.ShikolaPupilsApi.getLocalPupils === 'function') {
                        pupils = window.ShikolaPupilsApi.getLocalPupils() || [];
                    } else if (window.ShikolaPupilsStore && typeof window.ShikolaPupilsStore.list === 'function') {
                        pupils = window.ShikolaPupilsStore.list() || [];
                    }
                } catch (e) {
                    pupils = [];
                }
                pupils = Array.isArray(pupils) ? pupils : [];

                var clsLower = cls.toLowerCase();
                var updatedCount = 0;
                for (var i = 0; i < pupils.length; i++) {
                    var p = pupils[i];
                    if (!p) continue;
                    var classLabel = (p.classGrade || p.classLabel || '').trim();
                    if (!classLabel) continue;
                    if (classLabel.toLowerCase() !== clsLower) continue;

                    var updated = Object.assign({}, p, { status: status });
                    pupils[i] = updated;
                    try {
                        if (window.ShikolaPupilsApi) {
                            if (typeof window.ShikolaPupilsApi.updatePupil === 'function') {
                                await window.ShikolaPupilsApi.updatePupil(updated);
                            } else if (typeof window.ShikolaPupilsApi.saveLocalPupil === 'function') {
                                window.ShikolaPupilsApi.saveLocalPupil(updated);
                            }
                        }
                    } catch (e2) {
                    }
                    updatedCount++;
                }

                if (updatedCount === 0) {
                    this.errorMessage = 'No pupils found in the selected class.';
                    this.loading = false;
                    return;
                }

                this.successMessage = 'Updated ' + updatedCount + ' pupil(s) in ' + cls + ' to ' + status + '.';
                try {
                    var now = new Date();
                    var item = {
                        id: 'STATUS-' + now.getTime().toString(36) + '-' + Math.random().toString(36).slice(2, 6),
                        summary: cls + ' → ' + status,
                        details: 'Affected pupils: ' + updatedCount,
                        time: now.toLocaleString()
                    };
                    this.history = [item].concat(this.history || []).slice(0, 15);
                } catch (e3) {
                }

                try {
                    window.dispatchEvent(new CustomEvent('shikola:pupils-updated', { detail: { reason: 'status-bulk', className: cls, status: status } }));
                } catch (e4) {
                }

                this.loading = false;
            }
        };
    };

    window.pupilFamilies = function () {
        return {
            families: [],
            pupils: [],
            loading: false,
            errorMessage: '',
            showForm: false,
            familyForm: {
                id: '',
                familyName: '',
                guardianName: '',
                guardianPhone: '',
                notes: ''
            },
            searchQuery: '',
            init: async function () {
                this.loadFamilies();
                await this.loadPupils();
            },
            loadFamilies: function () {
                try {
                    if (window.ShikolaFamiliesStore && typeof window.ShikolaFamiliesStore.listFamilies === 'function') {
                        var list = window.ShikolaFamiliesStore.listFamilies();
                        this.families = Array.isArray(list) ? list : [];
                    } else {
                        this.families = [];
                    }
                } catch (e) {
                    this.families = [];
                }
            },
            loadPupils: async function () {
                this.loading = true;
                this.errorMessage = '';
                var list = [];
                try {
                    if (window.ShikolaPupilsApi && typeof window.ShikolaPupilsApi.listPupils === 'function') {
                        list = await window.ShikolaPupilsApi.listPupils();
                    } else if (window.ShikolaPupilsApi && typeof window.ShikolaPupilsApi.getLocalPupils === 'function') {
                        list = window.ShikolaPupilsApi.getLocalPupils() || [];
                    } else if (window.ShikolaPupilsStore && typeof window.ShikolaPupilsStore.list === 'function') {
                        list = window.ShikolaPupilsStore.list() || [];
                    }
                } catch (e) {
                    this.errorMessage = this.errorMessage || 'Unable to load pupils while computing family summaries.';
                }
                this.pupils = Array.isArray(list) ? list : [];
                this.loading = false;
            },
            startCreate: function () {
                this.familyForm.id = '';
                this.familyForm.familyName = '';
                this.familyForm.guardianName = '';
                this.familyForm.guardianPhone = '';
                this.familyForm.notes = '';
                this.showForm = true;
                this.errorMessage = '';
            },
            editFamily: function (fam) {
                if (!fam) return;
                this.familyForm.id = fam.id || '';
                this.familyForm.familyName = fam.familyName || '';
                this.familyForm.guardianName = fam.guardianName || '';
                this.familyForm.guardianPhone = fam.guardianPhone || '';
                this.familyForm.notes = fam.notes || '';
                this.showForm = true;
                this.errorMessage = '';
            },
            cancelForm: function () {
                this.showForm = false;
                this.errorMessage = '';
            },
            saveFamily: function () {
                var f = this.familyForm || {};
                var name = (f.familyName || '').trim();
                if (!name) {
                    this.errorMessage = 'Family name is required.';
                    return;
                }
                var payload = {
                    id: f.id,
                    familyName: name,
                    guardianName: (f.guardianName || '').trim(),
                    guardianPhone: (f.guardianPhone || '').trim(),
                    notes: (f.notes || '').trim(),
                    createdAt: f.createdAt || ''
                };
                var list = this.families;
                try {
                    if (window.ShikolaFamiliesStore && typeof window.ShikolaFamiliesStore.upsertFamily === 'function') {
                        list = window.ShikolaFamiliesStore.upsertFamily(payload);
                    }
                } catch (e) {
                }
                this.families = Array.isArray(list) ? list : this.families;
                this.showForm = false;
                this.errorMessage = '';
            },
            deleteFamilyClick: function (id) {
                if (!id) return;
                try {
                    if (window.ShikolaFamiliesStore && typeof window.ShikolaFamiliesStore.deleteFamily === 'function') {
                        var list = window.ShikolaFamiliesStore.deleteFamily(id);
                        this.families = Array.isArray(list) ? list : this.families;
                    } else {
                        this.families = (this.families || []).filter(function (f) { return f && f.id !== id; });
                    }
                } catch (e) {
                }
            },
            filteredFamilies: function () {
                var list = Array.isArray(this.families) ? this.families : [];
                var q = (this.searchQuery || '').toLowerCase().trim();
                if (!q) return list;
                return list.filter(function (fam) {
                    if (!fam) return false;
                    var name = (fam.familyName || '').toLowerCase();
                    var guardian = (fam.guardianName || '').toLowerCase();
                    var phone = (fam.guardianPhone || '').toLowerCase();
                    return name.indexOf(q) !== -1 ||
                        guardian.indexOf(q) !== -1 ||
                        phone.indexOf(q) !== -1;
                });
            },
            getPupilSummary: function (fam) {
                var list = Array.isArray(this.pupils) ? this.pupils : [];
                if (!fam) return '—';
                var name = (fam.guardianName || '').toLowerCase();
                var phone = (fam.guardianPhone || '').toLowerCase();
                if (!name && !phone) return '—';
                var count = 0;
                for (var i = 0; i < list.length; i++) {
                    var p = list[i];
                    if (!p) continue;
                    var pName = (p.guardianName || '').toLowerCase();
                    var pPhone = (p.guardianPhone || '').toLowerCase();
                    if ((name && pName === name) || (phone && pPhone === phone)) {
                        count++;
                    }
                }
                if (!count) return '—';
                return count + (count === 1 ? ' pupil' : ' pupils');
            }
        };
    };

    window.pupilBulkImport = function () {
        return {
            showImportModal: false,
            importing: false,
            selectedFile: null,
            selectedFileName: '',
            targetClassGrade: '',
            summary: {
                totalRows: 0,
                imported: 0,
                duplicates: 0,
                invalid: 0,
                errors: []
            },
            expectedHeaders: [
                'Registration Number',
                'First Name',
                'Last Name',
                'Gender',
                'Date of Birth',
                'Nationality',
                'Address',
                'Class / Grade',
                'Section',
                'Academic Session (Year)',
                'Admission Date',
                'Guardian Full Name',
                'Guardian Phone Number'
            ],
            get expectedHeaderLine() {
                return this.expectedHeaders.join(',');
            },
            get templateCsv() {
                return this.expectedHeaderLine + '\n' +
                    'REG-0001,John,Banda,Male,2026-06-15,Zambian,123 Example Street,Class 1,A,2026,2026-06-15,Mary Banda,+2609XXXXXXX';
            },
            openImportModal: function () {
                this.resetState();
                this.showImportModal = true;
            },
            closeImportModal: function () {
                if (this.importing) return;
                this.showImportModal = false;
            },
            resetState: function () {
                this.importing = false;
                this.selectedFile = null;
                this.selectedFileName = '';
                this.targetClassGrade = '';
                this.summary = {
                    totalRows: 0,
                    imported: 0,
                    duplicates: 0,
                    invalid: 0,
                    errors: []
                };
            },
            downloadTemplate: function () {
                try {
                    var blob = new Blob([this.templateCsv], { type: 'text/csv;charset=utf-8;' });
                    var url = URL.createObjectURL(blob);
                    var a = document.createElement('a');
                    a.href = url;
                    a.download = 'pupils_import_template.csv';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                } catch (e) {
                }
            },
            onFileChange: function (event) {
                var file = event.target.files && event.target.files[0];
                this.selectedFile = file || null;
                this.selectedFileName = file ? file.name : '';
            },
            startImport: async function () {
                if (!this.selectedFile) {
                    this.summary.errors.push('Please choose a CSV file before starting the import.');
                    return;
                }
                this.importing = true;
                this.summary.totalRows = 0;
                this.summary.imported = 0;
                this.summary.duplicates = 0;
                this.summary.invalid = 0;
                this.summary.errors = [];
                var text;
                try {
                    text = await this.readFileAsText(this.selectedFile);
                } catch (e) {
                    this.summary.errors.push('Unable to read CSV file. Please ensure the file is not corrupted.');
                    this.importing = false;
                    return;
                }
                await this.processCsv(text || '');
                this.importing = false;
            },
            readFileAsText: function (file) {
                return new Promise(function (resolve, reject) {
                    var reader = new FileReader();
                    reader.onload = function (e) {
                        resolve(e && e.target ? String(e.target.result || '') : '');
                    };
                    reader.onerror = function () {
                        reject(reader.error || new Error('Unable to read file'));
                    };
                    reader.readAsText(file, 'UTF-8');
                });
            },
            processCsv: async function (text) {
                var content = String(text || '');
                if (!content.trim()) {
                    this.summary.errors.push('CSV file appears to be empty.');
                    return;
                }
                var lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
                if (!lines.length) {
                    this.summary.errors.push('CSV file appears to be empty.');
                    return;
                }
                var headerLine = lines[0].trim();
                if (headerLine !== this.expectedHeaderLine) {
                    this.summary.errors.push('CSV header row does not match the expected template. Please download the template and ensure the first row is unchanged.');
                    return;
                }
                var existingRegs = {};
                try {
                    if (window.ShikolaPupilsApi && typeof window.ShikolaPupilsApi.getLocalPupils === 'function') {
                        var existingList = window.ShikolaPupilsApi.getLocalPupils() || [];
                        for (var i = 0; i < existingList.length; i++) {
                            var r = existingList[i] && existingList[i].registrationNo;
                            if (r) {
                                existingRegs[String(r)] = true;
                            }
                        }
                    }
                } catch (e) {
                }
                var seenInFile = {};
                var dateRegex = /^\d{4}-\d{2}-\d{2}$/;
                this.summary.totalRows = Math.max(0, lines.length - 1);
                for (var lineIndex = 1; lineIndex < lines.length; lineIndex++) {
                    var line = lines[lineIndex];
                    if (!line || !line.trim()) {
                        continue;
                    }
                    var cols = line.split(',');
                    if (cols.length < this.expectedHeaders.length) {
                        this.summary.invalid++;
                        this.summary.errors.push('Row ' + (lineIndex + 1) + ': not enough columns.');
                        continue;
                    }
                    for (var c = 0; c < cols.length; c++) {
                        cols[c] = cols[c].trim();
                    }
                    var registrationNo = cols[0];
                    var firstName = cols[1];
                    var lastName = cols[2];
                    var gender = cols[3];
                    var dob = cols[4];
                    var nationality = cols[5];
                    var address = cols[6];
                    var classGrade = cols[7];
                    var section = cols[8];
                    var sessionYear = cols[9];
                    var admissionDate = cols[10];
                    var guardianName = cols[11];
                    var guardianPhone = cols[12];
                    if (!registrationNo) {
                        this.summary.invalid++;
                        this.summary.errors.push('Row ' + (lineIndex + 1) + ': Registration Number is required.');
                        continue;
                    }
                    if (existingRegs[registrationNo] || seenInFile[registrationNo]) {
                        this.summary.duplicates++;
                        continue;
                    }
                    if (dob && !dateRegex.test(dob)) {
                        this.summary.invalid++;
                        this.summary.errors.push('Row ' + (lineIndex + 1) + ': Date of Birth must use format YYYY-MM-DD (e.g. 2026-06-15).');
                        continue;
                    }
                    if (admissionDate && !dateRegex.test(admissionDate)) {
                        this.summary.invalid++;
                        this.summary.errors.push('Row ' + (lineIndex + 1) + ': Admission Date must use format YYYY-MM-DD (e.g. 2026-06-15).');
                        continue;
                    }
                    seenInFile[registrationNo] = true;
                    var overrideClass = (this.targetClassGrade || '').trim();
                    var effectiveClassGrade = overrideClass || classGrade;
                    var fullName = (firstName || '') + ' ' + (lastName || '');
                    var payload = {
                        firstName: firstName,
                        lastName: lastName,
                        fullName: fullName.trim(),
                        gender: gender,
                        dob: dob,
                        nationality: nationality,
                        address: address,
                        classGrade: effectiveClassGrade,
                        section: section,
                        sessionYear: sessionYear,
                        admissionDate: admissionDate,
                        guardianName: guardianName,
                        guardianPhone: guardianPhone,
                        registrationNo: registrationNo,
                        status: 'Active'
                    };
                    var result;
                    try {
                        if (window.ShikolaPupilsApi && typeof window.ShikolaPupilsApi.createPupil === 'function') {
                            result = await window.ShikolaPupilsApi.createPupil(payload);
                        } else {
                            result = { success: true, pupil: payload, source: 'local' };
                        }
                    } catch (e) {
                        result = { success: false, error: 'Unexpected error while importing this row.' };
                    }
                    if (!result || !result.success) {
                        this.summary.invalid++;
                        this.summary.errors.push('Row ' + (lineIndex + 1) + ': ' + ((result && result.error) || 'Unable to import pupil.'));
                        continue;
                    }
                    this.summary.imported++;
                    try {
                        var saved = result.pupil || payload;
                        window.dispatchEvent(new CustomEvent('shikola:pupil-created', { detail: saved }));
                    } catch (e) {
                    }
                }
            }
        };
    };

    window.pupilAdmissionLetterTool = function () {
        return {
            searchQuery: '',
            searchResults: [],
            selectedPupil: null,
            loading: false,
            rulesHtml: '',
            admissionLetterHtml: '',
            showPreviewModal: false,
            errorMessage: '',
            init: function () {
                this.loadRules();
            },
            loadRules: function () {
                try {
                    var stored = localStorage.getItem('shikola_rules_regulations_html');
                    if (stored) {
                        this.rulesHtml = stored;
                    }
                } catch (e) {
                    this.rulesHtml = '';
                }
            },
            onSearchInput: function () {
                var q = this.searchQuery;
                this.errorMessage = '';
                if (!q || !q.trim()) {
                    this.searchResults = [];
                    this.selectedPupil = null;
                    return;
                }
                this.performSearch(q);
            },
            performSearch: async function (query) {
                this.loading = true;
                var results = [];
                try {
                    if (window.ShikolaPupilsApi && typeof window.ShikolaPupilsApi.searchPupils === 'function') {
                        results = await window.ShikolaPupilsApi.searchPupils(query);
                    } else if (window.ShikolaPupilsStore && typeof window.ShikolaPupilsStore.search === 'function') {
                        results = window.ShikolaPupilsStore.search(query);
                    }
                } catch (e) {
                    results = [];
                }
                if (!Array.isArray(results)) {
                    results = [];
                }
                this.searchResults = results;
                this.loading = false;
            },
            selectPupil: function (pupil) {
                this.selectedPupil = pupil;
                var label = (pupil.fullName || pupil.name || '') + (pupil.admissionNo ? ' • ' + pupil.admissionNo : '');
                this.searchQuery = label.trim();
                this.searchResults = [];
                this.errorMessage = '';
            },
            clearSelection: function () {
                this.selectedPupil = null;
                this.searchQuery = '';
                this.searchResults = [];
                this.errorMessage = '';
            },
            previewLetter: function () {
                this.errorMessage = '';
                if (!this.selectedPupil) {
                    this.errorMessage = 'Please select a pupil from the list before previewing the admission letter.';
                    return;
                }
                this.admissionLetterHtml = buildAdmissionLetterHtml(this.selectedPupil, this.rulesHtml);
                if (!this.admissionLetterHtml) {
                    this.errorMessage = 'Unable to build admission letter for the selected pupil.';
                    return;
                }
                this.showPreviewModal = true;
            },
            closePreviewModal: function () {
                this.showPreviewModal = false;
            }
        };
    };

    window.pupilIdCards = function () {
        return {
            loading: false,
            errorMessage: '',
            pupils: [],
            classOptions: [],
            classFilter: '',
            statusFilter: 'active',
            layout: 'standard-a4',
            schoolName: '',
            schoolAddress: '',
            schoolPhone: '',
            init: async function () {
                this.loadClassOptions();
                await this.ensureClassesLoaded(false);
                this.loadClassOptions();
                await this.loadPupils();
                this.loadSchoolProfile();
                this.setupClassListeners();
            },
            setupClassListeners: function () {
                var self = this;
                try {
                    window.addEventListener('shikola:classes-updated', function () {
                        self.loadClassOptions();
                    });
                } catch (e) {
                }
            },
            ensureClassesLoaded: async function (force) {
                try {
                    await syncClassesIfPossible(!!force);
                } catch (e) {
                }
            },
            loadClassOptions: function () {
                this.classOptions = listConfiguredClassNames();
            },
            loadPupils: async function () {
                this.loading = true;
                this.errorMessage = '';
                var list = [];
                try {
                    if (window.ShikolaPupilsApi && typeof window.ShikolaPupilsApi.listPupils === 'function') {
                        list = await window.ShikolaPupilsApi.listPupils();
                    } else if (window.ShikolaPupilsApi && typeof window.ShikolaPupilsApi.getLocalPupils === 'function') {
                        list = window.ShikolaPupilsApi.getLocalPupils() || [];
                    } else if (window.ShikolaPupilsStore && typeof window.ShikolaPupilsStore.list === 'function') {
                        list = window.ShikolaPupilsStore.list() || [];
                    }
                } catch (e) {
                    this.errorMessage = 'Unable to load pupils for ID cards.';
                }
                this.pupils = Array.isArray(list) ? list : [];
                this.loading = false;
            },
            loadSchoolProfile: function () {
                try {
                    if (window.ShikolaSchoolProfile && typeof window.ShikolaSchoolProfile.getProfile === 'function') {
                        var profile = window.ShikolaSchoolProfile.getProfile() || {};
                        this.schoolName = profile.name || '';
                        this.schoolAddress = profile.address || '';
                        this.schoolPhone = profile.phone || '';
                    }
                } catch (e) {
                }
            },
            get filteredPupils() {
                var list = Array.isArray(this.pupils) ? this.pupils : [];
                var cls = (this.classFilter || '').toLowerCase();
                var statusFilter = this.statusFilter || 'active';
                var filtered = list.filter(function (p) {
                    var classLabel = (p.classGrade || p.classLabel || '').toLowerCase();
                    var status = (p.status || 'Active').toLowerCase();
                    if (cls && classLabel !== cls) {
                        return false;
                    }
                    if (statusFilter === 'active' && status !== 'active') {
                        return false;
                    }
                    return true;
                });
                return filtered.slice(0, 18);
            },
            buildQrValue: function (pupil) {
                if (!pupil) return '';
                var id = pupil.id || pupil.admissionNo || pupil.registrationNo;
                if (!id) return '';
                return String(id);
            },
            buildQrDataUrl: function (pupil) {
                var value = this.buildQrValue(pupil);
                if (!value || typeof QRious === 'undefined') return '';
                try {
                    var canvas = document.createElement('canvas');
                    // small square QR suitable for ID cards
                    var qr = new QRious({
                        element: canvas,
                        value: value,
                        size: 96,
                        level: 'M'
                    });
                    return canvas.toDataURL('image/png');
                } catch (e) {
                    return '';
                }
            },
            printCards: function () {
                try {
                    window.print();
                } catch (e) {
                }
            }
        };
    };

    window.pupilManageLogin = function () {
        return {
            loading: false,
            errorMessage: '',
            pupils: [],
            classOptions: [],
            classFilter: '',
            searchQuery: '',
            selectedPupil: null,
            username: '',
            password: '',
            showPassword: false,
            init: async function () {
                this.loadClassOptions();
                await this.ensureClassesLoaded(false);
                this.loadClassOptions();
                await this.loadPupils();
                this.setupClassListeners();
            },
            setupClassListeners: function () {
                var self = this;
                try {
                    window.addEventListener('shikola:classes-updated', function () {
                        self.loadClassOptions();
                    });
                } catch (e) {
                }
            },
            ensureClassesLoaded: async function (force) {
                try {
                    await syncClassesIfPossible(!!force);
                } catch (e) {
                }
            },
            loadClassOptions: function () {
                this.classOptions = listConfiguredClassNames();
            },
            loadPupils: async function () {
                this.loading = true;
                this.errorMessage = '';
                var list = [];
                try {
                    if (window.ShikolaPupilsApi && typeof window.ShikolaPupilsApi.listPupils === 'function') {
                        list = await window.ShikolaPupilsApi.listPupils();
                    } else if (window.ShikolaPupilsApi && typeof window.ShikolaPupilsApi.getLocalPupils === 'function') {
                        list = window.ShikolaPupilsApi.getLocalPupils() || [];
                    } else if (window.ShikolaPupilsStore && typeof window.ShikolaPupilsStore.list === 'function') {
                        list = window.ShikolaPupilsStore.list() || [];
                    }
                } catch (e) {
                    this.errorMessage = 'Unable to load pupils for login management.';
                }
                this.pupils = Array.isArray(list) ? list : [];
                this.loading = false;
            },
            get filteredPupils() {
                var list = Array.isArray(this.pupils) ? this.pupils : [];
                var cls = (this.classFilter || '').toLowerCase();
                var q = (this.searchQuery || '').toLowerCase().trim();
                if (cls) {
                    list = list.filter(function (p) {
                        var classLabel = (p.classGrade || p.classLabel || '').toLowerCase();
                        return classLabel === cls;
                    });
                }
                if (q) {
                    list = list.filter(function (p) {
                        var name = (p.fullName || ((p.firstName || '') + ' ' + (p.lastName || ''))).toLowerCase();
                        var admission = (p.admissionNo || p.admissionNoFallback || '').toLowerCase();
                        var username = (p.loginUsername || '').toLowerCase();
                        return name.indexOf(q) !== -1 ||
                            admission.indexOf(q) !== -1 ||
                            username.indexOf(q) !== -1;
                    });
                }
                return list;
            },
            buildDefaultUsername: function (pupil) {
                if (!pupil) return '';
                var admission = pupil.admissionNo || pupil.admissionNoFallback || pupil.registrationNo || pupil.studentId;
                if (admission) return String(admission);
                var first = (pupil.firstName || '').toLowerCase();
                var last = (pupil.lastName || '').toLowerCase();
                var combined = (first + '.' + last).replace(/\s+/g, '');
                return combined || '';
            },
            selectPupil: function (pupil) {
                if (!pupil) return;
                this.selectedPupil = pupil;
                this.username = pupil.loginUsername || this.buildDefaultUsername(pupil) || '';
                this.password = pupil.loginPassword || '';
                this.showPassword = false;
            },
            clearSelection: function () {
                this.selectedPupil = null;
                this.username = '';
                this.password = '';
                this.showPassword = false;
            },
            togglePasswordVisibility: function () {
                this.showPassword = !this.showPassword;
            },
            generatePassword: function () {
                var token = Math.random().toString(36).slice(2, 10);
                this.password = token;
            },
            saveLogin: async function () {
                if (!this.selectedPupil) return;
                this.errorMessage = '';

                var username = (this.username || '').trim();
                var password = this.password || '';

                if (!username) {
                    this.errorMessage = 'Username is required.';
                    return;
                }
                if (!password || String(password).length < 8) {
                    this.errorMessage = 'Password must be at least 8 characters.';
                    return;
                }

                var email = username;
                if (email.indexOf('@') === -1) {
                    email = username + '@school.local';
                }
                email = String(email).trim().toLowerCase();

                var pupilName = (this.selectedPupil.fullName || ((this.selectedPupil.firstName || '') + ' ' + (this.selectedPupil.lastName || ''))).trim();
                if (!pupilName) {
                    pupilName = email.split('@')[0] || 'Pupil';
                }

                this.loading = true;
                var createdAccount = null;
                try {
                    if (window.ShikolaAPI && typeof window.ShikolaAPI.post === 'function') {
                        var createRes = await window.ShikolaAPI.post('/api/admin/accounts', {
                            email: email,
                            password: password,
                            role: 'pupil',
                            fullName: pupilName,
                            pupilId: this.selectedPupil.id
                        });
                        if (createRes && createRes.success) {
                            createdAccount = createRes.data;
                        } else if (createRes && createRes.status === 409) {
                            var listRes = await window.ShikolaAPI.get('/api/admin/accounts', { q: email, limit: 25, offset: 0 });
                            var matches = listRes && listRes.success && listRes.data && Array.isArray(listRes.data.data)
                                ? listRes.data.data
                                : [];
                            var found = null;
                            for (var m = 0; m < matches.length; m++) {
                                if (matches[m] && String(matches[m].email || '').toLowerCase() === email) {
                                    found = matches[m];
                                    break;
                                }
                            }
                            if (found && found.id) {
                                var resetRes = await window.ShikolaAPI.post('/api/admin/accounts/' + encodeURIComponent(found.id) + '/reset-password', {
                                    password: password
                                });
                                if (resetRes && resetRes.success) {
                                    createdAccount = found;
                                } else {
                                    throw new Error((resetRes && resetRes.error) || 'Unable to reset password');
                                }
                            } else {
                                throw new Error('Account already exists but could not be resolved');
                            }
                        } else {
                            throw new Error((createRes && createRes.error) || 'Unable to create account');
                        }
                    }
                } catch (e) {
                    this.errorMessage = (e && e.message) ? e.message : 'Unable to create login.';
                }

                var updated = Object.assign({}, this.selectedPupil, {
                    loginUsername: username,
                    loginPassword: password,
                    loginEmail: email,
                    accountId: createdAccount && createdAccount.id ? createdAccount.id : (this.selectedPupil.accountId || '')
                });

                this.selectedPupil = updated;
                var list = Array.isArray(this.pupils) ? this.pupils : [];
                var replaced = false;
                for (var i = 0; i < list.length; i++) {
                    if (list[i] && updated && list[i].id === updated.id) {
                        list[i] = updated;
                        replaced = true;
                        break;
                    }
                }
                if (!replaced && updated) {
                    list.push(updated);
                }
                this.pupils = list;

                try {
                    if (window.ShikolaPupilsApi) {
                        if (typeof window.ShikolaPupilsApi.updatePupil === 'function') {
                            window.ShikolaPupilsApi.updatePupil(updated).catch(function () {
                                if (typeof window.ShikolaPupilsApi.saveLocalPupil === 'function') {
                                    window.ShikolaPupilsApi.saveLocalPupil(updated);
                                }
                            });
                        } else if (typeof window.ShikolaPupilsApi.saveLocalPupil === 'function') {
                            window.ShikolaPupilsApi.saveLocalPupil(updated);
                        }
                    }
                } catch (err) {
                }

                this.loading = false;

                if (createdAccount && createdAccount.id) {
                    if (window.showNotification) {
                        try {
                            window.showNotification('Login updated for ' + (updated.fullName || '') + ' (' + email + ')', 'success');
                        } catch (e2) {
                        }
                    }
                } else {
                    if (window.showNotification) {
                        try {
                            window.showNotification('Login updated locally for ' + (updated.fullName || ''), 'success');
                        } catch (e3) {
                        }
                    }
                }
            }
        };
    };

    window.pupilPromote = function () {
        return {
            loading: false,
            errorMessage: '',
            pupils: [],
            classOptions: [],
            fromClass: '',
            toClass: '',
            academicYear: '',
            selectedKeys: [],
            promotionSummary: '',
            init: async function () {
                this.loadClassOptions();
                await this.ensureClassesLoaded(false);
                this.loadClassOptions();
                await this.loadPupils();
                this.setupClassListeners();
            },
            setupClassListeners: function () {
                var self = this;
                try {
                    window.addEventListener('shikola:classes-updated', function () {
                        self.loadClassOptions();
                    });
                } catch (e) {
                }
            },
            ensureClassesLoaded: async function (force) {
                try {
                    await syncClassesIfPossible(!!force);
                } catch (e) {
                }
            },
            loadClassOptions: function () {
                this.classOptions = listConfiguredClassNames();
            },
            loadPupils: async function () {
                this.loading = true;
                this.errorMessage = '';
                var list = [];
                try {
                    if (window.ShikolaPupilsApi && typeof window.ShikolaPupilsApi.listPupils === 'function') {
                        list = await window.ShikolaPupilsApi.listPupils();
                    } else if (window.ShikolaPupilsApi && typeof window.ShikolaPupilsApi.getLocalPupils === 'function') {
                        list = window.ShikolaPupilsApi.getLocalPupils() || [];
                    } else if (window.ShikolaPupilsStore && typeof window.ShikolaPupilsStore.list === 'function') {
                        list = window.ShikolaPupilsStore.list() || [];
                    }
                } catch (e) {
                    this.errorMessage = 'Unable to load pupils for promotion.';
                }
                this.pupils = Array.isArray(list) ? list : [];
                this.loading = false;
            },
            get pupilsInFromClass() {
                var list = Array.isArray(this.pupils) ? this.pupils : [];
                var fromCls = (this.fromClass || '').toLowerCase();
                if (!fromCls) return [];
                return list.filter(function (p) {
                    var classLabel = (p.classGrade || p.classLabel || '').toLowerCase();
                    return classLabel === fromCls;
                });
            },
            getKey: function (pupil) {
                if (!pupil) return '';
                var key = pupil.id || pupil.admissionNo || pupil.admissionNoFallback || pupil.registrationNo;
                if (!key) {
                    key = (pupil.firstName || '') + '-' + (pupil.lastName || '');
                }
                return String(key);
            },
            isSelected: function (pupil) {
                var key = this.getKey(pupil);
                return !!key && this.selectedKeys.indexOf(key) !== -1;
            },
            toggleSelectAll: function () {
                var list = this.pupilsInFromClass;
                if (!list.length) {
                    this.selectedKeys = [];
                    return;
                }
                var allSelected = true;
                for (var i = 0; i < list.length; i++) {
                    if (!this.isSelected(list[i])) {
                        allSelected = false;
                        break;
                    }
                }
                if (allSelected) {
                    this.selectedKeys = [];
                } else {
                    var keys = [];
                    for (var j = 0; j < list.length; j++) {
                        var k = this.getKey(list[j]);
                        if (k) keys.push(k);
                    }
                    this.selectedKeys = keys;
                }
            },
            toggleSelect: function (pupil) {
                var key = this.getKey(pupil);
                if (!key) return;
                var idx = this.selectedKeys.indexOf(key);
                if (idx === -1) {
                    this.selectedKeys.push(key);
                } else {
                    this.selectedKeys.splice(idx, 1);
                }
            },
            scrollToList: function () {
                try {
                    var el = document.getElementById('promote-pupils-list');
                    if (el && typeof el.scrollIntoView === 'function') {
                        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                } catch (e) {
                }
            },
            applyPromotion: function () {
                this.errorMessage = '';
                this.promotionSummary = '';
                var fromCls = (this.fromClass || '').trim();
                var toCls = (this.toClass || '').trim();
                if (!fromCls || !toCls) {
                    this.errorMessage = 'Please choose both From Class and To Class before applying promotion.';
                    return;
                }
                if (fromCls === toCls) {
                    this.errorMessage = 'From Class and To Class cannot be the same.';
                    return;
                }
                var year = (this.academicYear || '').trim();
                var list = Array.isArray(this.pupils) ? this.pupils : [];
                var useSelection = this.selectedKeys && this.selectedKeys.length > 0;
                var count = 0;
                for (var i = 0; i < list.length; i++) {
                    var p = list[i];
                    if (!p) continue;
                    var classLabel = p.classGrade || p.classLabel || '';
                    if (String(classLabel) !== fromCls) continue;
                    if (useSelection && !this.isSelected(p)) continue;
                    var updated = Object.assign({}, p, {
                        classGrade: toCls,
                        classLabel: toCls
                    });
                    if (year) {
                        updated.sessionYear = year;
                    }
                    list[i] = updated;
                    try {
                        if (window.ShikolaPupilsApi) {
                            if (typeof window.ShikolaPupilsApi.updatePupil === 'function') {
                                window.ShikolaPupilsApi.updatePupil(updated).catch(function () {
                                    if (typeof window.ShikolaPupilsApi.saveLocalPupil === 'function') {
                                        window.ShikolaPupilsApi.saveLocalPupil(updated);
                                    }
                                });
                            } else if (typeof window.ShikolaPupilsApi.saveLocalPupil === 'function') {
                                window.ShikolaPupilsApi.saveLocalPupil(updated);
                            }
                        }
                    } catch (e) {
                    }
                    count++;
                }
                this.pupils = list;
                this.selectedKeys = [];
                if (count === 0) {
                    this.errorMessage = 'No pupils found to promote for the selected class and filters.';
                    return;
                }
                this.promotionSummary = 'Promoted ' + count + ' pupil(s) from ' + fromCls + ' to ' + toCls + (year ? (' for academic year ' + year) : '') + '.';
            }
        };
    };

    window.pupilPrintBasicList = function () {
        return {
            loading: false,
            errorMessage: '',
            pupils: [],
            classOptions: [],
            classFilter: '',
            sortBy: 'admissionNo',
            includeFields: 'basic',
            init: async function () {
                this.loadClassOptions();
                await this.ensureClassesLoaded(false);
                this.loadClassOptions();
                await this.loadPupils();
                this.setupClassListeners();
            },
            setupClassListeners: function () {
                var self = this;
                try {
                    window.addEventListener('shikola:classes-updated', function () {
                        self.loadClassOptions();
                    });
                } catch (e) {
                }
            },
            ensureClassesLoaded: async function (force) {
                try {
                    await syncClassesIfPossible(!!force);
                } catch (e) {
                }
            },
            loadClassOptions: function () {
                this.classOptions = listConfiguredClassNames();
            },
            loadPupils: async function () {
                this.loading = true;
                this.errorMessage = '';
                var list = [];
                try {
                    if (window.ShikolaPupilsApi && typeof window.ShikolaPupilsApi.listPupils === 'function') {
                        list = await window.ShikolaPupilsApi.listPupils();
                    } else if (window.ShikolaPupilsApi && typeof window.ShikolaPupilsApi.getLocalPupils === 'function') {
                        list = window.ShikolaPupilsApi.getLocalPupils() || [];
                    } else if (window.ShikolaPupilsStore && typeof window.ShikolaPupilsStore.list === 'function') {
                        list = window.ShikolaPupilsStore.list() || [];
                    }
                } catch (e) {
                    this.errorMessage = 'Unable to load pupils for basic list.';
                }
                this.pupils = Array.isArray(list) ? list : [];
                this.loading = false;
            },
            get filteredPupils() {
                var list = Array.isArray(this.pupils) ? this.pupils.slice() : [];
                var cls = (this.classFilter || '').toLowerCase();
                if (cls) {
                    list = list.filter(function (p) {
                        var classLabel = (p.classGrade || p.classLabel || '').toLowerCase();
                        return classLabel === cls;
                    });
                }
                var sortKey = this.sortBy || 'admissionNo';
                list.sort(function (a, b) {
                    function safe(str) {
                        return (str || '').toString().toLowerCase();
                    }
                    if (sortKey === 'name') {
                        var aName = safe(a.fullName || ((a.firstName || '') + ' ' + (a.lastName || '')));
                        var bName = safe(b.fullName || ((b.firstName || '') + ' ' + (b.lastName || '')));
                        if (aName < bName) return -1;
                        if (aName > bName) return 1;
                        return 0;
                    }
                    if (sortKey === 'gender') {
                        var aGender = safe(a.gender);
                        var bGender = safe(b.gender);
                        if (aGender < bGender) return -1;
                        if (aGender > bGender) return 1;
                        return 0;
                    }
                    var aAdm = safe(a.admissionNo || a.admissionNoFallback || a.registrationNo);
                    var bAdm = safe(b.admissionNo || b.admissionNoFallback || b.registrationNo);
                    if (aAdm < bAdm) return -1;
                    if (aAdm > bAdm) return 1;
                    return 0;
                });
                return list;
            },
            scrollToTable: function () {
                try {
                    var el = document.getElementById('basic-list-table');
                    if (el && typeof el.scrollIntoView === 'function') {
                        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                } catch (e) {
                }
            },
            printList: function () {
                try {
                    window.print();
                } catch (e) {
                }
            }
        };
    };

    function setupAllPupilsGrid() {
        try {
            var container = document.getElementById('pupils-table-body');
            if (!container) return;
            var allPupils = [];
            var currentQuery = '';
            var currentClassFilter = '';
            var currentStatusFilter = '';
            var currentPupilIndex = null;

            var classFilterEl = document.getElementById('pupils-filter-class');
            var statusFilterEl = document.getElementById('pupils-filter-status');

            function ensureStatusOptions() {
                if (!statusFilterEl) return;
                try {
                    if (statusFilterEl.querySelectorAll('option').length > 1) return;
                    var opts = [
                        { value: 'active', label: 'Active' },
                        { value: 'inactive', label: 'Inactive' },
                        { value: 'transferred', label: 'Transferred' },
                        { value: 'graduated', label: 'Graduated' }
                    ];
                    for (var i = 0; i < opts.length; i++) {
                        var o = document.createElement('option');
                        o.value = opts[i].value;
                        o.textContent = opts[i].label;
                        statusFilterEl.appendChild(o);
                    }
                } catch (e) {
                }
            }

            function populateClassFilterOptions() {
                if (!classFilterEl) return;
                try {
                    var keep = classFilterEl.querySelector('option[value=""]');
                    classFilterEl.innerHTML = '';
                    if (keep) {
                        classFilterEl.appendChild(keep);
                    } else {
                        var defaultOpt = document.createElement('option');
                        defaultOpt.value = '';
                        defaultOpt.textContent = 'All Classes';
                        classFilterEl.appendChild(defaultOpt);
                    }
                    var classes = listConfiguredClassNames();
                    for (var i = 0; i < classes.length; i++) {
                        var c = classes[i];
                        var opt = document.createElement('option');
                        opt.value = c;
                        opt.textContent = c;
                        classFilterEl.appendChild(opt);
                    }
                } catch (e) {
                }
            }

            var viewModal = document.getElementById('pupil-view-modal');
            var viewBackdrop = viewModal ? viewModal.querySelector('[data-role="backdrop"]') : null;
            var viewSaveButton = viewModal ? document.getElementById('pupil-view-save') : null;
            var viewCancelButton = viewModal ? document.getElementById('pupil-view-cancel') : null;
            var viewCloseButton = viewModal ? document.getElementById('pupil-view-close') : null;

            function getInputValue(id) {
                var el = document.getElementById(id);
                if (!el) return '';
                return el.value || '';
            }

            function setInputValue(id, value) {
                var el = document.getElementById(id);
                if (!el) return;
                el.value = value == null ? '' : String(value);
            }

            function closePupilViewModal() {
                currentPupilIndex = null;
                if (viewModal) {
                    viewModal.classList.add('hidden');
                }
            }

            function openPupilViewModalByIndex(index) {
                if (!viewModal) return;
                if (index === null || index < 0 || index >= allPupils.length) return;
                currentPupilIndex = index;
                var pupil = allPupils[index] || {};
                var fullName = (pupil.fullName || ((pupil.firstName || '') + ' ' + (pupil.lastName || ''))).trim();
                var titleEl = viewModal.querySelector('[data-role="pupil-view-title"]');
                if (titleEl) {
                    titleEl.textContent = fullName || 'Pupil details';
                }
                setInputValue('pupil-view-first-name', pupil.firstName || '');
                setInputValue('pupil-view-last-name', pupil.lastName || '');
                setInputValue('pupil-view-class-grade', pupil.classGrade || pupil.classLabel || '');
                setInputValue('pupil-view-section', pupil.section || '');
                setInputValue('pupil-view-gender', pupil.gender || '');
                setInputValue('pupil-view-status', pupil.status || 'Active');
                setInputValue('pupil-view-guardian-name', pupil.guardianName || '');
                setInputValue('pupil-view-guardian-phone', pupil.guardianPhone || '');
                setInputValue('pupil-view-address', pupil.address || '');
                setInputValue('pupil-view-notes', pupil.notes || '');
                viewModal.classList.remove('hidden');
            }

            if (viewBackdrop) {
                viewBackdrop.addEventListener('click', function () {
                    closePupilViewModal();
                });
            }
            if (viewCancelButton) {
                viewCancelButton.addEventListener('click', function () {
                    closePupilViewModal();
                });
            }
            if (viewCloseButton) {
                viewCloseButton.addEventListener('click', function () {
                    closePupilViewModal();
                });
            }

            function matchesQuery(pupil, query) {
                if (!query) return true;
                var q = query.toLowerCase();
                var name = (pupil.fullName || ((pupil.firstName || '') + ' ' + (pupil.lastName || ''))).toLowerCase();
                var admission = (pupil.admissionNo || pupil.admissionNoFallback || '').toLowerCase();
                var grade = (pupil.classGrade || pupil.classLabel || '').toLowerCase();
                var parent = (pupil.guardianName || '').toLowerCase();
                return name.indexOf(q) !== -1 ||
                    admission.indexOf(q) !== -1 ||
                    grade.indexOf(q) !== -1 ||
                    parent.indexOf(q) !== -1;
            }

            function matchesClassFilter(pupil) {
                if (!currentClassFilter) return true;
                var classLabel = (pupil.classGrade || pupil.classLabel || '').trim().toLowerCase();
                return classLabel === currentClassFilter;
            }

            function matchesStatusFilter(pupil) {
                if (!currentStatusFilter) return true;
                var status = (pupil.status || 'Active').trim().toLowerCase();
                return status === currentStatusFilter;
            }

            function applyAllFilters(list) {
                var out = [];
                for (var i = 0; i < list.length; i++) {
                    var p = list[i];
                    if (!p) continue;
                    if (!matchesQuery(p, currentQuery)) continue;
                    if (!matchesClassFilter(p)) continue;
                    if (!matchesStatusFilter(p)) continue;
                    out.push(p);
                }
                return out;
            }

            function handlePupilViewSave() {
                if (currentPupilIndex === null || currentPupilIndex < 0 || currentPupilIndex >= allPupils.length) {
                    closePupilViewModal();
                    return;
                }
                var original = allPupils[currentPupilIndex] || {};
                var firstName = getInputValue('pupil-view-first-name').trim();
                var lastName = getInputValue('pupil-view-last-name').trim();
                var classGrade = getInputValue('pupil-view-class-grade').trim();
                var section = getInputValue('pupil-view-section').trim();
                var gender = getInputValue('pupil-view-gender').trim();
                var status = getInputValue('pupil-view-status').trim() || 'Active';
                var guardianName = getInputValue('pupil-view-guardian-name').trim();
                var guardianPhone = getInputValue('pupil-view-guardian-phone').trim();
                var address = getInputValue('pupil-view-address').trim();
                var notes = getInputValue('pupil-view-notes').trim();
                var fullName = (firstName + ' ' + lastName).trim();
                var updated = Object.assign({}, original, {
                    firstName: firstName || original.firstName,
                    lastName: lastName || original.lastName,
                    fullName: fullName || (original.fullName || ''),
                    classGrade: classGrade || original.classGrade,
                    classLabel: classGrade || original.classLabel,
                    section: section || original.section,
                    gender: gender || original.gender,
                    status: status || original.status,
                    guardianName: guardianName || original.guardianName,
                    guardianPhone: guardianPhone || original.guardianPhone,
                    address: address || original.address,
                    notes: notes || original.notes
                });
                allPupils[currentPupilIndex] = updated;
                try {
                    if (window.ShikolaPupilsApi) {
                        if (typeof window.ShikolaPupilsApi.updatePupil === 'function') {
                            window.ShikolaPupilsApi.updatePupil(updated).catch(function () {
                                if (typeof window.ShikolaPupilsApi.saveLocalPupil === 'function') {
                                    window.ShikolaPupilsApi.saveLocalPupil(updated);
                                }
                            });
                        } else if (typeof window.ShikolaPupilsApi.saveLocalPupil === 'function') {
                            window.ShikolaPupilsApi.saveLocalPupil(updated);
                        }
                    }
                } catch (e) {
                }
                var filtered = currentQuery ? allPupils.filter(function (p) { return matchesQuery(p, currentQuery); }) : allPupils;
                renderRows(filtered);
                closePupilViewModal();
            }

            if (viewSaveButton) {
                viewSaveButton.addEventListener('click', function () {
                    handlePupilViewSave();
                });
            }

            function renderRows(list) {
                if (!list.length) {
                    container.innerHTML = '' +
                        '<div class="px-4 py-8 text-center text-slate-400">' +
                        '<i class="fas fa-user-graduate text-4xl mb-2"></i>' +
                        '<p>No pupils found yet. Add a new pupil or import in bulk.</p>' +
                        '</div>';
                    return;
                }
                var html = '';
                for (var i = 0; i < list.length; i++) {
                    var p = list[i] || {};
                    var originalIndex = allPupils.indexOf(p);
                    var name = p.fullName || ((p.firstName || '') + ' ' + (p.lastName || ''));
                    var grade = p.classGrade || p.classLabel || '';
                    var klass = p.section || '';
                    var gender = p.gender || '';
                    var parent = p.guardianName || '';
                    var phone = p.guardianPhone || '';
                    var status = p.status || 'Active';
                    html += '' +
                        '<div class="grid grid-cols-12 px-4 py-2 items-center hover:bg-slate-50">' +
                        '<div class="col-span-3 font-medium text-slate-800">' + escapeHtml(name) + '</div>' +
                        '<div class="col-span-2 text-slate-600">' + escapeHtml(grade) + '</div>' +
                        '<div class="col-span-2 text-slate-600">' + escapeHtml(klass) + '</div>' +
                        '<div class="col-span-1 text-slate-600">' + escapeHtml(gender) + '</div>' +
                        '<div class="col-span-1 text-slate-600">' + escapeHtml(parent) + '</div>' +
                        '<div class="col-span-1 text-slate-600">' + escapeHtml(phone) + '</div>' +
                        '<div class="col-span-1 text-slate-600">' + escapeHtml(status) + '</div>' +
                        '<div class="col-span-1 text-right">' +
                        '<button type="button" class="px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600" data-action="view-pupil" data-index="' + (originalIndex >= 0 ? originalIndex : i) + '">View</button>' +
                        '</div>' +
                        '</div>';
                }
                container.innerHTML = html;
                try {
                    attachRowHandlers();
                } catch (e) {
                }
            }

            function attachRowHandlers() {
                try {
                    var buttons = container.querySelectorAll('button[data-action="view-pupil"]');
                    for (var i = 0; i < buttons.length; i++) {
                        (function (btn) {
                            btn.addEventListener('click', function () {
                                var indexAttr = btn.getAttribute('data-index');
                                var index = typeof indexAttr === 'string' ? parseInt(indexAttr, 10) : -1;
                                if (!isNaN(index) && index >= 0) {
                                    openPupilViewModalByIndex(index);
                                }
                            });
                        })(buttons[i]);
                    }
                } catch (e) {
                }
            }

            async function loadAndRender() {
                var pupils = [];
                try {
                    if (window.ShikolaPupilsApi && typeof window.ShikolaPupilsApi.listPupils === 'function') {
                        pupils = await window.ShikolaPupilsApi.listPupils();
                    } else if (window.ShikolaPupilsApi && typeof window.ShikolaPupilsApi.getLocalPupils === 'function') {
                        pupils = window.ShikolaPupilsApi.getLocalPupils() || [];
                    } else if (window.ShikolaPupilsStore && typeof window.ShikolaPupilsStore.list === 'function') {
                        pupils = window.ShikolaPupilsStore.list() || [];
                    }
                } catch (e) {
                    pupils = [];
                }
                allPupils = Array.isArray(pupils) ? pupils : [];
                try {
                    var countSpan = document.querySelector('[data-pupils-count]');
                    if (countSpan) {
                        countSpan.textContent = String(allPupils.length);
                    }
                } catch (e) {
                }
                renderRows(applyAllFilters(allPupils));
            }

            loadAndRender();

            ensureStatusOptions();
            populateClassFilterOptions();
            try {
                syncClassesIfPossible(false).then(function () {
                    populateClassFilterOptions();
                });
            } catch (e) {
            }

            if (classFilterEl) {
                classFilterEl.addEventListener('change', function (event) {
                    var v = (event.target && event.target.value) ? String(event.target.value) : '';
                    currentClassFilter = v.trim().toLowerCase();
                    renderRows(applyAllFilters(allPupils));
                });
            }
            if (statusFilterEl) {
                statusFilterEl.addEventListener('change', function (event) {
                    var v = (event.target && event.target.value) ? String(event.target.value) : '';
                    currentStatusFilter = v.trim().toLowerCase();
                    renderRows(applyAllFilters(allPupils));
                });
            }

            try {
                var searchInput = document.getElementById('pupils-search');
                if (searchInput) {
                    searchInput.addEventListener('input', function (event) {
                        currentQuery = (event.target.value || '').toLowerCase().trim();
                        renderRows(applyAllFilters(allPupils));
                    });
                }
            } catch (e) {
            }

            try {
                window.addEventListener('shikola:classes-updated', function () {
                    populateClassFilterOptions();
                });
            } catch (e) {
            }

            try {
                window.addEventListener('shikola:pupil-created', function () {
                    loadAndRender();
                });
            } catch (e) {
            }

            try {
                window.addEventListener('shikola:pupils-updated', function () {
                    loadAndRender();
                });
            } catch (e) {
            }
        } catch (e) {
        }
    }

    function registerAlpineComponents() {
        if (typeof window === 'undefined') return;
        if (!window.Alpine || typeof window.Alpine.data !== 'function') return;
        if (window.__shikolaPupilsAlpineRegistered) return;
        window.__shikolaPupilsAlpineRegistered = true;
        window.Alpine.data('pupilAdmissionForm', window.pupilAdmissionForm);
        window.Alpine.data('pupilBulkImport', window.pupilBulkImport);
        window.Alpine.data('pupilAdmissionLetterTool', window.pupilAdmissionLetterTool);
        window.Alpine.data('pupilIdCards', window.pupilIdCards);
        window.Alpine.data('pupilStatusManager', window.pupilStatusManager);
        window.Alpine.data('pupilManageLogin', window.pupilManageLogin);
        window.Alpine.data('pupilPromote', window.pupilPromote);
        window.Alpine.data('pupilPrintBasicList', window.pupilPrintBasicList);
    }

    if (typeof document !== 'undefined') {
        document.addEventListener('alpine:init', registerAlpineComponents);
        if (window.Alpine) {
            registerAlpineComponents();
        }
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setupAllPupilsGrid);
        } else {
            setupAllPupilsGrid();
        }
    }

    // Initialize real-time event listeners
    document.addEventListener('DOMContentLoaded', function() {
        if (window.shikolaRealtime) {
            // Listen for pupil updates from other users
            window.shikolaRealtime.on('pupilCreated', function(data) {
                console.log('Real-time pupil created:', data);
                // Refresh pupil lists if currently viewing
                if (window.Alpine && window.Alpine.store('pupils')) {
                    window.Alpine.store('pupils').refresh();
                }
                loadAndRender();
            });

            window.shikolaRealtime.on('pupilUpdated', function(data) {
                console.log('Real-time pupil updated:', data);
                // Update local storage
                updatePupilInLocalStorage(data.pupil);
                // Refresh UI
                loadAndRender();
            });

            window.shikolaRealtime.on('pupilDeleted', function(data) {
                console.log('Real-time pupil deleted:', data);
                // Remove from local storage
                removePupilFromLocalStorage(data.pupilId);
                // Refresh UI
                loadAndRender();
            });

            window.shikolaRealtime.on('pupilsBulkImported', function(data) {
                console.log('Real-time bulk import completed:', data);
                // Refresh all pupil data
                loadAndRender();
            });
        }
    });

    // Helper functions for local storage updates
    function updatePupilInLocalStorage(pupil) {
        try {
            var pupils = loadLocalPupils();
            var index = pupils.findIndex(function(p) { return p.id === pupil.id; });
            if (index !== -1) {
                pupils[index] = Object.assign(pupils[index], pupil);
                saveLocalPupils(pupils);
            }
        } catch (e) {
            console.warn('Failed to update pupil in local storage:', e);
        }
    }

    function removePupilFromLocalStorage(pupilId) {
        try {
            var pupils = loadLocalPupils();
            var filteredPupils = pupils.filter(function(p) { return p.id !== pupilId; });
            saveLocalPupils(filteredPupils);
        } catch (e) {
            console.warn('Failed to remove pupil from local storage:', e);
        }
    }
})();
