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
// Teacher Exams Page - Uses teacher-specific API endpoints
(function() {
    'use strict';

    // Helper functions
    function canUseApi() {
        return window.ShikolaAPI && typeof window.ShikolaAPI.get === 'function';
    }

    function loadJson(key, defaultValue) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            return defaultValue;
        }
    }

    function saveJson(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {}
    }

    function isUuid(value) {
        const v = (value || '').toString();
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
    }

    // API functions using teacher endpoints
    async function fetchExamsFromServer() {
        // Teachers don't have access to all exams, only exam schedules for their classes
        // Return empty array for now - this is for school admin only
        return [];
    }

    async function fetchExamSchedules() {
        if (window.TeacherAPI && window.TeacherAPI.getExamSchedules) {
            try {
                return await window.TeacherAPI.getExamSchedules();
            } catch (e) {
                console.error('Failed to fetch exam schedules:', e);
                return [];
            }
        }
        return [];
    }

    async function fetchExamChapters(params) {
        if (window.TeacherAPI && window.TeacherAPI.getExamChapters) {
            try {
                return await window.TeacherAPI.getExamChapters(params);
            } catch (e) {
                console.error('Failed to fetch exam chapters:', e);
                return [];
            }
        }
        return [];
    }

    async function fetchQuestionBank(params) {
        if (window.TeacherAPI && window.TeacherAPI.getQuestionBank) {
            try {
                return await window.TeacherAPI.getQuestionBank(params);
            } catch (e) {
                console.error('Failed to fetch question bank:', e);
                return [];
            }
        }
        return [];
    }

    // Question Papers functionality
    function questionPapersPage() {
        return {
            qpTab: 'subject-chapters',
            chapterForm: {
                className: '',
                subject: '',
                chapterName: ''
            },
            qbFilters: {
                className: '',
                subject: '',
                difficulty: 'Any'
            },
            chapters: [],
            questions: [],
            classOptions: [],
            subjectOptions: [],

            async init() {
                await this.loadTeacherData();
                await this.loadChapters();
                await this.loadQuestions();
            },

            async loadTeacherData() {
                // Load teacher's assigned classes
                if (window.TeacherAPI && window.TeacherAPI.getMyClasses) {
                    try {
                        const classes = await window.TeacherAPI.getMyClasses();
                        this.classOptions = classes.map(c => c.className || c.name);
                    } catch (e) {
                        console.error('Failed to load classes:', e);
                        this.classOptions = [];
                    }
                }

                // Load teacher's assigned subjects
                if (window.TeacherAPI && window.TeacherAPI.getMySubjects) {
                    try {
                        const subjects = await window.TeacherAPI.getMySubjects();
                        this.subjectOptions = subjects.map(s => s.subjectName || s.name);
                    } catch (e) {
                        console.error('Failed to load subjects:', e);
                        this.subjectOptions = [];
                    }
                }
            },

            async loadChapters() {
                this.chapters = await fetchExamChapters();
            },

            async loadQuestions() {
                this.questions = await fetchQuestionBank(this.qbFilters);
            },

            async saveChapterClick() {
                if (!this.chapterForm.className || !this.chapterForm.subject || !this.chapterForm.chapterName) {
                    alert('Please fill all chapter fields');
                    return;
                }

                if (window.TeacherAPI && window.TeacherAPI.createExamChapter) {
                    try {
                        await window.TeacherAPI.createExamChapter(this.chapterForm);
                        this.chapterForm = { className: '', subject: '', chapterName: '' };
                        await this.loadChapters();
                    } catch (e) {
                        console.error('Failed to save chapter:', e);
                        alert('Failed to save chapter');
                    }
                }
            },

            async deleteChapterClick(id) {
                if (!confirm('Are you sure you want to delete this chapter?')) return;
                
                if (window.TeacherAPI && window.TeacherAPI.deleteExamChapter) {
                    try {
                        await window.TeacherAPI.deleteExamChapter(id);
                        await this.loadChapters();
                    } catch (e) {
                        console.error('Failed to delete chapter:', e);
                        alert('Failed to delete chapter');
                    }
                }
            },

            startEditChapter(chapter) {
                // Implementation for editing chapters
                console.log('Edit chapter:', chapter);
            }
        };
    }

    // Exam Marks functionality
    function examMarksPage() {
        return {
            examSchedules: [],
            selectedSchedule: '',
            pupils: [],
            loading: false,

            async init() {
                await this.loadSchedules();
            },

            async loadSchedules() {
                this.examSchedules = await fetchExamSchedules();
            },

            async loadPupils() {
                if (!this.selectedSchedule) return;
                
                this.loading = true;
                try {
                    if (window.TeacherAPI && window.TeacherAPI.getExamMarks) {
                        const marks = await window.TeacherAPI.getExamMarks(this.selectedSchedule);
                        this.pupils = marks || [];
                    }
                } catch (e) {
                    console.error('Failed to load pupils:', e);
                } finally {
                    this.loading = false;
                }
            },

            async saveMarks() {
                if (!this.selectedSchedule || !this.pupils.length) return;

                try {
                    if (window.TeacherAPI && window.TeacherAPI.saveExamMarks) {
                        await window.TeacherAPI.saveExamMarks(this.selectedSchedule, this.pupils);
                        alert('Marks saved successfully');
                    }
                } catch (e) {
                    console.error('Failed to save marks:', e);
                    alert('Failed to save marks');
                }
            }
        };
    }

    // Result Card functionality
    function resultCardPage() {
        return {
            classOptions: [],
            selectedClass: '',
            examOptions: [],
            selectedExam: '',
            pupilResults: [],

            async init() {
                await this.loadTeacherData();
                await this.loadExams();
            },

            async loadTeacherData() {
                // Load teacher's assigned classes
                if (window.TeacherAPI && window.TeacherAPI.getMyClasses) {
                    try {
                        const classes = await window.TeacherAPI.getMyClasses();
                        this.classOptions = classes.map(c => c.className || c.name);
                    } catch (e) {
                        console.error('Failed to load classes:', e);
                        this.classOptions = [];
                    }
                }
            },

            async loadExams() {
                if (!this.selectedClass) return;
                
                const schedules = await fetchExamSchedules();
                this.examOptions = schedules.filter(s => s.className === this.selectedClass);
            },

            async generateResults() {
                if (!this.selectedClass || !this.selectedExam) {
                    alert('Please select class and exam');
                    return;
                }

                // Implementation for generating result cards
                console.log('Generate results for:', this.selectedClass, this.selectedExam);
            }
        };
    }

    // Make functions available globally
    window.questionPapersPage = questionPapersPage;
    window.examMarksPage = examMarksPage;
    window.resultCardPage = resultCardPage;

})();
