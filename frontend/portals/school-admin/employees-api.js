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
    var STORAGE_KEY = 'shikola_employees_v1';

    var _lastEmployeesFetchAt = 0;
    var _employeesFetchInFlight = null;
    var _employeesFetch429Until = 0;

    function isUuid(value) {
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));
    }

    function splitFullName(fullName) {
        var text = String(fullName || '').trim().replace(/\s+/g, ' ');
        if (!text) return { firstName: '', lastName: '' };
        var parts = text.split(' ');
        if (parts.length === 1) {
            return { firstName: parts[0], lastName: '' };
        }
        return {
            firstName: parts[0],
            lastName: parts.slice(1).join(' ')
        };
    }

    function deriveSystemRole(employee) {
        var dep = String(employee && employee.department || '').toLowerCase();
        var pos = String(employee && (employee.role || employee.position) || '').toLowerCase();
        if (pos.indexOf('class') !== -1 && pos.indexOf('teacher') !== -1) return 'class_teacher';
        if (pos.indexOf('subject') !== -1 && pos.indexOf('teacher') !== -1) return 'subject_teacher';
        if (dep.indexOf('teach') !== -1 || pos.indexOf('teacher') !== -1) return 'subject_teacher';
        if (pos.indexOf('account') !== -1) return 'accountant';
        if (pos.indexOf('admin') !== -1) return 'admin';
        return 'staff';
    }

    function normalizeSystemRole(value) {
        var r = String(value || '').trim().toLowerCase();
        if (!r) return '';
        if (r === 'class teacher') return 'class_teacher';
        if (r === 'subject teacher') return 'subject_teacher';
        r = r.replace(/\s+/g, '_');
        var allowed = {
            admin: true,
            class_teacher: true,
            subject_teacher: true,
            accountant: true,
            staff: true
        };
        return allowed[r] ? r : '';
    }

    function resolveEmployeeSystemRole(employee) {
        var direct = normalizeSystemRole(employee && (employee.systemRole || employee.portalRole || employee.accountRole));
        if (direct) return direct;
        return deriveSystemRole(employee);
    }

    function buildServerPayload(employee) {
        var emp = employee || {};
        var name = splitFullName(emp.fullName || emp.name || '');

        var phone = (emp.mobileNo || emp.phone || '').toString().trim();
        var staffId = (emp.staffId || emp.employeeNumber || emp.employee_number || '').toString().trim();
        var salary = emp.salary || null;

        var metadata = Object.assign({}, emp.metadata || {}, {
            staffId: staffId || undefined,
            responsibilities: emp.responsibilities || undefined,
            nationalId: emp.nationalId || undefined,
            photoFileName: emp.photoFileName || undefined,
            loginEmail: emp.loginEmail || undefined,
            loginRole: emp.loginRole || undefined,
            accountId: emp.accountId || undefined,
        });

        return {
            employeeNumber: staffId || null,
            firstName: (name.firstName || '').trim(),
            lastName: (name.lastName || '').trim(),
            email: (emp.email || '').trim(),
            phone: phone || null,
            department: emp.department || null,
            position: emp.role || emp.position || null,
            role: resolveEmployeeSystemRole(emp),
            hireDate: emp.hireDate || null,
            employmentType: emp.employmentType || null,
            salary: salary === '' || salary == null ? null : Number(salary),
            status: emp.status || 'Active',
            address: emp.address || null,
            emergencyContact: emp.emergencyContact || null,
            emergencyPhone: emp.emergencyPhone || null,
            qualifications: emp.qualifications || null,
            subjects: Array.isArray(emp.subjects) ? emp.subjects : [],
            classes: Array.isArray(emp.classes) ? emp.classes : [],
            metadata: metadata
        };
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

    function mapAccountRoleToPortalLabel(role) {
        var r = String(role || '').toLowerCase();
        if (r === 'subject_teacher') return 'Subject Teacher';
        if (r === 'class_teacher') return 'Class Teacher';
        if (r === 'accountant') return 'Accountant';
        if (r === 'admin') return 'Admin';
        if (r === 'staff') return 'Staff';
        return role || '';
    }

    function normalizeEmployeeFromServer(emp) {
        if (!emp) return null;
        var metadata = emp.metadata || {};
        var loginEmail = metadata.loginEmail || '';
        var loginRole = metadata.loginRole || '';
        return Object.assign({}, emp, {
            staffId: emp.staffId || emp.employeeNumber || emp.employee_number || '',
            systemRole: normalizeSystemRole(emp.role || metadata.systemRole || ''),
            role: emp.position || emp.role || '',
            loginUsername: emp.loginUsername || loginEmail || '',
            loginRole: emp.loginRole || mapAccountRoleToPortalLabel(loginRole) || '',
            loginEmail: emp.loginEmail || loginEmail || '',
            accountId: emp.accountId || metadata.accountId || ''
        });
    }

    function loadLocalEmployees() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return [];
            var data = JSON.parse(raw);
            return Array.isArray(data) ? data : [];
        } catch (e) {
            return [];
        }
    }

    function saveLocalEmployees(list) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.isArray(list) ? list : []));
        } catch (e) {
        }
    }

    function addLocalEmployee(employee) {
        var list = loadLocalEmployees();
        var id = employee && employee.id;
        if (!id) {
            id = generateEmployeeId();
            employee.id = id;
        }
        var index = list.findIndex(function (e) { return e && e.id === id; });
        if (index >= 0) {
            list[index] = employee;
        } else {
            list.push(employee);
        }
        saveLocalEmployees(list);
    }

    function saveLocalEmployee(employee) {
        if (!employee) return;
        if (!employee.id) {
            employee.id = generateEmployeeId();
        }
        addLocalEmployee(employee);
    }

    function getLocalEmployees() {
        return loadLocalEmployees();
    }

    function generateEmployeeId() {
        var ts = Date.now().toString(36).toUpperCase();
        return 'EMP-' + ts;
    }

    function searchLocalEmployees(query) {
        var q = (query || '').toLowerCase().trim();
        if (!q) return [];
        var list = loadLocalEmployees();
        return list.filter(function (e) {
            var name = (e.fullName || e.name || '').toLowerCase();
            var staffId = (e.staffId || '').toLowerCase();
            var department = (e.department || '').toLowerCase();
            var role = (e.role || '').toLowerCase();
            return name.indexOf(q) !== -1 ||
                staffId.indexOf(q) !== -1 ||
                department.indexOf(q) !== -1 ||
                role.indexOf(q) !== -1;
        }).slice(0, 20);
    }

    async function listEmployees() {
        var local = getLocalEmployees();
        var base = window.SHIKOLA_API_BASE;
        var token = getAuthToken();

        if (!base || !token) {
            return local;
        }

        var now = Date.now();
        if (_employeesFetch429Until && now < _employeesFetch429Until) {
            return local;
        }

        if (_employeesFetchInFlight) {
            return _employeesFetchInFlight;
        }

        // Avoid hammering the API if multiple Alpine components call listEmployees on init.
        if (_lastEmployeesFetchAt && (now - _lastEmployeesFetchAt) < 15000) {
            return local;
        }

        _lastEmployeesFetchAt = now;

        _employeesFetchInFlight = (async function () {
            try {
                var response = await fetch(base + '/api/admin/employees?limit=500&offset=0', {
                    headers: buildAuthHeaders()
                });

                if (response && response.status === 429) {
                    _employeesFetch429Until = Date.now() + 60000;
                    return local;
                }

                if (!response.ok) {
                    return local;
                }
                var data = await response.json().catch(function () { return null; });
                var list = data && Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : null);
                if (Array.isArray(list)) {
                    var mapped = list.map(function(emp) {
                        return {
                            id: emp.id,
                            fullName: emp.fullName,
                            name: emp.fullName,
                            email: emp.email,
                            mobileNo: emp.phone,
                            staffId: emp.employeeNumber,
                            employeeNumber: emp.employeeNumber,
                            department: emp.department,
                            role: emp.position,
                            systemRole: emp.systemRole,
                            address: emp.address,
                            responsibilities: '',
                            nationalId: '',
                            emergencyContact: emp.emergencyContact,
                            status: emp.status,
                            photoFileName: '',
                            loginUsername: '',
                            loginPassword: '',
                            loginRole: '',
                            loginDisabled: false,
                            subjects: emp.subjectIds || [],
                            classes: emp.classIds || []
                        };
                    });
                    saveLocalEmployees(mapped);
                    return mapped;
                }
            } catch (e) {
            }

            return local;
        })();

        try {
            return await _employeesFetchInFlight;
        } finally {
            _employeesFetchInFlight = null;
        }

        return local;
    }

    async function createEmployee(employee) {
        var payload = Object.assign({}, employee || {});
        if (!payload.id) {
            payload.id = generateEmployeeId();
        }

        addLocalEmployee(payload);

        var base = window.SHIKOLA_API_BASE;
        var token = getAuthToken();
        if (!base || !token) {
            return { success: true, employee: payload, source: 'local' };
        }

        var nameParts = splitFullName(payload.fullName || payload.name || '');
        if (!nameParts.firstName || !nameParts.lastName) {
            return { success: false, error: 'Please enter the employee full name (first name and last name).' };
        }

        try {
            var serverPayload = {
                fullName: (payload.fullName || '').trim(),
                email: (payload.email || '').trim(),
                phone: (payload.mobileNo || payload.phone || '').trim(),
                employeeNumber: (payload.staffId || payload.employeeNumber || '').trim(),
                systemRole: payload.systemRole || '',
                department: payload.department || '',
                position: payload.role || payload.position || '',
                qualification: payload.qualification || '',
                experienceYears: payload.experienceYears ? parseInt(payload.experienceYears) : null,
                salary: payload.salary ? parseFloat(payload.salary) : null,
                employmentType: payload.employmentType || 'full_time',
                hireDate: payload.hireDate || null,
                address: payload.address || '',
                emergencyContact: payload.emergencyContact || '',
                emergencyPhone: payload.emergencyPhone || '',
                subjectIds: Array.isArray(payload.subjects) ? payload.subjects : [],
                classIds: Array.isArray(payload.classes) ? payload.classes : []
            };
            
            var response = await fetch(base + '/api/admin/employees', {
                method: 'POST',
                headers: buildAuthHeaders(),
                body: JSON.stringify(serverPayload)
            });
            if (!response.ok) {
                var errData = await response.json().catch(function () { return null; });
                var msg = errData && (errData.error || errData.message) ? (errData.error || errData.message) : 'Unable to save employee.';
                return { success: false, error: msg };
            }
            var created = await response.json().catch(function () { return null; });
            var normalized = created && created.data ? {
                id: created.data.id,
                fullName: created.data.fullName,
                name: created.data.fullName,
                email: created.data.email,
                mobileNo: created.data.phone,
                staffId: created.data.employeeNumber,
                employeeNumber: created.data.employeeNumber,
                department: created.data.department,
                role: created.data.position,
                systemRole: created.data.systemRole,
                address: created.data.address,
                responsibilities: '',
                nationalId: '',
                emergencyContact: created.data.emergencyContact,
                status: created.data.status,
                photoFileName: '',
                loginUsername: '',
                loginPassword: '',
                loginRole: '',
                loginDisabled: false,
                subjects: created.data.subjectIds || [],
                classes: created.data.classIds || []
            } : null;
            if (normalized) {
                addLocalEmployee(normalized);
                return { success: true, employee: normalized, source: 'server' };
            }
        } catch (e) {
        }

        return { success: true, employee: payload, source: 'local' };
    }

    async function updateEmployee(employee) {
        if (!employee) {
            return { success: false, error: 'No employee data provided.' };
        }
        var payload = Object.assign({}, employee);
        if (!payload.id) {
            payload.id = generateEmployeeId();
        }

        addLocalEmployee(payload);

        var base = window.SHIKOLA_API_BASE;
        var token = getAuthToken();
        if (!base || !token || !isUuid(payload.id)) {
            return { success: true, employee: payload, source: 'local' };
        }

        var nameParts = splitFullName(payload.fullName || payload.name || '');
        if (!nameParts.firstName || !nameParts.lastName) {
            return { success: false, error: 'Please enter the employee full name (first name and last name).' };
        }

        try {
            var serverPayload = {
                fullName: (payload.fullName || '').trim(),
                email: (payload.email || '').trim(),
                phone: (payload.mobileNo || payload.phone || '').trim(),
                employeeNumber: (payload.staffId || payload.employeeNumber || '').trim(),
                systemRole: payload.systemRole || '',
                department: payload.department || '',
                position: payload.role || payload.position || '',
                qualification: payload.qualification || '',
                experienceYears: payload.experienceYears ? parseInt(payload.experienceYears) : null,
                salary: payload.salary ? parseFloat(payload.salary) : null,
                employmentType: payload.employmentType || 'full_time',
                hireDate: payload.hireDate || null,
                status: payload.status || 'active',
                address: payload.address || '',
                emergencyContact: payload.emergencyContact || '',
                emergencyPhone: payload.emergencyPhone || '',
                subjectIds: Array.isArray(payload.subjects) ? payload.subjects : [],
                classIds: Array.isArray(payload.classes) ? payload.classes : []
            };
            
            var response = await fetch(base + '/api/admin/employees/' + encodeURIComponent(payload.id), {
                method: 'PUT',
                headers: buildAuthHeaders(),
                body: JSON.stringify(serverPayload)
            });
            if (!response.ok) {
                var errData = await response.json().catch(function () { return null; });
                var msg = errData && (errData.error || errData.message) ? (errData.error || errData.message) : 'Unable to update employee.';
                return { success: false, error: msg };
            }
            var updated = await response.json().catch(function () { return null; });
            var normalized = updated && updated.data ? {
                id: updated.data.id,
                fullName: updated.data.fullName,
                name: updated.data.fullName,
                email: updated.data.email,
                mobileNo: updated.data.phone,
                staffId: updated.data.employeeNumber,
                employeeNumber: updated.data.employeeNumber,
                department: updated.data.department,
                role: updated.data.position,
                systemRole: updated.data.systemRole,
                address: updated.data.address,
                responsibilities: '',
                nationalId: '',
                emergencyContact: updated.data.emergencyContact,
                status: updated.data.status,
                photoFileName: '',
                loginUsername: '',
                loginPassword: '',
                loginRole: '',
                loginDisabled: false,
                subjects: updated.data.subjectIds || [],
                classes: updated.data.classIds || []
            } : null;
            if (normalized) {
                addLocalEmployee(normalized);
                return { success: true, employee: normalized, source: 'server' };
            }
        } catch (e) {
        }

        return { success: true, employee: payload, source: 'local' };
    }

    async function bulkImportEmployees(file, schoolId) {
        const base = window.SHIKOLA_API_BASE;
        const token = getAuthToken();
        if (!base || !token) {
            return { success: false, error: 'API not available' };
        }
        const formData = new FormData();
        formData.append('file', file);
        if (schoolId) {
            formData.append('schoolId', schoolId);
        }
        try {
            const response = await fetch(base + '/api/admin/employees/bulk-import', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + token
                },
                body: formData
            });
            if (!response.ok) {
                const errData = await response.json().catch(() => null);
                return { success: false, error: errData?.error || 'Import failed' };
            }
            const data = await response.json().catch(() => null);
            return { success: true, data };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    window.ShikolaEmployeesApi = {
        listEmployees: listEmployees,
        createEmployee: createEmployee,
        updateEmployee: updateEmployee,
        bulkImportEmployees: bulkImportEmployees,
        getLocalEmployees: getLocalEmployees,
        saveLocalEmployee: saveLocalEmployee,
        searchEmployees: function (query) { return Promise.resolve(searchLocalEmployees(query)); }
    };

    window.ShikolaEmployeesStore = {
        list: getLocalEmployees,
        search: searchLocalEmployees
    };

    function generateNextStaffId() {
        var list = getLocalEmployees();
        var prefix = 'STF-';
        var maxNum = 0;
        for (var i = 0; i < list.length; i++) {
            var staffId = list[i] && list[i].staffId;
            if (!staffId || typeof staffId !== 'string') continue;
            if (staffId.indexOf(prefix) !== 0) continue;
            var numPart = staffId.slice(prefix.length);
            var n = parseInt(numPart, 10);
            if (!isNaN(n) && n > maxNum) {
                maxNum = n;
            }
        }
        var next = maxNum + 1;
        var padded = String(next);
        while (padded.length < 4) {
            padded = '0' + padded;
        }
        return prefix + padded;
    }

    window.employeeForm = function () {
        console.log('employeeForm component loaded - dateOfJoining and salaryAmount should be removed');
        return {
            showCustomize: false,
            extraFields: { nationalId: true, emergencyContact: false },
            newFieldLabel: '',
            newFieldType: 'text',
            customFields: [],
            loading: false,
            errorMessage: '',
            successMessage: '',
            form: {
                fullName: '',
                mobileNo: '',
                staffId: '',
                email: '',
                department: '',
                role: '',
                systemRole: '',
                address: '',
                responsibilities: '',
                nationalId: '',
                emergencyContact: '',
                status: 'Active',
                photoFileName: ''
            },
            onPhotoSelected: function (event) {
                var file = event && event.target && event.target.files && event.target.files[0];
                this.form.photoFileName = file ? file.name : '';
            },
            resetForm: function () {
                this.form.fullName = '';
                this.form.mobileNo = '';
                this.form.staffId = '';
                this.form.email = '';
                this.form.department = '';
                this.form.role = '';
                this.form.systemRole = '';
                this.form.address = '';
                this.form.responsibilities = '';
                this.form.nationalId = '';
                this.form.emergencyContact = '';
                this.form.status = 'Active';
                this.form.photoFileName = '';
                this.errorMessage = '';
                this.successMessage = '';
            },
            validate: function () {
                var missing = [];
                if (!this.form.fullName) missing.push('Full Name');
                if (!this.form.department) missing.push('Department');
                if (!this.form.systemRole) missing.push('Role');
                this.errorMessage = missing.length ? ('Please fill in: ' + missing.join(', ') + '.') : '';
                return missing.length === 0;
            },
            buildPayload: function () {
                return {
                    id: this.form.id || '',
                    fullName: (this.form.fullName || '').trim(),
                    mobileNo: (this.form.mobileNo || '').trim(),
                    staffId: (this.form.staffId || '').trim(),
                    email: (this.form.email || '').trim(),
                    department: this.form.department || '',
                    role: this.form.role || '',
                    systemRole: this.form.systemRole || '',
                    address: this.form.address || '',
                    responsibilities: (this.form.responsibilities || '').trim(),
                    nationalId: this.extraFields.nationalId ? (this.form.nationalId || '').trim() : '',
                    emergencyContact: this.extraFields.emergencyContact ? (this.form.emergencyContact || '').trim() : '',
                    status: this.form.status || 'Active',
                    photoFileName: this.form.photoFileName || '',
                    loginUsername: '',
                    loginPassword: '',
                    loginRole: '',
                    loginDisabled: false
                };
            },
            submit: async function () {
                this.errorMessage = '';
                this.successMessage = '';
                if (!this.validate()) {
                    return;
                }
                var payload = this.buildPayload();
                if (!payload.staffId) {
                    payload.staffId = generateNextStaffId();
                    this.form.staffId = payload.staffId;
                }
                this.loading = true;
                var result;
                try {
                    if (window.ShikolaEmployeesApi && typeof window.ShikolaEmployeesApi.createEmployee === 'function') {
                        result = await window.ShikolaEmployeesApi.createEmployee(payload);
                    } else {
                        result = { success: true, employee: payload, source: 'local' };
                    }
                } catch (e) {
                    result = { success: false, error: 'Unable to save employee.' };
                }
                this.loading = false;
                if (!result || !result.success) {
                    this.errorMessage = (result && result.error) || 'Unable to save employee.';
                    return;
                }
                var saved = result.employee || payload;
                this.successMessage = 'Employee saved successfully.';
                if (window.showNotification) {
                    try {
                        window.showNotification('Employee ' + (saved.fullName || '') + ' saved.', 'success');
                    } catch (e) {
                    }
                }
                try {
                    window.dispatchEvent(new CustomEvent('shikola:employee-created', { detail: saved }));
                } catch (e) {
                }
                this.resetForm();
            }
        };
    };

    window.employeeIdCards = function () {
        return {
            loading: false,
            errorMessage: '',
            employees: [],
            departmentFilter: '',
            statusFilter: 'active',
            layout: 'standard-a4',
            schoolName: '',
            schoolAddress: '',
            schoolPhone: '',
            init: async function () {
                await this.loadEmployees();
                this.loadSchoolProfile();
            },
            loadEmployees: async function () {
                this.loading = true;
                this.errorMessage = '';
                var list = [];
                try {
                    if (window.ShikolaEmployeesApi && typeof window.ShikolaEmployeesApi.listEmployees === 'function') {
                        list = await window.ShikolaEmployeesApi.listEmployees();
                    } else if (window.ShikolaEmployeesApi && typeof window.ShikolaEmployeesApi.getLocalEmployees === 'function') {
                        list = window.ShikolaEmployeesApi.getLocalEmployees() || [];
                    } else if (window.ShikolaEmployeesStore && typeof window.ShikolaEmployeesStore.list === 'function') {
                        list = window.ShikolaEmployeesStore.list() || [];
                    }
                } catch (e) {
                    this.errorMessage = 'Unable to load employees for ID cards.';
                }
                this.employees = Array.isArray(list) ? list : [];
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
            loadRules: function () {
                try {
                    var stored = localStorage.getItem('shikola_rules_regulations_html');
                    if (stored) {
                        this.rulesHtml = stored;
                    } else {
                        this.rulesHtml = '';
                    }
                } catch (e) {
                    this.rulesHtml = '';
                }
            },
            get filteredEmployees() {
                var list = Array.isArray(this.employees) ? this.employees : [];
                var dep = (this.departmentFilter || '').toLowerCase();
                var statusFilter = this.statusFilter || 'active';
                var filtered = list.filter(function (emp) {
                    var department = (emp.department || '').toLowerCase();
                    var status = (emp.status || 'Active').toLowerCase();
                    if (dep && department.indexOf(dep) === -1) {
                        return false;
                    }
                    if (statusFilter === 'active' && status !== 'active') {
                        return false;
                    }
                    return true;
                });
                return filtered.slice(0, 18);
            },
            buildQrValue: function (employee) {
                if (!employee) return '';
                var id = employee.id || employee.staffId;
                if (!id) return '';
                return String(id);
            },
            buildQrDataUrl: function (employee) {
                var value = this.buildQrValue(employee);
                if (!value || typeof QRious === 'undefined') return '';
                try {
                    var canvas = document.createElement('canvas');
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

    window.employeeJobLetter = function () {
        return {
            searchQuery: '',
            showSuggestions: false,
            employees: [],
            selectedEmployee: null,
            letterType: 'employment',
            letterBody: '',
            templates: {
                employment: 'Dear [Employee Name],\n\nWe are pleased to offer you the position of [Employee Role] at [School Name]. Your employment will commence on [Date of Joining] with a monthly salary of [Salary Amount].',
                confirmation: 'Dear [Employee Name],\n\nThis letter confirms your appointment as [Employee Role] at [School Name] with effect from [Date of Joining]. Your agreed monthly salary is [Salary Amount].',
                recommendation: 'To whom it may concern,\n\nThis is to recommend [Employee Name], who has served as [Employee Role] at [School Name]. During this period, [Employee Name] has been responsible for [Responsibilities].'
            },
            templateStorageKey: 'shikola_employee_job_letter_templates_v1',
            savedTemplates: {},
            schoolName: '',
            schoolAddress: '',
            schoolPhone: '',
            issueDate: '',
            rulesHtml: '',
            loading: false,
            errorMessage: '',
            escapeHtml: function (value) {
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
            },
            stripRulesSection: function (text) {
                var body = String(text || '');
                var marker = '\n\n---\nSchool Rules & Regulations\n\n';
                var idx = body.indexOf(marker);
                if (idx === -1) return body;
                return body.slice(0, idx).trim();
            },
            loadSavedTemplates: function () {
                try {
                    var raw = localStorage.getItem(this.templateStorageKey);
                    if (!raw) {
                        this.savedTemplates = {};
                        return;
                    }
                    var parsed = JSON.parse(raw);
                    this.savedTemplates = parsed && typeof parsed === 'object' ? parsed : {};
                } catch (e) {
                    this.savedTemplates = {};
                }
            },
            persistSavedTemplates: function () {
                try {
                    localStorage.setItem(this.templateStorageKey, JSON.stringify(this.savedTemplates || {}));
                } catch (e) {
                }
            },
            loadRules: function () {
                try {
                    var stored = localStorage.getItem('shikola_rules_regulations_html');
                    if (stored) {
                        this.rulesHtml = stored;
                    } else {
                        this.rulesHtml = '';
                    }
                } catch (e) {
                    this.rulesHtml = '';
                }
            },
            init: async function () {
                await this.loadEmployees();
                this.loadSchoolProfile();
                this.loadRules();
                this.loadSavedTemplates();
                this.applyTemplate();
            },
            loadEmployees: async function () {
                this.loading = true;
                this.errorMessage = '';
                var list = [];
                try {
                    if (window.ShikolaEmployeesApi && typeof window.ShikolaEmployeesApi.listEmployees === 'function') {
                        list = await window.ShikolaEmployeesApi.listEmployees();
                    } else if (window.ShikolaEmployeesApi && typeof window.ShikolaEmployeesApi.getLocalEmployees === 'function') {
                        list = window.ShikolaEmployeesApi.getLocalEmployees() || [];
                    } else if (window.ShikolaEmployeesStore && typeof window.ShikolaEmployeesStore.list === 'function') {
                        list = window.ShikolaEmployeesStore.list() || [];
                    }
                } catch (e) {
                    this.errorMessage = 'Unable to load employees for job letters.';
                }
                this.employees = Array.isArray(list) ? list : [];
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
            filteredEmployees: function () {
                if (!this.searchQuery) return this.employees;
                var q = this.searchQuery.toLowerCase();
                return (this.employees || []).filter(function (e) {
                    var name = (e.fullName || e.name || '').toLowerCase();
                    var id = (e.staffId || e.id || '').toLowerCase();
                    return name.indexOf(q) !== -1 || id.indexOf(q) !== -1;
                });
            },
            selectEmployee: function (emp) {
                this.selectedEmployee = emp;
                var label = (emp.fullName || emp.name || '') + (emp.staffId ? ' (' + emp.staffId + ')' : '');
                this.searchQuery = label.trim();
                this.showSuggestions = false;
                this.applyTemplate();
            },
            applyTemplate: function () {
                var key = this.letterType || 'employment';
                var template = (this.savedTemplates && this.savedTemplates[key]) ? this.savedTemplates[key] : (this.templates[key] || '');
                var emp = this.selectedEmployee || {};
                var name = emp.fullName || emp.name || '';
                var role = emp.role || '';
                var salary = emp.salary || '';
                var joining = emp.hireDate || '';
                var responsibilities = emp.responsibilities || '';
                var schoolName = this.schoolName || '[School Name]';
                var issue = this.issueDate || '';
                var body = template;
                body = body.replace(/\[Employee Name\]/g, name);
                body = body.replace(/\[Employee Role\]/g, role);
                body = body.replace(/\[Salary Amount\]/g, salary);
                body = body.replace(/\[Date of Joining\]/g, joining);
                body = body.replace(/\[Issue Date\]/g, issue);
                body = body.replace(/\[School Name\]/g, schoolName);
                body = body.replace(/\[Responsibilities\]/g, responsibilities || 'their assigned duties');

                // Append school rules & regulations from General Settings (if configured)
                var rulesText = '';
                if (this.rulesHtml) {
                    try {
                        var div = document.createElement('div');
                        div.innerHTML = this.rulesHtml;
                        rulesText = (div.textContent || div.innerText || '').trim();
                    } catch (e) {
                        rulesText = '';
                    }
                }
                if (rulesText) {
                    body += '\n\n---\nSchool Rules & Regulations\n\n' + rulesText;
                }

                this.letterBody = body;
            },
            saveTemplate: function () {
                var key = this.letterType || 'employment';
                var emp = this.selectedEmployee || {};
                var name = emp.fullName || emp.name || '';
                var role = emp.role || '';
                var salary = emp.salary || '';
                var joining = emp.hireDate || '';
                var responsibilities = emp.responsibilities || '';
                var schoolName = this.schoolName || '';
                var issue = this.issueDate || '';
                var base = this.stripRulesSection(this.letterBody || '').trim();
                if (!base) {
                    this.errorMessage = 'Letter body is empty.';
                    return;
                }

                var template = base;
                if (name) template = template.split(String(name)).join('[Employee Name]');
                if (role) template = template.split(String(role)).join('[Employee Role]');
                if (salary !== '' && salary != null) template = template.split(String(salary)).join('[Salary Amount]');
                if (joining) template = template.split(String(joining)).join('[Date of Joining]');
                if (issue) template = template.split(String(issue)).join('[Issue Date]');
                if (schoolName) template = template.split(String(schoolName)).join('[School Name]');
                if (responsibilities) template = template.split(String(responsibilities)).join('[Responsibilities]');

                this.savedTemplates = this.savedTemplates && typeof this.savedTemplates === 'object' ? this.savedTemplates : {};
                this.savedTemplates[key] = template;
                this.persistSavedTemplates();
                if (window.showNotification) {
                    try {
                        window.showNotification('Template saved.', 'success');
                    } catch (e) {
                    }
                }
                this.applyTemplate();
            },
            openLetterPrintWindow: function (title) {
                var text = String(this.letterBody || '').trim();
                if (!text) {
                    this.errorMessage = 'Letter body is empty.';
                    return;
                }
                var win;
                try {
                    win = window.open('', '', 'width=900,height=900');
                } catch (e) {
                    win = null;
                }
                if (!win) {
                    try { window.print(); } catch (e2) {}
                    return;
                }
                var safeTitle = this.escapeHtml(title || 'Job Letter');
                win.document.open();
                win.document.write('<!DOCTYPE html><html><head><meta charset="utf-8" />');
                win.document.write('<title>' + safeTitle + '</title>');
                win.document.write('<style>body{font-family:Arial, sans-serif; padding:24px; color:#0f172a;} .hdr{margin-bottom:16px;} .school{font-weight:700; font-size:16px;} .meta{font-size:12px; color:#475569; margin-top:4px;} pre{white-space:pre-wrap; font-size:12px; line-height:1.5;}</style>');
                win.document.write('</head><body>');
                win.document.write('<div class="hdr">');
                win.document.write('<div class="school">' + this.escapeHtml(this.schoolName || 'Shikola') + '</div>');
                win.document.write('<div class="meta">' + this.escapeHtml(this.schoolAddress || '') + (this.schoolPhone ? ' • ' + this.escapeHtml(this.schoolPhone) : '') + '</div>');
                win.document.write('</div>');
                win.document.write('<pre>' + this.escapeHtml(text) + '</pre>');
                win.document.write('</body></html>');
                win.document.close();
                win.focus();
                try {
                    setTimeout(function () { try { win.print(); } catch (_e) {} }, 300);
                } catch (e3) {
                }
            },
            printLetter: function () {
                this.openLetterPrintWindow('Job Letter');
            },
            downloadPdf: function () {
                var suffix = this.letterType ? (' - ' + this.letterType) : '';
                this.openLetterPrintWindow('Job Letter' + suffix + '.pdf');
            }
        };
    };

    window.employeeManageLogin = function () {
        return {
            loading: false,
            errorMessage: '',
            employees: [],
            departmentFilter: '',
            statusFilter: 'all',
            searchQuery: '',
            selectedEmployee: null,
            username: '',
            password: '',
            portalRole: '',
            showPassword: false,
            init: async function () {
                await this.loadEmployees();
            },
            loadEmployees: async function () {
                this.loading = true;
                this.errorMessage = '';
                var list = [];
                try {
                    if (window.ShikolaEmployeesApi && typeof window.ShikolaEmployeesApi.listEmployees === 'function') {
                        list = await window.ShikolaEmployeesApi.listEmployees();
                    } else if (window.ShikolaEmployeesApi && typeof window.ShikolaEmployeesApi.getLocalEmployees === 'function') {
                        list = window.ShikolaEmployeesApi.getLocalEmployees() || [];
                    } else if (window.ShikolaEmployeesStore && typeof window.ShikolaEmployeesStore.list === 'function') {
                        list = window.ShikolaEmployeesStore.list() || [];
                    }
                } catch (e) {
                    this.errorMessage = 'Unable to load employees for login management.';
                }
                this.employees = Array.isArray(list) ? list : [];
                this.loading = false;
            },
            get departmentOptions() {
                var seen = {};
                var result = [];
                var list = Array.isArray(this.employees) ? this.employees : [];
                for (var i = 0; i < list.length; i++) {
                    var label = list[i] && (list[i].department || '');
                    if (label && !seen[label]) {
                        seen[label] = true;
                        result.push(label);
                    }
                }
                return result;
            },
            get filteredEmployees() {
                var list = Array.isArray(this.employees) ? this.employees : [];
                var dep = (this.departmentFilter || '').toLowerCase();
                var q = (this.searchQuery || '').toLowerCase().trim();
                var statusFilter = this.statusFilter || 'all';
                if (dep) {
                    list = list.filter(function (e) {
                        var department = (e.department || '').toLowerCase();
                        return department.indexOf(dep) !== -1;
                    });
                }
                if (q) {
                    list = list.filter(function (e) {
                        var name = (e.fullName || e.name || '').toLowerCase();
                        var staffId = (e.staffId || '').toLowerCase();
                        var username = (e.loginUsername || '').toLowerCase();
                        return name.indexOf(q) !== -1 || staffId.indexOf(q) !== -1 || username.indexOf(q) !== -1;
                    });
                }
                if (statusFilter === 'enabled') {
                    list = list.filter(function (e) {
                        return !!(e.loginUsername && !e.loginDisabled);
                    });
                } else if (statusFilter === 'disabled') {
                    list = list.filter(function (e) {
                        return !!e.loginDisabled;
                    });
                }
                return list;
            },
            selectEmployee: function (emp) {
                if (!emp) return;
                this.selectedEmployee = emp;
                this.username = emp.loginUsername || '';
                this.password = emp.loginPassword || '';
                this.portalRole = emp.loginRole || '';
                this.showPassword = false;
            },
            clearSelection: function () {
                this.selectedEmployee = null;
                this.username = '';
                this.password = '';
                this.portalRole = '';
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
                if (!this.selectedEmployee) return;
                this.errorMessage = '';

                var username = (this.username || '').trim();
                var password = this.password || '';
                var portalRole = this.portalRole || '';

                if (!username) {
                    this.errorMessage = 'Username is required.';
                    return;
                }
                if (!password || String(password).length < 8) {
                    this.errorMessage = 'Password must be at least 8 characters.';
                    return;
                }

                var roleMap = {
                    Teacher: 'teacher',
                    'Senior Teacher': 'senior_teacher',
                    Accountant: 'accountant',
                    Admin: 'admin',
                    Clerk: 'clerk'
                };
                var apiRole = roleMap[portalRole] || '';
                if (!apiRole) {
                    this.errorMessage = 'Please select a role.';
                    return;
                }

                if (apiRole === 'clerk') {
                    this.errorMessage = 'Clerk role is not supported yet. Please choose Teacher, Senior Teacher, Accountant, or Admin.';
                    return;
                }

                var email = username;
                if (email.indexOf('@') === -1) {
                    email = username + '@school.local';
                }
                email = String(email).trim().toLowerCase();

                var empName = (this.selectedEmployee.fullName || this.selectedEmployee.name || '').trim();
                if (!empName) {
                    empName = email.split('@')[0] || 'Employee';
                }

                this.loading = true;
                var createdAccount = null;
                try {
                    if (window.ShikolaAPI && typeof window.ShikolaAPI.post === 'function') {
                        var createRes = await window.ShikolaAPI.post('/api/admin/accounts', {
                            email: email,
                            password: password,
                            role: apiRole,
                            fullName: empName,
                            employeeId: this.selectedEmployee.id
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

                var updated = Object.assign({}, this.selectedEmployee, {
                    loginUsername: username,
                    loginPassword: password,
                    loginRole: portalRole,
                    loginEmail: email,
                    accountId: createdAccount && createdAccount.id ? createdAccount.id : (this.selectedEmployee.accountId || ''),
                    loginDisabled: false
                });

                this.selectedEmployee = updated;
                var list = Array.isArray(this.employees) ? this.employees : [];
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
                this.employees = list;

                try {
                    if (window.ShikolaEmployeesApi) {
                        if (typeof window.ShikolaEmployeesApi.updateEmployee === 'function') {
                            window.ShikolaEmployeesApi.updateEmployee(updated).catch(function () {
                                if (typeof window.ShikolaEmployeesApi.saveLocalEmployee === 'function') {
                                    window.ShikolaEmployeesApi.saveLocalEmployee(updated);
                                }
                            });
                        } else if (typeof window.ShikolaEmployeesApi.saveLocalEmployee === 'function') {
                            window.ShikolaEmployeesApi.saveLocalEmployee(updated);
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
            },
            disableLogin: function () {
                if (!this.selectedEmployee) return;
                var updated = Object.assign({}, this.selectedEmployee, {
                    loginDisabled: true
                });
                this.selectedEmployee = updated;
                var list = Array.isArray(this.employees) ? this.employees : [];
                for (var i = 0; i < list.length; i++) {
                    if (list[i] && updated && list[i].id === updated.id) {
                        list[i] = updated;
                        break;
                    }
                }
                this.employees = list;
                try {
                    if (window.ShikolaEmployeesApi) {
                        if (typeof window.ShikolaEmployeesApi.updateEmployee === 'function') {
                            window.ShikolaEmployeesApi.updateEmployee(updated).catch(function () {
                                if (typeof window.ShikolaEmployeesApi.saveLocalEmployee === 'function') {
                                    window.ShikolaEmployeesApi.saveLocalEmployee(updated);
                                }
                            });
                        } else if (typeof window.ShikolaEmployeesApi.saveLocalEmployee === 'function') {
                            window.ShikolaEmployeesApi.saveLocalEmployee(updated);
                        }
                    }
                } catch (e) {
                }
                if (window.showNotification) {
                    try {
                        window.showNotification('Login disabled for ' + (updated.fullName || ''), 'success');
                    } catch (e) {
                    }
                }
            }
        };
    };

    function setupAllEmployeesGrid() {
        try {
            var container = document.getElementById('employees-table-body');
            if (!container) return;
            var allEmployees = [];
            var currentQuery = '';
            var currentDepartmentFilter = '';
            var currentStatusFilter = '';

            function matchesQuery(employee, query) {
                if (!query) return true;
                var q = query.toLowerCase();
                var name = (employee.fullName || employee.name || '').toLowerCase();
                var staffId = (employee.staffId || '').toLowerCase();
                var department = (employee.department || '').toLowerCase();
                var role = (employee.role || '').toLowerCase();
                return name.indexOf(q) !== -1 ||
                    staffId.indexOf(q) !== -1 ||
                    department.indexOf(q) !== -1 ||
                    role.indexOf(q) !== -1;
            }

            function passesFilters(employee) {
                if (!employee) return false;
                if (!matchesQuery(employee, currentQuery)) return false;

                if (currentDepartmentFilter) {
                    var dep = (employee.department || '').toLowerCase();
                    if (dep.indexOf(currentDepartmentFilter) === -1) {
                        return false;
                    }
                }

                if (currentStatusFilter) {
                    var status = (employee.status || 'Active').toLowerCase();
                    if (currentStatusFilter === 'active' && status !== 'active') {
                        return false;
                    }
                    if (currentStatusFilter === 'inactive' && status !== 'inactive') {
                        return false;
                    }
                }

                return true;
            }

            function renderRows(list) {
                if (!list.length) {
                    container.innerHTML = '' +
                        '<div class="px-4 py-8 text-center text-slate-400">' +
                        '<i class="fas fa-users text-4xl mb-2"></i>' +
                        '<p>No employees found yet. Add a new employee to see them listed here.</p>' +
                        '</div>';
                    return;
                }
                var html = '';
                for (var i = 0; i < list.length; i++) {
                    var e = list[i] || {};
                    var name = e.fullName || e.name || '';
                    var subtitle = e.role || e.department || '';
                    var staffId = e.staffId || '';
                    var deptRole = (e.department || '') + (e.role ? ' - ' + e.role : '');
                    var status = e.status || 'Active';
                    var statusLower = String(status).toLowerCase();
                    var statusClasses = 'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] border ';
                    if (statusLower === 'inactive') {
                        statusClasses += 'bg-rose-50 text-rose-600 border-rose-100';
                    } else {
                        statusClasses += 'bg-emerald-50 text-emerald-600 border-emerald-100';
                    }
                    html += '' +
                        '<div class="px-4 py-3 grid grid-cols-2 md:grid-cols-12 gap-2 items-center">' +
                        '<div class="md:col-span-3">' +
                        '<div class="font-medium text-slate-800">' + escapeHtml(name) + '</div>' +
                        (subtitle ? '<div class="text-[11px] text-slate-400">' + escapeHtml(subtitle) + '</div>' : '') +
                        '</div>' +
                        '<div class="hidden md:block md:col-span-2 text-slate-500">' + escapeHtml(staffId) + '</div>' +
                        '<div class="hidden md:block md:col-span-3 text-slate-500">' + escapeHtml(deptRole) + '</div>' +
                        '<div class="hidden md:block md:col-span-2">' +
                        '<span class="' + statusClasses + '">' + escapeHtml(status) + '</span>' +
                        '</div>' +
                        '<div class="md:col-span-2 flex justify-end gap-2">' +
                        '<button type="button" class="px-2.5 py-1 rounded-xl bg-slate-50 text-[11px] text-slate-600 border border-slate-200">View</button>' +
                        '<button type="button" class="px-2.5 py-1 rounded-xl bg-orange-500 text-[11px] text-white">Edit</button>' +
                        '</div>' +
                        '</div>';
                }
                container.innerHTML = html;
            }

            function applyFiltersAndRender() {
                var filtered = allEmployees.filter(function (e) { return passesFilters(e); });
                renderRows(filtered);
            }

            async function loadAndRender() {
                var list = [];
                try {
                    if (window.ShikolaEmployeesApi && typeof window.ShikolaEmployeesApi.listEmployees === 'function') {
                        list = await window.ShikolaEmployeesApi.listEmployees();
                    } else {
                        list = getLocalEmployees();
                    }
                } catch (e) {
                    list = getLocalEmployees();
                }
                allEmployees = Array.isArray(list) ? list : [];
                applyFiltersAndRender();
            }

            loadAndRender();

            try {
                var searchInput = document.getElementById('employees-search');
                if (searchInput) {
                    searchInput.addEventListener('input', function (event) {
                        currentQuery = (event.target.value || '').toLowerCase().trim();
                        applyFiltersAndRender();
                    });
                }
                var departmentSelect = document.getElementById('employees-filter-department');
                if (departmentSelect) {
                    departmentSelect.addEventListener('change', function (event) {
                        currentDepartmentFilter = (event.target.value || '').toLowerCase().trim();
                        applyFiltersAndRender();
                    });
                }
                var statusSelect = document.getElementById('employees-filter-status');
                if (statusSelect) {
                    statusSelect.addEventListener('change', function (event) {
                        currentStatusFilter = (event.target.value || '').toLowerCase().trim();
                        applyFiltersAndRender();
                    });
                }
            } catch (e) {
            }

            try {
                window.addEventListener('shikola:employee-created', function () {
                    loadAndRender();
                });
            } catch (e) {
            }
        } catch (e) {
        }
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

    window.employeeBulkImport = function () {
        return {
            showImportModal: false,
            importing: false,
            loading: false,
            selectedFile: null,
            selectedFileName: '',
            errorMessage: '',
            successMessage: '',
            summary: {
                totalRows: 0,
                imported: 0,
                duplicates: 0,
                invalid: 0,
                errors: []
            },
            expectedHeaders: [
                'employee_number',
                'first_name',
                'last_name',
                'email',
                'phone',
                'department',
                'position',
                'role',
                'employment_type',
                'status',
                'address',
                'emergency_contact',
                'emergency_phone',
                'qualifications',
                'subjects',
                'classes'
            ],
            get expectedHeaderLine() {
                return this.expectedHeaders.join(',');
            },
            get templateCsv() {
                return this.expectedHeaderLine + '\n' +
                    'STF-001,John,mushibi,john.mushibi@school.com,+260123456789,Teaching,Mathematics Teacher,teacher,Full-time,Active,Kasama,John Mother,+260987654321,BSc Mathematics,Mathematics,Grade 8A,Grade 9B';
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
                this.errorMessage = '';
                this.successMessage = '';
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
                    console.log('downloadTemplate called, templateCsv:', this.templateCsv);
                    var blob = new Blob([this.templateCsv], { type: 'text/csv;charset=utf-8;' });
                    var url = URL.createObjectURL(blob);
                    var a = document.createElement('a');
                    a.href = url;
                    a.download = 'employees_import_template.csv';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    console.log('Template download completed');
                } catch (e) {
                    console.error('Error downloading template:', e);
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
                var lines = text.split('\n').filter(function (line) { return line.trim(); });
                if (lines.length === 0) {
                    this.summary.errors.push('CSV file is empty.');
                    return;
                }
                var headerLine = lines[0].trim();
                var expectedHeader = this.expectedHeaderLine;
                if (headerLine !== expectedHeader) {
                    this.summary.errors.push('CSV headers do not match expected format. Please download the template and use it as reference.');
                    return;
                }
                this.summary.totalRows = lines.length - 1;
                var employees = [];
                for (var i = 1; i < lines.length; i++) {
                    var line = lines[i].trim();
                    if (!line) continue;
                    var values = this.parseCsvLine(line);
                    if (values.length !== this.expectedHeaders.length) {
                        this.summary.invalid++;
                        this.summary.errors.push('Row ' + (i + 1) + ': Incorrect number of columns.');
                        continue;
                    }
                    var employee = this.buildEmployeeFromRow(values, i + 1);
                    if (!employee) {
                        this.summary.invalid++;
                        continue;
                    }
                    employees.push(employee);
                }
                await this.importEmployees(employees);
            },
            parseCsvLine: function (line) {
                var result = [];
                var current = '';
                var inQuotes = false;
                for (var i = 0; i < line.length; i++) {
                    var ch = line[i];
                    if (ch === '"') {
                        inQuotes = !inQuotes;
                    } else if (ch === ',' && !inQuotes) {
                        result.push(current.trim());
                        current = '';
                    } else {
                        current += ch;
                    }
                }
                result.push(current.trim());
                return result;
            },
            buildEmployeeFromRow: function (values, rowNumber) {
                try {
                    var firstName = values[1] || '';
                    var lastName = values[2] || '';
                    var fullName = (firstName + ' ' + lastName).trim();
                    if (!fullName) {
                        this.summary.errors.push('Row ' + rowNumber + ': First Name and Last Name are required.');
                        return null;
                    }
                    var email = values[3] || '';
                    var phone = values[4] || '';
                    var department = values[5] || '';
                    var position = values[6] || '';
                    var systemRole = values[7] || '';
                    var hireDate = values[8] || '';
                    var salary = values[9] || '';
                    var address = values[10] || '';
                    var emergencyContact = values[11] || '';
                    var emergencyPhone = values[12] || '';
                    var status = values[13] || 'Active';
                    
                    return {
                        staffId: values[0] || '',
                        fullName: fullName,
                        firstName: firstName,
                        lastName: lastName,
                        email: email,
                        mobileNo: phone,
                        department: department,
                        role: position,
                        systemRole: systemRole,
                        hireDate: hireDate,
                        salary: salary,
                        address: address,
                        emergencyContact: emergencyContact,
                        emergencyPhone: emergencyPhone,
                        status: status
                    };
                } catch (e) {
                    this.summary.errors.push('Row ' + rowNumber + ': ' + e.message);
                    return null;
                }
            },
            importEmployees: async function (employees) {
                for (var i = 0; i < employees.length; i++) {
                    var employee = employees[i];
                    try {
                        if (window.ShikolaEmployeesApi && typeof window.ShikolaEmployeesApi.createEmployee === 'function') {
                            var result = await window.ShikolaEmployeesApi.createEmployee(employee);
                            if (result && result.success) {
                                this.summary.imported++;
                            } else {
                                this.summary.invalid++;
                                this.summary.errors.push('Failed to import ' + employee.fullName + ': ' + (result && result.error ? result.error : 'Unknown error'));
                            }
                        } else {
                            this.summary.invalid++;
                            this.summary.errors.push('Employee API not available.');
                        }
                    } catch (e) {
                        this.summary.invalid++;
                        this.summary.errors.push('Failed to import ' + employee.fullName + ': ' + e.message);
                    }
                }
            },
            init: function () {
                this.resetState();
                console.log('employeeBulkImport component initialized');
            }
        };
    };

    // Also add global fallback for immediate access
    window.downloadEmployeeTemplate = function() {
        console.log('Global downloadEmployeeTemplate called');
        var templateCsv = 'employee_number,first_name,last_name,email,phone,department,position,role,employment_type,status,address,emergency_contact,emergency_phone,qualifications,subjects,classes\nSTF-001,John,mushibi,john.mushibi@school.com,+260123456789,Teaching,Mathematics Teacher,teacher,Full-time,Active,Kasama,John Mother,+260987654321,BSc Mathematics,Mathematics,Grade 8A,Grade 9B';
        try {
            var blob = new Blob([templateCsv], { type: 'text/csv;charset=utf-8;' });
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = 'employees_import_template.csv';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            console.log('Template download completed via global fallback');
            alert('Employee template downloaded successfully!');
        } catch (e) {
            console.error('Error downloading template via global fallback:', e);
            alert('Error downloading template: ' + e.message);
        }
    };

    // Register components immediately if Alpine is available, otherwise wait for alpine:init
    function registerAlpineComponents() {
        if (typeof window === 'undefined') return;
        if (!window.Alpine || typeof window.Alpine.data !== 'function') {
            console.log('Alpine not ready yet, retrying later...');
            return;
        }
        if (window.__shikolaEmployeesAlpineRegistered) {
            console.log('Components already registered');
            return;
        }
        window.__shikolaEmployeesAlpineRegistered = true;
        console.log('Registering employee components...');
        window.Alpine.data('employeeForm', window.employeeForm);
        window.Alpine.data('employeeIdCards', window.employeeIdCards);
        window.Alpine.data('employeeJobLetter', window.employeeJobLetter);
        window.Alpine.data('employeeManageLogin', window.employeeManageLogin);
        window.Alpine.data('employeeBulkImport', window.employeeBulkImport);
        console.log('Employee components registered successfully');
    }

    // Try to register immediately
    registerAlpineComponents();

    // Also register on alpine:init event
    if (typeof document !== 'undefined') {
        document.addEventListener('alpine:init', registerAlpineComponents);
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setupAllEmployeesGrid);
        } else {
            setupAllEmployeesGrid();
        }
    }
})();
