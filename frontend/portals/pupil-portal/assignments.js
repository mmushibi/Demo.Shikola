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
 * Pupil Assignments Page Module
 * Simple assignments functionality based on my-report-card.html structure
 */
(function (window) {
    'use strict';

    // Helper to compute due label
    function computeDueLabel(dueOn) {
        if (!dueOn) return 'No deadline';
        try {
            var due = new Date(dueOn);
            var now = new Date();
            var diffMs = due.getTime() - now.getTime();
            var diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

            if (diffDays < 0) return 'Overdue';
            if (diffDays === 0) return 'Due today';
            if (diffDays === 1) return 'Due tomorrow';
            if (diffDays <= 7) return 'Due in ' + diffDays + ' days';
            return 'Due ' + due.toLocaleDateString('en-ZM', { month: 'short', day: 'numeric' });
        } catch (e) {
            return dueOn;
        }
    }

    // Helper to format date
    function formatDate(dateStr) {
        if (!dateStr) return '—';
        try {
            var d = new Date(dateStr);
            if (!isFinite(d.getTime())) return dateStr;
            return d.toLocaleDateString('en-ZM', { year: 'numeric', month: 'short', day: 'numeric' });
        } catch (e) {
            return dateStr;
        }
    }

    // Sample assignment data
    var sampleAssignments = {
        pending: [
            {
                id: 'assign-001',
                title: 'Mathematics - Algebra Exercise',
                subject: 'Mathematics',
                priority: 'High',
                priorityLabel: 'High',
                teacher: 'Mrs. Banda',
                assignedOn: '2024-12-01',
                dueOn: '2024-12-15',
                dueLabel: computeDueLabel('2024-12-15'),
                summary: 'Complete exercises 1-20 on page 45',
                description: 'Practice solving linear equations and inequalities'
            },
            {
                id: 'assign-002',
                title: 'English - Essay Writing',
                subject: 'English',
                priority: 'Medium',
                priorityLabel: 'Medium',
                teacher: 'Mr. Mulenga',
                assignedOn: '2024-12-02',
                dueOn: '2024-12-18',
                dueLabel: computeDueLabel('2024-12-18'),
                summary: 'Write a 500-word essay on "My Future Career"',
                description: 'Focus on proper essay structure and grammar'
            },
            {
                id: 'assign-003',
                title: 'Science - Biology Lab Report',
                subject: 'Science',
                priority: 'High',
                priorityLabel: 'High',
                teacher: 'Mrs. Phiri',
                assignedOn: '2024-12-03',
                dueOn: '2024-12-20',
                dueLabel: computeDueLabel('2024-12-20'),
                summary: 'Submit lab report for photosynthesis experiment',
                description: 'Include hypothesis, method, results, and conclusion'
            }
        ],
        submitted: [
            {
                id: 'assign-004',
                title: 'History - Zambian Independence Research',
                subject: 'History',
                priority: 'Medium',
                priorityLabel: 'Medium',
                teacher: 'Mr. Tembo',
                assignedOn: '2024-11-20',
                submittedOn: '2024-12-10',
                grade: 'A',
                summary: 'Research paper on Zambia\'s independence movement',
                description: 'Minimum 1000 words with proper citations'
            },
            {
                id: 'assign-005',
                title: 'Geography - Map Project',
                subject: 'Geography',
                priority: 'Low',
                priorityLabel: 'Low',
                teacher: 'Mrs. Chanda',
                assignedOn: '2024-11-25',
                submittedOn: '2024-12-08',
                grade: 'B+',
                summary: 'Create a detailed map of Lusaka Province',
                description: 'Include major cities, rivers, and landmarks'
            }
        ]
    };

    // Define assignments page function
    function assignmentsPage() {
        return {
            sidebarOpen: false,
            chatOpen: false,
            pageTitle: 'Home Assignments',
            pageSubtitle: 'View and manage your assignments',
            searchQuery: '',
            activeTab: 'pending',
            loading: false,
            error: null,
            
            // Get pending assignments
            pendingAssignments: function() {
                return sampleAssignments.pending || [];
            },
            
            // Get submitted assignments
            submittedAssignments: function() {
                return sampleAssignments.submitted || [];
            },
            
            // Filter pending assignments
            filteredPending: function() {
                var assignments = this.pendingAssignments();
                var query = (this.searchQuery || '').toLowerCase();
                
                if (query) {
                    assignments = assignments.filter(function(assignment) {
                        return assignment.title.toLowerCase().indexOf(query) !== -1 ||
                               assignment.subject.toLowerCase().indexOf(query) !== -1 ||
                               assignment.teacher.toLowerCase().indexOf(query) !== -1;
                    });
                }
                
                return assignments;
            },
            
            // Filter submitted assignments
            filteredSubmitted: function() {
                var assignments = this.submittedAssignments();
                var query = (this.searchQuery || '').toLowerCase();
                
                if (query) {
                    assignments = assignments.filter(function(assignment) {
                        return assignment.title.toLowerCase().indexOf(query) !== -1 ||
                               assignment.subject.toLowerCase().indexOf(query) !== -1 ||
                               assignment.teacher.toLowerCase().indexOf(query) !== -1;
                    });
                }
                
                return assignments;
            },
            
            // Get priority badge class
            priorityBadge: function(priority) {
                switch (priority) {
                    case 'High': return 'px-2 py-1 rounded-full text-[10px] font-medium bg-red-100 text-red-700';
                    case 'Medium': return 'px-2 py-1 rounded-full text-[10px] font-medium bg-amber-100 text-amber-700';
                    case 'Low': return 'px-2 py-1 rounded-full text-[10px] font-medium bg-green-100 text-green-700';
                    default: return 'px-2 py-1 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700';
                }
            },
            
            // Get subject badge class
            subjectBadge: function(subject) {
                return 'px-2 py-1 rounded-full text-[10px] font-medium bg-blue-100 text-blue-700';
            },
            
            // Get priority tone for border
            priorityTone: function(priority) {
                switch (priority) {
                    case 'High': return 'border-red-200 bg-red-50';
                    case 'Medium': return 'border-amber-200 bg-amber-50';
                    case 'Low': return 'border-green-200 bg-green-50';
                    default: return 'border-slate-200 bg-slate-50';
                }
            },
            
            // Handle assignment action
            handleAction: function(action, assignment) {
                switch (action) {
                    case 'submit':
                        alert('Submitting assignment: ' + assignment.title);
                        break;
                    case 'details':
                        alert('Viewing details for: ' + assignment.title);
                        break;
                    case 'download':
                        alert('Downloading files for: ' + assignment.title);
                        break;
                }
            },
            
            // Get summary counts
            summaryCounts: function() {
                return {
                    totalPending: this.pendingAssignments().length,
                    totalSubmitted: this.submittedAssignments().length,
                    overdueCount: this.pendingAssignments().filter(function(a) {
                        return computeDueLabel(a.dueOn) === 'Overdue';
                    }).length
                };
            },
            
            // Get upcoming deadlines
            upcomingDeadlines: function() {
                return this.pendingAssignments()
                    .filter(function(assignment) {
                        return computeDueLabel(assignment.dueOn) !== 'Overdue';
                    })
                    .sort(function(a, b) {
                        return new Date(a.dueOn) - new Date(b.dueOn);
                    })
                    .slice(0, 3);
            },
            
            // Get sharing notice
            sharingNotice: function() {
                var pending = this.pendingAssignments().length;
                if (pending === 0) return 'All assignments submitted!';
                if (pending === 1) return '1 assignment pending';
                return pending + ' assignments pending';
            },
            
            // Get last synced label
            lastSyncedLabel: function() {
                return 'Last synced: ' + new Date().toLocaleTimeString('en-ZM', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
            }
        };
    }

    // Make function available globally
    window.assignmentsPage = assignmentsPage;

})(window);

    
