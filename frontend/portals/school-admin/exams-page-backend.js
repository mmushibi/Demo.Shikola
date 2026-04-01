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
 * Shikola School Admin Exams Page - Backend Integration
 * Replaces localStorage-based implementation with real backend API calls
 * Includes RBAC, row-level security, and real-time sync
 */
(function (window) {
    'use strict';

    // Check if unified API client is available
    if (!window.ShikolaAPI) {
        console.error('ShikolaAPI not found. Please include unified-api-client.js first');
        return;
    }

    // Exam management class with backend integration
    class ExamManager {
        constructor() {
            this.cache = new Map();
            this.subscribers = new Map();
            this.initialized = false;
        }

        async initialize() {
            if (this.initialized) return;
            
            try {
                // Get current user and verify permissions
                const user = await window.ShikolaAPI.auth.getCurrentUser();
                if (!user) {
                    throw new Error('User not authenticated');
                }

                if (!window.ShikolaAPI.auth.canAccessResource('exams', 'read')) {
                    throw new Error('Insufficient permissions for exam management');
                }

                // Setup real-time sync
                this.setupRealtimeSync();
                
                this.initialized = true;
                console.log('Exam Manager initialized successfully');
            } catch (error) {
                console.error('Failed to initialize Exam Manager:', error);
                throw error;
            }
        }

        setupRealtimeSync() {
            // Subscribe to exam updates
            window.ShikolaAPI.ws.subscribe('exams', (data) => {
                this.handleRealtimeUpdate(data);
            });

            // Listen for global updates
            window.addEventListener('shikola:realtime-update', (event) => {
                if (event.detail.channel === 'exams') {
                    this.handleRealtimeUpdate(event.detail.data);
                }
            });
        }

        handleRealtimeUpdate(data) {
            // Clear relevant cache
            this.cache.clear();

            // Notify UI components
            const callbacks = this.subscribers.get('*') || [];
            callbacks.forEach(callback => {
                try {
                    callback(data);
                } catch (e) {
                    console.error('Error in exam update callback:', e);
                }
            });

            // Dispatch custom event
            window.dispatchEvent(new CustomEvent('shikola:exams-updated', {
                detail: data
            }));
        }

        // Chapters Management
        async listChapters(params = {}) {
            try {
                const response = await window.ShikolaAPI.exams.chapters(params);
                return response.success ? response.data : [];
            } catch (error) {
                console.error('Failed to fetch chapters:', error);
                return [];
            }
        }

        async createChapter(data) {
            try {
                const response = await window.ShikolaAPI.exams.createChapter(data);
                if (response.success) {
                    this.invalidateCache('chapters');
                    return response.data;
                }
                throw new Error(response.error || 'Failed to create chapter');
            } catch (error) {
                console.error('Failed to create chapter:', error);
                throw error;
            }
        }

        async updateChapter(id, data) {
            try {
                const response = await window.ShikolaAPI.exams.updateChapter(id, data);
                if (response.success) {
                    this.invalidateCache('chapters');
                    return response.data;
                }
                throw new Error(response.error || 'Failed to update chapter');
            } catch (error) {
                console.error('Failed to update chapter:', error);
                throw error;
            }
        }

        async deleteChapter(id) {
            try {
                const response = await window.ShikolaAPI.exams.deleteChapter(id);
                if (response.success) {
                    this.invalidateCache('chapters');
                    return true;
                }
                throw new Error(response.error || 'Failed to delete chapter');
            } catch (error) {
                console.error('Failed to delete chapter:', error);
                throw error;
            }
        }

        // Questions Management
        async listQuestions(params = {}) {
            try {
                const cacheKey = `questions:${JSON.stringify(params)}`;
                if (this.cache.has(cacheKey)) {
                    return this.cache.get(cacheKey);
                }

                const response = await window.ShikolaAPI.exams.questions(params);
                const questions = response.success ? response.data : [];
                
                this.cache.set(cacheKey, questions);
                return questions;
            } catch (error) {
                console.error('Failed to fetch questions:', error);
                return [];
            }
        }

        async createQuestion(data) {
            try {
                const response = await window.ShikolaAPI.exams.createQuestion(data);
                if (response.success) {
                    this.invalidateCache('questions');
                    return response.data;
                }
                throw new Error(response.error || 'Failed to create question');
            } catch (error) {
                console.error('Failed to create question:', error);
                throw error;
            }
        }

        async updateQuestion(id, data) {
            try {
                const response = await window.ShikolaAPI.exams.updateQuestion(id, data);
                if (response.success) {
                    this.invalidateCache('questions');
                    return response.data;
                }
                throw new Error(response.error || 'Failed to update question');
            } catch (error) {
                console.error('Failed to update question:', error);
                throw error;
            }
        }

        async deleteQuestion(id) {
            try {
                const response = await window.ShikolaAPI.exams.deleteQuestion(id);
                if (response.success) {
                    this.invalidateCache('questions');
                    return true;
                }
                throw new Error(response.error || 'Failed to delete question');
            } catch (error) {
                console.error('Failed to delete question:', error);
                throw error;
            }
        }

        // Exams Management
        async listExams(params = {}) {
            try {
                const cacheKey = `exams:${JSON.stringify(params)}`;
                if (this.cache.has(cacheKey)) {
                    return this.cache.get(cacheKey);
                }

                const response = await window.ShikolaAPI.exams.list(params);
                const exams = response.success ? response.data : [];
                
                this.cache.set(cacheKey, exams);
                return exams;
            } catch (error) {
                console.error('Failed to fetch exams:', error);
                return [];
            }
        }

        async getExam(id) {
            try {
                const cacheKey = `exam:${id}`;
                if (this.cache.has(cacheKey)) {
                    return this.cache.get(cacheKey);
                }

                const response = await window.ShikolaAPI.exams.get(id);
                if (response.success) {
                    this.cache.set(cacheKey, response.data);
                    return response.data;
                }
                throw new Error(response.error || 'Exam not found');
            } catch (error) {
                console.error('Failed to fetch exam:', error);
                throw error;
            }
        }

        async createExam(data) {
            try {
                const response = await window.ShikolaAPI.exams.create(data);
                if (response.success) {
                    this.invalidateCache('exams');
                    return response.data;
                }
                throw new Error(response.error || 'Failed to create exam');
            } catch (error) {
                console.error('Failed to create exam:', error);
                throw error;
            }
        }

        async updateExam(id, data) {
            try {
                const response = await window.ShikolaAPI.exams.update(id, data);
                if (response.success) {
                    this.invalidateCache('exams');
                    this.cache.delete(`exam:${id}`);
                    return response.data;
                }
                throw new Error(response.error || 'Failed to update exam');
            } catch (error) {
                console.error('Failed to update exam:', error);
                throw error;
            }
        }

        async deleteExam(id) {
            try {
                const response = await window.ShikolaAPI.exams.delete(id);
                if (response.success) {
                    this.invalidateCache('exams');
                    this.cache.delete(`exam:${id}`);
                    return true;
                }
                throw new Error(response.error || 'Failed to delete exam');
            } catch (error) {
                console.error('Failed to delete exam:', error);
                throw error;
            }
        }

        // Question Papers Management
        async listQuestionPapers(params = {}) {
            try {
                const response = await window.ShikolaAPI.exams.questionPapers(params);
                return response.success ? response.data : [];
            } catch (error) {
                console.error('Failed to fetch question papers:', error);
                return [];
            }
        }

        async createQuestionPaper(data) {
            try {
                const response = await window.ShikolaAPI.exams.createQuestionPaper(data);
                if (response.success) {
                    this.invalidateCache('questionPapers');
                    return response.data;
                }
                throw new Error(response.error || 'Failed to create question paper');
            } catch (error) {
                console.error('Failed to create question paper:', error);
                throw error;
            }
        }

        // Date Sheets Management
        async listDateSheets(params = {}) {
            try {
                const response = await window.ShikolaAPI.exams.dateSheets(params);
                return response.success ? response.data : [];
            } catch (error) {
                console.error('Failed to fetch date sheets:', error);
                return [];
            }
        }

        async createDateSheet(data) {
            try {
                const response = await window.ShikolaAPI.exams.createDateSheet(data);
                if (response.success) {
                    this.invalidateCache('dateSheets');
                    return response.data;
                }
                throw new Error(response.error || 'Failed to create date sheet');
            } catch (error) {
                console.error('Failed to create date sheet:', error);
                throw error;
            }
        }

        // Results Management
        async getExamResults(examId, params = {}) {
            try {
                const response = await window.ShikolaAPI.exams.results({ 
                    examId, 
                    ...params 
                });
                return response.success ? response.data : [];
            } catch (error) {
                console.error('Failed to fetch exam results:', error);
                return [];
            }
        }

        async publishResults(examId, data) {
            try {
                const response = await window.ShikolaAPI.exams.publishResults(examId, data);
                if (response.success) {
                    this.invalidateCache('results');
                    return response.data;
                }
                throw new Error(response.error || 'Failed to publish results');
            } catch (error) {
                console.error('Failed to publish results:', error);
                throw error;
            }
        }

        // Utility methods
        invalidateCache(pattern) {
            for (const [key] of this.cache) {
                if (key.startsWith(pattern)) {
                    this.cache.delete(key);
                }
            }
        }

        subscribe(event, callback) {
            if (!this.subscribers.has(event)) {
                this.subscribers.set(event, []);
            }
            this.subscribers.get(event).push(callback);
        }

        unsubscribe(event, callback) {
            const callbacks = this.subscribers.get(event);
            if (callbacks) {
                const index = callbacks.indexOf(callback);
                if (index > -1) {
                    callbacks.splice(index, 1);
                }
            }
        }

        // Data normalization for UI compatibility
        normalizeExamForUI(exam) {
            if (!exam) return null;
            
            return {
                id: exam.id,
                name: exam.name || exam.examName || '',
                term: exam.term || exam.academicTerm || '',
                academicYear: exam.academicYear || '',
                academicTerm: exam.academicTerm || exam.term || '',
                examType: exam.examType || '',
                startDate: exam.startDate || exam.examDate || '',
                endDate: exam.endDate || exam.examDate || '',
                status: exam.status || 'draft',
                classNames: exam.classNames || (exam.className ? [exam.className] : []),
                resultPublishDate: exam.resultPublishDate || '',
                subjects: exam.subjects || (exam.subject ? [exam.subject] : []),
                totalMarks: exam.totalMarks || 0,
                duration: exam.duration || 0,
                instructions: exam.instructions || '',
                createdAt: exam.createdAt,
                updatedAt: exam.updatedAt
            };
        }

        normalizeQuestionForUI(question) {
            if (!question) return null;
            
            return {
                id: question.id,
                question: question.question || question.text || '',
                subject: question.subject || '',
                className: question.className || question.class || '',
                difficulty: question.difficulty || 'Any',
                type: question.type || 'Any',
                marks: question.marks || 1,
                options: question.options || [],
                correctAnswer: question.correctAnswer || '',
                explanation: question.explanation || '',
                chapter: question.chapter || '',
                topic: question.topic || ''
            };
        }
    }

    // Global exam manager instance
    const examManager = new ExamManager();

    // Legacy API compatibility functions
    window.ExamAPI = {
        // Initialize the exam manager
        init: async () => {
            return await examManager.initialize();
        },

        // Chapters
        listChapters: (params) => examManager.listChapters(params),
        createChapter: (data) => examManager.createChapter(data),
        updateChapter: (id, data) => examManager.updateChapter(id, data),
        deleteChapter: (id) => examManager.deleteChapter(id),

        // Questions
        listQuestions: (params) => examManager.listQuestions(params),
        createQuestion: (data) => examManager.createQuestion(data),
        updateQuestion: (id, data) => examManager.updateQuestion(id, data),
        deleteQuestion: (id) => examManager.deleteQuestion(id),

        // Exams
        listExams: (params) => examManager.listExams(params),
        getExam: (id) => examManager.getExam(id),
        createExam: (data) => examManager.createExam(data),
        updateExam: (id, data) => examManager.updateExam(id, data),
        deleteExam: (id) => examManager.deleteExam(id),

        // Question Papers
        listQuestionPapers: (params) => examManager.listQuestionPapers(params),
        createQuestionPaper: (data) => examManager.createQuestionPaper(data),

        // Date Sheets
        listDateSheets: (params) => examManager.listDateSheets(params),
        createDateSheet: (data) => examManager.createDateSheet(data),

        // Results
        getExamResults: (examId, params) => examManager.getExamResults(examId, params),
        publishResults: (examId, data) => examManager.publishResults(examId, data),

        // Utility
        normalizeExam: (exam) => examManager.normalizeExamForUI(exam),
        normalizeQuestion: (question) => examManager.normalizeQuestionForUI(question),
        subscribe: (event, callback) => examManager.subscribe(event, callback),
        unsubscribe: (event, callback) => examManager.unsubscribe(event, callback),
        clearCache: () => examManager.cache.clear()
    };

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', async () => {
            try {
                await examManager.initialize();
            } catch (error) {
                console.error('Failed to initialize ExamAPI:', error);
            }
        });
    } else {
        examManager.initialize().catch(error => {
            console.error('Failed to initialize ExamAPI:', error);
        });
    }

    console.log('Shikola Exams Backend Integration loaded');

})(window);
