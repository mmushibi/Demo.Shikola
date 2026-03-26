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
document.addEventListener('alpine:init', () => {
    Alpine.data('reportsShell', () => ({
        sidebarOpen: false,
        activeTab: 'student-report-card',
        chatOpen: false,
        searchQuery: '',
        searchOpen: false,
        searchHighlightIndex: 0,
        notificationsOpen: false,
        notifications: [],
        searchItems: [
            { label: 'Students Report Card', tab: 'student-report-card' },
            { label: 'Students Info Report', tab: 'student-info-report' },
            { label: 'Parents Info Report', tab: 'parent-info-report' },
            { label: 'Students Monthly Attendance', tab: 'student-attendance-report' },
            { label: 'Staff Monthly Attendance', tab: 'staff-attendance-report' },
            { label: 'Generate Certificate', tab: 'generate-certificate' },
            { label: 'Certificate Templates', tab: 'certificate-templates' }
        ],
        filteredSearchItems() {
            const q = this.searchQuery.toLowerCase().trim();
            if (!q) return this.searchItems;
            return this.searchItems.filter(item => item.label.toLowerCase().includes(q));
        },
        moveSearchSelection(direction) {
            const list = this.filteredSearchItems();
            if (!list.length) return;
            const count = list.length;
            const next = (this.searchHighlightIndex + direction + count) % count;
            this.searchHighlightIndex = next;
        },
        selectSearchItem(item) {
            this.activeTab = item.tab;
            this.searchQuery = item.label;
            this.searchOpen = false;
        },
        selectHighlightedSearch() {
            const list = this.filteredSearchItems();
            if (!list.length) return;
            const item = list[this.searchHighlightIndex] || list[0];
            this.selectSearchItem(item);
        },
        init() {
            // Seed notifications from any previously stored log (from this or other pages)
            try {
                const stored = localStorage.getItem('shikolaNotificationLog');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    if (Array.isArray(parsed)) {
                        window.shikolaNotificationLog = parsed;
                    }
                }
            } catch (e) {
                // Ignore storage errors
            }

            if (Array.isArray(window.shikolaNotificationLog)) {
                this.notifications = window.shikolaNotificationLog.slice(0, 10);
            } else {
                this.notifications = [];
            }

            window.addEventListener('shikola:notification', (event) => {
                const entry = event.detail;
                this.notifications.unshift(entry);
                if (this.notifications.length > 10) {
                    this.notifications.pop();
                }
            });
        }
    }));

    Alpine.data('studentReportCard', () => ({
        schoolSettings: null,
        examTerms: [], // Will be loaded from backend
        filters: {
            year: '',
            term: '',
            className: ''
        },
        signatureUrls: {
            classTeacher: null,
            headTeacher: null
        },
        signaturesLoading: false,
        commentsLoading: false,
        commentsSaving: false,
        searchQuery: '',
        showSuggestions: false,
        selectedStudent: null,
        selectedStudentIds: [],
        highlightedIndex: 0,
        primaryGradeNumbers: [1, 2, 3, 4, 5, 6, 7],
        secondaryGradeNumbers: [8, 9, 10, 11, 12],
        marksGrading: [
            { grade: 'A+', from: 90, to: 100, status: 'Distinction' },
            { grade: 'A', from: 80, to: 89, status: 'Excellent' },
            { grade: 'B+', from: 70, to: 79, status: 'Very Good' },
            { grade: 'B', from: 60, to: 69, status: 'Good' },
            { grade: 'C+', from: 50, to: 59, status: 'Satisfactory' },
            { grade: 'C', from: 40, to: 49, status: 'Pass' },
            { grade: 'D', from: 0, to: 39, status: 'Fail' }
        ],
        students: [],
        studentsLoading: false,
        reportCardLoading: false,
        reportCardError: '',
        isTeacherPortalContext() {
            try {
                if (window.shikolaAuth && typeof window.shikolaAuth.getCurrentPortal === 'function') {
                    var portal = window.shikolaAuth.getCurrentPortal();
                    if (portal === 'teacher-portal') {
                        return true;
                    }
                }
            } catch (e) {
            }
            try {
                var pathname = window.location && window.location.pathname ? window.location.pathname : '';
                if (pathname.indexOf('teacher-portal') !== -1) {
                    return true;
                }
            } catch (e) {
            }
            return false;
        },
        get teacherClassNames() {
            if (!this.isTeacherPortalContext()) {
                return [];
            }
            try {
                var auth = window.shikolaAuth;
                var store = window.ShikolaClassesStore;
                if (!auth || !store || typeof auth.getCurrentUser !== 'function' || typeof store.listClasses !== 'function') {
                    return [];
                }
                var user = auth.getCurrentUser();
                if (!user || user.role !== 'teacher') {
                    return [];
                }
                var teacherName = (user.name || '').toLowerCase();
                if (!teacherName) {
                    return [];
                }
                var allClasses = store.listClasses() || [];
                var allowed = [];
                for (var i = 0; i < allClasses.length; i++) {
                    var c = allClasses[i];
                    if (!c || !c.name) continue;
                    var t = (c.classTeacher || '').toLowerCase();
                    if (!t || t.indexOf(teacherName) === -1) continue;
                    if (allowed.indexOf(c.name) === -1) {
                        allowed.push(c.name);
                    }
                }
                if (!allowed.length) {
                    return [];
                }
                var present = [];
                var seen = {};
                for (var j = 0; j < this.students.length; j++) {
                    var name = (this.students[j].className || '').trim();
                    if (!name || seen[name]) continue;
                    seen[name] = true;
                    if (allowed.indexOf(name) !== -1) {
                        present.push(name);
                    }
                }
                return present.length ? present : allowed;
            } catch (e) {
                return [];
            }
        },
        get classOptions() {
            var students = this.students || [];
            var seen = {};
            var base = [];
            for (var i = 0; i < students.length; i++) {
                var name = (students[i].className || '').trim();
                if (!name || seen[name]) continue;
                seen[name] = true;
                base.push(name);
            }
            base.sort();
            if (!this.isTeacherPortalContext()) {
                return base;
            }
            var teacherClasses = this.teacherClassNames || [];
            if (!teacherClasses.length) {
                return base;
            }
            var filtered = [];
            for (var j = 0; j < base.length; j++) {
                var n = base[j];
                if (teacherClasses.indexOf(n) !== -1) {
                    filtered.push(n);
                }
            }
            return filtered.length ? filtered : base;
        },
        filteredStudents() {
            const query = this.searchQuery.toLowerCase().trim();
            const hasQuery = !!query;
            const teacherClasses = this.isTeacherPortalContext && this.isTeacherPortalContext() ? (this.teacherClassNames || []) : [];
            const filtered = this.students.filter((student) => {
                const matchesQuery = !query ||
                    student.name.toLowerCase().includes(query) ||
                    student.id.toLowerCase().includes(query) ||
                    (student.admissionNo && student.admissionNo.toLowerCase().includes(query));
                const matchesYear = !this.filters.year || student.year === this.filters.year;
                const matchesTerm = !this.filters.term || student.term === this.filters.term;
                const matchesClass = !this.filters.className || student.className === this.filters.className;
                const matchesTeacherClass = !teacherClasses.length || teacherClasses.indexOf(student.className) !== -1;

                if (!matchesTeacherClass) {
                    return false;
                }

                if (hasQuery) {
                    return matchesQuery;
                }

                return matchesYear && matchesTerm && matchesClass;
            });
            const limited = filtered.slice(0, 10);
            if (!this.selectedStudent && limited.length === 1 && query) {
                const only = limited[0];
                this.selectedStudent = only;
                this.filters.className = only.className || '';
                this.filters.year = only.year || '';
                this.filters.term = only.term || '';
            }
            if (this.highlightedIndex >= limited.length) {
                this.highlightedIndex = limited.length ? 0 : 0;
            }
            return limited;
        },
        getLevelFromClassName(className) {
            if (!className) return 'Primary';
            const match = className.match(/grade\s*(\d+)/i);
            if (!match) return 'Primary';
            const number = parseInt(match[1], 10);
            if (this.primaryGradeNumbers.includes(number)) return 'Primary';
            if (this.secondaryGradeNumbers.includes(number)) return 'Secondary';
            return number <= 7 ? 'Primary' : 'Secondary';
        },
        currentLevel() {
            const student = this.currentStudent();
            return this.getLevelFromClassName(student.className || student.grade || '');
        },
        gradeForPercentage(value) {
            // Use ECZ grading system if available
            if (window.ECZGrading && typeof window.ECZGrading.calculateGrade === 'function') {
                const pct = Number(value);
                if (Number.isNaN(pct)) {
                    return { grade: '-', status: '' };
                }
                return window.ECZGrading.calculateGrade(pct);
            }
            
            // Fallback to legacy grading system
            const pct = Number(value);
            if (Number.isNaN(pct)) {
                return { grade: '-', status: '' };
            }
            const rule = this.marksGrading.find((row) => {
                const from = Number(row.from);
                const to = Number(row.to);
                if (Number.isNaN(from) || Number.isNaN(to)) return false;
                return pct >= from && pct <= to;
            });
            return {
                grade: rule ? rule.grade : '-',
                status: rule ? rule.status : ''
            };
        },
        overallGradeFromTotals(student) {
            const s = student || this.currentStudent();
            if (!s || !s.totals || typeof s.totals.percentage === 'undefined') {
                return '-';
            }
            return this.gradeForPercentage(s.totals.percentage).grade;
        },
        async selectStudent(student) {
            this.selectedStudent = student;
            this.searchQuery = `${student.name} (${student.id})`;
            this.showSuggestions = false;
            this.loadSignatures();
            this.loadComments();
            await this.loadReportCard(student);
        },
        getCurrentRole() {
            try {
                var auth = window.shikolaAuth;
                var user = auth && typeof auth.getCurrentUser === 'function' ? auth.getCurrentUser() : null;
                return user && user.role ? String(user.role).toLowerCase() : '';
            } catch (e) {
                return '';
            }
        },
        canEditTeacherComment() {
            var role = this.getCurrentRole();
            return role === 'teacher' || role === 'senior_teacher';
        },
        canEditHeadteacherComment() {
            var role = this.getCurrentRole();
            return role === 'admin';
        },
        resolveAcademicYear(student) {
            var s = student || this.currentStudent();
            return (this.filters && this.filters.year) || s.academicYear || s.year || '';
        },
        resolveTerm(student) {
            var s = student || this.currentStudent();
            return (this.filters && this.filters.term) || s.term || '';
        },
        async loadComments() {
            if (this.commentsLoading) return;
            var student = this.currentStudent();
            if (!student || !student.id) return;
            var year = this.resolveAcademicYear(student);
            var term = this.resolveTerm(student);
            if (!year || !term) return;

            this.commentsLoading = true;
            try {
                var base = this.getApiBase();
                var token = this.getAuthToken();
                if (!token) return;
                var qs = new URLSearchParams({
                    pupilId: String(student.id),
                    academicYear: String(year),
                    term: String(term)
                }).toString();
                var res = await fetch(base + '/api/report-card/comments?' + qs, {
                    headers: {
                        'Authorization': 'Bearer ' + token,
                        'Accept': 'application/json'
                    }
                });
                if (!res.ok) return;
                var data = await res.json().catch(() => null);
                if (!data) return;

                if (typeof data.teacherComment === 'string' || data.teacherComment === null) {
                    student.teacherComment = data.teacherComment || '';
                }
                if (typeof data.headteacherComment === 'string' || data.headteacherComment === null) {
                    student.headteacherComment = data.headteacherComment || '';
                }
            } catch (e) {
            } finally {
                this.commentsLoading = false;
            }
        },
        async loadSignatures() {
            if (this.signaturesLoading) return;
            var student = this.currentStudent();
            if (!student || !student.className) return;
            
            this.signaturesLoading = true;
            try {
                // Load signatures for class teacher and headteacher
                var base = this.getApiBase();
                var token = this.getAuthToken();
                if (!token) return;
                
                // Get class teacher signature
                var classTeacherRes = await fetch(base + '/api/staff/signature?role=class_teacher&class=' + encodeURIComponent(student.className), {
                    headers: {
                        'Authorization': 'Bearer ' + token,
                        'Accept': 'application/json'
                    }
                });
                
                // Get headteacher signature  
                var headTeacherRes = await fetch(base + '/api/staff/signature?role=admin', {
                    headers: {
                        'Authorization': 'Bearer ' + token,
                        'Accept': 'application/json'
                    }
                });
                
                if (classTeacherRes.ok) {
                    var classData = await classTeacherRes.json().catch(() => null);
                    if (classData && classData.signatureUrl) {
                        this.signatureUrls.classTeacher = classData.signatureUrl;
                    }
                }
                
                if (headTeacherRes.ok) {
                    var headData = await headTeacherRes.json().catch(() => null);
                    if (headData && headData.signatureUrl) {
                        this.signatureUrls.headTeacher = headData.signatureUrl;
                    }
                }
            } catch (e) {
                console.warn('Failed to load signatures:', e);
            } finally {
                this.signaturesLoading = false;
            }
        },
        async apiGetJson(endpoint, query) {
            var base = this.getApiBase();
            var token = this.getAuthToken();
            if (!base || !token) return null;
            var url = base + endpoint;
            if (query && typeof query === 'object') {
                var qs = new URLSearchParams();
                Object.keys(query).forEach((key) => {
                    var value = query[key];
                    if (value === undefined || value === null || value === '') return;
                    qs.set(key, String(value));
                });
                var queryString = qs.toString();
                if (queryString) {
                    url += (url.indexOf('?') === -1 ? '?' : '&') + queryString;
                }
            }
            try {
                var res = await fetch(url, {
                    headers: {
                        'Authorization': 'Bearer ' + token,
                        'Accept': 'application/json'
                    }
                });
                var data = await res.json().catch(() => null);
                if (!res.ok) {
                    return null;
                }
                return data;
            } catch (e) {
                return null;
            }
        },
        normalizePupilForStudents(pupil) {
            var p = pupil || {};
            var className = p.classGrade || p.classLabel || '';
            var name = p.fullName || ((p.firstName || '') + ' ' + (p.lastName || '')).trim();
            var year = this.filters.year || '';
            var term = this.filters.term || '';
            return {
                id: p.id || '',
                admissionNo: p.admissionNo || p.registrationNo || p.studentId || '',
                name: name || 'Pupil',
                gender: p.gender || p.sex || '',
                dob: p.dob || p.dateOfBirth || '',
                grade: className ? String(className).replace(/\s*[A-Za-z]$/g, '').trim() : '',
                classSection: className || '',
                className: className || '',
                campus: p.campus || '',
                parentName: p.guardianName || '',
                parentRelation: p.guardianRelation || '',
                parentPhone: p.guardianPhone || '',
                parentEmail: p.guardianEmail || '',
                year: year,
                academicYear: year,
                term: term,
                termLabel: term && year ? ('REPORT CARD - ' + term.toUpperCase() + ' (' + year + ')') : '',
                totals: {
                    totalObtained: 0,
                    totalPossible: 0,
                    percentage: 0,
                    overallGrade: ''
                },
                classPosition: '',
                resultStatus: '',
                attendance: {
                    totalDays: 0,
                    daysPresent: 0,
                    daysAbsent: 0,
                    timesLate: 0,
                    percentage: 0
                },
                teacherComment: '',
                headteacherComment: '',
                subjects: []
            };
        },
        async loadPupils() {
            if (this.studentsLoading) return;
            this.studentsLoading = true;
            try {
                var data = await this.apiGetJson('/api/pupils', { limit: 500, offset: 0 });
                var list = Array.isArray(data) ? data : (data && Array.isArray(data.pupils) ? data.pupils : []);
                this.students = (list || []).map(p => this.normalizePupilForStudents(p)).filter(Boolean);

                if (this.filters.className) {
                    this.selectedStudent = null;
                }
            } finally {
                this.studentsLoading = false;
            }
        },
        async loadAttendanceSummary(studentId) {
            var id = String(studentId || '').trim();
            if (!id) return null;
            var data = await this.apiGetJson('/api/admin/pupils/' + encodeURIComponent(id) + '/details');
            return data && data.attendanceSummary ? data.attendanceSummary : null;
        },
        async loadReportCard(student) {
            var st = student || this.currentStudent();
            if (!st || !st.id) return;
            if (this.reportCardLoading) return;
            this.reportCardLoading = true;
            this.reportCardError = '';
            try {
                var query = {};
                if (this.filters.year) {
                    query.academicYear = this.filters.year;
                }
                if (this.filters.term) {
                    query.academicTerm = this.filters.term;
                }

                var data = await this.apiGetJson('/api/pupils/' + encodeURIComponent(String(st.id)) + '/report-card', query);
                if (!data) {
                    if (Object.keys(query).length) {
                        data = await this.apiGetJson('/api/pupils/' + encodeURIComponent(String(st.id)) + '/report-card');
                    }
                }
                if (!data) {
                    this.reportCardError = 'Failed to load report card.';
                    return;
                }

                var pupil = data.pupil || {};
                st.admissionNo = pupil.admissionNo || pupil.registrationNo || pupil.studentId || st.admissionNo;
                st.name = pupil.fullName || st.name;
                st.className = pupil.classGrade || st.className;
                st.grade = st.className ? String(st.className).replace(/\s*[A-Za-z]$/g, '').trim() : st.grade;
                st.classSection = st.className || st.classSection;

                var totalObtained = 0;
                var totalPossible = 0;
                var results = Array.isArray(data.results) ? data.results : [];
                st.subjects = results.map((r) => {
                    var mo = r && r.marksObtained != null ? Number(r.marksObtained) : null;
                    var tm = r && r.totalMarks != null ? Number(r.totalMarks) : 100;
                    if (mo != null && !Number.isNaN(mo)) totalObtained += mo;
                    if (tm != null && !Number.isNaN(tm)) totalPossible += tm;
                    var pct = r && r.percentage != null ? Number(r.percentage) : (mo != null && tm ? Math.round((mo / tm) * 100) : 0);
                    return {
                        name: (r && r.subjectName) ? r.subjectName : 'Subject',
                        marksObtained: mo == null ? '' : mo,
                        totalMarks: tm,
                        percentage: pct,
                        grade: r && r.grade ? r.grade : '',
                        remarks: r && r.remarks ? r.remarks : ''
                    };
                });

                var overall = data.overall || {};
                st.totals = {
                    totalObtained: totalObtained,
                    totalPossible: totalPossible,
                    percentage: overall.percentage != null ? Number(overall.percentage) : (totalPossible ? Math.round((totalObtained / totalPossible) * 100) : 0),
                    overallGrade: overall.grade || ''
                };

                st.year = this.filters.year || st.year || '';
                st.academicYear = st.year;
                st.term = this.filters.term || st.term || '';
                st.termLabel = st.term && st.year ? ('REPORT CARD - ' + st.term.toUpperCase() + ' (' + st.year + ')') : '';

                if (data.comments) {
                    if (data.comments.teacherComment != null) st.teacherComment = data.comments.teacherComment || '';
                    if (data.comments.headteacherComment != null) st.headteacherComment = data.comments.headteacherComment || '';
                }

                var summary = await this.loadAttendanceSummary(st.id);
                if (summary) {
                    var present = Number(summary.present || 0);
                    var absent = Number(summary.absent || 0);
                    var late = Number(summary.late || 0);
                    var excused = Number(summary.excused || 0);
                    var totalDays = present + absent + late + excused;
                    var pct = totalDays ? Math.round(((present + late) / totalDays) * 100) : 0;
                    st.attendance = {
                        totalDays: totalDays,
                        daysPresent: present + late,
                        daysAbsent: absent,
                        timesLate: late,
                        percentage: pct
                    };
                }

                this.selectedStudent = st;
            } catch (e) {
                this.reportCardError = 'Failed to load report card.';
            } finally {
                this.reportCardLoading = false;
            }
        },
        async saveComments() {
            if (this.commentsSaving) return;
            var student = this.currentStudent();
            if (!student || !student.id) return;
            var year = this.resolveAcademicYear(student);
            var term = this.resolveTerm(student);
            if (!year || !term) {
                if (window.showNotification) window.showNotification('Select academic year and term first.', 'warning');
                return;
            }

            var payload = {
                pupilId: String(student.id),
                className: student.className || '',
                academicYear: String(year),
                term: String(term)
            };

            if (this.canEditTeacherComment()) {
                payload.teacherComment = student.teacherComment || '';
            }
            if (this.canEditHeadteacherComment()) {
                payload.headteacherComment = student.headteacherComment || '';
            }

            this.commentsSaving = true;
            try {
                var base = this.getApiBase();
                var token = this.getAuthToken();
                if (!token) return;
                var res = await fetch(base + '/api/report-card/comments', {
                    method: 'PUT',
                    headers: {
                        'Authorization': 'Bearer ' + token,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });
                var data = await res.json().catch(() => null);
                if (!res.ok) {
                    if (window.showNotification) window.showNotification((data && data.error) || 'Failed to save comments', 'error');
                    return;
                }
                if (window.showNotification) window.showNotification('Comments saved.', 'success');
            } catch (e) {
                if (window.showNotification) window.showNotification('Failed to save comments', 'error');
            } finally {
                this.commentsSaving = false;
            }
        },
        getApiBase() {
            try {
                return window.SHIKOLA_API_BASE || 'http://localhost:3000';
            } catch (e) {
                return 'http://localhost:4567';
            }
        },
        getAuthToken() {
            try {
                return localStorage.getItem('authToken') || localStorage.getItem('shikola_token') || null;
            } catch (e) {
                return null;
            }
        },
        async fetchSignature(endpoint) {
            const base = this.getApiBase();
            const token = this.getAuthToken();
            if (!token) return null;
            try {
                const res = await fetch(base + endpoint, {
                    headers: {
                        'Authorization': 'Bearer ' + token,
                        'Accept': 'application/json'
                    }
                });
                if (!res.ok) return null;
                const data = await res.json().catch(() => null);
                const url = data && data.signatureUrl ? String(data.signatureUrl) : '';
                if (!url) return null;
                if (url.startsWith('http://') || url.startsWith('https://')) return url;
                if (url.startsWith('/')) return base + url;
                return base + '/' + url.replace(/^\/+/, '');
            } catch (e) {
                return null;
            }
        },
        async loadSignatures() {
            if (this.signaturesLoading) return;
            this.signaturesLoading = true;
            try {
                const auth = window.shikolaAuth;
                const user = auth && typeof auth.getCurrentUser === 'function' ? auth.getCurrentUser() : null;
                const role = user && user.role ? String(user.role).toLowerCase() : '';

                const headTeacherUrl = await this.fetchSignature('/api/staff/signature?role=admin');
                if (headTeacherUrl) {
                    this.signatureUrls.headTeacher = headTeacherUrl;
                } else if (role === 'admin') {
                    this.signatureUrls.headTeacher = await this.fetchSignature('/api/staff/signature/me');
                }

                if (this.isTeacherPortalContext && this.isTeacherPortalContext()) {
                    this.signatureUrls.classTeacher = await this.fetchSignature('/api/staff/signature/me');
                } else if (role === 'teacher' || role === 'senior_teacher') {
                    this.signatureUrls.classTeacher = await this.fetchSignature('/api/staff/signature/me');
                }
            } finally {
                this.signaturesLoading = false;
            }
        },
        currentStudent() {
            if (this.selectedStudent) {
                return this.selectedStudent;
            }
            const list = this.filteredStudents();
            if (list.length) {
                return list[0];
            }
            return (this.students && this.students.length) ? this.students[0] : this.emptyStudent();
        },
        isBatchMode() {
            return !this.searchQuery && !!this.filters.className && this.filteredStudents().length > 1;
        },
        selectedBatchStudents() {
            if (!this.isBatchMode()) return [];
            if (!this.selectedStudentIds.length) return [];
            const idSet = new Set(this.selectedStudentIds);
            return this.filteredStudents().filter(student => idSet.has(student.id));
        },
        toggleStudentSelection(studentId) {
            const index = this.selectedStudentIds.indexOf(studentId);
            if (index === -1) {
                this.selectedStudentIds.push(studentId);
            } else {
                this.selectedStudentIds.splice(index, 1);
            }
        },
        toggleSelectAllInClass() {
            const list = this.filteredStudents();
            if (!list.length) {
                this.selectedStudentIds = [];
                return;
            }
            const allIds = list.map(student => student.id);
            const allSelected = allIds.every(id => this.selectedStudentIds.includes(id));
            this.selectedStudentIds = allSelected ? [] : allIds;
        },
        isStudentChecked(studentId) {
            return this.selectedStudentIds.includes(studentId);
        },
        infoFilteredStudents() {
            return this.students.filter((student) => {
                const matchesYear = !this.filters.year || student.year === this.filters.year;
                const matchesTerm = !this.filters.term || student.term === this.filters.term;
                const matchesClass = !this.filters.className || student.className === this.filters.className;
                return matchesYear && matchesTerm && matchesClass;
            });
        },
        groupedInfoStudents() {
            const list = this.infoFilteredStudents();
            if (!list.length) return [];
            const groups = {};
            list.forEach((student) => {
                const key = student.className || 'Unassigned';
                if (!groups[key]) groups[key] = [];
                groups[key].push(student);
            });
            return Object.keys(groups).sort().map((className) => ({
                className,
                students: groups[className]
            }));
        },
        printInfoList() {
            if (!this.$refs.infoList) return;
            const content = this.$refs.infoList.innerHTML;
            const win = window.open('', '', 'width=900,height=650');
            if (!win) return;
            win.document.write('<html><head><title>Students Info Report</title>');
            win.document.write('<meta charset="utf-8">');
            win.document.write('<link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">');
            win.document.write('<script src="https://cdn.tailwindcss.com"></' + 'script>');
            win.document.write('<style>@page{size:A4 portrait;margin:10mm;}body{font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;margin:0;padding:0;background:#f8fafc;} .print-container{max-width:210mm;margin:0 auto;padding:12px 0;font-size:11px;} .print-container table th,.print-container table td{padding:3px 4px;font-size:10px;line-height:1.2;} @media print{body{background:#ffffff;} .print-container{max-width:100%;}}</style>');
            win.document.write('</head><body>');
            win.document.write('<div class="print-container text-xs">' + content + '</div>');
            win.document.write('</body></html>');
            win.document.close();
            win.addEventListener('load', () => {
                win.focus();
                setTimeout(() => {
                    win.print();
                }, 300);
            });
            if (window.showNotification) {
                window.showNotification('Opening print dialog for students info list. Use printer settings to print or save as PDF.', 'info');
            }
        },
        downloadInfoPdf() {
            if (!this.$refs.infoList || typeof html2pdf === 'undefined') {
                if (window.showNotification) {
                    window.showNotification('PDF download not available; opening print dialog instead.', 'warning');
                }
                this.printInfoList();
                return;
            }

            const list = this.infoFilteredStudents();
            if (!list.length) {
                if (window.showNotification) {
                    window.showNotification('No pupils match the selected filters to export.', 'warning');
                }
                return;
            }

            const element = this.$refs.infoList.cloneNode(true);
            element.style.backgroundColor = '#ffffff';
            element.style.fontSize = '11px';

            const classLabel = (this.filters.className || 'All Classes').replace(/\s+/g, '_');
            const termLabel = (this.filters.term || 'All Terms').replace(/\s+/g, '_');
            const yearLabel = (this.filters.year || 'All Years').replace(/\s+/g, '_');
            const now = new Date();
            const stamp = [
                now.getFullYear(),
                String(now.getMonth() + 1).padStart(2, '0'),
                String(now.getDate()).padStart(2, '0')
            ].join('-') + '_' +
                String(now.getHours()).padStart(2, '0') +
                String(now.getMinutes()).padStart(2, '0');
            const fileName = `students_info_${classLabel}_${termLabel}_${yearLabel}_${stamp}.pdf`;

            const options = {
                margin:       [10, 10, 10, 10],
                filename:     fileName,
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { scale: 2, useCORS: true },
                jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' }
            };

            html2pdf().set(options).from(element).save();

            if (window.showNotification) {
                window.showNotification('Downloading students info list as PDF...', 'success');
            }
        },
        downloadInfoCsv() {
            const list = this.infoFilteredStudents();
            if (!list.length) {
                if (window.showNotification) {
                    window.showNotification('No pupils match the selected filters to export.', 'warning');
                }
                return;
            }

            const headers = [
                'Student Name',
                'Student ID',
                'Admission No.',
                'Gender',
                'Date of Birth',
                'Grade',
                'Class',
                'Campus',
                'Parent / Guardian',
                'Term',
                'Year'
            ];

            const escapeCsv = (value) => {
                if (value === null || value === undefined) return '""';
                const str = String(value).replace(/"/g, '""');
                return '"' + str + '"';
            };

            const rows = [];
            rows.push(headers.map(escapeCsv).join(','));

            list.forEach((student) => {
                rows.push([
                    student.name,
                    student.id,
                    student.admissionNo || '',
                    student.gender || '',
                    student.dob || '',
                    student.grade || '',
                    student.className || '',
                    student.campus || '',
                    student.parentName || '',
                    student.term || '',
                    student.year || ''
                ].map(escapeCsv).join(','));
            });

            const csvContent = rows.join('\r\n');

            const classLabel = (this.filters.className || 'All Classes').replace(/\s+/g, '_');
            const termLabel = (this.filters.term || 'All Terms').replace(/\s+/g, '_');
            const yearLabel = (this.filters.year || 'All Years').replace(/\s+/g, '_');
            const now = new Date();
            const stamp = [
                now.getFullYear(),
                String(now.getMonth() + 1).padStart(2, '0'),
                String(now.getDate()).padStart(2, '0')
            ].join('-') + '_' +
                String(now.getHours()).padStart(2, '0') +
                String(now.getMinutes()).padStart(2, '0');
            const fileName = `students_info_${classLabel}_${termLabel}_${yearLabel}_${stamp}.csv`;

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            if (window.showNotification) {
                window.showNotification('Downloading students info list as CSV...', 'success');
            }
        },
        printParentsList() {
            if (!this.$refs.parentsList) return;
            const content = this.$refs.parentsList.innerHTML;
            const win = window.open('', '', 'width=900,height=650');
            if (!win) return;
            win.document.write('<html><head><title>Parents Info Report</title>');
            win.document.write('<meta charset="utf-8">');
            win.document.write('<link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">');
            win.document.write('<script src="https://cdn.tailwindcss.com"></' + 'script>');
            win.document.write('<style>@page{size:A4 portrait;margin:10mm;}body{font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;margin:0;padding:0;background:#f8fafc;} .print-container{max-width:210mm;margin:0 auto;padding:12px 0;font-size:11px;} .print-container table th,.print-container table td{padding:3px 4px;font-size:10px;line-height:1.2;} @media print{body{background:#ffffff;} .print-container{max-width:100%;}}</style>');
            win.document.write('</head><body>');
            win.document.write('<div class="print-container text-xs">' + content + '</div>');
            win.document.write('</body></html>');
            win.document.close();
            win.addEventListener('load', () => {
                win.focus();
                setTimeout(() => {
                    win.print();
                }, 300);
            });
            if (window.showNotification) {
                window.showNotification('Opening print dialog for parents info list. Use printer settings to print or save as PDF.', 'info');
            }
        },
        downloadParentsPdf() {
            if (!this.$refs.parentsList || typeof html2pdf === 'undefined') {
                if (window.showNotification) {
                    window.showNotification('PDF download not available; opening print dialog instead.', 'warning');
                }
                this.printParentsList();
                return;
            }

            const list = this.infoFilteredStudents();
            if (!list.length) {
                if (window.showNotification) {
                    window.showNotification('No pupils match the selected filters to export.', 'warning');
                }
                return;
            }

            const element = this.$refs.parentsList.cloneNode(true);
            element.style.backgroundColor = '#ffffff';
            element.style.fontSize = '11px';

            const classLabel = (this.filters.className || 'All Classes').replace(/\s+/g, '_');
            const termLabel = (this.filters.term || 'All Terms').replace(/\s+/g, '_');
            const yearLabel = (this.filters.year || 'All Years').replace(/\s+/g, '_');
            const now = new Date();
            const stamp = [
                now.getFullYear(),
                String(now.getMonth() + 1).padStart(2, '0'),
                String(now.getDate()).padStart(2, '0')
            ].join('-') + '_' +
                String(now.getHours()).padStart(2, '0') +
                String(now.getMinutes()).padStart(2, '0');
            const fileName = `parents_info_${classLabel}_${termLabel}_${yearLabel}_${stamp}.pdf`;

            const options = {
                margin:       [10, 10, 10, 10],
                filename:     fileName,
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { scale: 2, useCORS: true },
                jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' }
            };

            html2pdf().set(options).from(element).save();

            if (window.showNotification) {
                window.showNotification('Downloading parents info list as PDF...', 'success');
            }
        },
        downloadParentsCsv() {
            const list = this.infoFilteredStudents();
            if (!list.length) {
                if (window.showNotification) {
                    window.showNotification('No pupils match the selected filters to export.', 'warning');
                }
                return;
            }

            const headers = [
                'Student Name',
                'Student ID',
                'Class',
                'Parent / Guardian',
                'Relationship',
                'Phone',
                'Email',
                'Term',
                'Year'
            ];

            const escapeCsv = (value) => {
                if (value === null || value === undefined) return '""';
                const str = String(value).replace(/"/g, '""');
                return '"' + str + '"';
            };

            const rows = [];
            rows.push(headers.map(escapeCsv).join(','));

            list.forEach((student) => {
                rows.push([
                    student.name,
                    student.id,
                    student.className || '',
                    student.parentName || '',
                    student.parentRelation || '',
                    student.parentPhone || '',
                    student.parentEmail || '',
                    student.term || '',
                    student.year || ''
                ].map(escapeCsv).join(','));
            });

            const csvContent = rows.join('\r\n');

            const classLabel = (this.filters.className || 'All Classes').replace(/\s+/g, '_');
            const termLabel = (this.filters.term || 'All Terms').replace(/\s+/g, '_');
            const yearLabel = (this.filters.year || 'All Years').replace(/\s+/g, '_');
            const now = new Date();
            const stamp = [
                now.getFullYear(),
                String(now.getMonth() + 1).padStart(2, '0'),
                String(now.getDate()).padStart(2, '0')
            ].join('-') + '_' +
                String(now.getHours()).padStart(2, '0') +
                String(now.getMinutes()).padStart(2, '0');
            const fileName = `parents_info_${classLabel}_${termLabel}_${yearLabel}_${stamp}.csv`;

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            if (window.showNotification) {
                window.showNotification('Downloading parents info list as CSV...', 'success');
            }
        },
        async printPreview() {
            if (!this.$refs.preview) return;

            const isBatch = this.isBatchMode && this.isBatchMode();
            let bodyHtml = '';

            if (isBatch) {
                const selected = this.selectedBatchStudents ? this.selectedBatchStudents() : [];
                if (!selected.length) {
                    if (window.showNotification) {
                        window.showNotification('Select at least one pupil in this class to print reports.', 'warning');
                    }
                    return;
                }

                const originalSelected = this.selectedStudent;
                const chunks = [];

                for (const student of selected) {
                    this.selectedStudent = student;
                    if (this.$nextTick) {
                        await this.$nextTick();
                    }
                    if (this.$refs.preview) {
                        chunks.push(this.$refs.preview.innerHTML);
                    }
                }

                this.selectedStudent = originalSelected;

                bodyHtml = chunks
                    .map(chunk => '<div class="print-container">' + chunk + '</div>')
                    .join('<div style="page-break-after: always;"></div>');
            } else {
                const content = this.$refs.preview.innerHTML;
                bodyHtml = '<div class="print-container">' + content + '</div>';
            }

            const win = window.open('', '', 'width=900,height=650');
            if (!win) return;
            win.document.write('<html><head><title>Student Report Card</title>');
            win.document.write('<meta charset="utf-8">');
            win.document.write('<link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">');
            // Load Tailwind CDN in the print window so all preview classes render the same
            win.document.write('<script src="https://cdn.tailwindcss.com"></' + 'script>');
            // Minimal extra styling for A4 layout: smaller fonts & tighter table padding
            win.document.write('<style>@page{size:A4 portrait;margin:10mm;}body{font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;margin:0;padding:0;background:#f8fafc;} .print-container{max-width:210mm;margin:0 auto;padding:12px 0;font-size:11px;} .print-container table th,.print-container table td{padding:3px 4px;font-size:10px;line-height:1.2;} .print-container .text-xs{font-size:10px;} .print-container .text-sm{font-size:11px;} .print-container .text-base{font-size:12px;} @media print{body{background:#ffffff;} .print-container{max-width:100%;}}</style>');
            win.document.write('</head><body>');
            win.document.write(bodyHtml);
            win.document.write('</body></html>');
            win.document.close();
            win.addEventListener('load', () => {
                win.focus();
                setTimeout(() => {
                    win.print();
                }, 300);
            });
            if (window.showNotification) {
                const message = isBatch
                    ? 'Opening print dialog for selected class reports. Use printer settings to print or save as PDF.'
                    : 'Opening print dialog for selected report card. Choose "Save as PDF" to download.';
                window.showNotification(message, 'info');
            }
        },
        async downloadPdf() {
            if (!this.$refs.preview || typeof html2pdf === 'undefined') {
                // Fallback to print dialog if html2pdf is not available
                await this.printPreview();
                return;
            }

            const isBatch = this.isBatchMode && this.isBatchMode();
            const current = this.currentStudent();
            const baseName = current && current.name ? current.name.replace(/\s+/g, '_') : 'student_report_card';

            // Single report: use current preview only
            if (!isBatch) {
                const fileName = baseName + '_report.pdf';
                const element = this.$refs.preview.cloneNode(true);
                element.style.backgroundColor = '#ffffff';

                // Match print layout sizing: base 11px, xs ~10px, sm ~11px, tables slightly compact
                element.style.fontSize = '11px';
                const xsText = element.querySelectorAll('.text-xs');
                xsText.forEach(node => {
                    node.style.fontSize = '10px';
                });
                const smText = element.querySelectorAll('.text-sm');
                smText.forEach(node => {
                    node.style.fontSize = '11px';
                });
                const baseText = element.querySelectorAll('.text-base');
                baseText.forEach(node => {
                    node.style.fontSize = '12px';
                });
                const tableCells = element.querySelectorAll('table th, table td');
                tableCells.forEach(cell => {
                    cell.style.fontSize = '10px';
                    cell.style.padding = '3px 4px';
                    cell.style.lineHeight = '1.2';
                });

                const options = {
                    margin:       [10, 10, 10, 10],
                    filename:     fileName,
                    image:        { type: 'jpeg', quality: 0.98 },
                    html2canvas:  { scale: 2, useCORS: true },
                    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
                };

                html2pdf().set(options).from(element).save();

                if (window.showNotification) {
                    window.showNotification('Downloading report card as PDF...', 'success');
                }
                return;
            }

            // Batch mode: generate a multi-page PDF for selected pupils in the class
            const selected = this.selectedBatchStudents ? this.selectedBatchStudents() : [];
            if (!selected.length) {
                if (window.showNotification) {
                    window.showNotification('Select at least one pupil in this class to download reports.', 'warning');
                }
                return;
            }

            const wrapper = document.createElement('div');
            wrapper.style.backgroundColor = '#ffffff';
            wrapper.style.fontFamily = 'system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';
            wrapper.style.fontSize = '11px';

            const originalSelected = this.selectedStudent;

            for (let index = 0; index < selected.length; index++) {
                const student = selected[index];
                this.selectedStudent = student;
                if (this.$nextTick) {
                    await this.$nextTick();
                }
                if (!this.$refs.preview) continue;
                const cloned = this.$refs.preview.cloneNode(true);
                // Remove x-cloak attributes so global [x-cloak]{display:none!important} does not hide the clone
                cloned.removeAttribute('x-cloak');
                const cloakedDescendants = cloned.querySelectorAll('[x-cloak]');
                cloakedDescendants.forEach(node => node.removeAttribute('x-cloak'));
                // Ensure cloned preview is visible even though original is hidden in batch mode
                cloned.style.display = 'block';
                cloned.style.opacity = '1';
                cloned.style.visibility = 'visible';
                cloned.style.marginBottom = '8mm';
                wrapper.appendChild(cloned);
                if (index < selected.length - 1) {
                    const pageBreak = document.createElement('div');
                    pageBreak.style.pageBreakAfter = 'always';
                    wrapper.appendChild(pageBreak);
                }
            }

            this.selectedStudent = originalSelected;

            // Apply same typography adjustments as print layout
            const xsTextBatch = wrapper.querySelectorAll('.text-xs');
            xsTextBatch.forEach(node => {
                node.style.fontSize = '10px';
            });
            const smTextBatch = wrapper.querySelectorAll('.text-sm');
            smTextBatch.forEach(node => {
                node.style.fontSize = '11px';
            });
            const baseTextBatch = wrapper.querySelectorAll('.text-base');
            baseTextBatch.forEach(node => {
                node.style.fontSize = '12px';
            });
            const tableCellsBatch = wrapper.querySelectorAll('table th, table td');
            tableCellsBatch.forEach(cell => {
                cell.style.fontSize = '10px';
                cell.style.padding = '3px 4px';
                cell.style.lineHeight = '1.2';
            });

            // Attach wrapper to the document in normal flow so html2canvas can fully render it
            document.body.appendChild(wrapper);

            // Build file name from selected class, term, academic year and current time
            const refStudent = selected[0] || current;
            const classLabel = (this.filters.className || (refStudent && refStudent.className) || 'Class')
                .replace(/\s+/g, '_');
            const termLabel = (this.filters.term || (refStudent && refStudent.term) || 'Term')
                .replace(/\s+/g, '_');
            const academicLabelRaw = refStudent && (refStudent.academicYear || refStudent.year) || 'Year';
            const academicLabel = academicLabelRaw.replace(/[^A-Za-z0-9_]+/g, '_');
            const now = new Date();
            const stamp = [
                now.getFullYear(),
                String(now.getMonth() + 1).padStart(2, '0'),
                String(now.getDate()).padStart(2, '0')
            ].join('-') + '_' +
                String(now.getHours()).padStart(2, '0') +
                String(now.getMinutes()).padStart(2, '0');

            const batchFileName = `${classLabel}_${termLabel}_${academicLabel}_${stamp}_reports.pdf`;

            const options = {
                margin:       [10, 10, 10, 10],
                filename:     batchFileName,
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { scale: 2, useCORS: true },
                jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            html2pdf().set(options).from(wrapper).save().then(() => {
                document.body.removeChild(wrapper);
            });

            if (window.showNotification) {
                window.showNotification('Downloading selected class reports as PDF...', 'success');
            }
        },
        moveSelection(direction) {
            const list = this.filteredStudents();
            if (!list.length) return;
            const count = list.length;
            const next = (this.highlightedIndex + direction + count) % count;
            this.highlightedIndex = next;
        },
        selectHighlighted() {
            const list = this.filteredStudents();
            if (!list.length) return;
            const student = list[this.highlightedIndex] || list[0];
            this.selectStudent(student);
        },
        resetFilters() {
            this.filters.year = '';
            this.filters.term = '';
            this.filters.className = '';
            this.searchQuery = '';
            this.selectedStudent = null;
            this.selectedStudentIds = [];
            this.showSuggestions = false;
            this.highlightedIndex = 0;
            if (window.showNotification) {
                window.showNotification('Filters and selection cleared.', 'info');
            }
        },
        generateReport() {
            const student = this.currentStudent();
            const hasFilters = this.filters.year || this.filters.term || this.filters.className || this.searchQuery;
            const name = student && student.name ? student.name : 'selected criteria';
            if (window.showNotification) {
                window.showNotification(`Student report card generated for ${hasFilters ? name : 'selected criteria'}.`, 'success');
            }
        },
        init() {
            try {
                var profile = (window.ShikolaSchoolProfile && typeof window.ShikolaSchoolProfile.getProfile === 'function')
                    ? window.ShikolaSchoolProfile.getProfile()
                    : null;
                if (profile && profile.currentTerm && !this.filters.term) {
                    this.filters.term = String(profile.currentTerm);
                }
                if (profile && profile.academicYear && !this.filters.year) {
                    var m = String(profile.academicYear).match(/\d{4}/);
                    if (m) {
                        this.filters.year = m[0];
                    }
                }
            } catch (e) {
            }

            this.loadPupils();
            try {
                this.$watch('filters.year', () => {
                    (this.students || []).forEach((s) => {
                        if (!s) return;
                        s.year = this.filters.year || '';
                        s.academicYear = s.year;
                        s.termLabel = s.term && s.year ? ('REPORT CARD - ' + s.term.toUpperCase() + ' (' + s.year + ')') : '';
                    });
                });
                this.$watch('filters.term', () => {
                    (this.students || []).forEach((s) => {
                        if (!s) return;
                        s.term = this.filters.term || '';
                        s.termLabel = s.term && s.year ? ('REPORT CARD - ' + s.term.toUpperCase() + ' (' + s.year + ')') : '';
                    });
                });
            } catch (e) {
            }

            try {
                if (this.isTeacherPortalContext && this.isTeacherPortalContext()) {
                    var opts = this.classOptions || [];
                    if (Array.isArray(opts) && opts.length && !this.filters.className) {
                        this.filters.className = opts[0];
                    }
                }
            } catch (e) {
            }

            this.loadSignatures();
        }
    }));

    Alpine.data('attendanceReports', () => ({
        schoolSettings: null,
        studentAttendanceFilters: {
            year: '2026',
            className: '',
            month: 'June 2026'
        },
        staffAttendanceFilters: {
            year: '2026',
            month: 'June 2026'
        },
        studentAttendanceRows: [],
        staffAttendanceRows: [],
        studentAttendanceLoading: false,
        staffAttendanceLoading: false,
        staffAttendanceUnavailable: false,
        getApiBase() {
            try {
                return window.SHIKOLA_API_BASE || 'http://localhost:3000';
            } catch (e) {
                return 'http://localhost:4567';
            }
        },
        getAuthToken() {
            try {
                return localStorage.getItem('authToken') || localStorage.getItem('shikola_token') || null;
            } catch (e) {
                return null;
            }
        },
        async apiGetJson(endpoint, query) {
            var base = this.getApiBase();
            var token = this.getAuthToken();
            if (!base || !token) return null;
            var url = base + endpoint;
            if (query && typeof query === 'object') {
                var qs = new URLSearchParams();
                Object.keys(query).forEach((key) => {
                    var value = query[key];
                    if (value === undefined || value === null || value === '') return;
                    qs.set(key, String(value));
                });
                var queryString = qs.toString();
                if (queryString) {
                    url += (url.indexOf('?') === -1 ? '?' : '&') + queryString;
                }
            }
            try {
                var res = await fetch(url, {
                    headers: {
                        'Authorization': 'Bearer ' + token,
                        'Accept': 'application/json'
                    }
                });
                var data = await res.json().catch(() => null);
                if (!res.ok) {
                    return null;
                }
                return data;
            } catch (e) {
                return null;
            }
        },
        monthYearToRange(label) {
            var raw = String(label || '').trim();
            var m = raw.match(/^(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})$/i);
            if (!m) {
                return null;
            }
            var monthName = m[1].toLowerCase();
            var year = Number(m[2]);
            var names = ['january','february','march','april','may','june','july','august','september','october','november','december'];
            var idx = names.indexOf(monthName);
            if (idx < 0) return null;
            var start = new Date(Date.UTC(year, idx, 1));
            var end = new Date(Date.UTC(year, idx + 1, 0));
            var startDate = start.toISOString().slice(0, 10);
            var endDate = end.toISOString().slice(0, 10);
            return { startDate: startDate, endDate: endDate };
        },
        yearToRange(yearValue) {
            var y = String(yearValue || '').trim();
            if (!/^\d{4}$/.test(y)) return null;
            return { startDate: y + '-01-01', endDate: y + '-12-31' };
        },
        studentRange() {
            var fromMonth = this.monthYearToRange(this.studentAttendanceFilters.month);
            if (fromMonth) return fromMonth;
            return this.yearToRange(this.studentAttendanceFilters.year);
        },
        staffRange() {
            var fromMonth = this.monthYearToRange(this.staffAttendanceFilters.month);
            if (fromMonth) return fromMonth;
            return this.yearToRange(this.staffAttendanceFilters.year);
        },
        async refreshStudentAttendance() {
            if (this.studentAttendanceLoading) return;
            this.studentAttendanceLoading = true;
            try {
                var range = this.studentRange();
                var query = {
                    startDate: range ? range.startDate : '',
                    endDate: range ? range.endDate : '',
                    className: this.studentAttendanceFilters.className || ''
                };
                var data = await this.apiGetJson('/api/admin/reports/attendance', query);
                var rows = Array.isArray(data) ? data : [];
                this.studentAttendanceRows = rows.map((r) => ({
                    month: this.studentAttendanceFilters.month || '',
                    year: this.studentAttendanceFilters.year || '',
                    className: r.className || '',
                    studentName: r.pupilName || '',
                    studentId: r.pupilId || '',
                    daysPresent: r.presentDays != null ? Number(r.presentDays) : 0,
                    daysAbsent: r.absentDays != null ? Number(r.absentDays) : 0,
                    timesLate: r.lateDays != null ? Number(r.lateDays) : 0,
                    percentage: r.attendanceRate != null ? Number(r.attendanceRate) : 0
                }));
            } finally {
                this.studentAttendanceLoading = false;
            }
        },
        async refreshStaffAttendance() {
            if (this.staffAttendanceLoading) return;
            this.staffAttendanceLoading = true;
            this.staffAttendanceUnavailable = false;
            try {
                var range = this.staffRange();
                var query = {
                    startDate: range ? range.startDate : '',
                    endDate: range ? range.endDate : ''
                };

                var data = await this.apiGetJson('/api/admin/reports/staff-attendance', query);
                var rows = Array.isArray(data) ? data : [];
                this.staffAttendanceRows = rows.map((r) => ({
                    month: this.staffAttendanceFilters.month || '',
                    year: this.staffAttendanceFilters.year || '',
                    staffName: r.staffName || r.teacherName || r.fullName || '',
                    role: r.role || r.position || 'Staff',
                    department: r.department || r.className || '',
                    daysPresent: r.daysPresent != null ? Number(r.daysPresent) : 0,
                    daysAbsent: r.daysAbsent != null ? Number(r.daysAbsent) : 0,
                    timesLate: r.timesLate != null ? Number(r.timesLate) : 0,
                    percentage: r.attendanceRate != null ? Number(r.attendanceRate) : 0
                }));

                if (!rows.length && data === null) {
                    this.staffAttendanceUnavailable = true;
                }
            } finally {
                this.staffAttendanceLoading = false;
            }
        },
        isTeacherPortalContext() {
            try {
                if (window.shikolaAuth && typeof window.shikolaAuth.getCurrentPortal === 'function') {
                    var portal = window.shikolaAuth.getCurrentPortal();
                    if (portal === 'teacher-portal') {
                        return true;
                    }
                }
            } catch (e) {
            }
            try {
                var pathname = window.location && window.location.pathname ? window.location.pathname : '';
                if (pathname.indexOf('teacher-portal') !== -1) {
                    return true;
                }
            } catch (e) {
            }
            return false;
        },
        get teacherClassNames() {
            if (!this.isTeacherPortalContext()) {
                return [];
            }
            try {
                var auth = window.shikolaAuth;
                var store = window.ShikolaClassesStore;
                if (!auth || !store || typeof auth.getCurrentUser !== 'function' || typeof store.listClasses !== 'function') {
                    return [];
                }
                var user = auth.getCurrentUser();
                if (!user || user.role !== 'teacher') {
                    return [];
                }
                var teacherName = (user.name || '').toLowerCase();
                if (!teacherName) {
                    return [];
                }
                var allClasses = store.listClasses() || [];
                var allowed = [];
                for (var i = 0; i < allClasses.length; i++) {
                    var c = allClasses[i];
                    if (!c || !c.name) continue;
                    var t = (c.classTeacher || '').toLowerCase();
                    if (!t || t.indexOf(teacherName) === -1) continue;
                    if (allowed.indexOf(c.name) === -1) {
                        allowed.push(c.name);
                    }
                }
                return allowed;
            } catch (e) {
                return [];
            }
        },
        get studentClassOptions() {
            var rows = this.studentAttendanceRows || [];
            var seen = {};
            var base = [];
            for (var i = 0; i < rows.length; i++) {
                var name = (rows[i].className || '').trim();
                if (!name || seen[name]) continue;
                seen[name] = true;
                base.push(name);
            }
            base.sort();
            if (!this.isTeacherPortalContext()) {
                return base;
            }
            var teacherClasses = this.teacherClassNames || [];
            if (!teacherClasses.length) {
                return base;
            }
            var filtered = [];
            for (var j = 0; j < base.length; j++) {
                var n = base[j];
                if (teacherClasses.indexOf(n) !== -1) {
                    filtered.push(n);
                }
            }
            return filtered.length ? filtered : base;
        },
        init() {
            try {
                if (this.isTeacherPortalContext && this.isTeacherPortalContext()) {
                    var opts = this.studentClassOptions || [];
                    if (Array.isArray(opts) && opts.length && !this.studentAttendanceFilters.className) {
                        this.studentAttendanceFilters.className = opts[0];
                    }
                }
            } catch (e) {
            }

            this.refreshStudentAttendance();
            this.refreshStaffAttendance();
            try {
                this.$watch('studentAttendanceFilters.className', () => this.refreshStudentAttendance());
                this.$watch('studentAttendanceFilters.month', () => this.refreshStudentAttendance());
                this.$watch('studentAttendanceFilters.year', () => this.refreshStudentAttendance());
                this.$watch('staffAttendanceFilters.month', () => this.refreshStaffAttendance());
                this.$watch('staffAttendanceFilters.year', () => this.refreshStaffAttendance());
            } catch (e) {
            }
        },
        filteredStudentAttendance() {
            const teacherClasses = this.isTeacherPortalContext && this.isTeacherPortalContext() ? (this.teacherClassNames || []) : [];
            return this.studentAttendanceRows.filter((row) => {
                const matchesYear = !this.studentAttendanceFilters.year || row.year === this.studentAttendanceFilters.year;
                const matchesClass = !this.studentAttendanceFilters.className || row.className === this.studentAttendanceFilters.className;
                const matchesMonth = !this.studentAttendanceFilters.month || row.month === this.studentAttendanceFilters.month;
                const matchesTeacherClass = !teacherClasses.length || teacherClasses.indexOf(row.className) !== -1;
                return matchesYear && matchesClass && matchesMonth && matchesTeacherClass;
            });
        },
        filteredStaffAttendance() {
            return this.staffAttendanceRows.filter((row) => {
                const matchesYear = !this.staffAttendanceFilters.year || row.year === this.staffAttendanceFilters.year;
                const matchesMonth = !this.staffAttendanceFilters.month || row.month === this.staffAttendanceFilters.month;
                return matchesYear && matchesMonth;
            });
        },
        printStudentAttendance() {
            if (!this.$refs.studentAttendanceTable) return;
            const content = this.$refs.studentAttendanceTable.innerHTML;
            const win = window.open('', '', 'width=900,height=650');
            if (!win) return;
            win.document.write('<html><head><title>Students Monthly Attendance</title>');
            win.document.write('<meta charset="utf-8">');
            win.document.write('<link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">');
            win.document.write('<script src="https://cdn.tailwindcss.com"></' + 'script>');
            win.document.write('<style>@page{size:A4 landscape;margin:10mm;}body{font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;margin:0;padding:0;background:#f8fafc;} .print-container{max-width:297mm;margin:0 auto;padding:12px 0;font-size:11px;} .print-container table th,.print-container table td{padding:3px 4px;font-size:10px;line-height:1.2;} @media print{body{background:#ffffff;} .print-container{max-width:100%;}}</style>');
            win.document.write('</head><body>');
            win.document.write('<div class="print-container text-xs">' + content + '</div>');
            win.document.write('</body></html>');
            win.document.close();
            win.addEventListener('load', () => {
                win.focus();
                setTimeout(() => {
                    win.print();
                }, 300);
            });
            if (window.showNotification) {
                window.showNotification('Opening print dialog for students monthly attendance. Use printer settings to print or save as PDF.', 'info');
            }
        },
        downloadStudentAttendancePdf() {
            if (!this.$refs.studentAttendanceTable || typeof html2pdf === 'undefined') {
                if (window.showNotification) {
                    window.showNotification('PDF download not available; opening print dialog instead.', 'warning');
                }
                this.printStudentAttendance();
                return;
            }

            const rows = this.filteredStudentAttendance();
            if (!rows.length) {
                if (window.showNotification) {
                    window.showNotification('No attendance records match the selected filters to export.', 'warning');
                }
                return;
            }

            const element = this.$refs.studentAttendanceTable.cloneNode(true);
            element.style.backgroundColor = '#ffffff';
            element.style.fontSize = '11px';

            const classLabel = (this.studentAttendanceFilters.className || 'All Classes').replace(/\s+/g, '_');
            const yearLabel = (this.studentAttendanceFilters.year || 'All_Years').replace(/\s+/g, '_');
            const monthLabel = (this.studentAttendanceFilters.month || 'All_Months').replace(/\s+/g, '_');
            const now = new Date();
            const stamp = [
                now.getFullYear(),
                String(now.getMonth() + 1).padStart(2, '0'),
                String(now.getDate()).padStart(2, '0')
            ].join('-') + '_' +
                String(now.getHours()).padStart(2, '0') +
                String(now.getMinutes()).padStart(2, '0');
            const fileName = `student_monthly_attendance_${classLabel}_${yearLabel}_${monthLabel}_${stamp}.pdf`;

            const options = {
                margin:       [10, 10, 10, 10],
                filename:     fileName,
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { scale: 2, useCORS: true },
                jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' }
            };

            html2pdf().set(options).from(element).save();

            if (window.showNotification) {
                window.showNotification('Downloading students monthly attendance as PDF...', 'success');
            }
        },
        downloadStudentAttendanceCsv() {
            const rows = this.filteredStudentAttendance();
            if (!rows.length) {
                if (window.showNotification) {
                    window.showNotification('No attendance records match the selected filters to export.', 'warning');
                }
                return;
            }

            const headers = [
                'Month',
                'Year',
                'Class',
                'Student Name',
                'Student ID',
                'Days Present',
                'Days Absent',
                'Times Late',
                'Attendance %'
            ];

            const escapeCsv = (value) => {
                if (value === null || value === undefined) return '""';
                const str = String(value).replace(/"/g, '""');
                return '"' + str + '"';
            };

            const lines = [];
            lines.push(headers.map(escapeCsv).join(','));

            rows.forEach((row) => {
                lines.push([
                    row.month,
                    row.year,
                    row.className,
                    row.studentName,
                    row.studentId,
                    row.daysPresent,
                    row.daysAbsent,
                    row.timesLate,
                    row.percentage + '%'
                ].map(escapeCsv).join(','));
            });

            const csvContent = lines.join('\r\n');

            const classLabel = (this.studentAttendanceFilters.className || 'All Classes').replace(/\s+/g, '_');
            const yearLabel = (this.studentAttendanceFilters.year || 'All_Years').replace(/\s+/g, '_');
            const monthLabel = (this.studentAttendanceFilters.month || 'All_Months').replace(/\s+/g, '_');
            const now = new Date();
            const stamp = [
                now.getFullYear(),
                String(now.getMonth() + 1).padStart(2, '0'),
                String(now.getDate()).padStart(2, '0')
            ].join('-') + '_' +
                String(now.getHours()).padStart(2, '0') +
                String(now.getMinutes()).padStart(2, '0');
            const fileName = `student_monthly_attendance_${classLabel}_${yearLabel}_${monthLabel}_${stamp}.csv`;

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            if (window.showNotification) {
                window.showNotification('Downloading students monthly attendance as CSV...', 'success');
            }
        },
        printStaffAttendance() {
            if (!this.$refs.staffAttendanceTable) return;
            const content = this.$refs.staffAttendanceTable.innerHTML;
            const win = window.open('', '', 'width=900,height=650');
            if (!win) return;
            win.document.write('<html><head><title>Staff Monthly Attendance</title>');
            win.document.write('<meta charset="utf-8">');
            win.document.write('<link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">');
            win.document.write('<script src="https://cdn.tailwindcss.com"></' + 'script>');
            win.document.write('<style>@page{size:A4 landscape;margin:10mm;}body{font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;margin:0;padding:0;background:#f8fafc;} .print-container{max-width:297mm;margin:0 auto;padding:12px 0;font-size:11px;} .print-container table th,.print-container table td{padding:3px 4px;font-size:10px;line-height:1.2;} @media print{body{background:#ffffff;} .print-container{max-width:100%;}}</style>');
            win.document.write('</head><body>');
            win.document.write('<div class="print-container text-xs">' + content + '</div>');
            win.document.write('</body></html>');
            win.document.close();
            win.addEventListener('load', () => {
                win.focus();
                setTimeout(() => {
                    win.print();
                }, 300);
            });
            if (window.showNotification) {
                window.showNotification('Opening print dialog for staff monthly attendance. Use printer settings to print or save as PDF.', 'info');
            }
        },
        downloadStaffAttendancePdf() {
            if (!this.$refs.staffAttendanceTable || typeof html2pdf === 'undefined') {
                if (window.showNotification) {
                    window.showNotification('PDF download not available; opening print dialog instead.', 'warning');
                }
                this.printStaffAttendance();
                return;
            }

            const rows = this.filteredStaffAttendance();
            if (!rows.length) {
                if (window.showNotification) {
                    window.showNotification('No staff attendance records match the selected filters to export.', 'warning');
                }
                return;
            }

            const element = this.$refs.staffAttendanceTable.cloneNode(true);
            element.style.backgroundColor = '#ffffff';
            element.style.fontSize = '11px';

            const yearLabel = (this.staffAttendanceFilters.year || 'All_Years').replace(/\s+/g, '_');
            const monthLabel = (this.staffAttendanceFilters.month || 'All_Months').replace(/\s+/g, '_');
            const now = new Date();
            const stamp = [
                now.getFullYear(),
                String(now.getMonth() + 1).padStart(2, '0'),
                String(now.getDate()).padStart(2, '0')
            ].join('-') + '_' +
                String(now.getHours()).padStart(2, '0') +
                String(now.getMinutes()).padStart(2, '0');
            const fileName = `staff_monthly_attendance_${yearLabel}_${monthLabel}_${stamp}.pdf`;

            const options = {
                margin:       [10, 10, 10, 10],
                filename:     fileName,
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { scale: 2, useCORS: true },
                jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' }
            };

            html2pdf().set(options).from(element).save();

            if (window.showNotification) {
                window.showNotification('Downloading staff monthly attendance as PDF...', 'success');
            }
        },
        downloadStaffAttendanceCsv() {
            const rows = this.filteredStaffAttendance();
            if (!rows.length) {
                if (window.showNotification) {
                    window.showNotification('No staff attendance records match the selected filters to export.', 'warning');
                }
                return;
            }

            const headers = [
                'Month',
                'Year',
                'Staff Name',
                'Role',
                'Class / Department',
                'Days Present',
                'Days Absent',
                'Times Late',
                'Attendance %'
            ];

            const escapeCsv = (value) => {
                if (value === null || value === undefined) return '""';
                const str = String(value).replace(/"/g, '""');
                return '"' + str + '"';
            };

            const lines = [];
            lines.push(headers.map(escapeCsv).join(','));

            rows.forEach((row) => {
                lines.push([
                    row.month,
                    row.year,
                    row.staffName,
                    row.role,
                    row.department,
                    row.daysPresent,
                    row.daysAbsent,
                    row.timesLate,
                    row.percentage + '%'
                ].map(escapeCsv).join(','));
            });

            const yearLabel = (this.staffAttendanceFilters.year || 'All_Years').replace(/\s+/g, '_');
            const monthLabel = (this.staffAttendanceFilters.month || 'All_Months').replace(/\s+/g, '_');
            const now = new Date();
            const stamp = [
                now.getFullYear(),
                String(now.getMonth() + 1).padStart(2, '0'),
                String(now.getDate()).padStart(2, '0')
            ].join('-') + '_' +
                String(now.getHours()).padStart(2, '0') +
                String(now.getMinutes()).padStart(2, '0');
            const fileName = `staff_monthly_attendance_${yearLabel}_${monthLabel}_${stamp}.csv`;

            const blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            if (window.showNotification) {
                window.showNotification('Downloading staff monthly attendance as CSV...', 'success');
            }
        }
    }));

    Alpine.data('certificateCenter', () => ({
        certForm: {
            studentName: '',
            className: '',
            certificateTitle: 'Academic Achievement Certificate',
            issueDate: '',
            reason: ''
        },
        templateFilters: {
            category: '',
            status: ''
        },
        templates: [],
        templatesLoading: false,
        templatesLoaded: false,
        getApiBase() {
            try {
                return window.SHIKOLA_API_BASE || 'http://localhost:3000';
            } catch (e) {
                return 'http://localhost:4567';
            }
        },
        getAuthToken() {
            try {
                return localStorage.getItem('authToken') || localStorage.getItem('shikola_token') || null;
            } catch (e) {
                return null;
            }
        },
        async apiGetJson(endpoint) {
            var base = this.getApiBase();
            var token = this.getAuthToken();
            if (!base || !token) return null;
            try {
                var res = await fetch(base + endpoint, {
                    headers: {
                        'Authorization': 'Bearer ' + token,
                        'Accept': 'application/json'
                    }
                });
                var data = await res.json().catch(() => null);
                if (!res.ok) return null;
                return data;
            } catch (e) {
                return null;
            }
        },
        async loadTemplates() {
            if (this.templatesLoading || this.templatesLoaded) return;
            this.templatesLoading = true;
            try {
                var data = await this.apiGetJson('/api/admin/certificate-templates');
                var list = Array.isArray(data) ? data : (data && Array.isArray(data.templates) ? data.templates : []);
                this.templates = (list || []).map((tpl) => ({
                    code: tpl.code || tpl.templateCode || tpl.id || '',
                    name: tpl.name || tpl.title || 'Template',
                    level: tpl.level || 'All',
                    category: tpl.category || 'General',
                    status: tpl.status || (tpl.isActive ? 'Active' : 'Draft'),
                    lastUpdated: tpl.lastUpdated || tpl.updatedAt || tpl.createdAt || ''
                }));
            } finally {
                this.templatesLoaded = true;
                this.templatesLoading = false;
            }
        },
        filteredTemplates() {
            return this.templates.filter((tpl) => {
                const matchesCategory = !this.templateFilters.category || tpl.category === this.templateFilters.category;
                const matchesStatus = !this.templateFilters.status || tpl.status === this.templateFilters.status;
                return matchesCategory && matchesStatus;
            });
        },
        init() {
            this.loadTemplates();
        },
        printCertificate() {
            if (!this.$refs.certificatePreview) return;
            const content = this.$refs.certificatePreview.innerHTML;
            const win = window.open('', '', 'width=900,height=650');
            if (!win) return;
            win.document.write('<html><head><title>Student Certificate</title>');
            win.document.write('<meta charset="utf-8">');
            win.document.write('<link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">');
            win.document.write('<script src="https://cdn.tailwindcss.com"></' + 'script>');
            win.document.write('<style>@page{size:A4 landscape;margin:12mm;}body{font-family:system-ui,-apple-system,BlinkMacSystemFont,\"Segoe UI\",sans-serif;margin:0;padding:0;background:#f8fafc;} .print-container{max-width:297mm;margin:0 auto;padding:16px;font-size:11px;} @media print{body{background:#ffffff;} .print-container{max-width:100%;}}</style>');
            win.document.write('</head><body>');
            win.document.write('<div class="print-container text-xs">' + content + '</div>');
            win.document.write('</body></html>');
            win.document.close();
            win.addEventListener('load', () => {
                win.focus();
                setTimeout(() => {
                    win.print();
                }, 300);
            });
            if (window.showNotification) {
                window.showNotification('Opening print dialog for certificate. Use printer settings to print or save as PDF.', 'info');
            }
        },
        downloadCertificatePdf() {
            if (!this.$refs.certificatePreview || typeof html2pdf === 'undefined') {
                if (window.showNotification) {
                    window.showNotification('PDF download not available; opening print dialog instead.', 'warning');
                }
                this.printCertificate();
                return;
            }

            const element = this.$refs.certificatePreview.cloneNode(true);
            element.style.backgroundColor = '#ffffff';
            element.style.fontSize = '11px';

            const nameLabel = (this.certForm.studentName || 'Student').replace(/\s+/g, '_');
            const now = new Date();
            const stamp = [
                now.getFullYear(),
                String(now.getMonth() + 1).padStart(2, '0'),
                String(now.getDate()).padStart(2, '0')
            ].join('-') + '_' +
                String(now.getHours()).padStart(2, '0') +
                String(now.getMinutes()).padStart(2, '0');
            const fileName = `certificate_${nameLabel}_${stamp}.pdf`;

            const options = {
                margin:       [10, 10, 10, 10],
                filename:     fileName,
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { scale: 2, useCORS: true },
                jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' }
            };

            html2pdf().set(options).from(element).save();

            if (window.showNotification) {
                window.showNotification('Downloading certificate as PDF...', 'success');
            }
        },
        printTemplates() {
            if (!this.$refs.templatesTable) return;
            const content = this.$refs.templatesTable.innerHTML;
            const win = window.open('', '', 'width=900,height=650');
            if (!win) return;
            win.document.write('<html><head><title>Certificate Templates</title>');
            win.document.write('<meta charset="utf-8">');
            win.document.write('<link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">');
            win.document.write('<script src="https://cdn.tailwindcss.com"></' + 'script>');
            win.document.write('<style>@page{size:A4 landscape;margin:10mm;}body{font-family:system-ui,-apple-system,BlinkMacSystemFont,\"Segoe UI\",sans-serif;margin:0;padding:0;background:#f8fafc;} .print-container{max-width:297mm;margin:0 auto;padding:12px 0;font-size:11px;} .print-container table th,.print-container table td{padding:3px 4px;font-size:10px;line-height:1.2;} @media print{body{background:#ffffff;} .print-container{max-width:100%;}}</style>');
            win.document.write('</head><body>');
            win.document.write('<div class="print-container text-xs">' + content + '</div>');
            win.document.write('</body></html>');
            win.document.close();
            win.addEventListener('load', () => {
                win.focus();
                setTimeout(() => {
                    win.print();
                }, 300);
            });
            if (window.showNotification) {
                window.showNotification('Opening print dialog for certificate templates. Use printer settings to print or save as PDF.', 'info');
            }
        },
        downloadTemplatesPdf() {
            if (!this.$refs.templatesTable || typeof html2pdf === 'undefined') {
                if (window.showNotification) {
                    window.showNotification('PDF download not available; opening print dialog instead.', 'warning');
                }
                this.printTemplates();
                return;
            }

            const rows = this.filteredTemplates();
            if (!rows.length) {
                if (window.showNotification) {
                    window.showNotification('No templates match the selected filters to export.', 'warning');
                }
                return;
            }

            const element = this.$refs.templatesTable.cloneNode(true);
            element.style.backgroundColor = '#ffffff';
            element.style.fontSize = '11px';

            const categoryLabel = (this.templateFilters.category || 'All_Categories').replace(/\s+/g, '_');
            const statusLabel = (this.templateFilters.status || 'All_Statuses').replace(/\s+/g, '_');
            const now = new Date();
            const stamp = [
                now.getFullYear(),
                String(now.getMonth() + 1).padStart(2, '0'),
                String(now.getDate()).padStart(2, '0')
            ].join('-') + '_' +
                String(now.getHours()).padStart(2, '0') +
                String(now.getMinutes()).padStart(2, '0');
            const fileName = `certificate_templates_${categoryLabel}_${statusLabel}_${stamp}.pdf`;

            const options = {
                margin:       [10, 10, 10, 10],
                filename:     fileName,
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { scale: 2, useCORS: true },
                jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' }
            };

            html2pdf().set(options).from(element).save();

            if (window.showNotification) {
                window.showNotification('Downloading certificate templates as PDF...', 'success');
            }
        },
        downloadTemplatesCsv() {
            const rows = this.filteredTemplates();
            if (!rows.length) {
                if (window.showNotification) {
                    window.showNotification('No templates match the selected filters to export.', 'warning');
                }
                return;
            }

            const headers = [
                'Code',
                'Template Name',
                'Category',
                'Level',
                'Status',
                'Last Updated'
            ];

            const escapeCsv = (value) => {
                if (value === null || value === undefined) return '""';
                const str = String(value).replace(/"/g, '""');
                return '"' + str + '"';
            };

            const lines = [];
            lines.push(headers.map(escapeCsv).join(','));

            rows.forEach((tpl) => {
                lines.push([
                    tpl.code,
                    tpl.name,
                    tpl.category,
                    tpl.level,
                    tpl.status,
                    tpl.lastUpdated
                ].map(escapeCsv).join(','));
            });

            const categoryLabel = (this.templateFilters.category || 'All_Categories').replace(/\s+/g, '_');
            const statusLabel = (this.templateFilters.status || 'All_Statuses').replace(/\s+/g, '_');
            const now = new Date();
            const stamp = [
                now.getFullYear(),
                String(now.getMonth() + 1).padStart(2, '0'),
                String(now.getDate()).padStart(2, '0')
            ].join('-') + '_' +
                String(now.getHours()).padStart(2, '0') +
                String(now.getMinutes()).padStart(2, '0');
            const fileName = `certificate_templates_${categoryLabel}_${statusLabel}_${stamp}.csv`;

            const blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            if (window.showNotification) {
                window.showNotification('Downloading certificate templates as CSV...', 'success');
            }
        }
    }));
});
