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
(function (window, document) {
    var PRINT_WINDOW_FEATURES = 'width=900,height=680,noopener';
    var FALLBACK_EXAMS = [];

    function notify(message, type) {
        if (window.shikolaButtons && typeof window.shikolaButtons.showNotification === 'function') {
            window.shikolaButtons.showNotification(message, type || 'info');
        }
    }

    function cleanFilename(value) {
        return (value || 'exam-results')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '') || 'exam-results';
    }

    function buildPrintableDocument(section, title) {
        var clone = section.cloneNode(true);
        prepareClone(clone);
        var styles = "\n            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap');\n            :root { color-scheme: light; }\n            body {\n                font-family: 'Outfit', 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;\n                margin: 0;\n                padding: 32px;\n                background: #f8fafc;\n                color: #0f172a;\n            }\n            .report-wrapper {\n                max-width: 900px;\n                margin: 0 auto;\n                background: #ffffff;\n                padding: 36px 44px;\n                border-radius: 28px;\n                box-shadow: 0 25px 60px rgb(15 23 42 / 0.12);\n            }\n            h1, h2, h3, h4, h5, h6 { color: #020617; }\n            table {\n                border-collapse: collapse;\n                width: 100%;\n                margin-top: 24px;\n                font-size: 12px;\n            }\n            th, td {\n                border: 1px solid #e2e8f0;\n                padding: 8px 10px;\n                text-align: left;\n            }\n            th {\n                background: #f8fafc;\n                text-transform: uppercase;\n                letter-spacing: 0.04em;\n                font-size: 11px;\n            }\n            @media print {\n                body { background: #ffffff; padding: 0; }\n                .report-wrapper {\n                    border-radius: 0;\n                    box-shadow: none;\n                    padding: 0;\n                }\n            }\n        ";
        return '\n            <!DOCTYPE html>\n            <html>\n                <head>\n                    <meta charset="utf-8">\n                    <title>' + escapeHtml(title || 'Exam Results') + '</title>\n                    <style>' + styles + '</style>\n                </head>\n                <body>\n                    <div class="report-wrapper">' + clone.innerHTML + '</div>\n                </body>\n            </html>\n        ';
    }

    function prepareClone(node) {
        if (!node || typeof node.querySelectorAll !== 'function') return;
        node.querySelectorAll('[data-report-actions]').forEach(function (el) { el.remove(); });
        node.querySelectorAll('[data-report-download],[data-report-print]').forEach(function (el) { el.remove(); });
        node.querySelectorAll('[x-cloak]').forEach(function (el) { el.removeAttribute('x-cloak'); });
        node.querySelectorAll('[x-show]').forEach(function (el) { el.removeAttribute('x-show'); });
    }

    function escapeHtml(value) {
        var map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
        return (value || '').replace(/[&<>\"]/g, function (char) { return map[char]; });
    }

    window.pupilExamResultsPage = function () {
        return {
            sidebarOpen: false,
            loading: false,
            error: null,
            pupilId: '',
            pupilName: '',
            className: '',
            admissionNumber: '',
            schoolName: '',
            schoolProfile: null,
            exams: [],
            activeExamKey: '',
            summaries: {},
            summary: null,
            
            // Real-time sync properties
            syncStatus: 'connected',
            lastSyncTime: null,
            syncInterval: null,
            init: function () {
                this.bootstrapIdentity();
                this.setupRealtimeSync();
                this.loadInitialData();
            },
            /**
             * Load initial data from backend
             */
            async loadInitialData() {
                this.loading = true;
                this.error = null;
                
                try {
                    // Load school profile
                    await this.loadSchoolProfile();
                    
                    // Apply school profile to DOM
                    this.applySchoolProfileToDom();
                    
                    // Load pupil information
                    await this.loadPupilInfo();
                    
                    // Load available exams
                    await this.loadAvailableExams();
                    
                    // Set first exam as active if available
                    if (this.exams.length > 0) {
                        // Find the first exam with published results, otherwise use the first exam
                        const firstPublishedExam = this.exams.find(exam => exam.status === 'published' && exam.canViewResults);
                        const activeExam = firstPublishedExam || this.exams[0];
                        this.setActiveExam(activeExam.key);
                    }
                    
                } catch (error) {
                    console.error('Error loading initial data:', error);
                    this.error = 'Failed to load exam results. Please try again.';
                    
                    // Fallback to basic functionality
                    this.loadFallbackData();
                } finally {
                    this.loading = false;
                }
            },
            
            /**
             * Load school profile from backend
             */
            async loadSchoolProfile() {
                try {
                    // Try to get school profile from the shared school profile system first
                    if (window.ShikolaSchoolProfile && typeof window.ShikolaSchoolProfile.getProfile === 'function') {
                        const profile = window.ShikolaSchoolProfile.getProfile();
                        if (profile && profile.name && profile.name !== 'Shikola Academy') {
                            this.schoolProfile = {
                                name: profile.name,
                                address: profile.address || '',
                                phone: profile.phone || '',
                                email: profile.email || '',
                                logo: profile.logoDataUrl || profile.logo || '/frontend/assets/images/logo.png',
                                motto: profile.tagline || profile.motto || '',
                                established: profile.established || '',
                                headteacher: profile.headteacher || ''
                            };
                            this.schoolName = profile.name;
                            return;
                        }
                    }
                    
                    // Fallback to API if shared profile is not available or is default
                    if (window.PupilExamResultsAPI) {
                        const schoolProfile = await window.PupilExamResultsAPI.getSchoolProfile();
                        if (schoolProfile && schoolProfile.name) {
                            this.schoolProfile = {
                                name: schoolProfile.name,
                                address: schoolProfile.address || '',
                                phone: schoolProfile.phone || '',
                                email: schoolProfile.email || '',
                                logo: schoolProfile.logo || '/frontend/assets/images/logo.png',
                                motto: schoolProfile.tagline || schoolProfile.motto || '',
                                established: schoolProfile.established || '',
                                headteacher: schoolProfile.headteacher || ''
                            };
                            this.schoolName = schoolProfile.name;
                            return;
                        }
                    }
                    
                    // If no school profile is available, show error
                    console.warn('No school profile configured. Please configure school details in general settings.');
                    this.schoolName = 'School Name Not Configured';
                    
                } catch (error) {
                    console.error('Error loading school profile:', error);
                    this.schoolName = 'Error Loading School Profile';
                }
            },
            
            /**
             * Load pupil information from backend
             */
            async loadPupilInfo() {
                try {
                    // Try to get pupil info from API first
                    if (window.PupilExamResultsAPI) {
                        const pupilInfo = await window.PupilExamResultsAPI.getPupilInfo();
                        if (pupilInfo && pupilInfo.name && pupilInfo.name !== 'Pupil Name') {
                            this.pupilId = pupilInfo.id || '';
                            this.pupilName = pupilInfo.name;
                            this.className = pupilInfo.class || '';
                            this.admissionNumber = pupilInfo.admissionNumber || '';
                            return;
                        }
                    }
                    
                    // Fallback to auth user
                    this.bootstrapIdentity();
                    
                    // Check if we got real data from auth
                    if (this.pupilName && this.pupilName !== 'Pupil Name' && this.pupilName !== 'Pupil') {
                        return;
                    }
                    
                    // If no real pupil data is available, show error
                    console.warn('No pupil information available. Please ensure you are properly logged in.');
                    this.pupilName = 'Pupil Information Not Available';
                    this.className = 'Class Not Available';
                    this.admissionNumber = 'N/A';
                    
                } catch (error) {
                    console.error('Error loading pupil info:', error);
                    this.pupilName = 'Error Loading Pupil Information';
                    this.className = 'Error';
                    this.admissionNumber = 'Error';
                }
            },
            
            /**
             * Load available exams from backend
             */
            async loadAvailableExams() {
                try {
                    if (window.PupilExamResultsAPI) {
                        const exams = await window.PupilExamResultsAPI.getMyExams();
                        if (Array.isArray(exams)) {
                            this.exams = exams.map(exam => ({
                                key: exam.id.toString(),
                                examId: exam.id.toString(),
                                label: exam.title || exam.name,
                                subtitle: exam.examType ? (exam.examType + ' Examination Results') : 'Examination Results',
                                icon: this.getExamIcon(exam.examType),
                                examType: exam.examType,
                                status: exam.status,
                                canViewResults: exam.canViewResults,
                                resultPublishDate: exam.resultPublishDate,
                                className: exam.className
                            }));
                        }
                    }
                } catch (error) {
                    console.error('Error loading exams:', error);
                    // Fall back to configured exams
                    this.exams = this.loadConfiguredExams();
                    if (!this.exams.length) {
                        this.exams = FALLBACK_EXAMS.slice();
                    }
                }
            },
            
            /**
             * Get appropriate icon for exam type
             */
            getExamIcon(examType) {
                const icons = {
                    'midterm': 'fas fa-file-alt',
                    'final': 'fas fa-graduation-cap',
                    'mock': 'fas fa-clipboard-list',
                    'quiz': 'fas fa-question-circle',
                    'test': 'fas fa-file-contract'
                };
                return icons[examType?.toLowerCase()] || 'fas fa-file-invoice';
            },
            
            /**
             * Load fallback data when backend is unavailable
             */
            loadFallbackData() {
                this.bootstrapIdentity();
                this.exams = this.loadConfiguredExams();
                if (!this.exams.length) {
                    this.exams = FALLBACK_EXAMS.slice();
                }
                this.captureSchoolName();
                if (this.exams.length) {
                    this.setActiveExam(this.exams[0].key);
                }
            },
            
            /**
             * Apply school profile to DOM elements
             */
            applySchoolProfileToDom() {
                try {
                    if (this.schoolProfile) {
                        // Apply school name
                        const schoolNameElements = document.querySelectorAll('[data-school-name]');
                        schoolNameElements.forEach(el => {
                            if (this.schoolProfile.name) {
                                el.textContent = this.schoolProfile.name;
                            }
                        });
                        
                        // Apply school logo
                        const logoElements = document.querySelectorAll('[data-school-logo]');
                        logoElements.forEach(el => {
                            if (this.schoolProfile.logo && this.schoolProfile.logo !== '/frontend/assets/images/logo.png') {
                                el.src = this.schoolProfile.logo;
                                el.onerror = function() {
                                    console.warn('Failed to load configured school logo, using fallback');
                                    this.src = '/frontend/assets/images/logo.png';
                                };
                            } else {
                                // Use default logo if no custom logo is configured
                                el.src = '/frontend/assets/images/logo.png';
                            }
                        });
                        
                        // Apply other school details if needed
                        const schoolDetails = {
                            '[data-school-address]': this.schoolProfile.address,
                            '[data-school-phone]': this.schoolProfile.phone,
                            '[data-school-email]': this.schoolProfile.email,
                            '[data-school-motto]': this.schoolProfile.motto
                        };
                        
                        Object.entries(schoolDetails).forEach(([selector, value]) => {
                            if (value) {
                                const elements = document.querySelectorAll(selector);
                                elements.forEach(el => {
                                    el.textContent = value;
                                });
                            }
                        });
                    }
                } catch (error) {
                    console.error('Error applying school profile to DOM:', error);
                }
            },
            
            /**
             * Setup real-time synchronization
             */
            setupRealtimeSync() {
                // Listen for sync events from API
                document.addEventListener('sync-completed', (event) => {
                    const { status, error } = event.detail;
                    if (status === 'success') {
                        this.lastSyncTime = event.detail.timestamp;
                        // Refresh data if needed
                        this.refreshDataIfNeeded();
                    } else if (error) {
                        console.error('Sync failed:', error);
                    }
                });
                
                // Listen for sync status changes
                document.addEventListener('sync-status-changed', (event) => {
                    this.syncStatus = event.detail.status;
                });
                
                // Listen for cache cleared events
                document.addEventListener('cache-cleared', () => {
                    this.clearLocalCache();
                });
                
                // Listen for school profile updates
                document.addEventListener('shikola:school-profile-updated', (event) => {
                    const profile = event.detail;
                    if (profile && profile.name && profile.name !== 'Shikola Academy') {
                        this.schoolProfile = {
                            name: profile.name,
                            address: profile.address || '',
                            phone: profile.phone || '',
                            email: profile.email || '',
                            logo: profile.logoDataUrl || profile.logo || '/frontend/assets/images/logo.png',
                            motto: profile.tagline || profile.motto || '',
                            established: profile.established || '',
                            headteacher: profile.headteacher || ''
                        };
                        this.schoolName = profile.name;
                        this.applySchoolProfileToDom();
                    }
                });
            },
            
            /**
             * Refresh data if needed
             */
            async refreshDataIfNeeded() {
                if (this.activeExamKey) {
                    const exam = this.activeExam;
                    if (exam) {
                        await this.loadSummary(exam);
                    }
                }
            },
            
            /**
             * Clear local cache
             */
            clearLocalCache() {
                this.summaries = {};
                this.summary = null;
            },
            
            /**
             * Manual refresh
             */
            async manualRefresh() {
                if (window.PupilExamResultsAPI) {
                    await window.PupilExamResultsAPI.performRealtimeSync();
                }
            },
            
            /**
             * Get sync status display
             */
            getSyncStatusDisplay() {
                const statusMap = {
                    'connected': { text: 'Connected', color: 'text-green-600' },
                    'syncing': { text: 'Syncing...', color: 'text-blue-600' },
                    'offline': { text: 'Offline', color: 'text-orange-600' },
                    'error': { text: 'Error', color: 'text-red-600' }
                };
                return statusMap[this.syncStatus] || statusMap['offline'];
            },
            
            /**
             * Format last sync time
             */
            formatLastSyncTime() {
                if (!this.lastSyncTime) return 'Never';
                
                const now = new Date();
                const diff = now - this.lastSyncTime;
                const minutes = Math.floor(diff / 60000);
                
                if (minutes < 1) return 'Just now';
                if (minutes < 60) return `${minutes} min ago`;
                
                const hours = Math.floor(minutes / 60);
                if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
                
                const days = Math.floor(hours / 24);
                return `${days} day${days > 1 ? 's' : ''} ago`;
            },
            /**
             * Bootstrap identity from auth system
             */
            bootstrapIdentity: function () {
                try {
                    var auth = window.shikolaAuth;
                    if (auth && typeof auth.getCurrentUser === 'function') {
                        var user = auth.getCurrentUser();
                        if (user && user.role === 'pupil') {
                            if (user.id != null) this.pupilId = String(user.id);
                            if (user.name) this.pupilName = user.name;
                            var classLabel = user.className || user.class || user.classLabel;
                            if (classLabel) this.className = classLabel;
                        }
                    }
                } catch (e) {}
                try {
                    if (!this.pupilId) {
                        var cachedId = window.localStorage.getItem('shikola_last_exam_pupil_id');
                        if (cachedId) this.pupilId = String(cachedId);
                    }
                    if (!this.pupilName) {
                        var cachedName = window.localStorage.getItem('shikola_last_exam_pupil_name');
                        if (cachedName) this.pupilName = cachedName;
                    }
                    if (!this.className) {
                        var cachedClass = window.localStorage.getItem('shikola_last_exam_pupil_class');
                        if (cachedClass) this.className = cachedClass;
                    }
                } catch (e) {}
            },
            
            captureSchoolName: function () {
                var node = document.querySelector('[data-school-name]');
                if (node && node.textContent && node.textContent.trim()) {
                    this.schoolName = node.textContent.trim();
                }
            },
            loadConfiguredExams: function () {
                if (!window.ShikolaExamsStore || typeof window.ShikolaExamsStore.listExams !== 'function') {
                    return [];
                }
                var list = window.ShikolaExamsStore.listExams();
                if (!Array.isArray(list) || !list.length) {
                    return [];
                }
                return list.map(function (exam, index) {
                    exam = exam || {};
                    var key = exam.id ? String(exam.id) : ('exam-' + index);
                    return {
                        key: key,
                        examId: exam.id ? String(exam.id) : '',
                        label: exam.name || exam.term || ('Exam ' + (index + 1)),
                        subtitle: exam.term ? (exam.term + ' Examination Results') : 'Examination Results',
                        icon: 'fas fa-file-invoice',
                        classes: Array.isArray(exam.classNames) ? exam.classNames : [],
                        resultPublishDate: exam.resultPublishDate || '',
                        term: exam.term || '',
                        examType: exam.name ? exam.name.toLowerCase() : ''
                    };
                });
            },
            get activeExam() {
                var self = this;
                return self.exams.find(function (exam) { return exam.key === self.activeExamKey; }) || null;
            },
            setActiveExam: function (key) {
                if (!key) return;
                this.activeExamKey = key;
                var exam = this.activeExam;
                if (exam) {
                    this.loadSummary(exam);
                }
            },
            /**
             * Load exam summary from backend
             */
            async loadSummary(exam) {
                if (!exam || !exam.examId) {
                    this.summary = null;
                    return;
                }
                
                var cacheKey = exam.key;
                if (this.summaries[cacheKey]) {
                    this.summary = this.summaries[cacheKey];
                    return;
                }
                
                this.loading = true;
                this.error = null;
                
                try {
                    // Try to get results from backend API
                    if (window.PupilExamResultsAPI) {
                        var result = await window.PupilExamResultsAPI.getExamResults(exam.examId);
                        if (result) {
                            this.summary = result;
                            this.summaries[cacheKey] = result;
                            
                            // Update pupil info if available
                            if (result.pupilName) this.pupilName = result.pupilName;
                            if (result.className) this.className = result.className;
                            if (result.admissionNumber) this.admissionNumber = result.admissionNumber;
                            
                            // Apply ECZ grading to subjects
                            await this.applyGradingToSubjects(result.subjects || []);
                            
                            return;
                        }
                    }
                    
                    // Fallback to legacy system
                    if (this.pupilId && window.ShikolaExamResults) {
                        var options = {};
                        if (exam.examId) options.examId = exam.examId;
                        if (exam.examType) options.examType = exam.examType;
                        var legacyResult = window.ShikolaExamResults.getExamSummaryForPupil(this.pupilId, options) || null;
                        this.summary = legacyResult;
                        this.summaries[cacheKey] = legacyResult;
                        if (legacyResult) {
                            if (legacyResult.pupilName) this.pupilName = legacyResult.pupilName;
                            if (legacyResult.className) this.className = legacyResult.className;
                        }
                    }
                    
                    // Apply grading
                    if (window.ShikolaGrading && typeof window.ShikolaGrading.applyAll === 'function') {
                        setTimeout(function () { window.ShikolaGrading.applyAll(); }, 0);
                    }
                    
                } catch (error) {
                    console.error('Exam summary load failed', error);
                    this.error = 'Unable to load exam results at the moment.';
                    this.summary = null;
                } finally {
                    this.loading = false;
                }
            },
            
            /**
             * Apply ECZ grading to subjects
             */
            async applyGradingToSubjects(subjects) {
                if (!Array.isArray(subjects)) return;
                
                try {
                    // Get pupil's grade level
                    const gradeLevel = this.getPupilGradeLevel();
                    
                    for (const subject of subjects) {
                        if (subject.percentage !== undefined) {
                            let gradeInfo;
                            
                            // Try ECZ grading first
                            if (window.PupilExamResultsAPI) {
                                gradeInfo = await window.PupilExamResultsAPI.calculateGrade(subject.percentage, gradeLevel);
                            } else if (window.ShikolaECZGrading) {
                                gradeInfo = window.ShikolaECZGrading.calculateECZGrade(subject.percentage, gradeLevel);
                            } else {
                                // Fallback grading
                                gradeInfo = this.calculateFallbackGrade(subject.percentage, gradeLevel);
                            }
                            
                            // Update subject with grading info
                            subject.grade = gradeInfo.grade;
                            subject.gradeLabel = gradeInfo.label || gradeInfo.grade;
                            subject.points = gradeInfo.points;
                            subject.isEczCompliant = gradeInfo.isEczCompliant !== false;
                        }
                    }
                } catch (error) {
                    console.error('Error applying grading to subjects:', error);
                }
            },
            
            /**
             * Get pupil's grade level
             */
            getPupilGradeLevel() {
                try {
                    if (this.className) {
                        const gradeMatch = this.className.match(/grade\s*(\d+)/i);
                        if (gradeMatch) {
                            const grade = parseInt(gradeMatch[1]);
                            return grade <= 7 ? 'primary' : 'secondary';
                        }
                    }
                } catch (error) {
                    console.error('Error determining grade level:', error);
                }
                return 'primary'; // Default fallback
            },
            
            /**
             * Calculate fallback grade
             */
            calculateFallbackGrade(percentage, gradeLevel) {
                if (percentage >= 85) return { grade: '1', label: 'Excellent', points: 1 };
                if (percentage >= 75) return { grade: '2', label: 'Very Good', points: 2 };
                if (percentage >= 65) return { grade: '3', label: 'Good', points: 3 };
                if (percentage >= 55) return { grade: '4', label: 'Satisfactory', points: 4 };
                if (percentage >= 50) return { grade: '5', label: 'Pass', points: 5 };
                if (percentage >= 40) return { grade: '6', label: 'Credit', points: 6 };
                if (percentage >= 35) return { grade: '7', label: 'Marginal Pass', points: 7 };
                return { grade: '8', label: 'Fail', points: 8 };
            },
            get subjects() {
                return this.summary && Array.isArray(this.summary.subjects) ? this.summary.subjects : [];
            },
            get hasPublishedResults() {
                return this.subjects.length > 0;
            },
            get totalSubjects() {
                return this.summary ? (this.summary.totalSubjects || this.subjects.length) : 0;
            },
            get totalMarks() {
                return this.summary ? (this.summary.totalMarks || 0) : 0;
            },
            get totalMaxMarks() {
                return this.summary ? (this.summary.totalMaxMarks || 0) : 0;
            },
            get overallPercentage() {
                if (!this.summary || this.summary.overallPercentage == null) return '--';
                var p = this.summary.overallPercentage;
                if (!isFinite(p)) return '--';
                var rounded = Math.round(p * 10) / 10;
                return rounded.toFixed(1) + '%';
            },
            downloadActiveExam: function () {
                if (!this.hasPublishedResults) {
                    notify('Nothing to download yet. Please wait for published results.', 'warning');
                    return;
                }
                var section = this.$refs && this.$refs.reportCard ? this.$refs.reportCard : null;
                if (!section) {
                    notify('Unable to find the report card to download.', 'error');
                    return;
                }
                var title = this.reportTitle;
                var printable = buildPrintableDocument(section, title);
                var blob = new Blob([printable], { type: 'text/html' });
                var url = window.URL.createObjectURL(blob);
                var link = document.createElement('a');
                link.href = url;
                link.download = cleanFilename(title) + '.html';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
                notify('Report download started.', 'success');
            },
            printActiveExam: function () {
                if (!this.hasPublishedResults) {
                    notify('Nothing to print yet. Please wait for published results.', 'warning');
                    return;
                }
                var section = this.$refs && this.$refs.reportCard ? this.$refs.reportCard : null;
                if (!section) {
                    window.print();
                    return;
                }
                var title = this.reportTitle;
                var printable = buildPrintableDocument(section, title);
                var win = window.open('', '', PRINT_WINDOW_FEATURES);
                if (!win) {
                    notify('Please allow pop-ups to print this report.', 'error');
                    return;
                }
                win.document.open();
                win.document.write(printable);
                win.document.close();
                win.addEventListener('load', function () {
                    try {
                        win.focus();
                        setTimeout(function () { win.print(); }, 300);
                    } catch (e) {
                        console.error('Print preview failed', e);
                    }
                });
                notify('Opening print preview…', 'info');
            },
            /**
             * Clear cache and reload page
             */
            clearCacheAndReload() {
                try {
                    // Clear API cache
                    if (window.PupilExamResultsAPI) {
                        window.PupilExamResultsAPI.clearCache();
                    }
                    
                    // Clear local storage
                    localStorage.removeItem('shikola_last_exam_pupil_id');
                    localStorage.removeItem('shikola_last_exam_pupil_name');
                    localStorage.removeItem('shikola_last_exam_pupil_class');
                    
                    // Clear local cache
                    this.clearLocalCache();
                    
                    // Show notification
                    notify('Cache cleared successfully', 'success');
                    
                    // Reload page after a short delay
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                    
                } catch (error) {
                    console.error('Error clearing cache:', error);
                    notify('Failed to clear cache', 'error');
                }
            },
            
            get reportTitle() {
                var exam = this.activeExam;
                var examLabel = exam && exam.label ? exam.label : 'Exam Results';
                return (this.schoolName || 'School') + ' – ' + examLabel;
            }
        };
    };
})(window, document);
