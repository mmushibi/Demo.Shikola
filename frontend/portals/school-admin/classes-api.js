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
    var CLASSES_KEY = 'shikola_classes_v1';
    var SUBJECTS_KEY = 'shikola_subjects_v1';
    var ASSIGN_KEY = 'shikola_class_subjects_v1';

    function getApiBase() {
        return window.SHIKOLA_API_BASE || 'http://localhost:3000/api';
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

    function loadJson(key, fallback) {
        try {
            var raw = localStorage.getItem(key);
            if (!raw) return fallback;
            var parsed = JSON.parse(raw);
            return parsed == null ? fallback : parsed;
        } catch (e) {
            return fallback;
        }
    }

    function saveJson(key, value) {
        try {
            console.log('saveJson called with key:', key, 'value:', value);
            localStorage.setItem(key, JSON.stringify(value));
            console.log('Successfully saved to localStorage. Verification:', localStorage.getItem(key));
            
            // Background auto-save without notification
            scheduleAutoSave();
        } catch (e) {
            console.error('Error saving to localStorage:', e);
        }
    }

    function listClasses() {
        var list = loadJson(CLASSES_KEY, []);
        console.log('listClasses called, retrieved from localStorage:', list);
        console.log('localStorage key:', CLASSES_KEY);
        console.log('Raw localStorage data:', localStorage.getItem(CLASSES_KEY));
        
        return Array.isArray(list) ? list : [];
    }

    async function fetchClassesFromServer() {
        if (!canUseApi()) return null;
        try {
            const response = await apiRequestJson('/admin/classes?limit=500&offset=0', { method: 'GET' });
            if (!response || !response.success) {
                console.error('Failed to fetch classes:', response?.error || 'Unknown error');
                return null;
            }
            
            const classes = response.data || [];
            saveClasses(classes);
            
            // Broadcast update to other portals
            broadcastDataUpdate('classes-loaded', classes);
            
            return classes;
        } catch (error) {
            console.error('Error fetching classes from server:', error);
            return null;
        }
    }

    function saveClasses(list) {
        console.log('saveClasses called with:', list);
        saveJson(CLASSES_KEY, Array.isArray(list) ? list : []);
        console.log('Classes saved to localStorage with key:', CLASSES_KEY);
        try {
            window.dispatchEvent(new CustomEvent('shikola:classes-updated', { detail: list || [] }));
            console.log('Classes updated event dispatched');
        } catch (e) {
            console.error('Error dispatching event:', e);
        }
    }

    function normalizeClassPayload(data) {
        if (!data) data = {};
        var id = data.id || ('CLS-' + Date.now().toString(36));
        var maxPupils = data.maxPupils;
        if (typeof maxPupils === 'string') {
            maxPupils = maxPupils.trim();
        }
        var maxNumber = maxPupils === '' || maxPupils == null ? null : Number(maxPupils);
        if (isNaN(maxNumber)) {
            maxNumber = null;
        }
        var metadata = data.metadata && typeof data.metadata === 'object' ? data.metadata : {};
        if (data.classTeacherEmail) {
            metadata = Object.assign({}, metadata, { classTeacherEmail: data.classTeacherEmail });
        }
        return {
            id: id,
            name: (data.name || '').trim(),
            level: data.level || '',
            classTeacher: data.classTeacher || '',
            maxPupils: maxNumber,
            room: (data.room || '').trim(),
            metadata: metadata,
        };
    }

    function upsertClass(data) {
        console.log('=== UPSERT CLASS CALLED ===');
        console.log('upsertClass called with:', data);
        var cls = normalizeClassPayload(data);
        console.log('Normalized class data:', cls);
        var list = listClasses();
        console.log('Current classes list:', list);
        var index = list.findIndex(function (c) { return c.id === cls.id; });
        if (index >= 0) {
            console.log('Updating existing class at index:', index);
            list[index] = cls;
        } else {
            console.log('Adding new class to list');
            list.push(cls);
        }
        console.log('Saving updated list:', list);
        saveClasses(list);
        console.log('Class saved, returning:', cls);
        return cls;
    }

    function deleteClass(id) {
        if (!id) return;
        var list = listClasses();
        var filtered = list.filter(function (c) { return c.id !== id; });
        saveClasses(filtered);
        var assigns = listAssignments();
        var changed = false;
        var cleaned = assigns.filter(function (a) {
            if (!a || a.classId !== id) return true;
            changed = true;
            return false;
        });
        if (changed) {
            saveAssignments(cleaned);
        }
    }

    function findClassById(id) {
        if (!id) return null;
        var list = listClasses();
        var index = list.findIndex(function (c) { return c.id === id; });
        return index >= 0 ? list[index] : null;
    }

    function listClassNames() {
        var classes = listClasses();
        if (!Array.isArray(classes) || !classes.length) {
            return [];
        }
        var seen = {};
        var result = [];
        for (var i = 0; i < classes.length; i++) {
            var c = classes[i];
            if (!c) continue;
            var name = (c.name || '').trim();
            if (!name || seen[name]) continue;
            seen[name] = true;
            result.push(name);
        }
        return result;
    }

    function listSubjects() {
        var list = loadJson(SUBJECTS_KEY, null);
        if (!Array.isArray(list) || !list.length) {
            return [];
        }
        return list;
    }

    async function fetchSubjectsFromServer() {
        if (!canUseApi()) return null;
        var data = await apiRequestJson('/api/admin/subject-options', { method: 'GET' });
        if (!Array.isArray(data)) return null;
        var names = [];
        var seen = {};
        for (var i = 0; i < data.length; i++) {
            var row = data[i];
            var name = row && row.name ? String(row.name).trim() : '';
            if (!name || seen[name]) continue;
            seen[name] = true;
            names.push(name);
        }
        if (!names.length) return null;
        saveSubjects(names);
        return names;
    }

    function saveSubjects(list) {
        var value = Array.isArray(list) ? list : [];
        saveJson(SUBJECTS_KEY, value);
        try {
            window.dispatchEvent(new CustomEvent('shikola:subjects-updated', { detail: value }));
        } catch (e) {
        }
    }

    function addSubject(name) {
        var text = (name || '').trim();
        if (!text) return listSubjects();
        var subjects = listSubjects();
        if (subjects.indexOf(text) !== -1) return subjects;
        subjects.push(text);
        saveSubjects(subjects);
        return subjects;
    }

    function removeSubjectAt(index) {
        var subjects = listSubjects();
        if (!Array.isArray(subjects) || index < 0 || index >= subjects.length) {
            return subjects;
        }
        var removed = subjects.splice(index, 1)[0];
        saveSubjects(subjects);
        if (!removed) {
            return subjects;
        }
        var assigns = listAssignments();
        var changed = false;
        for (var i = 0; i < assigns.length; i++) {
            var a = assigns[i];
            if (!a || !Array.isArray(a.subjects)) continue;
            var before = a.subjects.length;
            a.subjects = a.subjects.filter(function (s) { return s !== removed; });
            if (a.subjects.length !== before) {
                changed = true;
            }
        }
        if (changed) {
            saveAssignments(assigns);
        }
        return subjects;
    }

    function listAssignments() {
        var list = loadJson(ASSIGN_KEY, []);
        return Array.isArray(list) ? list : [];
    }

    async function fetchSubjectsForClassFromServer(classId) {
        if (!canUseApi() || !isUuid(classId)) return null;
        var data = await apiRequestJson('/api/admin/classes/' + encodeURIComponent(classId) + '/subjects', { method: 'GET' });
        if (!data || !Array.isArray(data.subjects)) return null;
        return data.subjects;
    }

    async function saveSubjectsForClassToServer(classId, subjects) {
        if (!canUseApi() || !isUuid(classId)) {
            console.warn('API not available, saving locally only');
            return assignSubjectsToClass(classId, subjects);
        }
        
        try {
            const response = await apiRequestJson(`/admin/classes/${encodeURIComponent(classId)}/subjects`, {
                method: 'POST',
                body: JSON.stringify({ subjects: Array.isArray(subjects) ? subjects : [] })
            });
            
            if (!response || !response.success) {
                throw new Error(response?.error || 'Failed to save subjects for class');
            }
            
            const savedSubjects = response.data || [];
            
            // Update local storage
            assignSubjectsToClass(classId, savedSubjects.map(s => s.subjectName || s.name));
            
            // Broadcast update to other portals
            broadcastDataUpdate('subject-assigned', { classId, subjects: savedSubjects });
            
            return savedSubjects;
        } catch (error) {
            console.error('Error saving subjects for class:', error);
            // Fallback to local storage
            return assignSubjectsToClass(classId, subjects);
        }
    }

    async function fetchAssignmentsFromServer() {
        if (!canUseApi()) return null;
        var classes = listClasses();
        if (!Array.isArray(classes) || !classes.length) return null;
        var local = listAssignments().filter(function (a) { return a && !isUuid(a.classId); });
        var server = [];
        for (var i = 0; i < classes.length; i++) {
            var cls = classes[i];
            if (!cls || !isUuid(cls.id)) continue;
            var subjects = await fetchSubjectsForClassFromServer(cls.id);
            if (!Array.isArray(subjects) || !subjects.length) continue;
            server.push({ classId: cls.id, subjects: subjects.slice() });
        }
        saveAssignments(local.concat(server));
        return listAssignments();
    }

    async function saveClassToServer(classPayload) {
        if (!canUseApi()) {
            console.warn('API not available, saving locally only');
            return upsertClass(classPayload);
        }
        
        try {
            const payload = classPayload || {};
            const metadata = payload.metadata && typeof payload.metadata === 'object' ? payload.metadata : {};
            if (payload.classTeacherEmail) {
                metadata.classTeacherEmail = payload.classTeacherEmail;
            }
            
            const body = {
                className: payload.name,
                gradeLevel: payload.level,
                classTeacherId: payload.classTeacherId,
                maxCapacity: payload.maxPupils,
                room: payload.room
            };

            const isUpdate = isUuid(payload.id);
            const endpoint = isUpdate ? `/admin/classes/${encodeURIComponent(payload.id)}` : '/admin/classes';
            const method = isUpdate ? 'PUT' : 'POST';
            
            const response = await apiRequestJson(endpoint, { 
                method: method, 
                body: JSON.stringify(body) 
            });
            
            if (!response || !response.success) {
                throw new Error(response?.error || 'Failed to save class');
            }
            
            const serverClass = response.data;
            if (!serverClass || !serverClass.id) {
                throw new Error('Invalid response from server');
            }

            // Update local storage with server response
            const list = listClasses();
            if (payload.id && !isUuid(payload.id)) {
                // Remove temporary local ID
                const filtered = list.filter(function (c) { return c && c.id !== payload.id; });
                saveClasses(filtered);
            }
            
            // Add or update server class
            const updatedList = listClasses();
            const idx = updatedList.findIndex(function (c) { return c && c.id === serverClass.id; });
            if (idx >= 0) {
                updatedList[idx] = serverClass;
            } else {
                updatedList.push(serverClass);
            }
            saveClasses(updatedList);

            // Broadcast update to other portals
            const eventType = isUpdate ? 'class-updated' : 'class-created';
            broadcastDataUpdate(eventType, serverClass);

            return serverClass;
        } catch (error) {
            console.error('Error saving class to server:', error);
            // Fallback to local storage
            return upsertClass(classPayload);
        }
    }

    async function assignTeacherToClassServer(classId, teacherEmail, teacherName) {
        if (!canUseApi() || !isUuid(classId) || !teacherEmail) return null;
        var payload = {
            teacherEmail: teacherEmail,
            teacherName: teacherName || '',
            isClassTeacher: true
        };
        var data = await apiRequestJson('/api/admin/classes/' + encodeURIComponent(classId) + '/assign-teacher', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        if (!data || !data.class) return null;
        return data.class;
    }

    async function deleteClassFromServer(id) {
        if (!canUseApi()) {
            console.warn('API not available, deleting locally only');
            deleteClass(id);
            return true;
        }
        
        if (!isUuid(id)) {
            console.error('Invalid class ID for deletion');
            return false;
        }
        
        try {
            const response = await apiRequestJson(`/admin/classes/${encodeURIComponent(id)}`, {
                method: 'DELETE'
            });
            
            if (!response || !response.success) {
                throw new Error(response?.error || 'Failed to delete class');
            }
            
            // Remove from local storage
            deleteClass(id);
            
            // Broadcast deletion to other portals
            broadcastDataUpdate('class-deleted', { id });
            
            return true;
        } catch (error) {
            console.error('Error deleting class from server:', error);
            return false;
        }
    }

    async function syncFromServer() {
        if (!canUseApi()) return null;
        await fetchClassesFromServer();
        await fetchSubjectsFromServer();
        await fetchAssignmentsFromServer();
        return {
            classes: listClasses(),
            subjects: listSubjects(),
            assignments: listAssignments()
        };
    }

    function saveAssignments(list) {
        var value = Array.isArray(list) ? list : [];
        saveJson(ASSIGN_KEY, value);
        try {
            window.dispatchEvent(new CustomEvent('shikola:class-subjects-updated', { detail: value }));
        } catch (e) {
        }
    }

    function assignSubjectsToClass(classId, subjectNames) {
        if (!classId) return listAssignments();
        var clean = [];
        var seen = {};
        if (Array.isArray(subjectNames)) {
            for (var i = 0; i < subjectNames.length; i++) {
                var name = subjectNames[i];
                if (name == null) continue;
                var text = String(name).trim();
                if (!text || seen[text]) continue;
                seen[text] = true;
                clean.push(text);
            }
        }
        if (!clean.length) return listAssignments();
        var assigns = listAssignments();
        var index = assigns.findIndex(function (a) { return a && a.classId === classId; });
        if (index >= 0) {
            var existing = assigns[index];
            var base = Array.isArray(existing.subjects) ? existing.subjects.slice() : [];
            var map = {};
            var merged = [];
            for (var j = 0; j < base.length; j++) {
                var v = base[j];
                if (v == null) continue;
                var t = String(v).trim();
                if (!t || map[t]) continue;
                map[t] = true;
                merged.push(t);
            }
            for (var k = 0; k < clean.length; k++) {
                var c = clean[k];
                if (!map[c]) {
                    map[c] = true;
                    merged.push(c);
                }
            }
            existing.subjects = merged;
            assigns[index] = existing;
        } else {
            assigns.push({ classId: classId, subjects: clean });
        }
        saveAssignments(assigns);
        return assigns;
    }

    function listClassesWithSubjects() {
        var classes = listClasses();
        var assigns = listAssignments();
        var result = [];
        var i;
        for (i = 0; i < assigns.length; i++) {
            var a = assigns[i];
            if (!a || !a.classId || !Array.isArray(a.subjects) || !a.subjects.length) continue;
            var cls = findClassById(a.classId);
            if (!cls) continue;
            result.push({
                classId: cls.id,
                name: cls.name,
                subjects: a.subjects.slice(),
            });
        }
        return result;
    }

    // Enhanced error handling and validation
    function validateClassData(classData) {
        const errors = [];
        
        if (!classData.name || classData.name.trim() === '') {
            errors.push('Class name is required');
        }
        
        if (!classData.level || classData.level.trim() === '') {
            errors.push('Grade level is required');
        }
        
        if (classData.maxPupils && (isNaN(classData.maxPupils) || classData.maxPupils < 1)) {
            errors.push('Maximum pupils must be a positive number');
        }
        
        if (classData.classTeacherEmail && !isValidEmail(classData.classTeacherEmail)) {
            errors.push('Invalid teacher email format');
        }
        
        return errors;
    }
    
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    function sanitizeInput(input) {
        if (typeof input !== 'string') return input;
        return input.trim().replace(/[<>]/g, '');
    }
    
    function handleApiError(error, context = '') {
        console.error(`API Error in ${context}:`, error);
        
        // Don't show user notification for background operations
        if (context.includes('background') || context.includes('auto-save')) {
            return;
        }
        
        // Show user-friendly error message
        let message = 'An error occurred';
        if (error.message) {
            message = error.message;
        } else if (typeof error === 'string') {
            message = error;
        }
        
        // Dispatch error event for UI handling
        window.dispatchEvent(new CustomEvent('shikola:error', {
            detail: { message, context, error }
        }));
    }
    let autoSaveTimer = null;
    let autoSaveQueue = new Map();
    
    function scheduleAutoSave() {
        // Clear existing timer
        if (autoSaveTimer) {
            clearTimeout(autoSaveTimer);
        }
        
        // Schedule auto-save after 2 seconds of inactivity
        autoSaveTimer = setTimeout(() => {
            performAutoSave();
        }, 2000);
    }
    
    function performAutoSave() {
        try {
            // Save all queued items silently
            for (const [key, value] of autoSaveQueue) {
                localStorage.setItem(key, JSON.stringify(value));
            }
            
            // Clear queue after successful save
            autoSaveQueue.clear();
            console.log('Background auto-save completed successfully');
        } catch (e) {
            console.error('Background auto-save failed:', e);
        }
    }
    
    function queueAutoSave(key, value) {
        autoSaveQueue.set(key, value);
        scheduleAutoSave();
    }
    
    // Real-time data sharing between portals
    function broadcastDataUpdate(eventType, data) {
        try {
            // Dispatch custom event for other tabs/portals
            const event = new CustomEvent('shikola:data-update', {
                detail: {
                    type: eventType,
                    data: data,
                    timestamp: new Date().toISOString(),
                    source: 'classes-api'
                }
            });
            window.dispatchEvent(event);
            
            // Also store in sessionStorage for cross-tab communication
            const storageKey = `shikola_sync_${eventType}`;
            sessionStorage.setItem(storageKey, JSON.stringify({
                data,
                timestamp: Date.now()
            }));
            
            // Clean up old sessionStorage items
            setTimeout(() => {
                sessionStorage.removeItem(storageKey);
            }, 5000);
        } catch (e) {
            console.error('Failed to broadcast data update:', e);
        }
    }
    
    // Listen for data updates from other portals
    function listenForDataUpdates() {
        // Listen for custom events
        window.addEventListener('shikola:data-update', function(event) {
            if (event.detail && event.detail.source !== 'classes-api') {
                handleExternalDataUpdate(event.detail.type, event.detail.data);
            }
        });
        
        // Listen for sessionStorage changes (cross-tab communication)
        window.addEventListener('storage', function(event) {
            if (event.key && event.key.startsWith('shikola_sync_')) {
                try {
                    const syncData = JSON.parse(event.newValue || '{}');
                    const eventType = event.key.replace('shikola_sync_', '');
                    handleExternalDataUpdate(eventType, syncData.data);
                } catch (e) {
                    console.error('Failed to parse sync data:', e);
                }
            }
        });
    }
    
    function handleExternalDataUpdate(eventType, data) {
        switch (eventType) {
            case 'class-created':
            case 'class-updated':
            case 'class-deleted':
                // Refresh classes list
                if (window.ShikolaClassesStore && typeof window.ShikolaClassesStore.reloadClasses === 'function') {
                    window.ShikolaClassesStore.reloadClasses();
                }
                break;
            case 'subject-assigned':
            case 'subject-removed':
                // Refresh assignments
                if (window.ShikolaClassesStore && typeof window.ShikolaClassesStore.reloadAssignments === 'function') {
                    window.ShikolaClassesStore.reloadAssignments();
                }
                break;
        }
    }
    
    // Initialize data sharing listeners
    listenForDataUpdates();

    window.ShikolaClassesStore = {
        listClasses: listClasses,
        saveClasses: saveClasses,
        upsertClass: upsertClass,
        deleteClass: deleteClass,
        findClassById: findClassById,
        listClassNames: listClassNames,
        listSubjects: listSubjects,
        saveSubjects: saveSubjects,
        addSubject: addSubject,
        removeSubjectAt: removeSubjectAt,
        listAssignments: listAssignments,
        saveAssignments: saveAssignments,
        assignSubjectsToClass: assignSubjectsToClass,
        listClassesWithSubjects: listClassesWithSubjects,
        reloadClasses: function() {
            // Trigger reload event
            window.dispatchEvent(new CustomEvent('shikola:classes-reload'));
        },
        reloadAssignments: function() {
            // Trigger assignments reload event
            window.dispatchEvent(new CustomEvent('shikola:assignments-reload'));
        }
    };

    async function bulkImportClasses(file, schoolId) {
        const base = getApiBase();
        const token = getAuthToken();
        if (!base || !token) {
            return { success: false, error: 'API not available' };
        }
        
        try {
            // First try to parse the file locally for validation
            const classes = await parseClassesFile(file);
            if (!classes || !classes.length) {
                return { success: false, error: 'No valid classes found in file' };
            }
            
            // Send to server for bulk import
            const response = await apiRequestJson('/admin/classes/bulk-import', {
                method: 'POST',
                body: JSON.stringify(classes)
            });
            
            if (!response || !response.success) {
                throw new Error(response?.error || 'Bulk import failed');
            }
            
            const result = response.data;
            
            // Update local storage with successful imports
            if (result.success && result.success.length > 0) {
                const currentClasses = listClasses();
                const updatedClasses = currentClasses.concat(result.success);
                saveClasses(updatedClasses);
                
                // Broadcast successful imports
                broadcastDataUpdate('classes-bulk-imported', { 
                    success: result.success, 
                    failed: result.failed 
                });
            }
            
            return { 
                success: true, 
                data: result,
                summary: {
                    total: result.totalProcessed,
                    imported: result.successCount,
                    failed: result.failedCount
                }
            };
        } catch (error) {
            console.error('Error in bulk import:', error);
            return { success: false, error: error.message };
        }
    }
    
    async function parseClassesFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                try {
                    const content = e.target.result;
                    let classes = [];
                    
                    if (file.name.endsWith('.json')) {
                        // Parse JSON file
                        classes = JSON.parse(content);
                    } else if (file.name.endsWith('.csv')) {
                        // Parse CSV file
                        classes = parseCSVClasses(content);
                    } else {
                        throw new Error('Unsupported file format. Please use JSON or CSV.');
                    }
                    
                    resolve(classes);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = function() {
                reject(new Error('Failed to read file'));
            };
            
            reader.readAsText(file);
        });
    }
    
    function parseCSVClasses(content) {
        const lines = content.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        
        return lines.slice(1).map(line => {
            const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
            const classObj = {};
            
            headers.forEach((header, index) => {
                const value = values[index] || '';
                switch (header.toLowerCase()) {
                    case 'classname':
                    case 'name':
                        classObj.name = value;
                        break;
                    case 'gradelevel':
                    case 'grade':
                    case 'level':
                        classObj.level = value;
                        break;
                    case 'maxcapacity':
                    case 'capacity':
                        classObj.maxPupils = parseInt(value) || null;
                        break;
                    case 'room':
                        classObj.room = value;
                        break;
                    case 'classteacher':
                    case 'teacher':
                        classObj.classTeacher = value;
                        break;
                    default:
                        classObj[header] = value;
                }
            });
            
            return classObj;
        }).filter(cls => cls.name && cls.level);
    }

    window.ShikolaClassesApi = window.ShikolaClassesApi || {
        canUseApi: canUseApi,
        syncFromServer: syncFromServer,
        saveClass: saveClassToServer,
        deleteClass: deleteClassFromServer,
        saveSubjectsForClass: saveSubjectsForClassToServer,
        assignTeacherToClass: assignTeacherToClassServer,
        bulkImportClasses: bulkImportClasses
    };

    window.ShikolaClassesUi = window.ShikolaClassesUi || {};
    window.ShikolaClassesUi.getClassOptions = function (fallback) {
        var base = Array.isArray(fallback) ? fallback.slice() : [];
        try {
            if (!window.ShikolaClassesStore || typeof window.ShikolaClassesStore.listClassNames !== 'function') {
                return base;
            }
            var names = window.ShikolaClassesStore.listClassNames();
            if (!Array.isArray(names) || !names.length) {
                return base;
            }
            return names;
        } catch (e) {
            return base;
        }
    };

    window.classesPage = function () {
        return {
            sidebarOpen: false,
            chatOpen: false,
            activeTab: 'all-classes',
            mobileSearchOpen: false,
            mobileNotificationsOpen: false,
            mobileProfileOpen: false,
            mobileSearchQuery: '',
            mobileHeaderOpen: false,
            tierLevel: 5, // Default to highest tier to show all features
            classes: [],
            searchAll: '',
            filterLevel: 'all',
            filterTeacher: 'all',
            classTeacherOptions: [],
            teacherFilterOptions: [],
            formMode: 'create',
            form: {
                id: '',
                name: '',
                level: '',
                classTeacherEmail: '',
                maxPupils: '',
                room: '',
                metadata: {},
            },
            subjects: [],
            newSubjectName: '',
            selectedAssignClassId: '',
            selectedAssignSubjects: [],
            assignments: [],
            init: async function () {
                // Load tier level from user profile or config
                try {
                    var userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
                    this.tierLevel = userProfile.tierLevel || userProfile.subscriptionTier || 5;
                } catch (e) {
                    this.tierLevel = 5; // Default to highest tier
                }
                
                this.reloadClasses();
                this.reloadSubjects();
                this.reloadAssignments();
                await this.syncFromServer();
                await this.loadTeacherOptions();
                var self = this;
                try {
                    window.addEventListener('shikola:classes-updated', function (evt) {
                        self.classes = Array.isArray(evt.detail) ? evt.detail : [];
                        self.refreshTeacherFilterOptions();
                    });
                    window.addEventListener('shikola:subjects-updated', function (evt) {
                        self.subjects = Array.isArray(evt.detail) ? evt.detail : [];
                    });
                    window.addEventListener('shikola:class-subjects-updated', function (evt) {
                        self.assignments = Array.isArray(evt.detail) ? evt.detail : [];
                    });
                } catch (e) {
                }
            },
            syncFromServer: async function () {
                try {
                    if (window.ShikolaClassesApi && typeof window.ShikolaClassesApi.syncFromServer === 'function') {
                        await window.ShikolaClassesApi.syncFromServer();
                        this.reloadClasses();
                        this.reloadSubjects();
                        this.reloadAssignments();
                        this.refreshTeacherFilterOptions();
                    }
                } catch (e) {
                }
            },
            reloadClasses: function () {
                console.log('reloadClasses called');
                if (window.ShikolaClassesStore && typeof window.ShikolaClassesStore.listClasses === 'function') {
                    this.classes = window.ShikolaClassesStore.listClasses();
                    console.log('Classes reloaded from store:', this.classes);
                } else {
                    console.log('ShikolaClassesStore.listClasses not available, using empty array');
                    this.classes = [];
                }
                this.refreshTeacherFilterOptions();
                console.log('Final classes array:', this.classes);
            },
            reloadSubjects: function () {
                if (window.ShikolaClassesStore && typeof window.ShikolaClassesStore.listSubjects === 'function') {
                    this.subjects = window.ShikolaClassesStore.listSubjects();
                } else {
                    this.subjects = [];
                }
            },
            reloadAssignments: function () {
                if (window.ShikolaClassesStore && typeof window.ShikolaClassesStore.listAssignments === 'function') {
                    this.assignments = window.ShikolaClassesStore.listAssignments();
                } else {
                    this.assignments = [];
                }
            },
            refreshTeacherFilterOptions: function () {
                var list = Array.isArray(this.classes) ? this.classes : [];
                var seen = {};
                var result = [];
                for (var i = 0; i < list.length; i++) {
                    var t = (list[i] && list[i].classTeacher) ? String(list[i].classTeacher).trim() : '';
                    if (!t || seen[t]) continue;
                    seen[t] = true;
                    result.push(t);
                }
                this.teacherFilterOptions = result;
            },
            loadTeacherOptions: async function () {
                var teachers = [];
                try {
                    if (window.ShikolaEmployeesApi && typeof window.ShikolaEmployeesApi.listEmployees === 'function') {
                        teachers = await window.ShikolaEmployeesApi.listEmployees();
                    } else if (window.ShikolaEmployeesStore && typeof window.ShikolaEmployeesStore.list === 'function') {
                        teachers = window.ShikolaEmployeesStore.list() || [];
                    }
                } catch (e) {
                    teachers = [];
                }

                var options = [];
                var seen = {};
                for (var i = 0; i < teachers.length; i++) {
                    var emp = teachers[i];
                    if (!emp) continue;
                    var roleText = String(emp.role || emp.loginRole || emp.position || '').toLowerCase();
                    if (roleText.indexOf('teacher') === -1) continue;
                    var email = String(emp.loginEmail || emp.email || '').trim();
                    var name = String(emp.fullName || emp.name || emp.loginUsername || emp.email || '').trim();
                    var key = (email || name).toLowerCase();
                    if (!name || !key || seen[key]) continue;
                    seen[key] = true;
                    options.push({ name: name, email: email || name });
                }

                if (!options.length) {
                    var fallback = this.teacherFilterOptions || [];
                    for (var j = 0; j < fallback.length; j++) {
                        var tName = String(fallback[j] || '').trim();
                        if (!tName) continue;
                        var k = tName.toLowerCase();
                        if (seen[k]) continue;
                        seen[k] = true;
                        options.push({ name: tName, email: tName });
                    }
                }
                this.classTeacherOptions = options;
            },
            get filteredClasses() {
                var list = Array.isArray(this.classes) ? this.classes.slice() : [];
                console.log('filteredClasses - starting list:', list);
                var q = (this.searchAll || '').toLowerCase().trim();
                var level = this.filterLevel || 'all';
                var teacher = this.filterTeacher || 'all';
                console.log('filteredClasses - filters:', { search: q, level: level, teacher: teacher });
                
                if (q) {
                    list = list.filter(function (c) {
                        var name = (c.name || '').toLowerCase();
                        var t = (c.classTeacher || '').toLowerCase();
                        return name.indexOf(q) !== -1 || t.indexOf(q) !== -1;
                    });
                    console.log('filteredClasses - after search filter:', list);
                }
                if (level && level !== 'all') {
                    list = list.filter(function (c) { return c.level === level; });
                    console.log('filteredClasses - after level filter:', list);
                }
                if (teacher && teacher !== 'all') {
                    list = list.filter(function (c) { return c.classTeacher === teacher; });
                    console.log('filteredClasses - after teacher filter:', list);
                }
                console.log('filteredClasses - final result:', list);
                return list;
            },
            get classesWithSubjects() {
                if (!window.ShikolaClassesStore || typeof window.ShikolaClassesStore.listClassesWithSubjects !== 'function') {
                    return [];
                }
                return window.ShikolaClassesStore.listClassesWithSubjects();
            },
            resetForm: function () {
                this.formMode = 'create';
                this.form.id = '';
                this.form.name = '';
                this.form.level = '';
                this.form.classTeacherEmail = '';
                this.form.maxPupils = '';
                this.form.room = '';
                this.form.metadata = {};
            },
            startCreate: function () {
                this.formMode = 'create';
                this.resetForm();
                this.activeTab = 'new-class';
            },
            startEdit: function (cls) {
                if (!cls) return;
                this.formMode = 'edit';
                this.form.id = cls.id || '';
                this.form.name = cls.name || '';
                this.form.level = cls.level || '';
                var meta = cls.metadata && typeof cls.metadata === 'object' ? cls.metadata : {};
                this.form.metadata = meta;
                this.form.classTeacherEmail = meta.classTeacherEmail || cls.classTeacher || '';
                this.form.maxPupils = cls.maxPupils != null ? String(cls.maxPupils) : '';
                this.form.room = cls.room || '';
                this.activeTab = 'new-class';
            },
            resolveTeacherByEmailOrName: function (emailOrName) {
                var value = emailOrName == null ? '' : String(emailOrName).trim();
                if (!value) return null;
                var list = Array.isArray(this.classTeacherOptions) ? this.classTeacherOptions : [];
                for (var i = 0; i < list.length; i++) {
                    var t = list[i];
                    if (!t) continue;
                    var email = t.email ? String(t.email).trim() : '';
                    var name = t.name ? String(t.name).trim() : '';
                    if (email && email.toLowerCase() === value.toLowerCase()) return t;
                }
                return '';
            },
            saveClassClick: async function () {
                console.log('Enhanced saveClassClick called with data:', this.form);
                
                // Validate input first
                const validationErrors = validateClassData(this.form);
                if (validationErrors.length > 0) {
                    this.showNotification(validationErrors.join(', '), 'error');
                    return;
                }
                
                // Sanitize input
                const sanitizedData = {
                    id: this.form.id,
                    name: sanitizeInput(this.form.name),
                    level: sanitizeInput(this.form.level),
                    classTeacher: this.resolveTeacherByEmailOrName(this.form.classTeacherEmail)?.name || '',
                    classTeacherEmail: sanitizeInput(this.form.classTeacherEmail),
                    maxPupils: this.form.maxPupils ? parseInt(this.form.maxPupils) : null,
                    room: sanitizeInput(this.form.room),
                    metadata: this.form.metadata || {},
                };
                
                // Show loading state
                const originalButtonText = event.target.textContent;
                event.target.textContent = 'Saving...';
                event.target.disabled = true;
                
                try {
                    console.log('Processed data for save:', sanitizedData);
                    
                    if (!sanitizedData.name || !sanitizedData.level) {
                        throw new Error('Class name and level are required');
                    }
                    
                    // Use enhanced API function
                    const savedClass = await window.ShikolaClassesApi.saveClass(sanitizedData);
                    
                    if (savedClass && savedClass.id) {
                        this.form.id = savedClass.id;
                        
                        // Also assign teacher if provided
                        if (sanitizedData.classTeacherEmail && window.ShikolaClassesApi.assignTeacherToClass) {
                            try {
                                await window.ShikolaClassesApi.assignTeacherToClass(
                                    savedClass.id, 
                                    sanitizedData.classTeacherEmail, 
                                    sanitizedData.classTeacher
                                );
                            } catch (teacherError) {
                                handleApiError(teacherError, 'teacher assignment');
                            }
                        }
                        
                        this.reloadClasses();
                        this.activeTab = 'all-classes';
                        
                        // Show success notification
                        this.showNotification('Class saved successfully', 'success');
                    } else {
                        throw new Error('Failed to save class');
                    }
                } catch (error) {
                    handleApiError(error, 'save class');
                    this.showNotification(error.message || 'Failed to save class', 'error');
                } finally {
                    // Restore button state
                    event.target.textContent = originalButtonText;
                    event.target.disabled = false;
                }
            },
            deleteClassClick: async function (classId) {
                if (!classId) return;
                
                if (!confirm('Are you sure you want to delete this class? This action cannot be undone.')) {
                    return;
                }
                
                try {
                    // Use enhanced API function
                    const success = await window.ShikolaClassesApi.deleteClass(classId);
                    
                    if (success) {
                        this.reloadClasses();
                        this.showNotification('Class deleted successfully', 'success');
                    } else {
                        throw new Error('Failed to delete class');
                    }
                } catch (error) {
                    console.error('Error deleting class:', error);
                    this.showNotification(error.message || 'Failed to delete class', 'error');
                }
            },
            showNotification: function(message, type = 'info') {
                // Create a simple notification without using alert
                const notification = document.createElement('div');
                notification.className = `fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm ${
                    type === 'success' ? 'bg-green-500 text-white' : 
                    type === 'error' ? 'bg-red-500 text-white' : 
                    'bg-blue-500 text-white'
                }`;
                notification.innerHTML = `
                    <div class="flex items-center gap-2">
                        <i class="fas ${
                    type === 'success' ? 'fa-check-circle' : 
                    type === 'error' ? 'fa-exclamation-circle' : 
                    'fa-info-circle'
                }"></i>
                        <span>${message}</span>
                    </div>
                `;
                
                document.body.appendChild(notification);
                
                // Auto-remove after 3 seconds
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 3000);
            },
            assignSubjectsToSelectedClassClick: async function () {
                if (!this.selectedAssignClassId || !this.selectedAssignSubjects.length) {
                    return;
                }
                if (window.ShikolaClassesStore && typeof window.ShikolaClassesStore.assignSubjectsToClass === 'function') {
                    window.ShikolaClassesStore.assignSubjectsToClass(this.selectedAssignClassId, this.selectedAssignSubjects);
                    this.reloadAssignments();
                }
                try {
                    if (window.ShikolaClassesApi && typeof window.ShikolaClassesApi.saveSubjectsForClass === 'function' && window.ShikolaClassesApi.canUseApi && window.ShikolaClassesApi.canUseApi()) {
                        var merged = [];
                        var assigns = window.ShikolaClassesStore && typeof window.ShikolaClassesStore.listAssignments === 'function' ? window.ShikolaClassesStore.listAssignments() : [];
                        for (var i = 0; i < assigns.length; i++) {
                            if (assigns[i] && assigns[i].classId === this.selectedAssignClassId && Array.isArray(assigns[i].subjects)) {
                                merged = assigns[i].subjects.slice();
                                break;
                            }
                        }
                        await window.ShikolaClassesApi.saveSubjectsForClass(this.selectedAssignClassId, merged);
                    }
                } catch (e) {
                }
                this.selectedAssignSubjects = [];
            },
            downloadTemplate: function () {
                try {
                    var link = document.createElement('a');
                    link.href = '../../public/classes_template.csv';
                    link.download = 'classes_template.csv';
                    link.style.display = 'none';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                } catch (e) {
                    console.error('Error downloading template:', e);
                    this.showNotification('Failed to download template. Please try again.', 'error');
                }
            },
        };
    };

    window.classBulkImport = function () {
        return {
            selectedFile: null,
            loading: false,
            errorMessage: '',
            successMessage: '',
            init: function () {
                // Initialize component
            },
            onFileSelected: function (event) {
                var file = event.target.files[0];
                if (!file) {
                    this.selectedFile = null;
                    return;
                }
                
                // Validate file type
                if (!file.name.toLowerCase().endsWith('.csv')) {
                    this.errorMessage = 'Please select a CSV file.';
                    this.selectedFile = null;
                    event.target.value = '';
                    return;
                }
                
                // Validate file size (5MB max)
                var maxSize = 5 * 1024 * 1024; // 5MB in bytes
                if (file.size > maxSize) {
                    this.errorMessage = 'File size must be less than 5MB.';
                    this.selectedFile = null;
                    event.target.value = '';
                    return;
                }
                
                this.selectedFile = file;
                this.errorMessage = '';
                this.successMessage = '';
            },
            importClasses: async function () {
                if (!this.selectedFile) {
                    this.errorMessage = 'Please select a CSV file to import.';
                    return;
                }
                
                this.loading = true;
                this.errorMessage = '';
                this.successMessage = '';
                
                try {
                    // Try to use API if available
                    if (window.ShikolaClassesApi && typeof window.ShikolaClassesApi.bulkImportClasses === 'function') {
                        var result = await window.ShikolaClassesApi.bulkImportClasses(this.selectedFile);
                        if (result.success) {
                            this.successMessage = 'Classes imported successfully!';
                            this.selectedFile = null;
                            // Reset file input
                            var fileInput = document.querySelector('input[type="file"]');
                            if (fileInput) fileInput.value = '';
                            
                            // After API import, sync with server to get latest data
                            try {
                                if (window.ShikolaClassesApi && typeof window.ShikolaClassesApi.syncFromServer === 'function') {
                                    await window.ShikolaClassesApi.syncFromServer();
                                }
                            } catch (e) {
                                console.error('Error syncing from server:', e);
                            }
                            
                            // Trigger classes updated event to refresh the UI
                            try {
                                if (window.ShikolaClassesStore && typeof window.ShikolaClassesStore.listClasses === 'function') {
                                    var updatedClasses = window.ShikolaClassesStore.listClasses();
                                    console.log('Triggering refresh with classes:', updatedClasses);
                                    window.dispatchEvent(new CustomEvent('shikola:classes-updated', { detail: updatedClasses }));
                                    
                                    // Fallback: Force a direct refresh after a short delay
                                    setTimeout(function() {
                                        try {
                                            // Find the main Alpine.js component and force refresh
                                            var mainElement = document.querySelector('[x-data*="classesPage"]');
                                            if (mainElement && mainElement._x_dataStack) {
                                                var component = mainElement._x_dataStack[0];
                                                if (component && typeof component.reloadClasses === 'function') {
                                                    component.reloadClasses();
                                                }
                                            }
                                        } catch (e) {
                                            console.log('Fallback refresh failed:', e);
                                        }
                                    }, 100);
                                }
                            } catch (e) {
                                console.error('Error triggering refresh:', e);
                            }
                        } else {
                            this.errorMessage = result.error || 'Import failed. Please check your file format and try again.';
                        }
                    } else {
                        // Fallback to local processing
                        await this.processFileLocally();
                    }
                } catch (error) {
                    console.error('Import error:', error);
                    this.errorMessage = 'Import failed: ' + (error.message || 'Unknown error occurred.');
                } finally {
                    this.loading = false;
                }
            },
            processFileLocally: async function () {
                var self = this;
                return new Promise(function (resolve, reject) {
                    var reader = new FileReader();
                    reader.onload = function (e) {
                        try {
                            var csv = e.target.result;
                            var lines = csv.split('\n').filter(function (line) { return line.trim(); });
                            
                            if (lines.length < 2) {
                                reject(new Error('CSV file is empty or invalid.'));
                                return;
                            }
                            
                            // Skip header row and process data
                            var imported = 0;
                            var errors = [];
                            
                            for (var i = 1; i < lines.length; i++) {
                                var line = lines[i].trim();
                                if (!line) continue;
                                
                                // Simple CSV parsing (assuming no commas in fields)
                                var fields = line.split(',');
                                if (fields.length < 2) {
                                    errors.push('Line ' + (i + 1) + ': Invalid format');
                                    continue;
                                }
                                
                                var classData = {
                                    name: fields[0] ? fields[0].trim() : '',
                                    level: fields[1] ? fields[1].trim() : '',
                                    grade: fields[2] ? fields[2].trim() : '',
                                    academic_year: fields[3] ? fields[3].trim() : '',
                                    description: fields[4] ? fields[4].trim() : '',
                                    classTeacherEmail: fields[5] ? fields[5].trim() : '',
                                    subjects: fields.slice(6).map(function (s) { return s.trim(); }).filter(function (s) { return s; })
                                };
                                
                                if (!classData.name || !classData.level) {
                                    errors.push('Line ' + (i + 1) + ': Name and level are required');
                                    continue;
                                }
                                
                                // Save class using existing store
                                if (window.ShikolaClassesStore && typeof window.ShikolaClassesStore.upsertClass === 'function') {
                                    window.ShikolaClassesStore.upsertClass(classData);
                                    imported++;
                                }
                            }
                            
                            if (imported > 0) {
                                self.successMessage = 'Successfully imported ' + imported + ' classes.' + (errors.length > 0 ? ' (' + errors.length + ' errors)' : '');
                                self.selectedFile = null;
                                var fileInput = document.querySelector('input[type="file"]');
                                if (fileInput) fileInput.value = '';
                                
                                console.log('Imported', imported, 'classes locally');
                                
                                // Trigger classes updated event to refresh the UI
                                try {
                                    if (window.ShikolaClassesStore && typeof window.ShikolaClassesStore.listClasses === 'function') {
                                        var updatedClasses = window.ShikolaClassesStore.listClasses();
                                        console.log('Triggering refresh with classes:', updatedClasses);
                                        window.dispatchEvent(new CustomEvent('shikola:classes-updated', { detail: updatedClasses }));
                                        
                                        // Fallback: Force a direct refresh after a short delay
                                        setTimeout(function() {
                                            try {
                                                // Find the main Alpine.js component and force refresh
                                                var mainElement = document.querySelector('[x-data*="classesPage"]');
                                                if (mainElement && mainElement._x_dataStack) {
                                                    var component = mainElement._x_dataStack[0];
                                                    if (component && typeof component.reloadClasses === 'function') {
                                                        component.reloadClasses();
                                                    }
                                                }
                                            } catch (e) {
                                                console.log('Fallback refresh failed:', e);
                                            }
                                        }, 100);
                                    }
                                } catch (e) {
                                    console.error('Error triggering refresh:', e);
                                }
                            } else {
                                reject(new Error('No classes were imported. ' + errors.join('; ')));
                            }
                            
                            resolve();
                        } catch (error) {
                            reject(error);
                        }
                    };
                    
                    reader.onerror = function () {
                        reject(new Error('Failed to read the file.'));
                    };
                    
                    reader.readAsText(this.selectedFile);
                });
            }
        };
    };

    try {
        if (canUseApi() && typeof window.setTimeout === 'function') {
            window.setTimeout(function () {
                try {
                    syncFromServer();
                } catch (e) {
                }
            }, 0);
        }
    } catch (e) {
    }
})();
