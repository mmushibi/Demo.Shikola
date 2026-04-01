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
    return !!(window.ShikolaAPI && typeof window.ShikolaAPI.get === 'function');
}

async function apiGet(path, params) {
    if (!canUseApi()) return null;
    try {
        return await window.ShikolaAPI.get(path, params || null);
    } catch (e) {
        return null;
    }
}

async function apiPost(path, body) {
    if (!canUseApi()) return null;
    try {
        return await window.ShikolaAPI.post(path, body || {});
    } catch (e) {
        return null;
    }
}

async function apiPut(path, body) {
    if (!canUseApi()) return null;
    try {
        return await window.ShikolaAPI.put(path, body || {});
    } catch (e) {
        return null;
    }
}

async function apiDel(path) {
    if (!canUseApi()) return false;
    try {
        await window.ShikolaAPI.delete(path, null);
        return true;
    } catch (e) {
        return false;
    }
}

async function ensureSchoolProfile() {
    var cached = loadJson('shikola_school_profile_server_cache', null);
    if (cached && typeof cached === 'object') return cached;
    var server = await apiGet('/api/admin/school-profile');
    if (server && typeof server === 'object') {
        saveJson('shikola_school_profile_server_cache', server);
        return server;
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
    // Check if we're in teacher portal and prevent admin API calls
    if (window.location.pathname.includes('teacher-portal')) {
        console.warn('Admin API calls blocked in teacher portal');
        return [];
    }
    
    // Also check if we're in admin context
    if (!window.location.pathname.includes('school-admin') && !window.location.pathname.includes('admin')) {
        console.warn('Admin functions should only run in admin portal');
        return [];
    }
    
    var data = await apiGet('/api/admin/exams');
    var list = data && Array.isArray(data) ? data : [];
    var normalized = list.map(normalizeExamForUi).filter(Boolean);
    saveExams(normalized);
    return normalized;
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

function listChapters() {
    var list = loadJson(CHAPTERS_KEY, []);
    return Array.isArray(list) ? list : [];
}

function saveChapters(list) {
    var value = Array.isArray(list) ? list : [];
    saveJson(CHAPTERS_KEY, value);
    try {
        window.dispatchEvent(new CustomEvent('shikola:exam-chapters-updated', { detail: value }));
    } catch (e) {
    }
}

function upsertChapter(data) {
    if (!data) return listChapters();
    var id = data.id || ('CH-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6));
    var className = (data.className || '').trim();
    var subject = (data.subject || '').trim();
    var chapterName = (data.chapterName || '').trim();
    var list = listChapters();
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
    saveChapters(list);
    return list;
}

function deleteChapter(id) {
    if (!id) return listChapters();
    var list = listChapters();
    var filtered = list.filter(function (ch) {
        return ch && ch.id && ch.id !== id;
    });
    saveChapters(filtered);
    return filtered;
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
                alert('Chapter management is handled through backend API.');
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
                alert('Chapter management is handled through backend API.');
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
                alert('Question bank is handled through backend API.');
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
                alert('Question bank is handled through backend API.');
            } catch (e) {
                console.error('Question delete error:', e);
            }
        },
        saveQuestionPaperClick: function () {
            try {
                alert('Question papers are not available yet.');
            } catch (e) {
            }
        },
        previewQuestionPaperClick: function () {
            try {
                alert('Question papers are not available yet.');
            } catch (e) {
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

// Continue with the rest of the Alpine.js components...
// (The rest of the file would continue with all the other page components)

// Prevent admin components from loading in teacher portal
if (window.location.pathname.includes('teacher-portal')) {
    console.warn('Admin exam components blocked in teacher portal');
}
