/*
Reports Data Loader for Shikola Academy
Generates comprehensive sample data for all reports sections
*/

window.ReportsDataLoader = {
    // Student report card data
    studentReportCardData: [
        {
            id: 'P2026001',
            name: 'Yohano Mushibi',
            admissionNo: 'SKL-4102241',
            gender: 'Male',
            dob: '14/02/2014',
            grade: 'Form 1',
            classSection: 'B',
            campus: 'Main',
            className: 'Grade 9A',
            term: 'Term 1',
            year: '2026',
            termLabel: 'END OF TERM 1 EXAMINATIONS 2026',
            subjects: [
                { name: 'Mathematics', marksObtained: 78, totalMarks: 100, percentage: 78, remarks: 'Good performance' },
                { name: 'English Language', marksObtained: 85, totalMarks: 100, percentage: 85, remarks: 'Excellent work' },
                { name: 'Science', marksObtained: 72, totalMarks: 100, percentage: 72, remarks: 'Satisfactory' },
                { name: 'Social Studies', marksObtained: 68, totalMarks: 100, percentage: 68, remarks: 'Needs improvement' },
                { name: 'Geography', marksObtained: 75, totalMarks: 100, percentage: 75, remarks: 'Good effort' },
                { name: 'History', marksObtained: 70, totalMarks: 100, percentage: 70, remarks: 'Satisfactory' },
                { name: 'Biology', marksObtained: 82, totalMarks: 100, percentage: 82, remarks: 'Very good' },
                { name: 'Physics', marksObtained: 65, totalMarks: 100, percentage: 65, remarks: 'Needs improvement' },
                { name: 'Chemistry', marksObtained: 70, totalMarks: 100, percentage: 70, remarks: 'Satisfactory' },
                { name: 'Agricultural Science', marksObtained: 88, totalMarks: 100, percentage: 88, remarks: 'Outstanding' }
            ],
            totals: {
                totalObtained: 753,
                totalPossible: 1000,
                percentage: 75.3
            },
            classPosition: '8/32',
            resultStatus: 'PASSED',
            attendance: {
                totalDays: 90,
                daysPresent: 82,
                daysAbsent: 8,
                timesLate: 3,
                percentage: 91.1
            },
            teacherComment: 'Yohano has shown good progress this term. He participates actively in class and completes assignments on time.',
            headteacherComment: 'A promising student who demonstrates consistent effort and good conduct.'
        },
        {
            id: 'P2026002',
            name: 'Sarah Banda',
            admissionNo: 'SKL-4102242',
            gender: 'Female',
            dob: '23/06/2014',
            grade: 'Form 1',
            classSection: 'A',
            campus: 'Main',
            className: 'Grade 9A',
            term: 'Term 1',
            year: '2026',
            termLabel: 'END OF TERM 1 EXAMINATIONS 2026',
            subjects: [
                { name: 'Mathematics', marksObtained: 92, totalMarks: 100, percentage: 92, remarks: 'Outstanding' },
                { name: 'English Language', marksObtained: 88, totalMarks: 100, percentage: 88, remarks: 'Excellent work' },
                { name: 'Science', marksObtained: 85, totalMarks: 100, percentage: 85, remarks: 'Excellent' },
                { name: 'Social Studies', marksObtained: 90, totalMarks: 100, percentage: 90, remarks: 'Outstanding' },
                { name: 'Geography', marksObtained: 87, totalMarks: 100, percentage: 87, remarks: 'Excellent' },
                { name: 'History', marksObtained: 84, totalMarks: 100, percentage: 84, remarks: 'Very good' },
                { name: 'Biology', marksObtained: 89, totalMarks: 100, percentage: 89, remarks: 'Excellent' },
                { name: 'Physics', marksObtained: 83, totalMarks: 100, percentage: 83, remarks: 'Very good' },
                { name: 'Chemistry', marksObtained: 86, totalMarks: 100, percentage: 86, remarks: 'Excellent' },
                { name: 'Agricultural Science', marksObtained: 91, totalMarks: 100, percentage: 91, remarks: 'Outstanding' }
            ],
            totals: {
                totalObtained: 875,
                totalPossible: 1000,
                percentage: 87.5
            },
            classPosition: '1/32',
            resultStatus: 'PASSED WITH DISTINCTION',
            attendance: {
                totalDays: 90,
                daysPresent: 89,
                daysAbsent: 1,
                timesLate: 0,
                percentage: 98.9
            },
            teacherComment: 'Sarah is an exceptional student who consistently demonstrates academic excellence.',
            headteacherComment: 'Outstanding performance across all subjects. Keep up the excellent work!'
        },
        {
            id: 'P2026003',
            name: 'James Mwale',
            admissionNo: 'SKL-4102243',
            gender: 'Male',
            dob: '15/09/2014',
            grade: 'Form 2',
            classSection: 'C',
            campus: 'Main',
            className: 'Grade 10B',
            term: 'Term 1',
            year: '2026',
            termLabel: 'END OF TERM 1 EXAMINATIONS 2026',
            subjects: [
                { name: 'Mathematics', marksObtained: 55, totalMarks: 100, percentage: 55, remarks: 'Needs improvement' },
                { name: 'English Language', marksObtained: 62, totalMarks: 100, percentage: 62, remarks: 'Satisfactory' },
                { name: 'Science', marksObtained: 48, totalMarks: 100, percentage: 48, remarks: 'Needs significant improvement' },
                { name: 'Social Studies', marksObtained: 58, totalMarks: 100, percentage: 58, remarks: 'Needs improvement' },
                { name: 'Geography', marksObtained: 52, totalMarks: 100, percentage: 52, remarks: 'Needs improvement' },
                { name: 'History', marksObtained: 60, totalMarks: 100, percentage: 60, remarks: 'Satisfactory' },
                { name: 'Biology', marksObtained: 45, totalMarks: 100, percentage: 45, remarks: 'Needs significant improvement' },
                { name: 'Physics', marksObtained: 42, totalMarks: 100, percentage: 42, remarks: 'Needs significant improvement' },
                { name: 'Chemistry', marksObtained: 50, totalMarks: 100, percentage: 50, remarks: 'Needs improvement' },
                { name: 'Agricultural Science', marksObtained: 65, totalMarks: 100, percentage: 65, remarks: 'Satisfactory' }
            ],
            totals: {
                totalObtained: 537,
                totalPossible: 1000,
                percentage: 53.7
            },
            classPosition: '28/30',
            resultStatus: 'PASSED',
            attendance: {
                totalDays: 90,
                daysPresent: 75,
                daysAbsent: 15,
                timesLate: 8,
                percentage: 83.3
            },
            teacherComment: 'James needs to put more effort into his studies. Regular attendance is crucial.',
            headteacherComment: 'More dedication required to achieve academic success.'
        }
    ],

    // Student attendance data
    studentAttendanceData: [
        {
            month: 'June 2026',
            className: 'Grade 9A',
            studentName: 'Yohano Mushibi',
            studentId: 'P2026001',
            daysPresent: 22,
            daysAbsent: 3,
            timesLate: 2,
            percentage: 88.0
        },
        {
            month: 'June 2026',
            className: 'Grade 9A',
            studentName: 'Sarah Banda',
            studentId: 'P2026002',
            daysPresent: 24,
            daysAbsent: 1,
            timesLate: 0,
            percentage: 96.0
        },
        {
            month: 'June 2026',
            className: 'Grade 10B',
            studentName: 'James Mwale',
            studentId: 'P2026003',
            daysPresent: 20,
            daysAbsent: 5,
            timesLate: 3,
            percentage: 80.0
        },
        {
            month: 'June 2026',
            className: 'Grade 7B',
            studentName: 'Grace Phiri',
            studentId: 'P2026004',
            daysPresent: 23,
            daysAbsent: 2,
            timesLate: 1,
            percentage: 92.0
        },
        {
            month: 'June 2026',
            className: 'Grade 8A',
            studentName: 'David Tembo',
            studentId: 'P2026005',
            daysPresent: 21,
            daysAbsent: 4,
            timesLate: 2,
            percentage: 84.0
        },
        {
            month: 'May 2026',
            className: 'Grade 9A',
            studentName: 'Yohano Mushibi',
            studentId: 'P2026001',
            daysPresent: 20,
            daysAbsent: 2,
            timesLate: 1,
            percentage: 90.9
        },
        {
            month: 'May 2026',
            className: 'Grade 9A',
            studentName: 'Sarah Banda',
            studentId: 'P2026002',
            daysPresent: 22,
            daysAbsent: 0,
            timesLate: 0,
            percentage: 100.0
        }
    ],

    // Staff attendance data
    staffAttendanceData: [
        {
            month: 'June 2026',
            staffName: 'John Mulenga',
            role: 'Deputy Head Teacher',
            department: 'Administration',
            daysPresent: 22,
            daysAbsent: 1,
            timesLate: 0,
            percentage: 95.7
        },
        {
            month: 'June 2026',
            staffName: 'Daniel Tembo',
            role: 'Senior Teacher',
            department: 'Academic',
            daysPresent: 21,
            daysAbsent: 2,
            timesLate: 1,
            percentage: 91.3
        },
        {
            month: 'June 2026',
            staffName: 'Nancy Mwansa',
            role: 'Teacher',
            department: 'Academic',
            daysPresent: 23,
            daysAbsent: 0,
            timesLate: 0,
            percentage: 100.0
        },
        {
            month: 'June 2026',
            staffName: 'Quinton Mwansa',
            role: 'Accountant',
            department: 'Administration',
            daysPresent: 22,
            daysAbsent: 1,
            timesLate: 0,
            percentage: 95.7
        },
        {
            month: 'June 2026',
            staffName: 'Abraham Phiri',
            role: 'Administrator',
            department: 'Support',
            daysPresent: 20,
            daysAbsent: 3,
            timesLate: 2,
            percentage: 87.0
        },
        {
            month: 'May 2026',
            staffName: 'John Mulenga',
            role: 'Deputy Head Teacher',
            department: 'Administration',
            daysPresent: 21,
            daysAbsent: 0,
            timesLate: 0,
            percentage: 100.0
        },
        {
            month: 'May 2026',
            staffName: 'Daniel Tembo',
            role: 'Senior Teacher',
            department: 'Academic',
            daysPresent: 20,
            daysAbsent: 1,
            timesLate: 1,
            percentage: 95.2
        }
    ],

    // Initialize reports data
    initializeReportsData: function() {
        console.log('Initializing reports data...');
        
        // Store data in window scope for accessibility
        window.reportsStudentData = this.studentReportCardData;
        window.reportsStudentAttendance = this.studentAttendanceData;
        window.reportsStaffAttendance = this.staffAttendanceData;
        
        // Store in localStorage
        localStorage.setItem('shikola_reports_student_data', JSON.stringify(this.studentReportCardData));
        localStorage.setItem('shikola_reports_student_attendance', JSON.stringify(this.studentAttendanceData));
        localStorage.setItem('shikola_reports_staff_attendance', JSON.stringify(this.staffAttendanceData));
        
        // Trigger initialization event
        window.dispatchEvent(new CustomEvent('shikola:reports-data-initialized', {
            detail: { 
                success: true,
                timestamp: new Date()
            }
        }));
        
        console.log('Reports data initialized successfully!');
    },

    // Get student report card data
    getStudentReportCardData: function() {
        return this.studentReportCardData;
    },

    // Get student attendance data
    getStudentAttendanceData: function() {
        return this.studentAttendanceData;
    },

    // Get staff attendance data
    getStaffAttendanceData: function() {
        return this.staffAttendanceData;
    },

    // Auto-initialize when DOM is ready
    autoInitialize: function() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.initializeReportsData();
            });
        } else {
            this.initializeReportsData();
        }
    }
};

// Auto-initialize
window.ReportsDataLoader.autoInitialize();

// Also force immediate initialization for demo purposes
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    window.ReportsDataLoader.initializeReportsData();
}
