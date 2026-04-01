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
    var EXAMS_KEY = 'shikola_exams_v1';

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
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
        }
    }

    function listExams() {
        var list = loadJson(EXAMS_KEY, []);
        return Array.isArray(list) ? list : [];
    }

    async function fetchExamsFromServer(filters) {
        if (!canUseApi()) return null;
        var query = '';
        if (filters && typeof filters === 'object') {
            var params = [];
            if (filters.academic_year) params.push('academic_year=' + encodeURIComponent(filters.academic_year));
            if (filters.academic_term) params.push('academic_term=' + encodeURIComponent(filters.academic_term));
            if (filters.class_name) params.push('class_name=' + encodeURIComponent(filters.class_name));
            if (filters.subject) params.push('subject=' + encodeURIComponent(filters.subject));
            if (params.length) query = '?' + params.join('&');
        }
        var data = await apiRequestJson('/api/admin/exams' + query, { method: 'GET' });
        if (!Array.isArray(data)) return null;
        saveExams(data);
        return data;
    }

    function saveExams(list) {
        saveJson(EXAMS_KEY, Array.isArray(list) ? list : []);
        try {
            window.dispatchEvent(new CustomEvent('shikola:exams-updated', { detail: list || [] }));
        } catch (e) {
        }
    }

    function upsertExam(data) {
        var exam = normalizeExamPayload(data);
        var list = listExams();
        var index = list.findIndex(function (e) { return e.id === exam.id; });
        if (index >= 0) {
            list[index] = exam;
        } else {
            list.push(exam);
        }
        saveExams(list);
        return exam;
    }

    function deleteExam(id) {
        if (!id) return;
        var list = listExams();
        var filtered = list.filter(function (e) { return e.id !== id; });
        saveExams(filtered);
    }

    function findExamById(id) {
        if (!id) return null;
        var list = listExams();
        var index = list.findIndex(function (e) { return e.id === id; });
        return index >= 0 ? list[index] : null;
    }

    function normalizeExamPayload(data) {
        if (!data) data = {};
        var id = data.id || ('EXAM-' + Date.now().toString(36));
        return {
            id: id,
            academic_year: (data.academic_year || '').trim(),
            academic_term: (data.academic_term || '').trim(),
            exam_name: (data.exam_name || '').trim(),
            subject: (data.subject || '').trim(),
            class_name: (data.class_name || '').trim(),
            exam_date: data.exam_date,
            total_marks: data.total_marks ? Number(data.total_marks) : null,
            created_by: data.created_by,
            created_at: data.created_at || new Date().toISOString(),
        };
    }

    async function saveExamToServer(examPayload) {
        if (!canUseApi()) return null;
        var payload = examPayload || {};
        var isUpdate = payload.id && !payload.id.startsWith('EXAM-');
        var endpoint = isUpdate ? ('/api/admin/exams/' + encodeURIComponent(payload.id)) : '/api/admin/exams';
        var method = isUpdate ? 'PUT' : 'POST';
        var data = await apiRequestJson(endpoint, { method: method, body: JSON.stringify(payload) });
        if (!data || !data.id) return null;
        upsertExam(data);
        return data;
    }

    async function deleteExamFromServer(id) {
        if (!canUseApi() || !id) return false;
        var base = getApiBase();
        try {
            var response = await fetch(base + '/api/admin/exams/' + encodeURIComponent(id), {
                method: 'DELETE',
                headers: buildAuthHeaders()
            });
            if (response.ok) {
                deleteExam(id);
                return true;
            }
            return false;
        } catch (e) {
            return false;
        }
    }

    async function syncFromServer(filters) {
        if (!canUseApi()) return null;
        await fetchExamsFromServer(filters);
        return listExams();
    }

    window.ShikolaExamsStore = {
        listExams: listExams,
        saveExams: saveExams,
        upsertExam: upsertExam,
        deleteExam: deleteExam,
        findExamById: findExamById,
    };

    window.ShikolaExamsApi = {
        canUseApi: canUseApi,
        syncFromServer: syncFromServer,
        saveExam: saveExamToServer,
        deleteExam: deleteExamFromServer,
        fetchExams: fetchExamsFromServer,
    };
})();
