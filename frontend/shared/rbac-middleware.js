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
 * Shikola RBAC Middleware
 * Role-Based Access Control and Row-Level Security for Frontend
 */
(function (window) {
    'use strict';

    const ROLE_HIERARCHY = {
        'Super Admin': 10,
        'Operations': 9,
        'School Admin': 8,
        'Head Teacher': 7,
        'Deputy Head': 6,
        'Teacher': 5,
        'Accountant': 4,
        'Parent': 3,
        'Pupil': 2
    };

    const RESOURCE_PERMISSIONS = {
        'exams': {
            'Super Admin': ['create', 'read', 'update', 'delete'],
            'School Admin': ['create', 'read', 'update', 'delete'],
            'Teacher': ['read', 'create', 'update'],
            'Pupil': ['read'],
            'Parent': ['read']
        },
        'pupils': {
            'Super Admin': ['create', 'read', 'update', 'delete'],
            'School Admin': ['create', 'read', 'update', 'delete'],
            'Teacher': ['read'],
            'Parent': ['read'],
            'Pupil': ['read']
        },
        'fees': {
            'Super Admin': ['create', 'read', 'update', 'delete'],
            'School Admin': ['create', 'read', 'update', 'delete'],
            'Accountant': ['create', 'read', 'update', 'delete'],
            'Parent': ['read'],
            'Pupil': ['read']
        },
        'attendance': {
            'Super Admin': ['create', 'read', 'update', 'delete'],
            'School Admin': ['create', 'read', 'update', 'delete'],
            'Teacher': ['create', 'read', 'update'],
            'Parent': ['read'],
            'Pupil': ['read']
        },
        'reports': {
            'Super Admin': ['create', 'read', 'update', 'delete'],
            'School Admin': ['create', 'read', 'update', 'delete'],
            'Teacher': ['read'],
            'Accountant': ['read'],
            'Parent': ['read']
        }
    };

    class RBACMiddleware {
        constructor() {
            this.currentUser = null;
            this.permissions = new Map();
        }

        async initialize() {
            if (window.ShikolaAPI) {
                this.currentUser = await window.ShikolaAPI.auth.getCurrentUser();
                this.cachePermissions();
            }
        }

        cachePermissions() {
            if (!this.currentUser) return;

            Object.keys(RESOURCE_PERMISSIONS).forEach(resource => {
                const rolePerms = RESOURCE_PERMISSIONS[resource][this.currentUser.role] || [];
                this.permissions.set(`${resource}_permissions`, rolePerms);
            });
        }

        hasRole(requiredRole) {
            if (!this.currentUser) return false;
            
            const userLevel = ROLE_HIERARCHY[this.currentUser.role] || 0;
            const requiredLevel = ROLE_HIERARCHY[requiredRole] || 0;
            
            return userLevel >= requiredLevel;
        }

        hasPermission(resource, action) {
            if (!this.currentUser) return false;
            
            const permissions = this.permissions.get(`${resource}_permissions`) || [];
            return permissions.includes(action);
        }

        canAccessResource(resource, action) {
            return this.hasPermission(resource, action);
        }

        getRowLevelFilter(resource) {
            if (!this.currentUser) return {};

            const filters = {
                'pupils': {
                    'School Admin': { schoolId: this.currentUser.schoolId },
                    'Teacher': { 
                        schoolId: this.currentUser.schoolId,
                        assignedClassId: this.currentUser.classId
                    },
                    'Parent': { parentId: this.currentUser.id },
                    'Pupil': { id: this.currentUser.id }
                },
                'exams': {
                    'School Admin': { schoolId: this.currentUser.schoolId },
                    'Teacher': { 
                        schoolId: this.currentUser.schoolId,
                        classId: this.currentUser.classId
                    }
                },
                'fees': {
                    'School Admin': { schoolId: this.currentUser.schoolId },
                    'Accountant': { schoolId: this.currentUser.schoolId },
                    'Parent': { parentId: this.currentUser.id },
                    'Pupil': { pupilId: this.currentUser.id }
                },
                'attendance': {
                    'School Admin': { schoolId: this.currentUser.schoolId },
                    'Teacher': { 
                        schoolId: this.currentUser.schoolId,
                        classId: this.currentUser.classId
                    }
                }
            };

            return filters[resource]?.[this.currentUser.role] || {};
        }

        enforceAccess(resource, action) {
            if (!this.canAccessResource(resource, action)) {
                throw new Error(`Access denied: ${this.currentUser?.role} cannot ${action} ${resource}`);
            }
        }

        applyRowLevelSecurity(params, resource) {
            const rowFilter = this.getRowLevelFilter(resource);
            return { ...params, ...rowFilter };
        }
    }

    const rbac = new RBACMiddleware();

    window.ShikolaRBAC = {
        initialize: () => rbac.initialize(),
        hasRole: (role) => rbac.hasRole(role),
        hasPermission: (resource, action) => rbac.hasPermission(resource, action),
        canAccessResource: (resource, action) => rbac.canAccessResource(resource, action),
        enforceAccess: (resource, action) => rbac.enforceAccess(resource, action),
        getRowLevelFilter: (resource) => rbac.getRowLevelFilter(resource),
        applyRowLevelSecurity: (params, resource) => rbac.applyRowLevelSecurity(params, resource)
    };

    // Auto-initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => rbac.initialize());
    } else {
        rbac.initialize();
    }

})(window);
