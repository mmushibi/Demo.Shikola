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
 * Teacher Role Assignment Management
 * Handles assignment of teachers as class teachers, subject teachers, or both
 */

(function() {
    'use strict';

    // Data keys
    var TEACHERS_KEY = 'shikola_teachers_v1';
    var CLASSES_KEY = 'shikola_classes_v1';
    var SUBJECTS_KEY = 'shikola_subjects_v1';
    var ASSIGNMENTS_KEY = 'shikola_teacher_assignments_v1';

    // API helpers
    function getApiBase() {
        return window.SHIKOLA_API_BASE || 'http://localhost:3000';
    }

    function getAuthToken() {
        try {
            return localStorage.getItem('authToken') || localStorage.getItem('shikola_token') || null;
        } catch (e) {
            return null;
        }
    }

    function buildAuthHeaders() {
        var headers = { 'Content-Type': 'application/json' };
        var token = getAuthToken();
        if (token) {
            headers['Authorization'] = 'Bearer ' + token;
        }
        return headers;
    }

    async function apiRequestJson(endpoint, options) {
        var base = getApiBase();
        if (!base) return null;
        try {
            var response = await fetch(base + endpoint, Object.assign({
                headers: buildAuthHeaders()
            }, options || {}));
            var data = await response.json().catch(function () { return null; });
            if (!response.ok) {
                console.error('API request failed:', response.status, data);
                return null;
            }
            return data;
        } catch (e) {
            console.error('API request error:', e);
            return null;
        }
    }

    // Local storage helpers
    function loadJson(key, fallback) {
        try {
            var raw = localStorage.getItem(key);
            if (!raw) return fallback;
            var parsed = JSON.parse(raw);
            return parsed == null ? fallback : parsed;
        } catch (e) {
            console.error('Error loading from localStorage:', e);
            return fallback;
        }
    }

    function saveJson(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error('Error saving to localStorage:', e);
        }
    }

    // Teacher assignment data management
    function loadTeacherAssignments() {
        return loadJson(ASSIGNMENTS_KEY, []);
    }

    function saveTeacherAssignments(assignments) {
        saveJson(ASSIGNMENTS_KEY, assignments);
        window.dispatchEvent(new CustomEvent('shikola:teacher-assignments-updated', { 
            detail: assignments 
        }));
    }

    function loadTeachers() {
        return loadJson(TEACHERS_KEY, []);
    }

    function loadClasses() {
        return loadJson(CLASSES_KEY, []);
    }

    function loadSubjects() {
        return loadJson(SUBJECTS_KEY, []);
    }

    // Teacher role assignment functions
    window.TeacherRoleAssignments = {
        
        // Get all teacher assignments
        getAssignments: function() {
            return loadTeacherAssignments();
        },

        // Add or update teacher assignment
        saveAssignment: function(assignmentData) {
            var assignments = loadTeacherAssignments();
            var existingIndex = assignments.findIndex(function(a) {
                return a.teacherId === assignmentData.teacherId && 
                       a.classId === assignmentData.classId &&
                       a.subjectId === assignmentData.subjectId;
            });

            assignmentData.updatedAt = new Date().toISOString();
            
            if (existingIndex >= 0) {
                assignments[existingIndex] = assignmentData;
            } else {
                assignmentData.createdAt = new Date().toISOString();
                assignments.push(assignmentData);
            }

            saveTeacherAssignments(assignments);
            return assignmentData;
        },

        // Remove teacher assignment
        removeAssignment: function(teacherId, classId, subjectId) {
            var assignments = loadTeacherAssignments();
            assignments = assignments.filter(function(a) {
                return !(a.teacherId === teacherId && 
                        a.classId === classId &&
                        a.subjectId === subjectId);
            });
            saveTeacherAssignments(assignments);
            return true;
        },

        // Get assignments for a specific teacher
        getTeacherAssignments: function(teacherId) {
            var assignments = loadTeacherAssignments();
            return assignments.filter(function(a) {
                return a.teacherId === teacherId;
            });
        },

        // Get assignments for a specific class
        getClassAssignments: function(classId) {
            var assignments = loadTeacherAssignments();
            return assignments.filter(function(a) {
                return a.classId === classId;
            });
        },

        // Get class teacher for a class
        getClassTeacher: function(classId) {
            var assignments = loadTeacherAssignments();
            var classAssignment = assignments.find(function(a) {
                return a.classId === classId && 
                       a.assignmentType === 'class_teacher' && 
                       a.isPrimary;
            });
            return classAssignment || null;
        },

        // Get subject teachers for a class
        getSubjectTeachers: function(classId) {
            var assignments = loadTeacherAssignments();
            return assignments.filter(function(a) {
                return a.classId === classId && 
                       a.assignmentType === 'subject_teacher';
            });
        },

        // Get teacher's role type
        getTeacherRole: function(teacherId) {
            var assignments = this.getTeacherAssignments(teacherId);
            var hasClassTeacherRole = assignments.some(function(a) {
                return a.assignmentType === 'class_teacher';
            });
            var hasSubjectTeacherRole = assignments.some(function(a) {
                return a.assignmentType === 'subject_teacher';
            });

            if (hasClassTeacherRole && hasSubjectTeacherRole) {
                return 'both';
            } else if (hasClassTeacherRole) {
                return 'class_teacher';
            } else {
                return 'subject_teacher';
            }
        },

        // Create assignment with proper role validation
        createAssignment: function(teacherId, classId, subjectId, assignmentType, options) {
            options = options || {};
            
            var assignment = {
                id: options.id || this.generateId(),
                teacherId: teacherId,
                classId: classId,
                subjectId: subjectId,
                assignmentType: assignmentType, // 'class_teacher' or 'subject_teacher'
                isPrimary: options.isPrimary || false,
                canMarkAttendance: options.canMarkAttendance !== false,
                canViewReports: options.canViewReports !== false,
                canManageGrades: options.canManageGrades !== false,
                accessLevel: options.accessLevel || (assignmentType === 'class_teacher' ? 'full' : 'limited'),
                notes: options.notes || '',
                assignedBy: options.assignedBy || 'current_user',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            // Set default permissions based on assignment type
            if (assignmentType === 'class_teacher') {
                assignment.isPrimary = true;
                assignment.canViewReports = true;
                assignment.canManageGrades = true;
                assignment.accessLevel = 'full';
            } else if (assignmentType === 'subject_teacher') {
                assignment.isPrimary = false;
                assignment.canViewReports = false;
                assignment.canManageGrades = true; // Can manage grades for their subject
                assignment.accessLevel = 'limited';
            }

            return this.saveAssignment(assignment);
        },

        // Update teacher role in user_profiles
        updateTeacherRole: function(teacherId) {
            var role = this.getTeacherRole(teacherId);
            
            // This would typically be handled by the backend
            // For now, store locally for UI purposes
            var teachers = loadTeachers();
            var teacher = teachers.find(function(t) {
                return t.id === teacherId;
            });
            
            if (teacher) {
                teacher.teacherRole = role;
                saveJson(TEACHERS_KEY, teachers);
            }

            return role;
        },

        // Validate assignment rules with support for multiple subject teachers
        validateAssignment: function(teacherId, classId, subjectId, assignmentType) {
            var errors = [];

            // Check if teacher exists
            var teachers = loadTeachers();
            var teacher = teachers.find(function(t) {
                return t.id === teacherId;
            });
            if (!teacher) {
                errors.push('Teacher not found');
            }

            // Check if class exists
            var classes = loadClasses();
            var classObj = classes.find(function(c) {
                return c.id === classId;
            });
            if (!classObj) {
                errors.push('Class not found');
            }

            // Check if subject exists (if provided)
            if (subjectId) {
                var subjects = loadSubjects();
                var subject = subjects.find(function(s) {
                    return s.id === subjectId;
                });
                if (!subject) {
                    errors.push('Subject not found');
                }
            }

            // Check for duplicate class teacher assignment
            if (assignmentType === 'class_teacher') {
                var existingClassTeacher = this.getClassTeacher(classId);
                if (existingClassTeacher && existingClassTeacher.teacherId !== teacherId) {
                    errors.push('Class already has a class teacher assigned');
                }
            }

            // Allow multiple subject teachers per class (no limit)
            // Only check for exact duplicate assignment
            var existingAssignment = this.getAssignments().find(function(a) {
                return a.teacherId === teacherId && 
                       a.classId === classId && 
                       a.subjectId === subjectId;
            });
            if (existingAssignment) {
                errors.push('Teacher already assigned to this class/subject combination');
            }

            return {
                isValid: errors.length === 0,
                errors: errors
            };
        },

        // Get all subject teachers for a specific class
        getClassSubjectTeachers: function(classId) {
            var assignments = loadTeacherAssignments();
            return assignments.filter(function(a) {
                return a.classId === classId && 
                       a.assignmentType === 'subject_teacher';
            });
        },

        // Get subject teachers for a specific subject in a class
        getSubjectTeachersForClass: function(classId, subjectId) {
            var assignments = loadTeacherAssignments();
            return assignments.filter(function(a) {
                return a.classId === classId && 
                       a.assignmentType === 'subject_teacher' &&
                       (a.subjectId === subjectId || (a.subjectIds && a.subjectIds.includes(subjectId)));
            });
        },

        // Check if class has reached maximum subject teachers (increased limit)
        hasMaxSubjectTeachers: function(classId, maxCount) {
            maxCount = maxCount || 10; // Increased from 6 to 10
            var subjectTeachers = this.getClassSubjectTeachers(classId);
            return subjectTeachers.length >= maxCount;
        },

        // Create assignment with support for multiple subject teachers
        createAssignment: function(teacherId, classId, subjectId, assignmentType, options) {
            options = options || {};
            
            var assignment = {
                id: options.id || this.generateId(),
                teacherId: teacherId,
                classId: classId,
                subjectId: subjectId,
                subjectIds: options.subjectIds || (subjectId ? [subjectId] : []),
                assignmentType: assignmentType, // 'class_teacher' or 'subject_teacher'
                isPrimary: options.isPrimary || false,
                isLeadSubjectTeacher: options.isLeadSubjectTeacher || false,
                subjectLoadPercentage: options.subjectLoadPercentage || 100,
                collaborationTeachers: options.collaborationTeachers || [],
                canMarkAttendance: options.canMarkAttendance !== false,
                canViewReports: options.canViewReports !== false,
                canManageGrades: options.canManageGrades !== false,
                accessLevel: options.accessLevel || (assignmentType === 'class_teacher' ? 'full' : 'limited'),
                subjectSpecificAccess: options.subjectSpecificAccess || {
                    canViewSubjectPupils: true,
                    canManageSubjectGrades: true,
                    canCreateSubjectAssignments: true,
                    canMarkSubjectAttendance: true,
                    canAccessSubjectReports: true,
                    canCommunicateSubjectParents: true,
                    restrictedToSubjectOnly: true
                },
                teachingSchedule: options.teachingSchedule || {},
                pupilGroupIds: options.pupilGroupIds || [],
                notes: options.notes || '',
                assignedBy: options.assignedBy || 'current_user',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            // Set default permissions based on assignment type
            if (assignmentType === 'class_teacher') {
                assignment.isPrimary = true;
                assignment.canViewReports = true;
                assignment.canManageGrades = true;
                assignment.accessLevel = 'full';
            } else if (assignmentType === 'subject_teacher') {
                assignment.isPrimary = false;
                assignment.canViewReports = false;
                assignment.canManageGrades = true; // Can manage grades for their subject
                assignment.accessLevel = 'limited';
                assignment.subjectSpecificAccess.restrictedToSubjectOnly = true;
            }

            return this.saveAssignment(assignment);
        },

        // Generate unique ID
        generateId: function() {
            return 'assignment_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        },

        // Sync with server
        syncWithServer: async function() {
            try {
                var result = await apiRequestJson('/api/admin/teacher-assignments', {
                    method: 'GET'
                });
                
                if (result && result.assignments) {
                    saveTeacherAssignments(result.assignments);
                    return result.assignments;
                }
            } catch (e) {
                console.error('Failed to sync teacher assignments:', e);
            }
            return null;
        },

        // Push assignment to server
        pushAssignmentToServer: async function(assignment) {
            try {
                var result = await apiRequestJson('/api/admin/teacher-assignments', {
                    method: 'POST',
                    body: JSON.stringify(assignment)
                });
                
                if (result && result.success) {
                    return result.assignment;
                }
            } catch (e) {
                console.error('Failed to push assignment to server:', e);
            }
            return null;
        },

        // Initialize the module
        init: function() {
            console.log('Teacher Role Assignments module initialized');
            
            // Load initial data from server if available
            this.syncWithServer();
        }
    };

    // Auto-initialize
    document.addEventListener('DOMContentLoaded', function() {
        if (window.TeacherRoleAssignments) {
            window.TeacherRoleAssignments.init();
        }
    });

})();
