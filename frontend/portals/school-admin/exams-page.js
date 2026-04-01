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
// Load unified API client first
if (!window.ShikolaAPI) {
    console.warn('ShikolaAPI not found. Loading unified API client...');
    const script = document.createElement('script');
    script.src = '/shared/unified-api-client.js';
    document.head.appendChild(script);
}

// Legacy localStorage keys for migration
var CHAPTERS_KEY = 'shikola_exam_subject_chapters_v1';
var QUESTION_BANK_KEY = 'shikola_exam_question_bank_v1';
var EXAMS_KEY = 'shikola_exams_v1';
var QUESTION_PAPERS_KEY = 'shikola_exam_question_papers_v1';
var DATE_SHEETS_KEY = 'shikola_exam_date_sheets_v1';
var AWARD_LISTS_KEY = 'shikola_blank_award_lists_v1';
var SCHEDULES_KEY = 'shikola_exam_schedules_v1';

var MEMORY_STORE = {};

function isUuid(value) {
        if (!value) return false;
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value));
    }

function canUseApi() {
    return !!(window.ShikolaAPI && window.ShikolaAPI.exams);
}

// Check if backend is available and user has permissions
async function canUseBackendAPI() {
    try {
        if (!canUseApi()) return false;
        
        // Check if user has exam permissions
        if (!window.ShikolaAPI.auth.canAccessResource('exams', 'read')) {
            console.warn('User does not have exam management permissions');
            return false;
        }
        
        return true;
    } catch (e) {
        return false;
    }
}

// Legacy API functions - now use unified API client
async function apiGet(path, params) {
    if (!canUseApi()) return null;
    try {
        return await window.ShikolaAPI.request(path, { method: 'GET', params });
    } catch (e) {
        console.error('API GET failed:', e);
        return null;
    }
}

async function apiPost(path, body) {
    if (!canUseApi()) return null;
    try {
        return await window.ShikolaAPI.request(path, { method: 'POST', body });
    } catch (e) {
        console.error('API POST failed:', e);
        return null;
    }
}

async function apiPut(path, body) {
    if (!canUseApi()) return null;
    try {
        return await window.ShikolaAPI.request(path, { method: 'PUT', body });
    } catch (e) {
        console.error('API PUT failed:', e);
        return null;
    }
}

async function apiDel(path) {
    if (!canUseApi()) return false;
    try {
        await window.ShikolaAPI.request(path, { method: 'DELETE' });
        return true;
    } catch (e) {
        console.error('API DELETE failed:', e);
        return false;
    }
}

async function ensureSchoolProfile() {
    try {
        if (canUseApi() && window.ShikolaAPI.auth) {
            const user = await window.ShikolaAPI.auth.getCurrentUser();
            if (user && user.schoolId) {
                return {
                    schoolId: user.schoolId,
                    schoolName: user.schoolName,
                    academicYear: user.academicYear,
                    term: user.currentTerm
                };
            }
        }
        
        // Fallback to cache
        var cached = loadJson('shikola_school_profile_server_cache', null);
        if (cached && typeof cached === 'object') return cached;
        
        // Try legacy API
        var server = await apiGet('/api/admin/school-profile');
        if (server && typeof server === 'object') {
            saveJson('shikola_school_profile_server_cache', server);
            return server;
        }
    } catch (e) {
        console.error('Failed to get school profile:', e);
    }
    return null;
}

function normalizeExamForUi(exam) {
        if (!exam) return null;
        return {
            id: exam.id,
            name: exam.exam_name || '',
            term: exam.academic_term || '',
            academicYear: exam.academic_year || '',
            academicTerm: exam.academic_term || '',
            examType: '',
            startDate: exam.exam_date || '',
            endDate: exam.exam_date || '',
            status: 'draft',
            classNames: exam.class_name ? [exam.class_name] : [],
            resultPublishDate: '',
            subjects: exam.subject ? [exam.subject] : []
        };
    }

async function fetchExamsFromServer() {
    try {
        // Check if backend API is available
        if (await canUseBackendAPI()) {
            const response = await window.ShikolaAPI.exams.list();
            return response.success ? response.data : [];
        }
        
        // Check portal context for security
        if (window.location.pathname.includes('teacher-portal')) {
            console.warn('Admin API calls blocked in teacher portal');
            return [];
        }
        
        if (!window.location.pathname.includes('school-admin') && !window.location.pathname.includes('admin')) {
            console.warn('Admin functions should only run in admin portal');
            return [];
        }
        
        // Fallback to legacy API
        var data = await apiGet('/api/admin/exams');
        var list = data && Array.isArray(data) ? data : [];
        return list.map(normalizeExamForUi);
    } catch (e) {
        console.error('Failed to fetch exams from server:', e);
        return [];
    }
}

function normalizeScheduleForUi(row, examId, examName) {
        if (!row) return null;
        return {
            id: row.id,
            examId: String(row.examId || row.exam_id || examId || ''),
            examName: examName || row.examName || '',
            className: row.className || row.class_name || '',
            date: row.examDate || row.exam_date || row.date || '',
            startTime: row.startTime || row.start_time || '',
            endTime: row.endTime || row.end_time || '',
            subject: row.subjectName || row.subject_name || row.subject || '',
            room: row.venue || row.room || ''
        };
    }

async function fetchSchedulesForExam(examId) {
        if (!examId) return [];
        var exam = await apiGet('/api/admin/exams/' + encodeURIComponent(String(examId)));
        var examName = exam && exam.name ? exam.name : '';
        var schedules = exam && Array.isArray(exam.schedules) ? exam.schedules : [];
        var normalized = schedules.map(function (s) {
            return normalizeScheduleForUi(s, examId, examName);
        }).filter(Boolean);
        saveSchedules(normalized);
        return normalized;
    }

function loadJson(key, fallback) {
        if (!key) return fallback;
        if (!Object.prototype.hasOwnProperty.call(MEMORY_STORE, key)) {
            return fallback;
        }
        var value = MEMORY_STORE[key];
        return value == null ? fallback : value;
    }

function saveJson(key, value) {
        if (!key) return;
        MEMORY_STORE[key] = value;
    }

// Backend-first chapters management
async function listChapters() {
    try {
        if (await canUseBackendAPI()) {
            return await window.ShikolaAPI.exams.chapters();
        }
        
        // Fallback to localStorage
        var list = loadJson(CHAPTERS_KEY, null);
        return Array.isArray(list) ? list : [];
    } catch (e) {
        console.error('Failed to list chapters:', e);
        return [];
    }
}

async function saveChapters(list) {
    try {
        if (await canUseBackendAPI()) {
            // Backend manages chapters, just sync local cache
            var value = Array.isArray(list) ? list : [];
            saveJson(CHAPTERS_KEY, value);
            return value;
        }
        
        // Fallback to localStorage
        var value = Array.isArray(list) ? list : [];
        saveJson(CHAPTERS_KEY, value);
    } catch (e) {
        console.error('Failed to save chapters:', e);
    }
    
    try {
        window.dispatchEvent(new CustomEvent('shikola:exam-chapters-updated', { detail: list }));
    } catch (e) {
        console.error('Failed to dispatch chapters update event:', e);
    }
}

    async function upsertChapter(data) {
        try {
            if (!data) return await listChapters();
            
            if (await canUseBackendAPI()) {
                // Use backend API
                if (data.id) {
                    const result = await window.ShikolaAPI.exams.updateChapter(data.id, data);
                    if (result.success) {
                        return await listChapters();
                    }
                } else {
                    const result = await window.ShikolaAPI.exams.createChapter(data);
                    if (result.success) {
                        return await listChapters();
                    }
                }
            }
            
            // Fallback to localStorage
            var id = data.id || ('CH-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6));
            var className = (data.className || '').trim();
            var subject = (data.subject || '').trim();
            var chapterName = (data.chapterName || '').trim();
            var list = await listChapters();
            var i;
            var found = false;
            for (i = 0; i < list.length; i++) {
                if (list[i] && list[i].id === id) {
                    list[i] = {
                        id: id,
                        className: className,
                        subject: subject,
                        chapterName: chapterName
                    };
                    found = true;
                    break;
                }
            }
            if (!found) {
                list.push({
                    id: id,
                    className: className,
                    subject: subject,
                    chapterName: chapterName
                });
            }
            await saveChapters(list);
            return list;
        } catch (e) {
            console.error('Failed to upsert chapter:', e);
            return await listChapters();
        }
    }

    async function deleteChapter(id) {
        try {
            if (!id) return await listChapters();
            
            if (await canUseBackendAPI()) {
                const result = await window.ShikolaAPI.exams.deleteChapter(id);
                if (result.success) {
                    return await listChapters();
                }
            }
            
            // Fallback to localStorage
            var list = await listChapters();
            var filtered = list.filter(function (ch) {
                return ch && ch.id && ch.id !== id;
            });
            await saveChapters(filtered);
            return filtered;
        } catch (e) {
            console.error('Failed to delete chapter:', e);
            return await listChapters();
        }
    }

    function listQuestions() {
        var list = loadJson(QUESTION_BANK_KEY, null);
        return Array.isArray(list) ? list : [];
    }

    function saveQuestions(list) {
        var value = Array.isArray(list) ? list : [];
        saveJson(QUESTION_BANK_KEY, value);
        try {
            window.dispatchEvent(new CustomEvent('shikola:exam-questions-updated', { detail: value }));
        } catch (e) {
        }
    }

    function upsertQuestion(data) {
        if (!data) return listQuestions();
        var id = data.id || ('QB-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6));
        var question = (data.question || '').trim();
        var subject = (data.subject || '').trim();
        var className = (data.className || '').trim();
        var difficulty = data.difficulty || 'Any';
        var type = data.type || 'Any';
        var marks = data.marks == null ? 1 : Number(data.marks);
        if (isNaN(marks) || marks <= 0) {
            marks = 1;
        }
        var list = listQuestions();
        var i;
        var found = false;
        for (i = 0; i < list.length; i++) {
            if (list[i] && list[i].id === id) {
                list[i] = {
                    id: id,
                    question: question,
                    subject: subject,
                    className: className,
                    difficulty: difficulty,
                    type: type,
                    marks: marks
                };
                found = true;
                break;
            }
        }
        if (!found) {
            list.unshift({
                id: id,
                question: question,
                subject: subject,
                className: className,
                difficulty: difficulty,
                type: type,
                marks: marks
            });
        }
        saveQuestions(list);
        return list;
    }

    function deleteQuestion(id) {
        if (!id) return listQuestions();
        var list = listQuestions();
        var filtered = list.filter(function (q) {
            return q && q.id && q.id !== id;
        });
        saveQuestions(filtered);
        return filtered;
    }

    function listExams() {
        if (canUseApi()) {
            fetchExamsFromServer().catch(function () {});
        }
        var list = loadJson(EXAMS_KEY, []);
        return Array.isArray(list) ? list : [];
    }

    function saveExams(list) {
        var value = Array.isArray(list) ? list : [];
        saveJson(EXAMS_KEY, value);
        try {
            window.dispatchEvent(new CustomEvent('shikola:exams-updated', { detail: value }));
        } catch (e) {
        }
    }

    function upsertExam(data) {
        if (!data) return listExams();
        var id = data.id || ('EX-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6));
        var name = (data.name || '').trim();
        var term = (data.term || '').trim();
        var classNames = Array.isArray(data.classNames) ? data.classNames.slice() : [];
        var resultPublishDate = data.resultPublishDate || '';
        var startDate = data.startDate || '';
        var endDate = data.endDate || '';
        var subjects = Array.isArray(data.subjects) ? data.subjects.slice() : [];
        var status = data.status || 'draft';
        var localData = {
            id: id,
            name: name,
            term: term,
            classNames: classNames,
            resultPublishDate: resultPublishDate,
            startDate: startDate,
            endDate: endDate,
            subjects: subjects,
            status: status
        };
        if (canUseApi()) {
            (async function () {
                try {
                    var apiData = {
                        academic_year: data.academicYear || '',
                        academic_term: data.academicTerm || '',
                        exam_name: name,
                        subject: subjects.length ? subjects[0] : '',
                        class_name: classNames.length ? classNames[0] : '',
                        exam_date: startDate,
                        total_marks: null
                    };
                    if (isUuid(id)) {
                        apiData.id = id;
                    }
                    var saved = await ShikolaExamsApi.saveExam(apiData);
                    if (saved) {
                        localData.id = saved.id;
                        localData.name = saved.exam_name;
                        localData.term = saved.academic_term;
                        localData.academicYear = saved.academic_year;
                        localData.academicTerm = saved.academic_term;
                        localData.subjects = saved.subject ? [saved.subject] : [];
                        localData.classNames = saved.class_name ? [saved.class_name] : [];
                        localData.startDate = saved.exam_date;
                        localData.endDate = saved.exam_date;
                        // update the list
                        var list = listExams();
                        var index = list.findIndex(function (e) { return e.id === id; });
                        if (index >= 0) {
                            list[index] = localData;
                        } else {
                            list.unshift(localData);
                        }
                        saveExams(list);
                    }
                } catch (e) {
                }
            })();
        }
        var list = listExams();
        var index = list.findIndex(function (e) { return e.id === id; });
        if (index >= 0) {
            list[index] = localData;
        } else {
            list.unshift(localData);
        }
        saveExams(list);
        return list;
    }

    function deleteExam(id) {
        if (!id) return listExams();
        if (canUseApi()) {
            (async function () {
                try {
                    await ShikolaExamsApi.deleteExam(id);
                } catch (e) {
                }
            })();
        }
        var list = listExams();
        var filtered = list.filter(function (ex) {
            return ex && ex.id && ex.id !== id;
        });
        saveExams(filtered);
        return filtered;
    }

    function listQuestionPapers() {
        var list = loadJson(QUESTION_PAPERS_KEY, []);
        return Array.isArray(list) ? list : [];
    }

    function saveQuestionPapers(list) {
        var value = Array.isArray(list) ? list : [];
        saveJson(QUESTION_PAPERS_KEY, value);
    }

    function listDateSheets() {
        var list = loadJson(DATE_SHEETS_KEY, []);
        return Array.isArray(list) ? list : [];
    }

    function saveDateSheets(list) {
        var value = Array.isArray(list) ? list : [];
        saveJson(DATE_SHEETS_KEY, value);
    }

    function listAwardLists() {
        var list = loadJson(AWARD_LISTS_KEY, []);
        return Array.isArray(list) ? list : [];
    }

    function saveAwardLists(list) {
        var value = Array.isArray(list) ? list : [];
        saveJson(AWARD_LISTS_KEY, value);
    }

    function listSchedules() {
        var list = loadJson(SCHEDULES_KEY, []);
        return Array.isArray(list) ? list : [];
    }

    function saveSchedules(list) {
        var value = Array.isArray(list) ? list : [];
        saveJson(SCHEDULES_KEY, value);
    }

    window.ShikolaExamsStore = {
        listChapters: listChapters,
        saveChapters: saveChapters,
        upsertChapter: upsertChapter,
        deleteChapter: deleteChapter,
        listQuestions: listQuestions,
        saveQuestions: saveQuestions,
        upsertQuestion: upsertQuestion,
        deleteQuestion: deleteQuestion,
        listExams: listExams,
        saveExams: saveExams,
        upsertExam: upsertExam,
        deleteExam: deleteExam,
        listQuestionPapers: listQuestionPapers,
        saveQuestionPapers: saveQuestionPapers,
        listDateSheets: listDateSheets,
        saveDateSheets: saveDateSheets,
        listAwardLists: listAwardLists,
        saveAwardLists: saveAwardLists,
        listSchedules: listSchedules,
        saveSchedules: saveSchedules
    };

    window.questionPapersPage = function () {
        return {
            qpTab: 'subject-chapters',
            unavailable: true,
            chapters: [],
            chapterForm: {
                id: '',
                className: '',
                subject: '',
                chapterName: ''
            },
            questionBank: [],
            questionPapers: [],
            questionForm: {
                id: '',
                question: '',
                subject: '',
                className: '',
                difficulty: 'Any',
                type: 'Any',
                marks: 1
            },
            qbFilters: {
                className: '',
                subject: '',
                difficulty: 'Any',
                type: 'Any'
            },
            init: function () {
                this.chapters = [];
                this.questionBank = [];
                this.questionPapers = [];
            },
            reloadChapters: function () {
                this.chapters = [];
            },
            startNewChapter: function () {
                this.chapterForm.id = '';
                this.chapterForm.className = '';
                this.chapterForm.subject = '';
                this.chapterForm.chapterName = '';
            },
            startEditChapter: function (chapter) {
                if (!chapter) return;
                this.chapterForm.id = chapter.id || '';
                this.chapterForm.className = chapter.className || '';
                this.chapterForm.subject = chapter.subject || '';
                this.chapterForm.chapterName = chapter.chapterName || '';
            },
            saveChapterClick: function () {
                try {
                    if (!canUseApi()) {
                        alert('Chapter management requires backend connection.');
                        return;
                    }
                    // Backend API will handle chapter operations
                    alert('Chapter management is handled through the backend API.');
                } catch (e) {
                    console.error('Chapter save error:', e);
                }
            },
            deleteChapterClick: function (id) {
                try {
                    if (!canUseApi()) {
                        alert('Chapter management requires backend connection.');
                        return;
                    }
                    // Backend API will handle chapter operations
                    alert('Chapter management is handled through the backend API.');
                } catch (e) {
                    console.error('Chapter delete error:', e);
                }
            },
            reloadQuestions: function () {
                this.questionBank = [];
            },
            reloadQuestionPapers: function () {
                this.questionPapers = [];
            },
            startNewQuestion: function () {
                this.questionForm.id = '';
                this.questionForm.question = '';
                this.questionForm.subject = '';
                this.questionForm.className = '';
                this.questionForm.difficulty = 'Any';
                this.questionForm.type = 'Any';
                this.questionForm.marks = 1;
            },
            startEditQuestion: function (question) {
                if (!question) return;
                this.questionForm.id = question.id || '';
                this.questionForm.question = question.question || '';
                this.questionForm.subject = question.subject || '';
                this.questionForm.className = question.className || '';
                this.questionForm.difficulty = question.difficulty || 'Any';
                this.questionForm.type = question.type || 'Any';
                this.questionForm.marks = question.marks != null ? question.marks : 1;
            },
            saveQuestionClick: function () {
                try {
                    if (!canUseApi()) {
                        alert('Question bank requires backend connection.');
                        return;
                    }
                    // Backend API will handle question operations
                    alert('Question bank is handled through the backend API.');
                } catch (e) {
                    console.error('Question save error:', e);
                }
            },
            deleteQuestionClick: function (id) {
                try {
                    if (!canUseApi()) {
                        alert('Question bank requires backend connection.');
                        return;
                    }
                    // Backend API will handle question operations
                    alert('Question bank is handled through the backend API.');
                } catch (e) {
                    console.error('Question delete error:', e);
                }
            },
            saveQuestionPaperClick: function () {
                try {
                    if (!canUseApi()) {
                        alert('Question paper management requires backend connection.');
                        return;
                    }
                    // Backend API will handle question paper operations
                    alert('Question paper management is handled through the backend API.');
                } catch (e) {
                    console.error('Question paper save error:', e);
                }
            },
            previewQuestionPaperClick: function () {
                try {
                    if (!canUseApi()) {
                        alert('Question paper preview requires backend connection.');
                        return;
                    }
                    // Backend API will handle question paper operations
                    alert('Question paper preview is handled through the backend API.');
                } catch (e) {
                    console.error('Question paper preview error:', e);
                }
            },
            get filteredQuestionBank() {
                var list = Array.isArray(this.questionBank) ? this.questionBank.slice() : [];
                var filters = this.qbFilters || {};
                var cls = (filters.className || '').trim();
                var subj = (filters.subject || '').trim();
                var diff = filters.difficulty || 'Any';
                var type = filters.type || 'Any';
                return list.filter(function (q) {
                    if (!q) return false;
                    if (cls && q.className !== cls) return false;
                    if (subj && subj !== 'All subjects' && q.subject !== subj) return false;
                    if (diff && diff !== 'Any' && q.difficulty !== diff) return false;
                    if (type && type !== 'Any' && q.type !== type) return false;
                    return true;
                });
            },
            get classOptions() {
                var fallback = [];
                try {
                    if (window.ShikolaClassesUi && typeof window.ShikolaClassesUi.getClassOptions === 'function') {
                        var fromStore = window.ShikolaClassesUi.getClassOptions(fallback);
                        if (Array.isArray(fromStore) && fromStore.length) {
                            return fromStore;
                        }
                    }
                } catch (e) {
                }
                return fallback;
            },
            get subjectOptions() {
                var className = (this.awardForm && this.awardForm.className ? this.awardForm.className : '').trim();
                if (className && window.ShikolaClassesStore && typeof window.ShikolaClassesStore.listClassesWithSubjects === 'function') {
                    try {
                        var byClass = window.ShikolaClassesStore.listClassesWithSubjects();
                        if (Array.isArray(byClass) && byClass.length) {
                            for (var i = 0; i < byClass.length; i++) {
                                var cs = byClass[i];
                                if (cs && cs.name === className && Array.isArray(cs.subjects) && cs.subjects.length) {
                                    return cs.subjects;
                                }
                            }
                        }
                    } catch (e) {
                    }
                }
                try {
                    if (window.ShikolaClassesStore && typeof window.ShikolaClassesStore.listSubjects === 'function') {
                        var list = window.ShikolaClassesStore.listSubjects();
                        if (Array.isArray(list) && list.length) {
                            return list;
                        }
                    }
                } catch (e) {
                }
                return [];
            }
        };
    };

    window.adminResultCardPage = function () {
        return {
            examId: '',
            className: '',
            pupilId: '',
            pupils: [],
            exams: [],
            summary: null,
            loading: false,
            error: null,
            pupilName: '',
            pupilClassName: '',
            pupilAdmissionNo: '',
            init: function () {
                this.summary = null;
                this.error = null;
                this.loadExams();
                this.loadPupils();
            },
            loadExams: function () {
                var self = this;
                (async function () {
                    var list = await fetchExamsFromServer();
                    self.exams = Array.isArray(list) ? list : [];
                })();
            },
            async loadPupils() {
                var pupils = [];
                try {
                    if (window.ShikolaPupilsApi && typeof window.ShikolaPupilsApi.listPupils === 'function') {
                        pupils = await window.ShikolaPupilsApi.listPupils();
                    } else if (window.ShikolaPupilsApi && typeof window.ShikolaPupilsApi.getLocalPupils === 'function') {
                        pupils = window.ShikolaPupilsApi.getLocalPupils() || [];
                    }
                } catch (e) {
                }
                if (!Array.isArray(pupils) || !pupils.length) {
                    this.pupils = [];
                    return;
                }
                var normalized = pupils.map(function (p, index) {
                    var id = p.id || p.pupilId || p.registrationNo || ('P-' + (index + 1));
                    var name = (p.fullName || ((p.firstName || '') + ' ' + (p.lastName || ''))).trim() || (p.registrationNo || id || 'Pupil');
                    var cls = p.classLabel || p.classGrade || p.className || '';
                    var admission = p.registrationNo || p.admissionNo || '';
                    return {
                        id: String(id),
                        name: name,
                        className: cls,
                        admissionNo: admission
                    };
                });
                this.pupils = normalized;
            },
            loadSummary: function () {
                var examId = this.examId ? String(this.examId) : '';
                var pupilId = this.pupilId ? String(this.pupilId) : '';
                if (!examId || !pupilId) {
                    this.error = 'Please select exam and pupil first.';
                    this.summary = null;
                    return;
                }
                var self = this;
                (async function () {
                    self.loading = true;
                    self.error = null;
                    try {
                        var pupil = null;
                        if (Array.isArray(self.pupils) && self.pupils.length) {
                            for (var i = 0; i < self.pupils.length; i++) {
                                var p = self.pupils[i];
                                if (p && String(p.id) === pupilId) {
                                    pupil = p;
                                    break;
                                }
                            }
                        }
                        self.pupilName = pupil ? (pupil.name || 'Pupil') : 'Pupil';
                        self.pupilClassName = pupil ? (pupil.className || '') : '';
                        self.pupilAdmissionNo = pupil ? (pupil.admissionNo || '') : '';

                        var cls = (self.className || '').trim();
                        var schedules = await fetchSchedulesForExam(examId);
                        if (cls) {
                            schedules = schedules.filter(function (s) {
                                return s && String(s.className || '').trim() === cls;
                            });
                        }

                        var subjects = [];
                        var totalMarks = 0;
                        var totalMax = 0;
                        var pctSum = 0;
                        var pctCount = 0;

                        for (var si = 0; si < schedules.length; si++) {
                            var sch = schedules[si];
                            if (!sch || !sch.id || !isUuid(sch.id)) continue;
                            var results = await apiGet('/api/admin/exams/schedules/' + encodeURIComponent(String(sch.id)) + '/results');
                            if (!Array.isArray(results) || !results.length) continue;
                            var hit = null;
                            for (var ri = 0; ri < results.length; ri++) {
                                var r = results[ri];
                                if (r && String(r.pupilId) === pupilId) {
                                    hit = r;
                                    break;
                                }
                            }
                            if (!hit) continue;
                            var max = hit.totalMarks != null ? Number(hit.totalMarks) : 100;
                            var marks = hit.marksObtained != null ? Number(hit.marksObtained) : null;
                            var pct = hit.percentage != null ? Number(hit.percentage) : (marks != null && max > 0 ? (marks / max) * 100 : null);
                            if (marks != null && isFinite(marks)) totalMarks += marks;
                            if (max != null && isFinite(max)) totalMax += max;
                            if (pct != null && isFinite(pct)) {
                                pctSum += pct;
                                pctCount++;
                            }
                            subjects.push({
                                subject: hit.subjectName || sch.subject || 'Subject',
                                marksObtained: marks,
                                totalMarks: max,
                                percentage: pct,
                                grade: hit.grade || '',
                                remarks: hit.remarks || ''
                            });
                        }

                        subjects.sort(function (a, b) {
                            return String(a.subject || '').localeCompare(String(b.subject || ''));
                        });
                        var overallPct = pctCount > 0 ? (pctSum / pctCount) : (totalMax > 0 ? (totalMarks / totalMax) * 100 : 0);

                        self.summary = {
                            pupilId: pupilId,
                            pupilName: self.pupilName,
                            className: self.pupilClassName || cls,
                            totalSubjects: subjects.length,
                            totalMarks: totalMarks,
                            totalMaxMarks: totalMax,
                            overallPercentage: overallPct,
                            subjects: subjects
                        };
                    } catch (e) {
                        self.summary = null;
                        self.error = 'Unable to load result card from exam marks.';
                    }

                    try {
                        if (window.ShikolaGrading && typeof window.ShikolaGrading.applyAll === 'function') {
                            setTimeout(function () { window.ShikolaGrading.applyAll(); }, 0);
                        }
                    } catch (e) {}

                    self.loading = false;
                })();
            },
            downloadSubjectsCsvClick: function () {
                var summary = this.summary;
                if (!summary || !Array.isArray(summary.subjects) || !summary.subjects.length) {
                    try {
                        alert('Please load a result card with subject marks before downloading.');
                    } catch (e) {}
                    return;
                }

                function csvCell(val) {
                    var s = val == null ? '' : String(val);
                    if (s.indexOf('"') !== -1) {
                        s = s.replace(/"/g, '""');
                    }
                    if (s.indexOf(',') !== -1 || s.indexOf('\n') !== -1) {
                        s = '"' + s + '"';
                    }
                    return s;
                }

                var headers = ['Subject', 'Marks', 'Max Marks', 'Percentage', 'Grade', 'Remark'];
                var csv = headers.join(',') + '\n';
                var subjects = summary.subjects;

                for (var i = 0; i < subjects.length; i++) {
                    var row = subjects[i] || {};
                    var subject = row.subject || '';
                    var marks = row.marksObtained != null ? row.marksObtained : '';
                    var maxMarks = row.totalMarks != null ? row.totalMarks : '';
                    var pctNum = (row.percentage != null && isFinite(row.percentage)) ? Math.round(row.percentage) : null;
                    var pctText = pctNum != null ? (pctNum + '%') : '';

                    var grade = row.grade || '';
                    var remark = row.remarks || '';
                    try {
                        if (window.ShikolaGrading && typeof window.ShikolaGrading.getGradeForPercent === 'function' && pctNum != null) {
                            var g = window.ShikolaGrading.getGradeForPercent(pctNum);
                            if (g) {
                                if (!grade) grade = g.grade || '';
                                if (!remark) remark = g.status || '';
                            }
                        }
                    } catch (e) {}

                    var line = [
                        csvCell(subject),
                        csvCell(marks),
                        csvCell(maxMarks),
                        csvCell(pctText),
                        csvCell(grade),
                        csvCell(remark)
                    ].join(',');
                    csv += line + '\n';
                }

                try {
                    var blob = new Blob([csv], { type: 'text/csv' });
                    var url = window.URL.createObjectURL(blob);
                    var a = document.createElement('a');
                    a.href = url;
                    var baseName = (this.pupilName || 'pupil').replace(/\s+/g, '_');
                    var examIdForFile = this.examId || '';
                    a.download = 'result_card_subjects_' + (examIdForFile ? ('exam_' + examIdForFile + '_') : '') + baseName + '.csv';
                    a.click();
                    window.URL.revokeObjectURL(url);
                } catch (e) {}
            },
            saveAndPrintClick: function () {
                if (!this.summary || !this.hasResults) {
                    try {
                        alert('Please select exam and pupil with saved marks before printing.');
                    } catch (e) {
                    }
                    return;
                }
                try {
                    window.print();
                } catch (e) {
                }
            },
            get examOptions() {
                var list = Array.isArray(this.exams) ? this.exams.slice() : [];
                var className = (this.className || '').trim();
                if (className) {
                    list = list.filter(function (ex) {
                        if (!ex) return false;
                        if (!Array.isArray(ex.classNames) || !ex.classNames.length) return false;
                        return ex.classNames.indexOf(className) !== -1;
                    });
                }
                return list;
            },
            get classOptions() {
                var fallback = [];
                try {
                    if (window.ShikolaClassesUi && typeof window.ShikolaClassesUi.getClassOptions === 'function') {
                        var fromStore = window.ShikolaClassesUi.getClassOptions(fallback);
                        if (Array.isArray(fromStore) && fromStore.length) {
                            return fromStore;
                        }
                    }
                } catch (e) {
                }
                return fallback;
            },
            get pupilOptions() {
                var list = Array.isArray(this.pupils) ? this.pupils.slice() : [];
                var className = (this.className || '').trim();
                if (className) {
                    list = list.filter(function (p) {
                        return p && String(p.className) === className;
                    });
                }
                return list;
            },
            get subjects() {
                return this.summary && Array.isArray(this.summary.subjects) ? this.summary.subjects : [];
            },
            get hasResults() {
                return this.subjects.length > 0;
            },
            get totalSubjects() {
                if (!this.summary) return 0;
                if (typeof this.summary.totalSubjects === 'number') return this.summary.totalSubjects;
                return this.subjects.length;
            },
            get overallPercentage() {
                if (!this.summary || this.summary.overallPercentage == null) return '--';
                var p = this.summary.overallPercentage;
                if (!isFinite(p)) return '--';
                var rounded = Math.round(p * 10) / 10;
                return rounded.toFixed(1) + '%';
            },
            get resultLabel() {
                if (!this.summary || this.summary.overallPercentage == null) return '--';
                var p = this.summary.overallPercentage;
                if (!isFinite(p)) return '--';
                return p >= 40 ? 'PASS' : 'FAIL';
            }
        };
    };

    window.adminResultSheetPage = function () {
        return {
            filters: {
                examId: '',
                examType: '',
                className: '',
                orderBy: 'high'
            },
            rows: [],
            loading: false,
            error: null,
            exams: [],
            init: function () {
                this.rows = [];
                var self = this;
                (async function () {
                    var list = await fetchExamsFromServer();
                    self.exams = Array.isArray(list) ? list : [];
                })();
            },
            loadSheetClick: function () {
                var self = this;
                (async function () {
                    var examId = self.filters.examId || '';
                    var examType = (self.filters.examType || '').trim();
                    var className = (self.filters.className || '').trim();
                    if (!className || (!examId && !examType)) {
                        self.error = 'Please select class and at least exam or exam type first.';
                        return;
                    }

                    self.loading = true;
                    self.error = null;
                    self.rows = [];

                    try {
                        if (!examId && examType) {
                            var exams = Array.isArray(self.exams) ? self.exams : [];
                            for (var exi = 0; exi < exams.length; exi++) {
                                var ex = exams[exi];
                                if (!ex || !ex.examType) continue;
                                if (String(ex.examType).toLowerCase().indexOf(String(examType).toLowerCase()) !== -1) {
                                    examId = ex.id;
                                    break;
                                }
                            }
                        }
                        if (!examId) {
                            self.error = 'Please select an exam to load a result sheet.';
                            self.loading = false;
                            return;
                        }

                        var schedules = await fetchSchedulesForExam(String(examId));
                        schedules = Array.isArray(schedules) ? schedules.filter(function (s) {
                            return s && String(s.className || '').trim() === className;
                        }) : [];

                        var byPupil = {};
                        for (var si = 0; si < schedules.length; si++) {
                            var sch = schedules[si];
                            if (!sch || !sch.id || !isUuid(sch.id)) continue;
                            var results = await apiGet('/api/admin/exams/schedules/' + encodeURIComponent(String(sch.id)) + '/results');
                            if (!Array.isArray(results) || !results.length) continue;
                            for (var ri = 0; ri < results.length; ri++) {
                                var r = results[ri];
                                if (!r || !r.pupilId) continue;
                                var pid = String(r.pupilId);
                                if (!byPupil[pid]) {
                                    byPupil[pid] = {
                                        pupilId: pid,
                                        pupilName: r.pupilName || '',
                                        totalMarks: 0,
                                        totalMaxMarks: 0,
                                        subjects: []
                                    };
                                }
                                var entry = byPupil[pid];
                                var max = r.totalMarks != null ? Number(r.totalMarks) : 100;
                                var marks = r.marksObtained != null ? Number(r.marksObtained) : null;
                                if (marks != null && isFinite(marks)) entry.totalMarks += marks;
                                if (max != null && isFinite(max)) entry.totalMaxMarks += max;
                                var pct = r.percentage != null ? Number(r.percentage) : (marks != null && max > 0 ? (marks / max) * 100 : null);
                                var grade = r.grade || '';
                                if (!grade && pct != null && isFinite(pct)) {
                                    if (pct >= 80) grade = 'A';
                                    else if (pct >= 70) grade = 'B';
                                    else if (pct >= 60) grade = 'C';
                                    else if (pct >= 50) grade = 'D';
                                    else if (pct >= 40) grade = 'E';
                                    else grade = 'F';
                                }
                                entry.subjects.push({
                                    subject: r.subjectName || sch.subject || 'Subject',
                                    grade: grade
                                });
                            }
                        }

                        var rows = [];
                        for (var pid in byPupil) {
                            if (!Object.prototype.hasOwnProperty.call(byPupil, pid)) continue;
                            var p = byPupil[pid];
                            var pctAll = p.totalMaxMarks > 0 ? (p.totalMarks / p.totalMaxMarks) * 100 : 0;
                            var subjectsSummary = (p.subjects || []).map(function (s) {
                                return s.grade ? (s.subject + ' (' + s.grade + ')') : s.subject;
                            }).join(', ');
                            rows.push({
                                pupilId: p.pupilId,
                                pupilName: p.pupilName,
                                subjectsSummary: subjectsSummary,
                                totalMarks: p.totalMarks,
                                totalMaxMarks: p.totalMaxMarks,
                                overallPercentage: pctAll,
                                position: 0,
                                examNo: '',
                                resultLabel: pctAll >= 40 ? 'PASS' : 'FAIL'
                            });
                        }

                        var order = self.filters.orderBy || 'high';
                        rows.sort(function (a, b) {
                            return order === 'low' ? (a.overallPercentage - b.overallPercentage) : (b.overallPercentage - a.overallPercentage);
                        });
                        for (var idx = 0; idx < rows.length; idx++) {
                            rows[idx].position = idx + 1;
                            rows[idx].examNo = 'EXM-' + (idx + 1);
                        }

                        self.rows = rows;
                    } catch (e) {
                        self.error = 'Unable to load result sheet from exam marks.';
                        self.rows = [];
                    }

                    self.loading = false;
                })();
            },
            printSheetClick: function () {
                var hasRows = Array.isArray(this.rows) && this.rows.length > 0;
                if (!hasRows) {
                    try {
                        alert('Please load a result sheet before printing.');
                    } catch (e) {
                    }
                    return;
                }
                try {
                    window.print();
                } catch (e) {
                }
            },
            downloadSheetClick: function () {
                var rows = Array.isArray(this.rows) ? this.rows : [];
                if (!rows.length) {
                    try {
                        alert('Please load a result sheet before downloading.');
                    } catch (e) {
                    }
                    return;
                }
                function csvCell(val) {
                    var s = val == null ? '' : String(val);
                    if (s.indexOf('"') !== -1) {
                        s = s.replace(/"/g, '""');
                    }
                    if (s.indexOf(',') !== -1 || s.indexOf('\n') !== -1) {
                        s = '"' + s + '"';
                    }
                    return s;
                }
                var headers = ['Exam No.', 'Pupil Name', 'Subjects & Grades', 'Total Marks', 'Overall %', 'Position', 'Result'];
                var csv = headers.join(',') + '\n';
                for (var i = 0; i < rows.length; i++) {
                    var r = rows[i] || {};
                    var examNo = r.examNo || ('EXM-' + (r.position || (i + 1)));
                    var pupilName = r.pupilName || '';
                    var subjectsSummary = r.subjectsSummary || '';
                    var totalText = (r.totalMarks || 0) + ' / ' + (r.totalMaxMarks || 0);
                    var pctText = String(Math.round(r.overallPercentage || 0)) + '%';
                    var position = r.position || '';
                    var result = r.resultLabel || '';
                    var line = [
                        csvCell(examNo),
                        csvCell(pupilName),
                        csvCell(subjectsSummary),
                        csvCell(totalText),
                        csvCell(pctText),
                        csvCell(position),
                        csvCell(result)
                    ].join(',');
                    csv += line + '\n';
                }
                try {
                    var blob = new Blob([csv], { type: 'text/csv' });
                    var url = window.URL.createObjectURL(blob);
                    var a = document.createElement('a');
                    a.href = url;
                    var examId = this.filters.examId || '';
                    var examType = (this.filters.examType || '').trim() || 'all';
                    var className = (this.filters.className || 'class').replace(/\s+/g, '_');
                    var safeExam = examId ? ('exam_' + examId) : ('type_' + examType);
                    a.download = 'result_sheet_' + safeExam + '_' + className + '.csv';
                    a.click();
                    window.URL.revokeObjectURL(url);
                } catch (e) {
                }
            },
            get examOptions() {
                var list = Array.isArray(this.exams) ? this.exams.slice() : [];
                var className = (this.filters.className || '').trim();
                if (className) {
                    list = list.filter(function (ex) {
                        if (!ex) return false;
                        if (!Array.isArray(ex.classNames) || !ex.classNames.length) return false;
                        return ex.classNames.indexOf(className) !== -1;
                    });
                }
                return list;
            },
            get classOptions() {
                var fallback = [];
                try {
                    if (window.ShikolaClassesUi && typeof window.ShikolaClassesUi.getClassOptions === 'function') {
                        var fromStore = window.ShikolaClassesUi.getClassOptions(fallback);
                        if (Array.isArray(fromStore) && fromStore.length) {
                            return fromStore;
                        }
                    }
                } catch (e) {
                }
                return fallback;
            }
        };
    };

    window.examSchedulePage = function () {
        return {
            filters: {
                examId: '',
                className: '',
                viewAs: 'list'
            },
            form: {
                date: '',
                startTime: '',
                endTime: '',
                subject: '',
                room: ''
            },
            schedules: [],
            exams: [],
            init: async function () {
                this.exams = await fetchExamsFromServer();
                this.schedules = [];
                var self = this;
                try {
                    this.$watch('filters.examId', function () { self.reloadSchedules(); });
                } catch (e) {
                }
                this.reloadSchedules();
            },
            reloadSchedules: async function () {
                var examId = this.filters.examId ? String(this.filters.examId) : '';
                if (!examId) {
                    this.schedules = [];
                    return;
                }
                this.schedules = await fetchSchedulesForExam(examId);
            },
            addEntryClick: function () {
                var examId = this.filters.examId || '';
                var className = (this.filters.className || '').trim();
                var date = (this.form.date || '').trim();
                var startTime = (this.form.startTime || '').trim();
                var endTime = (this.form.endTime || '').trim();
                var subject = (this.form.subject || '').trim();
                var room = (this.form.room || '').trim();
                if (!examId || !className || !date || !startTime) {
                    try {
                        alert('Please select exam, class, date and start time before adding an entry.');
                    } catch (e) {
                    }
                    return;
                }
                var examName = '';
                var exams = Array.isArray(this.exams) ? this.exams : [];
                for (var i = 0; i < exams.length; i++) {
                    var ex = exams[i];
                    if (ex && String(ex.id) === String(examId)) {
                        examName = ex.name || '';
                        break;
                    }
                }
                var list = Array.isArray(this.schedules) ? this.schedules.slice() : [];
                list.push({
                    id: 'SCH-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6),
                    examId: String(examId),
                    examName: examName,
                    className: className,
                    date: date,
                    startTime: startTime,
                    endTime: endTime,
                    subject: subject,
                    room: room
                });
                this.schedules = list;
                this.form.subject = '';
                this.form.room = '';
            },
            saveScheduleClick: async function () {
                var examId = this.filters.examId ? String(this.filters.examId) : '';
                if (!examId) return;
                var list = Array.isArray(this.schedules) ? this.schedules.slice() : [];
                for (var i = 0; i < list.length; i++) {
                    var row = list[i];
                    if (!row) continue;
                    if (String(row.examId || '') !== examId) continue;
                    if (row.id && isUuid(row.id)) continue;
                    var payload = {
                        className: row.className,
                        subjectName: row.subject,
                        examDate: row.date,
                        startTime: row.startTime || null,
                        endTime: row.endTime || null,
                        totalMarks: 100,
                        venue: row.room || null
                    };
                    var saved = await apiPost('/api/admin/exams/' + encodeURIComponent(examId) + '/schedules', payload);
                    if (saved && saved.id) {
                        list[i] = normalizeScheduleForUi(saved, examId, row.examName || '');
                    }
                }
                this.schedules = list;
                await this.reloadSchedules();
                try {
                    if (window.showNotification) {
                        window.showNotification('Exam schedule saved.', 'success');
                    } else {
                        alert('Exam schedule saved.');
                    }
                } catch (e) {
                }
            },
            get examOptions() {
                var list = Array.isArray(this.exams) ? this.exams.slice() : [];
                var className = (this.filters.className || '').trim();
                if (className) {
                    list = list.filter(function (ex) {
                        if (!ex) return false;
                        if (!Array.isArray(ex.classNames) || !ex.classNames.length) return false;
                        return ex.classNames.indexOf(className) !== -1;
                    });
                }
                return list;
            },
            get classOptions() {
                var fallback = [];
                try {
                    if (window.ShikolaClassesUi && typeof window.ShikolaClassesUi.getClassOptions === 'function') {
                        var fromStore = window.ShikolaClassesUi.getClassOptions(fallback);
                        if (Array.isArray(fromStore) && fromStore.length) {
                            return fromStore;
                        }
                    }
                } catch (e) {
                }
                return fallback;
            },
            get visibleEntries() {
                var list = Array.isArray(this.schedules) ? this.schedules.slice() : [];
                var examId = this.filters.examId ? String(this.filters.examId) : '';
                var className = (this.filters.className || '').trim();
                if (examId) {
                    list = list.filter(function (r) {
                        return r && String(r.examId) === examId;
                    });
                }
                if (className) {
                    list = list.filter(function (r) {
                        return r && String(r.className) === className;
                    });
                }
                var mode = this.filters.viewAs || 'list';
                if (mode === 'date') {
                    list.sort(function (a, b) {
                        var ad = a.date || '';
                        var bd = b.date || '';
                        if (ad === bd) {
                            var at = a.startTime || '';
                            var bt = b.startTime || '';
                            return at.localeCompare(bt);
                        }
                        return ad.localeCompare(bd);
                    });
                } else if (mode === 'class') {
                    list.sort(function (a, b) {
                        var ac = a.className || '';
                        var bc = b.className || '';
                        if (ac === bc) {
                            var ad2 = a.date || '';
                            var bd2 = b.date || '';
                            if (ad2 === bd2) {
                                var at2 = a.startTime || '';
                                var bt2 = b.startTime || '';
                                return at2.localeCompare(bt2);
                            }
                            return ad2.localeCompare(bd2);
                        }
                        return ac.localeCompare(bc);
                    });
                }
                return list;
            }
        };
    };

    window.createExamPage = function () {
        return {
            exams: [],
            searchQuery: '',
            examForm: {
                id: '',
                name: '',
                term: '',
                classNames: [],
                resultPublishDate: '',
                startDate: '',
                endDate: '',
                subjects: []
            },
            init: async function () {
                await this.reloadExams();
                this.resetForm();
            },
            reloadExams: async function () {
                var list = await fetchExamsFromServer();
                this.exams = Array.isArray(list) ? list : [];
            },
            resetForm: function () {
                this.examForm.id = '';
                this.examForm.name = '';
                this.examForm.term = '';
                this.examForm.classNames = [];
                this.examForm.resultPublishDate = '';
                this.examForm.startDate = '';
                this.examForm.endDate = '';
                this.examForm.subjects = [
                    {
                        id: 'SUB-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6),
                        name: '',
                        maxMarks: 100,
                        passMarks: 40
                    }
                ];
            },
            addSubjectRow: function () {
                if (!Array.isArray(this.examForm.subjects)) {
                    this.examForm.subjects = [];
                }
                this.examForm.subjects.push({
                    id: 'SUB-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6),
                    name: '',
                    maxMarks: 100,
                    passMarks: 40
                });
            },
            startEditExam: function (exam) {
                if (!exam) return;
                this.examForm.id = exam.id || '';
                this.examForm.name = exam.name || '';
                this.examForm.term = exam.term || '';
                this.examForm.classNames = Array.isArray(exam.classNames) ? exam.classNames.slice() : [];
                this.examForm.resultPublishDate = exam.resultPublishDate || '';
                this.examForm.startDate = exam.startDate || '';
                this.examForm.endDate = exam.endDate || '';
                var srcSubjects = Array.isArray(exam.subjects) && exam.subjects.length ? exam.subjects : [];
                if (!srcSubjects.length) {
                    this.examForm.subjects = [
                        {
                            id: 'SUB-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6),
                            name: '',
                            maxMarks: 100,
                            passMarks: 40
                        }
                    ];
                } else {
                    this.examForm.subjects = srcSubjects.map(function (s, idx) {
                        var id = s && s.id ? s.id : ('SUB-' + Date.now().toString(36) + '-' + idx.toString(36));
                        var name = (s && s.name ? s.name : '').trim();
                        var maxMarks = s && s.maxMarks != null ? Number(s.maxMarks) : 0;
                        var passMarks = s && s.passMarks != null ? Number(s.passMarks) : 0;
                        if (!isFinite(maxMarks) || maxMarks < 0) maxMarks = 0;
                        if (!isFinite(passMarks) || passMarks < 0) passMarks = 0;
                        return {
                            id: id,
                            name: name,
                            maxMarks: maxMarks,
                            passMarks: passMarks
                        };
                    });
                }
            },
            removeSubjectRow: function (index) {
                if (!Array.isArray(this.examForm.subjects)) return;
                if (this.examForm.subjects.length <= 1) return;
                if (index < 0 || index >= this.examForm.subjects.length) return;
                this.examForm.subjects.splice(index, 1);
            },
            saveExam: async function (status) {
                var form = this.examForm || {};
                var name = (form.name || '').trim();
                if (!name) {
                    try {
                        if (window.showNotification) {
                            window.showNotification('Exam name is required.', 'error');
                        } else {
                            alert('Exam name is required.');
                        }
                    } catch (e) {}
                    return;
                }
                var classNames = Array.isArray(form.classNames) ? form.classNames.slice() : [];
                if (!classNames.length) {
                    try {
                        if (window.showNotification) {
                            window.showNotification('At least one class must be selected.', 'error');
                        } else {
                            alert('At least one class must be selected.');
                        }
                    } catch (e) {}
                    return;
                }
                var resultPublishDate = form.resultPublishDate || '';
                var startDate = form.startDate || '';
                var endDate = form.endDate || '';
                var term = form.term || '';
                var subjects = Array.isArray(form.subjects) ? form.subjects.map(function (s, idx) {
                    var id = s && s.id ? s.id : ('SUB-' + Date.now().toString(36) + '-' + idx.toString(36));
                    var name = (s && s.name ? s.name : '').trim();
                    var maxMarks = s && s.maxMarks != null ? Number(s.maxMarks) : 0;
                    var passMarks = s && s.passMarks != null ? Number(s.passMarks) : 0;
                    if (!isFinite(maxMarks) || maxMarks < 0) maxMarks = 0;
                    if (!isFinite(passMarks) || passMarks < 0) passMarks = 0;
                    return {
                        id: id,
                        name: name,
                        maxMarks: maxMarks,
                        passMarks: passMarks
                    };
                }) : [];
                var profile = await ensureSchoolProfile();
                var academicYear = profile && profile.academicYear ? profile.academicYear : '';
                var academicTerm = term || (profile && profile.currentTerm ? profile.currentTerm : '');
                var examStatus = status === 'scheduled' ? 'Scheduled' : 'Draft';
                var apiPayload = {
                    name: name,
                    examType: 'Term Exam',
                    academicYear: academicYear,
                    academicTerm: academicTerm,
                    startDate: startDate || null,
                    endDate: endDate || null,
                    status: examStatus,
                    description: null,
                    metadata: {
                        classNames: classNames,
                        resultPublishDate: resultPublishDate,
                        subjects: subjects
                    }
                };

                var saved = null;
                if (form.id && isUuid(form.id)) {
                    saved = await apiPut('/api/admin/exams/' + encodeURIComponent(String(form.id)), apiPayload);
                } else {
                    saved = await apiPost('/api/admin/exams', apiPayload);
                }

                if (!saved || !saved.id) {
                    if (window.showNotification) {
                        window.showNotification('Failed to save exam.', 'error');
                    }
                    return;
                }

                await this.reloadExams();
                if (window.showNotification) {
                    var verb = examStatus === 'Scheduled' ? 'scheduled' : 'saved';
                    window.showNotification('Exam ' + verb + ' successfully.', 'success');
                }
                this.resetForm();
            },
            deleteExamClick: function (exam) {
                if (!exam || !exam.id) return;
                try {
                    if (!confirm('Delete this exam? This will not delete any existing marks, but will remove it from future exam lists.')) {
                        return;
                    }
                } catch (e) {
                }
                var self = this;
                (async function () {
                    var ok = await apiDel('/api/admin/exams/' + encodeURIComponent(String(exam.id)));
                    if (ok) {
                        await self.reloadExams();
                        if (self.examForm && self.examForm.id && String(self.examForm.id) === String(exam.id)) {
                            self.resetForm();
                        }
                    }
                })();
            },
            unpublishExam: function (exam) {
                if (!exam || !exam.id) return;
                var self = this;
                (async function () {
                    var profile = await ensureSchoolProfile();
                    var academicYear = profile && profile.academicYear ? profile.academicYear : '';
                    var academicTerm = exam.term || (profile && profile.currentTerm ? profile.currentTerm : '');
                    var apiPayload = {
                        name: exam.name || '',
                        examType: exam.examType || 'Term Exam',
                        academicYear: academicYear,
                        academicTerm: academicTerm,
                        startDate: exam.startDate || null,
                        endDate: exam.endDate || null,
                        status: 'Draft',
                        description: null,
                        metadata: {
                            classNames: Array.isArray(exam.classNames) ? exam.classNames.slice() : [],
                            resultPublishDate: exam.resultPublishDate || '',
                            subjects: Array.isArray(exam.subjects) ? exam.subjects.slice() : []
                        }
                    };
                    var saved = await apiPut('/api/admin/exams/' + encodeURIComponent(String(exam.id)), apiPayload);
                    if (saved && saved.id) {
                        await self.reloadExams();
                    }
                })();
            },
            get subjectOptions() {
                var selectedClasses = Array.isArray(this.examForm.classNames) ? this.examForm.classNames : [];
                if (selectedClasses.length && window.ShikolaClassesStore && typeof window.ShikolaClassesStore.listClassesWithSubjects === 'function') {
                    try {
                        var byClass = window.ShikolaClassesStore.listClassesWithSubjects();
                        if (Array.isArray(byClass) && byClass.length) {
                            var seen = {};
                            var subjects = [];
                            for (var i = 0; i < byClass.length; i++) {
                                var cs = byClass[i];
                                if (!cs || !cs.name) continue;
                                if (selectedClasses.indexOf(cs.name) === -1) continue;
                                if (!Array.isArray(cs.subjects) || !cs.subjects.length) continue;
                                for (var j = 0; j < cs.subjects.length; j++) {
                                    var s = cs.subjects[j];
                                    if (s == null) continue;
                                    var text = String(s).trim();
                                    if (!text || seen[text]) continue;
                                    seen[text] = true;
                                    subjects.push(text);
                                }
                            }
                            if (subjects.length) {
                                return subjects;
                            }
                        }
                    } catch (e) {
                    }
                }
                try {
                    if (window.ShikolaClassesStore && typeof window.ShikolaClassesStore.listSubjects === 'function') {
                        var list = window.ShikolaClassesStore.listSubjects();
                        if (Array.isArray(list) && list.length) {
                            return list;
                        }
                    }
                } catch (e) {
                }
                return [];
            },
            get filteredExams() {
                var list = Array.isArray(this.exams) ? this.exams.slice() : [];
                var q = (this.searchQuery || '').toLowerCase().trim();
                if (!q) return list;
                return list.filter(function (ex) {
                    if (!ex) return false;
                    var name = (ex.name || '').toLowerCase();
                    var term = (ex.term || '').toLowerCase();
                    var status = (ex.status || '').toLowerCase();
                    var classes = Array.isArray(ex.classNames) ? ex.classNames.join(' ').toLowerCase() : '';
                    return name.indexOf(q) !== -1 || term.indexOf(q) !== -1 || status.indexOf(q) !== -1 || classes.indexOf(q) !== -1;
                });
            },
            get classOptions() {
                var fallback = [];
                try {
                    if (window.ShikolaClassesUi && typeof window.ShikolaClassesUi.getClassOptions === 'function') {
                        var fromStore = window.ShikolaClassesUi.getClassOptions(fallback);
                        if (Array.isArray(fromStore) && fromStore.length) {
                            return fromStore;
                        }
                    }
                } catch (e) {
                }
                return fallback;
            }
        };
    };

    window.dateSheetPage = function () {
        return {
            examId: '',
            className: '',
            includeWeekends: 'Yes',
            dateSheets: [],
            schedules: [],
            exams: [],
            init: function () {
                this.reloadDateSheets();
                var self = this;
                (async function () {
                    var list = await fetchExamsFromServer();
                    self.exams = Array.isArray(list) ? list : [];
                    try {
                        self.$watch('examId', function () { self.reloadSchedules(); });
                    } catch (e) {
                    }
                    self.reloadSchedules();
                })();
            },
            reloadDateSheets: function () {
                this.dateSheets = [];
            },
            reloadSchedules: function () {
                var self = this;
                (async function () {
                    var examId = self.examId ? String(self.examId) : '';
                    if (!examId) {
                        self.schedules = [];
                        return;
                    }
                    self.schedules = await fetchSchedulesForExam(examId);
                })();
            },
            saveDateSheetClick: function () {
                var examId = this.examId || '';
                var className = (this.className || '').trim();
                if (!examId || !className) {
                    return;
                }
                var examName = '';
                var exams = Array.isArray(this.exams) ? this.exams : [];
                for (var i = 0; i < exams.length; i++) {
                    if (exams[i] && String(exams[i].id) === String(examId)) {
                        examName = exams[i].name || '';
                        break;
                    }
                }
                var list = Array.isArray(this.dateSheets) ? this.dateSheets.slice() : [];
                var record = {
                    id: 'DS-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6),
                    examId: examId,
                    examName: examName,
                    className: className,
                    includeWeekends: this.includeWeekends === 'Yes',
                    createdAt: new Date().toISOString()
                };
                list.unshift(record);
                this.dateSheets = list;
                try {
                    alert('Date sheet saved for ' + (examName || 'selected exam') + ' - ' + className + '.');
                } catch (e) {
                }
            },
            printDateSheetClick: function () {
                try {
                    if (confirm('Print the current date sheet view for pupils and guardians?')) {
                        window.print();
                    }
                } catch (e) {
                }
            },
            downloadCsvClick: function () {
                var examId = this.examId || '';
                var className = (this.className || '').trim();
                var rows = this.visibleEntries || [];
                if (!examId || !className || !rows.length) {
                    try {
                        alert('Please select exam and class and ensure date sheet entries exist before downloading.');
                    } catch (e) {
                    }
                    return;
                }
                function csvCell(val) {
                    var s = val == null ? '' : String(val);
                    if (s.indexOf('"') !== -1) {
                        s = s.replace(/"/g, '""');
                    }
                    if (s.indexOf(',') !== -1 || s.indexOf('\n') !== -1) {
                        s = '"' + s + '"';
                    }
                    return s;
                }
                var headers = ['Date', 'Day', 'Subject', 'Time', 'Class', 'Room'];
                var csv = headers.join(',') + '\n';
                for (var i = 0; i < rows.length; i++) {
                    var r = rows[i] || {};
                    var d = r.date || '';
                    var day = '';
                    if (d) {
                        try {
                            day = new Date(d).toLocaleDateString(undefined, { weekday: 'long' });
                        } catch (e) {
                        }
                    }
                    var time = (r.startTime || '') + (r.endTime ? ' - ' + r.endTime : '');
                    var line = [
                        csvCell(d),
                        csvCell(day),
                        csvCell(r.subject || ''),
                        csvCell(time),
                        csvCell(r.className || ''),
                        csvCell(r.room || '')
                    ].join(',');
                    csv += line + '\n';
                }
                try {
                    var blob = new Blob([csv], { type: 'text/csv' });
                    var url = window.URL.createObjectURL(blob);
                    var a = document.createElement('a');
                    a.href = url;
                    var safeClass = className.replace(/\s+/g, '_');
                    a.download = 'date_sheet_exam_' + examId + '_' + safeClass + '.csv';
                    a.click();
                    window.URL.revokeObjectURL(url);
                } catch (e) {
                }
            },
            get examOptions() {
                var list = Array.isArray(this.exams) ? this.exams.slice() : [];
                var className = (this.className || '').trim();
                if (className) {
                    list = list.filter(function (ex) {
                        if (!ex) return false;
                        if (!Array.isArray(ex.classNames) || !ex.classNames.length) return false;
                        return ex.classNames.indexOf(className) !== -1;
                    });
                }
                return list;
            },
            get classOptions() {
                var fallback = [];
                try {
                    if (window.ShikolaClassesUi && typeof window.ShikolaClassesUi.getClassOptions === 'function') {
                        var fromStore = window.ShikolaClassesUi.getClassOptions(fallback);
                        if (Array.isArray(fromStore) && fromStore.length) {
                            return fromStore;
                        }
                    }
                } catch (e) {
                }
                return fallback;
            },
            get visibleEntries() {
                var list = Array.isArray(this.schedules) ? this.schedules.slice() : [];
                var examId = this.examId ? String(this.examId) : '';
                var className = (this.className || '').trim();
                if (examId) {
                    list = list.filter(function (r) {
                        return r && String(r.examId) === examId;
                    });
                }
                if (className) {
                    list = list.filter(function (r) {
                        return r && String(r.className) === className;
                    });
                }
                list.sort(function (a, b) {
                    var ad = a.date || '';
                    var bd = b.date || '';
                    if (ad === bd) {
                        var at = a.startTime || '';
                        var bt = b.startTime || '';
                        return at.localeCompare(bt);
                    }
                    return ad.localeCompare(bd);
                });
                return list;
            }
        };
    };

    window.blankAwardListPage = function () {
        return {
            awardForm: {
                examId: '',
                className: '',
                subject: '',
                includeAdmissionNo: true,
                includeName: true,
                includeMarks: true,
                includeRemarks: false,
                rowCount: 30
            },
            previewRows: [],
            awardLists: [],
            init: function () {
                this.reloadAwardLists();
                var self = this;
                this.exams = [];
                (async function () {
                    var list = await fetchExamsFromServer();
                    self.exams = Array.isArray(list) ? list : [];
                })();
                try {
                    this.$watch('awardForm.examId', function () { self.refreshPreviewRows(); });
                    this.$watch('awardForm.className', function () { self.refreshPreviewRows(); });
                    this.$watch('awardForm.subject', function () { self.refreshPreviewRows(); });
                } catch (e) {
                }
            },
            reloadAwardLists: function () {
                this.awardLists = [];
            },
            refreshPreviewRows: async function () {
                var form = this.awardForm || {};
                var className = (form.className || '').trim();
                var subject = (form.subject || '').trim();
                if (!className || !subject) {
                    this.previewRows = [];
                    return;
                }
                var pupils = [];
                try {
                    if (window.ShikolaPupilsApi && typeof window.ShikolaPupilsApi.listPupils === 'function') {
                        pupils = await window.ShikolaPupilsApi.listPupils();
                    } else if (window.ShikolaPupilsApi && typeof window.ShikolaPupilsApi.getLocalPupils === 'function') {
                        pupils = window.ShikolaPupilsApi.getLocalPupils() || [];
                    }
                } catch (e) {
                    pupils = [];
                }
                var filtered = Array.isArray(pupils) ? pupils.filter(function (p) {
                    var cls = p && (p.classLabel || p.classGrade || p.className || '');
                    return String(cls || '') === className;
                }) : [];
                this.previewRows = filtered.slice(0, 20).map(function (p, idx) {
                    var name = (p.fullName || ((p.firstName || '') + ' ' + (p.lastName || ''))).trim() || 'Pupil';
                    var examNo = 'EXM-' + String(idx + 1).padStart(4, '0');
                    return { examNo: examNo, pupilName: name, subject: subject };
                });
            },
            saveAndDownloadClick: function () {
                var form = this.awardForm || {};
                var examId = form.examId || '';
                var className = (form.className || '').trim();
                var subject = (form.subject || '').trim();
                if (!examId || !className || !subject) {
                    return;
                }
                try {
                    if (!confirm('Generate and download a blank award list for manual entry of marks?')) {
                        return;
                    }
                } catch (e) {
                }
                var examName = '';
                var exams = Array.isArray(this.exams) ? this.exams : [];
                for (var i = 0; i < exams.length; i++) {
                    if (exams[i] && String(exams[i].id) === String(examId)) {
                        examName = exams[i].name || '';
                        break;
                    }
                }
                var headers = [];
                if (form.includeAdmissionNo) headers.push('Admission No.');
                if (form.includeName) headers.push('Name');
                if (form.includeMarks) headers.push('Marks');
                if (form.includeRemarks) headers.push('Remarks');
                if (!headers.length) {
                    headers = ['Admission No.', 'Name', 'Marks'];
                }
                var csv = headers.join(',') + '\n';
                var rows = Number(form.rowCount || 0);
                if (!isFinite(rows) || rows <= 0) rows = 30;
                for (var r = 0; r < rows; r++) {
                    var emptyRow = new Array(headers.length).fill('');
                    csv += emptyRow.join(',') + '\n';
                }
                var record = {
                    id: 'AW-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6),
                    examId: examId,
                    examName: examName,
                    className: className,
                    subject: subject,
                    columns: {
                        admissionNo: !!form.includeAdmissionNo,
                        name: !!form.includeName,
                        marks: !!form.includeMarks,
                        remarks: !!form.includeRemarks
                    },
                    rowCount: rows,
                    createdAt: new Date().toISOString()
                };
                var list = Array.isArray(this.awardLists) ? this.awardLists.slice() : [];
                list.unshift(record);
                this.awardLists = list;
                try {
                    var blob = new Blob([csv], { type: 'text/csv' });
                    var url = window.URL.createObjectURL(blob);
                    var a = document.createElement('a');
                    a.href = url;
                    var safeExam = examName ? examName.replace(/\s+/g, '_') : 'exam';
                    var safeClass = className ? className.replace(/\s+/g, '_') : 'class';
                    var safeSubject = subject ? subject.replace(/\s+/g, '_') : 'subject';
                    a.download = 'blank_award_list_' + safeExam + '_' + safeClass + '_' + safeSubject + '.csv';
                    a.click();
                    window.URL.revokeObjectURL(url);
                } catch (e) {
                }
            },
            get examOptions() {
                return Array.isArray(this.exams) ? this.exams : [];
            },
            get classOptions() {
                var fallback = [];
                try {
                    if (window.ShikolaClassesUi && typeof window.ShikolaClassesUi.getClassOptions === 'function') {
                        var fromStore = window.ShikolaClassesUi.getClassOptions(fallback);
                        if (Array.isArray(fromStore) && fromStore.length) {
                            return fromStore;
                        }
                    }
                } catch (e) {
                }
                return fallback;
            },
            get subjectOptions() {
                var className = (this.awardForm && this.awardForm.className ? this.awardForm.className : '').trim();
                if (className && window.ShikolaClassesStore && typeof window.ShikolaClassesStore.listClassesWithSubjects === 'function') {
                    try {
                        var byClass = window.ShikolaClassesStore.listClassesWithSubjects();
                        if (Array.isArray(byClass) && byClass.length) {
                            for (var i = 0; i < byClass.length; i++) {
                                var cs = byClass[i];
                                if (cs && cs.name === className && Array.isArray(cs.subjects) && cs.subjects.length) {
                                    return cs.subjects;
                                }
                            }
                        }
                    } catch (e) {
                    }
                }
                try {
                    if (window.ShikolaClassesStore && typeof window.ShikolaClassesStore.listSubjects === 'function') {
                        var list = window.ShikolaClassesStore.listSubjects();
                        if (Array.isArray(list) && list.length) {
                            return list;
                        }
                    }
                } catch (e) {
                }
                return [];
            }
        };
    };

    window.adminExamMarksPage = function () {
        return {
            filters: {
                examId: '',
                className: '',
                subject: '',
                sortBy: 'admission'
            },
            rows: [],
            loading: false,
            error: null,
            exams: [],
            scheduleId: '',
            init: function () {
                this.rows = [];
                this.reloadExams();
                var self = this;
                try {
                    window.addEventListener('shikola:exams-updated', function (ev) {
                        if (!self) return;
                        if (ev && ev.detail && Array.isArray(ev.detail)) {
                            self.exams = ev.detail;
                        } else {
                            self.reloadExams();
                        }
                    });
                } catch (e) {
                }
            },
            reloadExams: function () {
                var self = this;
                (async function () {
                    var list = await fetchExamsFromServer();
                    self.exams = Array.isArray(list) ? list : [];
                })();
            },
            async loadPupils() {
                var examId = this.filters.examId;
                var className = (this.filters.className || '').trim();
                var subject = (this.filters.subject || '').trim();
                if (!examId || !className || !subject) {
                    this.error = 'Please select exam, class and subject first.';
                    return;
                }
                this.loading = true;
                this.error = null;

                this.scheduleId = '';
                var schedules = await fetchSchedulesForExam(String(examId));
                var schedule = null;
                for (var si = 0; si < schedules.length; si++) {
                    var sch = schedules[si];
                    if (!sch || !sch.id) continue;
                    if (!isUuid(sch.id)) continue;
                    if (String(sch.className || '').trim() !== className) continue;
                    if (String(sch.subject || '').trim().toLowerCase() !== subject.toLowerCase()) continue;
                    schedule = sch;
                    break;
                }
                if (!schedule) {
                    this.rows = [];
                    this.loading = false;
                    this.error = 'No exam schedule found for the selected exam/class/subject. Please create it first in Exam Schedule.';
                    return;
                }
                this.scheduleId = String(schedule.id);

                var existingResults = await apiGet('/api/admin/exams/schedules/' + encodeURIComponent(this.scheduleId) + '/results');
                var resultsByPupil = {};
                if (Array.isArray(existingResults)) {
                    for (var er = 0; er < existingResults.length; er++) {
                        var row0 = existingResults[er];
                        if (row0 && row0.pupilId) {
                            resultsByPupil[String(row0.pupilId)] = row0;
                        }
                    }
                }

                var pupils = [];
                try {
                    if (window.ShikolaPupilsApi && typeof window.ShikolaPupilsApi.listPupils === 'function') {
                        pupils = await window.ShikolaPupilsApi.listPupils();
                    } else if (window.ShikolaPupilsApi && typeof window.ShikolaPupilsApi.getLocalPupils === 'function') {
                        pupils = window.ShikolaPupilsApi.getLocalPupils() || [];
                    }
                } catch (e) {
                    this.error = 'Unable to load pupils from the admin pupils page.';
                    this.loading = false;
                    return;
                }
                if (!Array.isArray(pupils) || !pupils.length) {
                    this.rows = [];
                    this.loading = false;
                    return;
                }
                var normalized = pupils.map(function (p, index) {
                    var id = p.id || p.pupilId || p.registrationNo || ('P-' + (index + 1));
                    var name = (p.fullName || ((p.firstName || '') + ' ' + (p.lastName || ''))).trim() || (p.registrationNo || id || 'Pupil');
                    var cls = p.classLabel || p.classGrade || p.className || '';
                    var admission = p.registrationNo || p.admissionNo || '';
                    return {
                        pupilId: String(id),
                        name: name,
                        className: cls,
                        admissionNo: admission
                    };
                }).filter(function (p) {
                    return !className || String(p.className) === className;
                });
                var sortBy = this.filters.sortBy || 'admission';
                normalized.sort(function (a, b) {
                    if (sortBy === 'name') {
                        return String(a.name).localeCompare(String(b.name));
                    }
                    return String(a.admissionNo).localeCompare(String(b.admissionNo));
                });
                this.rows = normalized.map(function (p, idx) {
                    var existing = resultsByPupil[String(p.pupilId)] || null;
                    var marks = existing && existing.marksObtained != null ? existing.marksObtained : '';
                    var remark = existing && existing.remarks ? String(existing.remarks) : '';
                    var status = 'Present';
                    if (marks === '' && remark) {
                        var rlc = remark.toLowerCase();
                        if (rlc.indexOf('absent') !== -1) status = 'Absent';
                        if (rlc.indexOf('medical') !== -1) status = 'Medical';
                    }
                    return {
                        id: 'AM-' + Date.now().toString(36) + '-' + idx.toString(36),
                        examNo: 'EXM-' + (idx + 1),
                        pupilId: p.pupilId,
                        name: p.name,
                        className: p.className,
                        subject: subject,
                        marks: marks,
                        status: status,
                        remarks: remark
                    };
                });
                this.loading = false;
            },
            removeRow: function (id) {
                if (!id) return;
                this.rows = this.rows.filter(function (r) { return r && r.id !== id; });
            },
            saveMarksClick: async function () {
                var scheduleId = this.scheduleId ? String(this.scheduleId) : '';
                if (!scheduleId || !isUuid(scheduleId)) {
                    this.error = 'Please load pupils for a scheduled exam subject before saving marks.';
                    return;
                }
                var className = (this.filters.className || '').trim();
                var saved = [];
                for (var j = 0; j < this.rows.length; j++) {
                    var row = this.rows[j];
                    if (!row || !row.pupilId) continue;
                    var status = row.status || 'Present';
                    var marksVal = row.marks === '' || row.marks == null ? NaN : Number(row.marks);
                    var isPresent = status === 'Present';
                    if (isPresent) {
                        if (!isFinite(marksVal) || marksVal < 0) continue;
                        saved.push({
                            pupilId: row.pupilId,
                            pupilName: row.name,
                            marksObtained: marksVal,
                            remarks: row.remarks || null
                        });
                    } else {
                        saved.push({
                            pupilId: row.pupilId,
                            pupilName: row.name,
                            marksObtained: null,
                            remarks: status
                        });
                    }
                }
                if (!saved.length) {
                    this.error = 'No valid marks to save.';
                    return;
                }

                var resp = await apiPost('/api/admin/exams/schedules/' + encodeURIComponent(scheduleId) + '/results', { results: saved });
                if (resp && resp.success) {
                    this.error = null;
                    try {
                        if (window.showNotification) {
                            window.showNotification('Marks saved for ' + (resp.count || saved.length) + ' pupils.', 'success');
                        } else {
                            alert('Marks saved for ' + (resp.count || saved.length) + ' pupils.');
                        }
                    } catch (e) {
                    }
                } else {
                    this.error = 'Failed to save marks.';
                }
            },
            get examOptions() {
                return Array.isArray(this.exams) ? this.exams : [];
            },
            get classOptions() {
                var fallback = [];
                try {
                    if (window.ShikolaClassesUi && typeof window.ShikolaClassesUi.getClassOptions === 'function') {
                        var fromStore = window.ShikolaClassesUi.getClassOptions(fallback);
                        if (Array.isArray(fromStore) && fromStore.length) {
                            return fromStore;
                        }
                    }
                } catch (e) {
                }
                return fallback;
            },
            get subjectOptions() {
                var examId = this.filters && this.filters.examId ? String(this.filters.examId) : '';
                var className = (this.filters && this.filters.className ? this.filters.className : '').trim();

                // 1) Collect subjects defined on the selected exam
                var examSubjects = [];
                if (examId && Array.isArray(this.exams) && this.exams.length) {
                    for (var i = 0; i < this.exams.length; i++) {
                        var ex = this.exams[i];
                        if (!ex || String(ex.id) !== examId) continue;
                        if (Array.isArray(ex.subjects)) {
                            for (var j = 0; j < ex.subjects.length; j++) {
                                var s = ex.subjects[j];
                                if (!s) continue;
                                var name = (s.name != null ? s.name : s).toString().trim();
                                if (!name) continue;
                                examSubjects.push(name);
                            }
                        }
                        break;
                    }
                }

                // 2) Collect subjects assigned to the selected class in Classes module
                var classSubjects = [];
                if (className && window.ShikolaClassesStore && typeof window.ShikolaClassesStore.listClassesWithSubjects === 'function') {
                    try {
                        var byClass = window.ShikolaClassesStore.listClassesWithSubjects();
                        if (Array.isArray(byClass) && byClass.length) {
                            for (var k = 0; k < byClass.length; k++) {
                                var cs = byClass[k];
                                if (!cs || cs.name !== className || !Array.isArray(cs.subjects)) continue;
                                for (var m = 0; m < cs.subjects.length; m++) {
                                    var csSub = cs.subjects[m];
                                    if (csSub == null) continue;
                                    var text = String(csSub).trim();
                                    if (!text) continue;
                                    classSubjects.push(text);
                                }
                                break;
                            }
                        }
                    } catch (e) {
                    }
                }

                // 3) Intersection of examSubjects and classSubjects (case-insensitive),
                //    but preserve the original exam subject names for display.
                var result = [];
                var seen = {};
                if (examSubjects.length && classSubjects.length) {
                    var classMap = {};
                    for (var a = 0; a < classSubjects.length; a++) {
                        var cName = classSubjects[a];
                        classMap[cName.toLowerCase()] = true;
                    }
                    for (var b = 0; b < examSubjects.length; b++) {
                        var eName = examSubjects[b];
                        var key = eName.toLowerCase();
                        if (!classMap[key]) continue;
                        if (seen[key]) continue;
                        seen[key] = true;
                        result.push(eName);
                    }
                    if (result.length) {
                        return result;
                    }
                }

                // 4) Fallbacks: exam-only, then class-only, then global subjects list
                if (examSubjects.length) {
                    seen = {};
                    var uniqExam = [];
                    for (var x = 0; x < examSubjects.length; x++) {
                        var n1 = examSubjects[x];
                        var k1 = n1.toLowerCase();
                        if (seen[k1]) continue;
                        seen[k1] = true;
                        uniqExam.push(n1);
                    }
                    return uniqExam;
                }

                if (classSubjects.length) {
                    seen = {};
                    var uniqClass = [];
                    for (var y = 0; y < classSubjects.length; y++) {
                        var n2 = classSubjects[y];
                        var k2 = n2.toLowerCase();
                        if (seen[k2]) continue;
                        seen[k2] = true;
                        uniqClass.push(n2);
                    }
                    return uniqClass;
                }

                try {
                    if (window.ShikolaClassesStore && typeof window.ShikolaClassesStore.listSubjects === 'function') {
                        var list = window.ShikolaClassesStore.listSubjects();
                        if (Array.isArray(list) && list.length) {
                            return list;
                        }
                    }
                } catch (e) {
                }
                return [];
            }
        };

    // Prevent admin components from loading in teacher portal
if (window.location.pathname.includes('teacher-portal')) {
    console.warn('Admin exam components blocked in teacher portal');
}

    };
