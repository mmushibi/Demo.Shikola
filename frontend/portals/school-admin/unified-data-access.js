/**
 * Unified Data Access System for Shikola Academy
 * Ensures all modules (classes, pupils, employees, attendance, tests, exams, timetable, dashboard, general settings) 
 * are interconnected and share the same demo data
 */

(function() {
    'use strict';

    // Unified Data Access Layer
    window.ShikolaUnifiedData = {
        // Initialize all data connections
        init: function() {
            if (window.ShikolaDemoData && window.ShikolaDemoData._ensureDataConsistency) {
                window.ShikolaDemoData._ensureDataConsistency();
            }
            console.log('Unified Data Access System initialized');
        },

        // Get all classes with related data
        getClassesWithDetails: function() {
            const classes = window.ShikolaDemoData?.classes || [];
            return classes.map(cls => ({
                ...cls,
                pupils: window.ShikolaDemoData.getPupilsByClass(cls.name),
                attendance: window.ShikolaDemoData.getAttendanceForClass(cls.name),
                timetable: window.ShikolaDemoData.getTimetableForClass(cls.name),
                subjects: window.ShikolaDemoData.getSubjectsForClass(cls.name),
                teacher: window.ShikolaDemoData.employees.find(emp => emp.fullName === cls.classTeacher)
            }));
        },

        // Get all pupils with related data
        getPupilsWithDetails: function() {
            const pupils = window.ShikolaDemoData?.pupils || [];
            return pupils.map(pupil => {
                const classData = window.ShikolaDemoData?.classes.find(c => c.name === pupil.className);
                return {
                    ...pupil,
                    class: classData,
                    attendance: window.ShikolaDemoData?.attendance?.detailedRecords?.find(r => r.pupilId === pupil.pupil_id),
                    subjects: classData ? window.ShikolaDemoData.getSubjectsForClass(classData.name) : []
                };
            });
        },

        // Get all employees with related data
        getEmployeesWithDetails: function() {
            const employees = window.ShikolaDemoData?.employees || [];
            return employees.map(emp => ({
                ...emp,
                classes: window.ShikolaDemoData.getClassesByTeacher(emp.fullName),
                subjects: emp.subjects || []
            }));
        },

        // Get dashboard statistics with real-time data
        getDashboardStats: function() {
            const classes = window.ShikolaDemoData?.classes || [];
            const pupils = window.ShikolaDemoData?.pupils || [];
            const employees = window.ShikolaDemoData?.employees || [];
            const attendance = window.ShikolaDemoData?.attendance?.today || {};

            return {
                totalPupils: pupils.length,
                totalEmployees: employees.length,
                totalClasses: classes.length,
                presentPupils: attendance.present || 0,
                absentPupils: attendance.absent || 0,
                latePupils: attendance.late || 0,
                attendancePercentage: attendance.percentage || 0,
                averageClassSize: classes.length > 0 ? Math.round(pupils.length / classes.length) : 0,
                occupancyRate: classes.length > 0 ? Math.round((pupils.length / classes.reduce((sum, cls) => sum + cls.maxPupils, 0)) * 100) : 0
            };
        },

        // Get timetable for all classes
        getCompleteTimetable: function() {
            const classes = window.ShikolaDemoData?.classes || [];
            const timetable = {};
            
            classes.forEach(cls => {
                timetable[cls.name] = window.ShikolaDemoData.getTimetableForClass(cls.name);
            });
            
            return timetable;
        },

        // Get examinations with related data
        getExaminationsWithDetails: function() {
            const exams = window.ShikolaDemoData?.examinations || [];
            return exams.map(exam => ({
                ...exam,
                applicableClassesData: exam.applicableClasses.map(className => 
                    window.ShikolaDemoData?.classes.find(c => c.name === className)
                ).filter(Boolean),
                subjectsData: exam.subjects.map(subjectName => 
                    window.ShikolaDemoData?.subjects.find(s => s.name === subjectName)
                ).filter(Boolean)
            }));
        },

        // Get class tests with related data
        getClassTestsWithDetails: function() {
            const tests = window.ShikolaDemoData?.classTests || [];
            return tests.map(test => ({
                ...test,
                applicableClassesData: test.applicableClasses.map(className => 
                    window.ShikolaDemoData?.classes.find(c => c.name === className)
                ).filter(Boolean),
                subjectData: window.ShikolaDemoData?.subjects.find(s => s.name === test.subject)
            }));
        },

        // Get attendance summary by class
        getAttendanceSummaryByClass: function() {
            const attendance = window.ShikolaDemoData?.attendance?.today?.byClass || [];
            return attendance.map(att => {
                const classData = window.ShikolaDemoData?.classes.find(c => c.name === att.className);
                return {
                    ...att,
                    class: classData,
                    teacher: classData ? window.ShikolaDemoData?.employees.find(emp => emp.fullName === classData.classTeacher) : null
                };
            });
        },

        // Get settings with related data
        getGeneralSettingsWithDetails: function() {
            const profile = window.ShikolaDemoData?.schoolProfile || {};
            const classes = window.ShikolaDemoData?.classes || [];
            const employees = window.ShikolaDemoData?.employees || [];
            
            return {
                ...profile,
                totalClasses: classes.length,
                totalEmployees: employees.length,
                teachers: employees.filter(emp => emp.role === 'Teacher'),
                classes: classes.map(cls => ({
                    name: cls.name,
                    level: cls.level,
                    classTeacher: cls.classTeacher,
                    maxPupils: cls.maxPupils,
                    currentEnrollment: cls.metadata?.currentEnrollment || 0
                }))
            };
        },

        // Search across all data
        searchAll: function(query) {
            const results = {
                classes: [],
                pupils: [],
                employees: [],
                subjects: []
            };

            const lowerQuery = query.toLowerCase();

            // Search classes
            if (window.ShikolaDemoData?.classes) {
                results.classes = window.ShikolaDemoData.classes.filter(cls => 
                    cls.name.toLowerCase().includes(lowerQuery) ||
                    cls.level.toLowerCase().includes(lowerQuery) ||
                    cls.classTeacher.toLowerCase().includes(lowerQuery)
                );
            }

            // Search pupils
            if (window.ShikolaDemoData?.pupils) {
                results.pupils = window.ShikolaDemoData.pupils.filter(pupil => 
                    pupil.fullName.toLowerCase().includes(lowerQuery) ||
                    pupil.admissionNo.toLowerCase().includes(lowerQuery) ||
                    pupil.className.toLowerCase().includes(lowerQuery)
                );
            }

            // Search employees
            if (window.ShikolaDemoData?.employees) {
                results.employees = window.ShikolaDemoData.employees.filter(emp => 
                    emp.fullName.toLowerCase().includes(lowerQuery) ||
                    emp.email.toLowerCase().includes(lowerQuery) ||
                    emp.role.toLowerCase().includes(lowerQuery)
                );
            }

            // Search subjects
            if (window.ShikolaDemoData?.subjects) {
                results.subjects = window.ShikolaDemoData.subjects.filter(subj => 
                    subj.name.toLowerCase().includes(lowerQuery) ||
                    subj.code.toLowerCase().includes(lowerQuery)
                );
            }

            return results;
        },

        // Export data for reports
        exportDataForReports: function() {
            return {
                classes: this.getClassesWithDetails(),
                pupils: this.getPupilsWithDetails(),
                employees: this.getEmployeesWithDetails(),
                attendance: {
                    today: window.ShikolaDemoData?.attendance?.today,
                    weekly: window.ShikolaDemoData?.attendance?.weekly,
                    monthly: window.ShikolaDemoData?.attendance?.monthly
                },
                examinations: this.getExaminationsWithDetails(),
                classTests: this.getClassTestsWithDetails(),
                timetable: this.getCompleteTimetable(),
                dashboard: this.getDashboardStats(),
                settings: this.getGeneralSettingsWithDetails()
            };
        }
    };

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            window.ShikolaUnifiedData.init();
        });
    } else {
        window.ShikolaUnifiedData.init();
    }

})();
