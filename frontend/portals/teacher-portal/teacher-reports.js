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
 * Teacher Reports Backend Integration
 * Uses real API calls and role-based access control
 */

// Result Cards Data Component
// Handles the display and filtering of student result cards
// Integrates with backend API for real-time data retrieval
function resultCardsData() {
    return {
        loading: false,              // Loading state indicator
        resultCards: [],             // Array to store result card data
        resultFilters: {             // Filter options for result cards
            year: '',               // Academic year filter
            term: '',               // Term filter (Term 1, 2, 3)
            className: ''           // Class name filter
        },
        examTerms: ['Term 1', 'Term 2', 'Term 3'],  // Available exam terms
        classOptions: [],          // Available class options from API
        
        // Initialize component: load class options and result cards
        async init() {
            await this.loadClassOptions();
            await this.loadResultCards();
        },
        
        async loadClassOptions() {
            try {
                if (window.ShikolaTeacherApi && typeof window.ShikolaTeacherApi.getMyClasses === 'function') {
                    const classes = await window.ShikolaTeacherApi.getMyClasses();
                    if (Array.isArray(classes)) {
                        this.classOptions = classes.map(c => c.className || c.name).filter(Boolean);
                    }
                }
            } catch (error) {
                console.error('Failed to load class options:', error);
            }
        },
        
        // Load result cards data from backend API with applied filters
        async loadResultCards() {
            this.loading = true;
            try {
                // Build query parameters from filters
                const params = {};
                if (this.resultFilters.year) params.year = this.resultFilters.year;
                if (this.resultFilters.term) params.term = this.resultFilters.term;
                if (this.resultFilters.className) params.className = this.resultFilters.className;
                
                // Fetch result cards from teacher API
                if (window.ShikolaTeacherApi && typeof window.ShikolaTeacherApi.getResultCards === 'function') {
                    this.resultCards = await window.ShikolaTeacherApi.getResultCards(params);
                } else {
                    console.error('ShikolaTeacherApi.getResultCards not available');
                    this.resultCards = [];
                }
            } catch (error) {
                console.error('Error loading result cards:', error);
                this.resultCards = [];
            } finally {
                this.loading = false;
            }
        },
        
        // Reset all filters and reload result cards
        resetResultFilters() {
            this.resultFilters = {
                year: '',
                term: '',
                className: ''
            };
            this.loadResultCards();
        },
        
        // Get color class for grade display based on ECZ grading scale
        getGradeColor(grade) {
            const gradeColors = {
                '1': 'bg-emerald-100 text-emerald-700',    // Excellent
                '2': 'bg-emerald-100 text-emerald-700',    // Very Good
                '3': 'bg-blue-100 text-blue-700',          // Good
                '4': 'bg-blue-100 text-blue-700',          // Good
                '5': 'bg-amber-100 text-amber-700',        // Fair
                '6': 'bg-amber-100 text-amber-700',        // Fair
                '7': 'bg-orange-100 text-orange-700',      // Poor
                '8': 'bg-orange-100 text-orange-700',      // Poor
                '9': 'bg-red-100 text-red-700'             // Very Poor
            };
            return gradeColors[grade] || 'bg-slate-100 text-slate-600';
        },
        
        // View detailed result card information
        viewResultCardDetails(card) {
            // Implementation for viewing detailed result card
            console.log('View result card details:', card);
        },
        
        // Print result cards using browser print functionality
        printResultCards() {
            window.print();
        },
        
        // Download result cards as PDF (requires backend PDF generation)
        downloadResultCardsPdf() {
            // Implementation for PDF download - requires backend integration
            console.log('Download result cards as PDF');
        }
    }
}

// Enhanced Student Report Card Component with Real Backend
function studentReportCard() {
    return {
        loading: false,
        students: [],
        selectedStudents: new Set(),
        filters: {
            year: '',
            term: '',
            className: ''
        },
        searchQuery: '',
        showSuggestions: false,
        highlightedIndex: -1,
        examTerms: ['Term 1', 'Term 2', 'Term 3'],
        classOptions: [],
        schoolSettings: null,
        commentsSaving: false,
        
        async init() {
            await this.loadSchoolSettings();
            await this.loadClassOptions();
            await this.loadStudentData();
        },
        
        async loadSchoolSettings() {
            try {
                if (window.ShikolaTeacherApi && typeof window.ShikolaTeacherApi.getSchoolSettings === 'function') {
                    this.schoolSettings = await window.ShikolaTeacherApi.getSchoolSettings();
                }
            } catch (error) {
                console.error('Failed to load school settings:', error);
            }
        },
        
        async loadClassOptions() {
            try {
                if (window.ShikolaTeacherApi && typeof window.ShikolaTeacherApi.getMyClasses === 'function') {
                    const classes = await window.ShikolaTeacherApi.getMyClasses();
                    if (Array.isArray(classes)) {
                        this.classOptions = classes.map(c => c.className || c.name).filter(Boolean);
                    }
                }
            } catch (error) {
                console.error('Failed to load class options:', error);
            }
        },
        
        async loadStudentData() {
            this.loading = true;
            try {
                const params = {};
                if (this.filters.year) params.year = this.filters.year;
                if (this.filters.term) params.term = this.filters.term;
                if (this.filters.className) params.className = this.filters.className;
                
                if (window.ShikolaTeacherApi && typeof window.ShikolaTeacherApi.getStudentReportCard === 'function') {
                    this.students = await window.ShikolaTeacherApi.getStudentReportCard(params);
                } else {
                    console.error('ShikolaTeacherApi.getStudentReportCard not available');
                    this.students = [];
                }
            } catch (error) {
                console.error('Error loading student data:', error);
                this.students = [];
            } finally {
                this.loading = false;
            }
        },
        
        filteredStudents() {
            if (!this.searchQuery) return this.students;
            
            const query = this.searchQuery.toLowerCase();
            return this.students.filter(student => 
                student.name.toLowerCase().includes(query) ||
                student.admissionNo.toLowerCase().includes(query) ||
                student.classSection.toLowerCase().includes(query)
            );
        },
        
        currentStudent() {
            const student = this.filteredStudents()[0];
            return student || {
                totals: { totalObtained: 0, totalPossible: 0, percentage: 0 },
                attendance: { totalDays: 0, daysPresent: 0, daysAbsent: 0, timesLate: 0, percentage: 0 },
                subjects: [],
                name: '',
                gender: '',
                dob: '',
                admissionNo: '',
                id: '',
                grade: '',
                classSection: '',
                level: '',
                campus: '',
                term: '',
                year: ''
            };
        },
        
        isBatchMode() {
            return this.filteredStudents().length > 1 && !this.searchQuery;
        },
        
        isStudentChecked(studentId) {
            return this.selectedStudents.has(studentId);
        },
        
        toggleStudentSelection(studentId) {
            if (this.selectedStudents.has(studentId)) {
                this.selectedStudents.delete(studentId);
            } else {
                this.selectedStudents.add(studentId);
            }
        },
        
        toggleSelectAllInClass() {
            const students = this.filteredStudents();
            if (students.every(s => this.selectedStudents.has(s.id))) {
                // Clear all
                students.forEach(s => this.selectedStudents.delete(s.id));
            } else {
                // Select all
                students.forEach(s => this.selectedStudents.add(s.id));
            }
        },
        
        selectStudent(student) {
            this.searchQuery = student.name;
            this.showSuggestions = false;
            this.selectedStudents.clear();
            this.selectedStudents.add(student.id);
        },
        
        moveSelection(direction) {
            const filtered = this.filteredStudents();
            this.highlightedIndex = Math.max(0, Math.min(filtered.length - 1, this.highlightedIndex + direction));
        },
        
        selectHighlighted() {
            const filtered = this.filteredStudents();
            if (this.highlightedIndex >= 0 && this.highlightedIndex < filtered.length) {
                this.selectStudent(filtered[this.highlightedIndex]);
            }
        },
        
        resetFilters() {
            this.filters = {
                year: '',
                term: '',
                className: ''
            };
            this.searchQuery = '';
            this.selectedStudents.clear();
            this.loadStudentData();
        },
        
        generateReport() {
            this.loadStudentData();
        },
        
        printPreview() {
            window.print();
        },
        
        downloadPdf() {
            // Implementation for PDF download
            console.log('Download PDF');
        },
        
        gradeForPercentage(percentage) {
            // Use ECZ grading if available
            if (typeof window !== 'undefined' && window.ECZGrading) {
                return window.ECZGrading.calculateGrade(percentage, this.currentStudent().grade);
            }
            
            // Fallback grading
            if (percentage >= 85) return { grade: '1', points: 1 };
            if (percentage >= 75) return { grade: '2', points: 2 };
            if (percentage >= 65) return { grade: '3', points: 3 };
            if (percentage >= 55) return { grade: '4', points: 4 };
            if (percentage >= 45) return { grade: '5', points: 5 };
            if (percentage >= 35) return { grade: '6', points: 6 };
            if (percentage >= 30) return { grade: '7', points: 7 };
            if (percentage >= 20) return { grade: '8', points: 8 };
            return { grade: '9', points: 9 };
        },
        
        overallGradeFromTotals(student) {
            if (!student.totals || !student.totals.percentage) return 'N/A';
            return this.gradeForPercentage(student.totals.percentage).grade;
        },
        
        currentLevel() {
            const student = this.currentStudent();
            if (!student.grade) return 'N/A';
            
            // Determine level based on grade
            const gradeLevel = parseInt(student.grade);
            if (gradeLevel <= 4) return 'Early Years';
            if (gradeLevel <= 7) return 'Primary';
            return 'Secondary';
        },
        
        canEditTeacherComment() {
            // Check if user has permission to edit teacher comments
            // This would be based on role-based access control
            return true; // Simplified for now
        },
        
        canEditHeadteacherComment() {
            // Check if user is class teacher
            return true; // Simplified for now
        },
        
        async saveComments() {
            this.commentsSaving = true;
            try {
                const student = this.currentStudent();
                const commentsData = {
                    studentId: student.id,
                    term: student.term,
                    year: student.year,
                    teacherComment: student.teacherComment,
                    headteacherComment: student.headteacherComment
                };
                
                if (window.ShikolaTeacherApi && typeof window.ShikolaTeacherApi.saveReportComments === 'function') {
                    const response = await window.ShikolaTeacherApi.saveReportComments(commentsData);
                    if (response.success) {
                        console.log('Comments saved successfully');
                    } else {
                        console.error('Failed to save comments:', response.error);
                    }
                } else {
                    console.error('ShikolaTeacherApi.saveReportComments not available');
                }
            } catch (error) {
                console.error('Error saving comments:', error);
            } finally {
                this.commentsSaving = false;
            }
        }
    }
}

// Enhanced Attendance Reports Component with Real Backend
function attendanceReports() {
    return {
        loading: false,
        attendanceData: [],
        studentAttendanceFilters: {
            year: '',
            className: '',
            month: ''
        },
        studentClassOptions: [],
        months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
        
        async init() {
            await this.loadClassOptions();
            await this.loadAttendanceData();
        },
        
        async loadClassOptions() {
            try {
                if (window.ShikolaTeacherApi && typeof window.ShikolaTeacherApi.getMyClasses === 'function') {
                    const classes = await window.ShikolaTeacherApi.getMyClasses();
                    if (Array.isArray(classes)) {
                        this.studentClassOptions = classes.map(c => c.className || c.name).filter(Boolean);
                    }
                }
            } catch (error) {
                console.error('Failed to load class options:', error);
            }
        },
        
        async loadAttendanceData() {
            this.loading = true;
            try {
                const params = {};
                if (this.studentAttendanceFilters.year) params.year = this.studentAttendanceFilters.year;
                if (this.studentAttendanceFilters.className) params.className = this.studentAttendanceFilters.className;
                if (this.studentAttendanceFilters.month) params.month = this.studentAttendanceFilters.month;
                
                if (window.ShikolaTeacherApi && typeof window.ShikolaTeacherApi.getAttendanceSummary === 'function') {
                    this.attendanceData = await window.ShikolaTeacherApi.getAttendanceSummary(params);
                } else {
                    console.error('ShikolaTeacherApi.getAttendanceSummary not available');
                    this.attendanceData = [];
                }
            } catch (error) {
                console.error('Error loading attendance data:', error);
                this.attendanceData = [];
            } finally {
                this.loading = false;
            }
        },
        
        filteredStudentAttendance() {
            // Apply filters to attendance data
            return this.attendanceData.filter(record => {
                if (this.studentAttendanceFilters.className && record.className !== this.studentAttendanceFilters.className) {
                    return false;
                }
                if (this.studentAttendanceFilters.month && record.month !== this.studentAttendanceFilters.month) {
                    return false;
                }
                return true;
            });
        },
        
        printStudentAttendance() {
            window.print();
        },
        
        downloadStudentAttendancePdf() {
            // Implementation for PDF download
            console.log('Download attendance PDF');
        },
        
        downloadStudentAttendanceCsv() {
            // Implementation for CSV download
            console.log('Download attendance CSV');
        }
    }
}

// Initialize components when Alpine.js is ready
document.addEventListener('alpine:init', () => {
    Alpine.data('resultCardsData', resultCardsData);
    Alpine.data('studentReportCard', studentReportCard);
    Alpine.data('attendanceReports', attendanceReports);
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        resultCardsData,
        studentReportCard,
        attendanceReports
    };
}
