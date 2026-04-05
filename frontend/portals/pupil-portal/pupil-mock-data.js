/*
Pupil Portal Mock Data
Contains realistic mock data specifically for pupil portal pages
*/

(function() {
    'use strict';

    // Pupil profile data
    const PUPIL_PROFILE = {
        id: 'REG-452',
        firstName: 'Chipo',
        lastName: 'Bwalya',
        fullName: 'Chipo Bwalya',
        gender: 'Female',
        dateOfBirth: '2010-03-15',
        class: 'Grade 9A',
        grade: 'Grade 9',
        section: 'A',
        email: 'chipo.bwalya@shikola.edu.zm',
        phone: '+260976543210',
        address: '123 Kabulonga Road, Lusaka',
        parentName: 'Mary Bwalya',
        parentPhone: '+260976543211',
        status: 'Active',
        admissionYear: '2018',
        studentNumber: 'STU20260452'
    };

    // Dashboard data
    const DASHBOARD_DATA = {
        academicPerformance: {
            averageGrade: '78%',
            academicStatus: 'Good',
            gradeSummary: 'B+ Average',
            recentGrades: [
                { subject: 'Mathematics', score: 85, maxScore: 100 },
                { subject: 'English', score: 78, maxScore: 100 },
                { subject: 'Science', score: 82, maxScore: 100 }
            ]
        },
        attendance: {
            termPercentage: 92,
            todayLabel: 'Present',
            recentRecords: [
                { date: '2026-04-04', label: 'Present', className: 'Mathematics' },
                { date: '2026-04-03', label: 'Present', className: 'English' },
                { date: '2026-04-02', label: 'Late', className: 'Science' }
            ]
        },
        assignments: {
            pendingCount: 5,
            overdueCount: 1,
            assignmentStatus: 'Active',
            recentAssignments: [
                { id: 'ASSIGN-1234', title: 'Mathematics Problem Set', subject: 'Mathematics', dueOn: '2026-04-08' },
                { id: 'ASSIGN-1235', title: 'English Essay', subject: 'English', dueOn: '2026-04-09' },
                { id: 'ASSIGN-1236', title: 'Science Lab Report', subject: 'Science', dueOn: '2026-04-10' }
            ]
        }
    };

    // Assignments data
    const ASSIGNMENTS_DATA = {
        pending: [
            {
                id: 'ASSIGN-1234',
                title: 'Mathematics Problem Set - Chapter 5',
                summary: 'Complete exercises 1-20 on algebraic expressions and equations',
                subject: 'Mathematics',
                teacher: 'Mr. Mulenga',
                priority: 'high',
                priorityLabel: 'High Priority',
                assignedOn: '2026-04-01',
                dueOn: '2026-04-08',
                dueLabel: 'Due in 3 days',
                primaryButtonClass: 'bg-orange-500 hover:bg-orange-600',
                submissionType: 'online',
                estimatedTime: '45 minutes',
                attachments: ['math_exercises.pdf']
            },
            {
                id: 'ASSIGN-1235',
                title: 'English Essay - My Hero',
                summary: 'Write a 500-word essay about your personal hero and their influence on your life',
                subject: 'English',
                teacher: 'Ms. Phiri',
                priority: 'medium',
                priorityLabel: 'Medium Priority',
                assignedOn: '2026-04-02',
                dueOn: '2026-04-09',
                dueLabel: 'Due in 4 days',
                primaryButtonClass: 'bg-blue-500 hover:bg-blue-600',
                submissionType: 'upload',
                estimatedTime: '60 minutes',
                attachments: ['essay_guidelines.pdf', 'rubric.pdf']
            },
            {
                id: 'ASSIGN-1236',
                title: 'Science Lab Report - Chemical Reactions',
                summary: 'Document your observations from the chemistry experiment conducted in class',
                subject: 'Science',
                teacher: 'Mr. Chanda',
                priority: 'high',
                priorityLabel: 'High Priority',
                assignedOn: '2026-04-03',
                dueOn: '2026-04-10',
                dueLabel: 'Due in 5 days',
                primaryButtonClass: 'bg-orange-500 hover:bg-orange-600',
                submissionType: 'upload',
                estimatedTime: '90 minutes',
                attachments: ['lab_template.docx', 'experiment_notes.pdf']
            }
        ],
        submitted: [
            {
                id: 'ASSIGN-1230',
                title: 'History Project - Zambian Independence',
                summary: 'Research project on Zambia\'s journey to independence',
                subject: 'History',
                teacher: 'Ms. Tembo',
                submittedOn: '2026-04-05',
                submittedTime: '2:30 PM',
                statusLabel: 'Submitted for grading'
            },
            {
                id: 'ASSIGN-1231',
                title: 'Geography Map Work',
                summary: 'Create a physical map of Zambia showing major features',
                subject: 'Geography',
                teacher: 'Mr. Nkhata',
                submittedOn: '2026-04-04',
                submittedTime: '4:15 PM',
                statusLabel: 'Submitted for grading'
            }
        ],
        graded: [
            {
                id: 'ASSIGN-1225',
                title: 'Mathematics Quiz - Geometry',
                summary: 'Quiz on angles, shapes, and geometric proofs',
                subject: 'Mathematics',
                teacher: 'Mr. Mulenga',
                grade: 'A',
                score: '92/100',
                gradedOn: '2026-04-03',
                feedback: 'Excellent work! Your understanding of geometric concepts is outstanding. Keep up the good effort.'
            },
            {
                id: 'ASSIGN-1226',
                title: 'English Comprehension Test',
                summary: 'Reading comprehension and analysis of selected passages',
                subject: 'English',
                teacher: 'Ms. Phiri',
                grade: 'B+',
                score: '85/100',
                gradedOn: '2026-04-02',
                feedback: 'Good analysis of the text. Focus more on supporting your arguments with evidence from the passage.'
            }
        ]
    };

    // Live classes data
    const LIVE_CLASSES_DATA = {
        today: [
            {
                id: 'CLASS-001',
                title: 'Mathematics - Algebraic Expressions',
                description: 'Introduction to algebraic expressions and simplification techniques',
                subject: 'Mathematics',
                teacher: 'Mr. Mulenga',
                startTime: '08:00',
                endTime: '09:00',
                participants: 24,
                status: 'completed',
                cancelled: false
            },
            {
                id: 'CLASS-002',
                title: 'English - Essay Writing Workshop',
                description: 'Interactive workshop on essay structure and writing techniques',
                subject: 'English',
                teacher: 'Ms. Phiri',
                startTime: '09:30',
                endTime: '10:30',
                participants: 0,
                status: 'live',
                cancelled: false
            },
            {
                id: 'CLASS-003',
                title: 'Science - Chemistry Lab',
                description: 'Practical session on chemical reactions and laboratory safety',
                subject: 'Science',
                teacher: 'Mr. Chanda',
                startTime: '11:00',
                endTime: '12:00',
                participants: 0,
                status: 'upcoming',
                cancelled: false
            },
            {
                id: 'CLASS-004',
                title: 'History - Zambian Culture',
                description: 'Exploring Zambia\'s diverse cultural heritage',
                subject: 'History',
                teacher: 'Ms. Tembo',
                startTime: '14:00',
                endTime: '15:00',
                participants: 0,
                status: 'upcoming',
                cancelled: true,
                cancellationNote: 'Teacher unavailable - class rescheduled for tomorrow'
            }
        ],
        upcoming: [
            {
                id: 'CLASS-005',
                title: 'Geography - Physical Features of Africa',
                description: 'Study of major geographical features across the African continent',
                subject: 'Geography',
                teacher: 'Mr. Nkhata',
                date: '2026-04-07',
                startTime: '08:00',
                endTime: '09:00'
            },
            {
                id: 'CLASS-006',
                title: 'Physical Education - Team Sports',
                description: 'Basketball techniques and team coordination drills',
                subject: 'Physical Education',
                teacher: 'Mr. Siamuleya',
                date: '2026-04-08',
                startTime: '10:00',
                endTime: '11:00'
            }
        ],
        recorded: [
            {
                id: 'REC-001',
                classTitle: 'Mathematics - Introduction to Geometry',
                teacher: 'Mr. Mulenga',
                subject: 'Mathematics',
                recordedDate: '2026-04-01',
                duration: '45 mins'
            },
            {
                id: 'REC-002',
                classTitle: 'English - Poetry Analysis',
                teacher: 'Ms. Phiri',
                subject: 'English',
                recordedDate: '2026-03-31',
                duration: '60 mins'
            }
        ]
    };

    // Report card data
    const REPORT_CARD_DATA = {
        term1: {
            subjects: [
                { name: 'Mathematics', score: 85, grade: 'A', remarks: 'Excellent' },
                { name: 'English', score: 78, grade: 'B+', remarks: 'Good' },
                { name: 'Science', score: 82, grade: 'A-', remarks: 'Very Good' },
                { name: 'History', score: 75, grade: 'B', remarks: 'Good' },
                { name: 'Geography', score: 80, grade: 'B+', remarks: 'Good' },
                { name: 'Civic Education', score: 88, grade: 'A', remarks: 'Excellent' },
                { name: 'Art', score: 92, grade: 'A+', remarks: 'Outstanding' },
                { name: 'Physical Education', score: 85, grade: 'A', remarks: 'Excellent' }
            ],
            average: 83.1,
            position: '3/28',
            attendance: '95%',
            conduct: 'Excellent'
        },
        term2: {
            subjects: [
                { name: 'Mathematics', score: 87, grade: 'A', remarks: 'Excellent' },
                { name: 'English', score: 80, grade: 'B+', remarks: 'Good' },
                { name: 'Science', score: 85, grade: 'A', remarks: 'Excellent' },
                { name: 'History', score: 77, grade: 'B+', remarks: 'Good' },
                { name: 'Geography', score: 82, grade: 'B+', remarks: 'Good' },
                { name: 'Civic Education', score: 90, grade: 'A+', remarks: 'Outstanding' },
                { name: 'Art', score: 94, grade: 'A+', remarks: 'Outstanding' },
                { name: 'Physical Education', score: 88, grade: 'A', remarks: 'Excellent' }
            ],
            average: 85.4,
            position: '2/28',
            attendance: '93%',
            conduct: 'Excellent'
        },
        term3: {
            subjects: [
                { name: 'Mathematics', score: 89, grade: 'A', remarks: 'Excellent' },
                { name: 'English', score: 82, grade: 'B+', remarks: 'Good' },
                { name: 'Science', score: 87, grade: 'A', remarks: 'Excellent' },
                { name: 'History', score: 79, grade: 'B+', remarks: 'Good' },
                { name: 'Geography', score: 84, grade: 'B+', remarks: 'Good' },
                { name: 'Civic Education', score: 91, grade: 'A+', remarks: 'Outstanding' },
                { name: 'Art', score: 95, grade: 'A+', remarks: 'Outstanding' },
                { name: 'Physical Education', score: 90, grade: 'A+', remarks: 'Outstanding' }
            ],
            average: 87.1,
            position: '2/28',
            attendance: '94%',
            conduct: 'Excellent'
        }
    };

    // Timetable data
    const TIMETABLE_DATA = {
        today: [
            {
                id: 'TT-001',
                startTime: '08:00',
                endTime: '09:00',
                startLabel: '08:00 AM',
                subjectName: 'Mathematics',
                subjectCode: 'MATH',
                teacherName: 'Mr. Mulenga',
                roomName: 'Room 101',
                periodTime: '08:00 - 09:00'
            },
            {
                id: 'TT-002',
                startTime: '09:00',
                endTime: '10:00',
                startLabel: '09:00 AM',
                subjectName: 'English',
                subjectCode: 'ENG',
                teacherName: 'Ms. Phiri',
                roomName: 'Room 102',
                periodTime: '09:00 - 10:00'
            },
            {
                id: 'TT-003',
                startTime: '10:30',
                endTime: '11:30',
                startLabel: '10:30 AM',
                subjectName: 'Science',
                subjectCode: 'SCI',
                teacherName: 'Mr. Chanda',
                roomName: 'Lab 201',
                periodTime: '10:30 - 11:30'
            },
            {
                id: 'TT-004',
                startTime: '11:30',
                endTime: '12:30',
                startLabel: '11:30 AM',
                subjectName: 'History',
                subjectCode: 'HIST',
                teacherName: 'Ms. Tembo',
                roomName: 'Room 103',
                periodTime: '11:30 - 12:30'
            },
            {
                id: 'TT-005',
                startTime: '14:00',
                endTime: '15:00',
                startLabel: '02:00 PM',
                subjectName: 'Geography',
                subjectCode: 'GEOG',
                teacherName: 'Mr. Nkhata',
                roomName: 'Room 104',
                periodTime: '14:00 - 15:00'
            }
        ],
        week: [
            {
                periodId: 'P1',
                label: '08:00-09:00',
                cells: [
                    { dayKey: 'mon', slot: { subjectCode: 'MATH', roomName: 'Room 101' } },
                    { dayKey: 'tue', slot: { subjectCode: 'ENG', roomName: 'Room 102' } },
                    { dayKey: 'wed', slot: { subjectCode: 'SCI', roomName: 'Lab 201' } },
                    { dayKey: 'thu', slot: { subjectCode: 'HIST', roomName: 'Room 103' } },
                    { dayKey: 'fri', slot: { subjectCode: 'GEOG', roomName: 'Room 104' } }
                ]
            },
            {
                periodId: 'P2',
                label: '09:00-10:00',
                cells: [
                    { dayKey: 'mon', slot: { subjectCode: 'ENG', roomName: 'Room 102' } },
                    { dayKey: 'tue', slot: { subjectCode: 'MATH', roomName: 'Room 101' } },
                    { dayKey: 'wed', slot: { subjectCode: 'GEOG', roomName: 'Room 104' } },
                    { dayKey: 'thu', slot: { subjectCode: 'SCI', roomName: 'Lab 201' } },
                    { dayKey: 'fri', slot: { subjectCode: 'HIST', roomName: 'Room 103' } }
                ]
            },
            {
                periodId: 'P3',
                label: '10:30-11:30',
                cells: [
                    { dayKey: 'mon', slot: { subjectCode: 'SCI', roomName: 'Lab 201' } },
                    { dayKey: 'tue', slot: { subjectCode: 'HIST', roomName: 'Room 103' } },
                    { dayKey: 'wed', slot: { subjectCode: 'MATH', roomName: 'Room 101' } },
                    { dayKey: 'thu', slot: { subjectCode: 'ENG', roomName: 'Room 102' } },
                    { dayKey: 'fri', slot: { subjectCode: 'CIVIC', roomName: 'Room 105' } }
                ]
            }
        ]
    };

    // Export data for use in HTML files
    window.PupilMockData = {
        profile: PUPIL_PROFILE,
        dashboard: DASHBOARD_DATA,
        assignments: ASSIGNMENTS_DATA,
        liveClasses: LIVE_CLASSES_DATA,
        reportCard: REPORT_CARD_DATA,
        timetable: TIMETABLE_DATA
    };

    // Initialize function
    window.initializePupilMockData = function() {
        console.log('Initializing pupil mock data...');
        
        // Store data in localStorage for easy access
        localStorage.setItem('pupil_profile', JSON.stringify(PUPIL_PROFILE));
        localStorage.setItem('pupil_dashboard_data', JSON.stringify(DASHBOARD_DATA));
        localStorage.setItem('pupil_assignments_data', JSON.stringify(ASSIGNMENTS_DATA));
        localStorage.setItem('pupil_live_classes_data', JSON.stringify(LIVE_CLASSES_DATA));
        localStorage.setItem('pupil_report_card_data', JSON.stringify(REPORT_CARD_DATA));
        localStorage.setItem('pupil_timetable_data', JSON.stringify(TIMETABLE_DATA));
        
        console.log('Pupil mock data initialized successfully!');
        
        // Trigger event for UI updates
        window.dispatchEvent(new CustomEvent('pupil:mock-data-initialized', {
            detail: { success: true, timestamp: new Date() }
        }));
    };

    // Auto-initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializePupilMockData);
    } else {
        initializePupilMockData();
    }

})();
