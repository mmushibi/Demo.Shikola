/*
Mock Data Compatibility Bridge
Connects comprehensive mock data to existing data loaders
*/

(function() {
    'use strict';

    // Wait for comprehensive mock data to be available
    function initializeCompatibility() {
        if (window.ShikolaMockData) {
            console.log('Initializing mock data compatibility bridge...');
            
            // Create ShikolaAdminMockData interface for existing loaders
            window.ShikolaAdminMockData = {
                getPupils: function() {
                    return window.ShikolaMockData.pupils || [];
                },
                
                getEmployees: function() {
                    return window.ShikolaMockData.employees || [];
                },
                
                getClasses: function() {
                    return window.ShikolaMockData.classes || [];
                },
                
                getTimetable: function() {
                    return window.ShikolaMockData.timetable || [];
                },
                
                getSchoolConfig: function() {
                    return window.ShikolaMockData.schoolConfig || {};
                },
                
                getReportsData: function() {
                    const pupils = this.getPupils();
                    const employees = this.getEmployees();
                    const classes = this.getClasses();
                    
                    return {
                        enrollment: {
                            totalPupils: pupils.length,
                            activePupils: pupils.filter(p => p.status === 'Active').length,
                            newPupils: pupils.filter(p => p.admission_year >= new Date().getFullYear()).length
                        },
                        staff: {
                            totalStaff: employees.length,
                            teachingStaff: employees.filter(e => e.position.includes('Teacher')).length,
                            adminStaff: employees.filter(e => e.department === 'Administration').length
                        },
                        academic: {
                            totalClasses: classes.length,
                            averageClassSize: Math.round(pupils.length / classes.length),
                            subjectsOffered: 24 // Based on our subjects array
                        },
                        financial: {
                            totalRevenue: pupils.length * 3500, // Average fees per pupil
                            totalExpenses: employees.reduce((sum, e) => sum + (e.salary || 0), 0),
                            outstandingFees: pupils.reduce((sum, p) => sum + (p.fees_balance || 0), 0)
                        },
                        attendance: {
                            averageAttendance: pupils.length > 0 ? 
                                Math.round(pupils.reduce((sum, p) => sum + (p.attendance_rate || 85), 0) / pupils.length) : 85,
                            presentToday: Math.round(pupils.length * 0.92),
                            absentToday: Math.round(pupils.length * 0.08)
                        }
                    };
                }
            };

            // Create teacher mock data interface
            window.ShikolaTeacherMockData = {
                getTeacherProfile: function() {
                    const employees = window.ShikolaMockData.employees || [];
                    const teachers = employees.filter(e => e.position.includes('Teacher'));
                    return teachers[0] || {
                        id: 'TCH-001',
                        name: 'John Bwalya',
                        email: 'john.bwalya@shikola.edu.zm',
                        phone: '+260950123456',
                        department: 'Academic',
                        specialization: 'Mathematics',
                        experience: '5 years',
                        qualification: 'Bachelor of Education'
                    };
                },
                
                getAssignedClasses: function() {
                    const classes = window.ShikolaMockData.classes || [];
                    return classes.slice(0, 5); // Return first 5 classes
                },
                
                getClassStudents: function() {
                    const pupils = window.ShikolaMockData.pupils || [];
                    return pupils.slice(0, 30); // Return first 30 pupils
                }
            };

            // Create pupil mock data interface
            window.ShikolaPupilMockData = {
                getPupilProfile: function() {
                    const pupils = window.ShikolaMockData.pupils || [];
                    return pupils[0] || {
                        id: 'REG-001',
                        first_name: 'Mary',
                        last_name: 'Bwalya',
                        class_name: 'Grade 10A',
                        email: 'mary.bwalya@shikola.edu.zm'
                    };
                },
                
                getAssignments: function() {
                    return [
                        {
                            id: 'ASSIGN-001',
                            title: 'Mathematics Homework - Algebra',
                            subject: 'Mathematics',
                            class: 'Grade 10A',
                            teacher: 'John Bwalya',
                            assignedDate: '2026-04-01',
                            dueDate: '2026-04-08',
                            status: 'Active',
                            description: 'Complete exercises 1-20 on page 45',
                            maxMarks: 50,
                            submittedMarks: null
                        },
                        {
                            id: 'ASSIGN-002',
                            title: 'English Essay - My Hero',
                            subject: 'English Language',
                            class: 'Grade 10A',
                            teacher: 'Mary Mulenga',
                            assignedDate: '2026-04-02',
                            dueDate: '2026-04-09',
                            status: 'Submitted',
                            description: 'Write a 500-word essay about your hero',
                            maxMarks: 40,
                            submittedMarks: 35
                        },
                        {
                            id: 'ASSIGN-003',
                            title: 'Science Project - Solar System',
                            subject: 'Integrated Science',
                            class: 'Grade 10A',
                            teacher: 'Grace Phiri',
                            assignedDate: '2026-03-28',
                            dueDate: '2026-04-04',
                            status: 'Graded',
                            description: 'Create a model of the solar system',
                            maxMarks: 60,
                            submittedMarks: 52
                        }
                    ];
                }
            };

            // Trigger data ready events for different loaders
            window.dispatchEvent(new CustomEvent('shikola:mock-data-ready', {
                detail: { success: true, timestamp: new Date() }
            }));
            
            window.dispatchEvent(new CustomEvent('shikola:admin-mock-data-initialized', {
                detail: { success: true, timestamp: new Date() }
            }));
            
            window.dispatchEvent(new CustomEvent('shikola:teacher-mock-data-initialized', {
                detail: { success: true, timestamp: new Date() }
            }));
            
            window.dispatchEvent(new CustomEvent('shikola:pupil-mock-data-initialized', {
                detail: { success: true, timestamp: new Date() }
            }));
            
            // Initialize localStorage for data persistence
            if (typeof window.ShikolaMockData.initializeAll === 'function') {
                window.ShikolaMockData.initializeAll();
            }
            
            console.log('Mock data compatibility bridge initialized successfully');
        } else {
            // Retry after a short delay
            setTimeout(initializeCompatibility, 100);
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeCompatibility);
    } else {
        initializeCompatibility();
    }
})();
