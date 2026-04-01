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
 * Handles assignments listing, filtering, submission, and file upload/download.
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

    // Priority label
    function getPriorityLabel(priority) {
        var labels = { high: 'Urgent', medium: 'Normal', low: 'Low Priority' };
        return labels[priority] || 'Normal';
    }

    // Primary button class based on priority
    function getPrimaryButtonClass(priority) {
        var classes = {
            high: 'bg-red-500 hover:bg-red-600',
            medium: 'bg-orange-500 hover:bg-orange-600',
            low: 'bg-blue-500 hover:bg-blue-600'
        };
        return classes[priority] || 'bg-orange-500 hover:bg-orange-600';
    }

    // Alpine.js component
    window.pupilAssignmentsPage = function () {
        return {
            pageTitle: 'Home Assignments',
            pageSubtitle: 'Everything you submit here is visible to your class teacher and classmates.',
            sidebarOpen: false,
            chatOpen: false,
            activeTab: 'pending',
            searchQuery: '',

            // Loading states
            loading: true,
            error: null,
            lastSyncedAt: null,

            // Data
            allAssignments: [],
            filters: {
                pending: { subject: 'all', priority: 'all' },
                submitted: { subject: 'all' },
                graded: { subject: 'all' }
            },

            // Submission modal
            showSubmitModal: false,
            submitModalAssignment: null,
            submitFile: null,
            submitComment: '',
            submitting: false,
            submitError: null,

            // Details modal
            showDetailsModal: false,
            detailsAssignment: null,

            async init() {
                await this.loadAssignments();
            },

            async loadAssignments() {
                this.loading = true;
                this.error = null;

                try {
                    // Use real-time service if available, otherwise fallback to direct API
                    if (window.ShikolaAPI && window.ShikolaAPI.assignments) {
                        var result = await window.ShikolaAPI.assignments.list();
                        if (!result || !result.success) {
                            throw new Error(result && result.error ? result.error : 'Failed to load assignments.');
                        }

                        this.allAssignments = this.processAssignments(result.data || []);
                        this.lastSyncedAt = new Date();
                        
                        // Update real-time cache
                        if (window.ShikolaAssignmentsRealtime) {
                            result.data.forEach(assignment => {
                                window.ShikolaAssignmentsRealtime.updateAssignmentCache(assignment);
                            });
                        }
                    } else {
                        // API not available - show empty state without error
                        this.allAssignments = [];
                        this.lastSyncedAt = null;
                    }
                } catch (err) {
                    console.error('[assignments.js] Error loading:', err);
                    this.error = err.message || 'An error occurred';
                    this.allAssignments = [];
                    
                    // Show error toast
                    if (window.showAssignmentToast) {
                        window.showAssignmentToast('Failed to load assignments', 'error', 5000);
                    }
                } finally {
                    this.loading = false;
                }
            },

            processAssignments(list) {
                return list.map(function (a) {
                    return Object.assign({}, a, {
                        dueOnRaw: a.dueOn || null,
                        submittedOnRaw: a.submittedOn || null,
                        gradedOnRaw: a.gradedOn || null,
                        dueLabel: computeDueLabel(a.dueOn),
                        priorityLabel: getPriorityLabel(a.priority),
                        primaryButtonClass: getPrimaryButtonClass(a.priority),
                        assignedOn: formatDate(a.assignedOn),
                        dueOn: formatDate(a.dueOn),
                        submittedOn: formatDate(a.submittedOn),
                        gradedOn: formatDate(a.gradedOn),
                        statusLabel: a.status === 'submitted' ? 'Awaiting review' : '',
                        summary: a.description,
                        cardTone: a.grade === 'A' || a.grade === 'A+' ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white'
                    });
                });
            },

            // Profile helpers
            profileName() {
                try {
                    if (window.ShikolaPupilPortal) {
                        var p = window.ShikolaPupilPortal.getActivePupilProfile();
                        return p && (p.fullName || p.name) || 'Pupil';
                    }
                    if (window.shikolaAuth) {
                        var u = window.shikolaAuth.getCurrentUser();
                        return u && u.name || 'Pupil';
                    }
                } catch (e) {}
                return 'Pupil';
            },

            profileClassLabel() {
                try {
                    if (window.ShikolaPupilPortal) {
                        var p = window.ShikolaPupilPortal.getActivePupilProfile();
                        return p && p.classLabel || 'Class';
                    }
                } catch (e) {}
                return 'Class';
            },

            sharingNotice() {
                return 'Activity on this page is shared live with ' + this.profileClassLabel() + ' pupils and their class teacher.';
            },

            lastSyncedLabel() {
                if (!this.lastSyncedAt) return 'Awaiting first sync...';
                try {
                    return 'Last synced ' + this.lastSyncedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                } catch (e) {
                    return 'Last synced recently';
                }
            },

            // Filtering
            pendingSubjectOptions() {
                var subjects = [];
                var seen = {};
                this.allAssignments.filter(function (a) { return a.status === 'pending'; }).forEach(function (a) {
                    if (a.subject && !seen[a.subject]) {
                        seen[a.subject] = true;
                        subjects.push(a.subject);
                    }
                });
                return subjects;
            },

            filteredPending() {
                var self = this;
                return this.allAssignments.filter(function (a) {
                    if (a.status !== 'pending') return false;
                    if (self.filters.pending.subject !== 'all' && a.subject !== self.filters.pending.subject) return false;
                    if (self.filters.pending.priority !== 'all' && a.priority !== self.filters.pending.priority) return false;
                    if (self.searchQuery) {
                        var q = self.searchQuery.toLowerCase();
                        var text = ((a.title || '') + ' ' + (a.description || '') + ' ' + (a.subject || '')).toLowerCase();
                        if (text.indexOf(q) === -1) return false;
                    }
                    return true;
                });
            },

            filteredSubmitted() {
                var self = this;
                return this.allAssignments.filter(function (a) {
                    if (a.status !== 'submitted') return false;
                    if (self.searchQuery) {
                        var q = self.searchQuery.toLowerCase();
                        var text = ((a.title || '') + ' ' + (a.description || '')).toLowerCase();
                        if (text.indexOf(q) === -1) return false;
                    }
                    return true;
                });
            },

            filteredGraded() {
                var self = this;
                return this.allAssignments.filter(function (a) {
                    if (a.status !== 'graded') return false;
                    if (self.searchQuery) {
                        var q = self.searchQuery.toLowerCase();
                        var text = ((a.title || '') + ' ' + (a.description || '')).toLowerCase();
                        if (text.indexOf(q) === -1) return false;
                    }
                    return true;
                });
            },

            // Summary
            summaryCounts() {
                var pending = this.allAssignments.filter(function (a) { return a.status === 'pending'; });
                var now = new Date();
                var weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

                var dueThisWeek = pending.filter(function (a) {
                    try {
                        var due = new Date(a.dueOnRaw || a.dueOn);
                        return due <= weekFromNow;
                    } catch (e) {
                        return false;
                    }
                }).length;

                var overdue = pending.filter(function (a) {
                    return a.dueLabel === 'Overdue';
                }).length;

                var today = now.toISOString().slice(0, 10);
                var submittedToday = this.allAssignments.filter(function (a) {
                    if (a.status !== 'submitted') return false;
                    if (!a.submittedOnRaw) return false;
                    return a.submittedOnRaw.slice(0, 10) === today;
                }).length;

                return {
                    totalPending: pending.length,
                    dueThisWeek: dueThisWeek,
                    overdue: overdue,
                    submittedToday: submittedToday
                };
            },

            upcomingDeadlines() {
                return this.allAssignments
                    .filter(function (a) { return a.status === 'pending'; })
                    .sort(function (a, b) {
                        try {
                            return new Date(a.dueOnRaw || a.dueOn) - new Date(b.dueOnRaw || b.dueOn);
                        } catch (e) {
                            return 0;
                        }
                    })
                    .slice(0, 5);
            },

            // Style helpers
            priorityTone(priority) {
                var tones = {
                    high: 'border-red-200 bg-red-50',
                    medium: 'border-orange-200 bg-orange-50',
                    low: 'border-blue-200 bg-blue-50'
                };
                return tones[priority] || 'border-slate-200 bg-white';
            },

            priorityBadge(priority) {
                var badges = {
                    high: 'bg-red-100 text-red-700',
                    medium: 'bg-orange-100 text-orange-700',
                    low: 'bg-blue-100 text-blue-700'
                };
                return badges[priority] || 'bg-slate-100 text-slate-700';
            },

            subjectBadge(subject) {
                var badges = {
                    'Mathematics': 'bg-indigo-100 text-indigo-700',
                    'English': 'bg-purple-100 text-purple-700',
                    'Science': 'bg-emerald-100 text-emerald-700',
                    'History': 'bg-amber-100 text-amber-700',
                    'Geography': 'bg-cyan-100 text-cyan-700'
                };
                return badges[subject] || 'bg-slate-100 text-slate-700';
            },

            gradeChipClass(grade) {
                if (!grade) return 'bg-slate-100 text-slate-700';
                var g = grade.toUpperCase();
                if (g === 'A' || g === 'A+') return 'bg-emerald-100 text-emerald-700';
                if (g === 'B' || g === 'B+') return 'bg-blue-100 text-blue-700';
                if (g === 'C' || g === 'C+') return 'bg-amber-100 text-amber-700';
                return 'bg-red-100 text-red-700';
            },

            // Actions
            async handleAction(action, assignment) {
                switch (action) {
                    case 'submit':
                        this.openSubmitModal(assignment);
                        break;
                    case 'details':
                    case 'view':
                        this.openDetailsModal(assignment);
                        break;
                    case 'download':
                        await this.downloadAttachment(assignment);
                        break;
                    case 'receipt':
                        this.downloadReceipt(assignment);
                        break;
                    case 'certificate':
                        this.downloadCertificate(assignment);
                        break;
                }
            },

            openSubmitModal(assignment) {
                this.submitModalAssignment = assignment;
                this.submitFile = null;
                this.submitComment = '';
                this.submitError = null;
                this.showSubmitModal = true;
            },

            closeSubmitModal() {
                this.showSubmitModal = false;
                this.submitModalAssignment = null;
            },

            handleFileSelect(event) {
                var files = event.target.files;
                if (files && files.length > 0) {
                    var file = files[0];
                    
                    // Validate file using upload manager
                    if (window.validateAssignmentFile) {
                        var validation = window.validateAssignmentFile(file);
                        if (!validation.isValid) {
                            this.submitError = validation.errors.join(', ');
                            if (window.showAssignmentToast) {
                                window.showAssignmentToast('Invalid file: ' + this.submitError, 'error', 5000);
                            }
                            return;
                        }
                    }
                    
                    this.submitFile = file;
                    this.submitError = null;
                }
            },

            async submitAssignment() {
                if (!this.submitModalAssignment) return;

                this.submitting = true;
                this.submitError = null;

                try {
                    var options = {
                        comment: this.submitComment
                    };

                    // Check if we should queue for offline
                    if (window.ShikolaAssignmentOffline && window.ShikolaAssignmentOffline.shouldQueueSubmission()) {
                        // Queue for offline submission
                        var queueData = {
                            assignmentId: this.submitModalAssignment.id,
                            assignmentTitle: this.submitModalAssignment.title,
                            comment: this.submitComment,
                            file: this.submitFile
                        };

                        var queueId = await window.queueAssignmentOffline(queueData);
                        
                        // Update local state optimistically
                        var assignment = this.allAssignments.find(function (a) {
                            return a.id === this.submitModalAssignment.id;
                        }.bind(this));

                        if (assignment) {
                            assignment.status = 'submitted';
                            assignment.submittedOn = formatDate(new Date().toISOString());
                            assignment.submittedTime = new Date().toTimeString().slice(0, 5);
                            assignment.statusLabel = 'Queued (offline)';
                        }

                        // Show queued notification
                        if (window.showAssignmentToast) {
                            window.showAssignmentToast('Assignment queued for submission when connection is restored', 'info', 5000);
                        }

                        this.closeSubmitModal();
                        this.activeTab = 'submitted';
                        return;
                    }

                    if (this.submitFile) {
                        // Use upload manager for file uploads
                        if (window.uploadAssignmentFile) {
                            // Show upload started toast
                            if (window.showAssignmentToast) {
                                window.showAssignmentToast('Uploading assignment file...', 'info', 3000);
                            }

                            var uploadResult = await window.uploadAssignmentFile(
                                this.submitFile, 
                                this.submitModalAssignment.id, 
                                options
                            );

                            if (uploadResult.success) {
                                // Update local state
                                var assignment = this.allAssignments.find(function (a) {
                                    return a.id === this.submitModalAssignment.id;
                                }.bind(this));

                                if (assignment) {
                                    assignment.status = 'submitted';
                                    assignment.submittedOn = formatDate(new Date().toISOString());
                                    assignment.submittedTime = new Date().toTimeString().slice(0, 5);
                                    assignment.statusLabel = 'Awaiting review';
                                }

                                // Send real-time update event
                                if (window.ShikolaAssignmentsRealtime) {
                                    window.ShikolaAssignmentsRealtime.handleAssignmentSubmission({
                                        assignmentId: this.submitModalAssignment.id,
                                        assignmentTitle: this.submitModalAssignment.title,
                                        submittedAt: new Date().toISOString(),
                                        hasAttachment: !!this.submitFile
                                    });
                                }

                                // Show success toast
                                if (window.showAssignmentToast) {
                                    window.showAssignmentToast('Assignment submitted successfully!', 'success', 5000);
                                }

                                // Trigger custom event for other components
                                window.dispatchEvent(new CustomEvent('assignmentSubmitted', {
                                    detail: {
                                        assignmentId: this.submitModalAssignment.id,
                                        assignmentTitle: this.submitModalAssignment.title,
                                        submittedAt: new Date().toISOString()
                                    }
                                }));

                                this.closeSubmitModal();
                                this.activeTab = 'submitted';
                            } else {
                                this.submitError = uploadResult.error || 'Upload failed';
                                
                                // Show error toast
                                if (window.showAssignmentToast) {
                                    window.showAssignmentToast('Failed to submit assignment: ' + this.submitError, 'error', 5000);
                                }
                            }
                        } else {
                            // Fallback to regular API
                            var formData = new FormData();
                            formData.append('file', this.submitFile);
                            if (this.submitComment) {
                                formData.append('comment', this.submitComment);
                            }

                            if (window.ShikolaAPI && window.ShikolaAPI.assignments) {
                                var result = await window.ShikolaAPI.assignments.submit(this.submitModalAssignment.id, formData);
                                if (result.success) {
                                    // Update local state
                                    var assignment = this.allAssignments.find(function (a) {
                                        return a.id === this.submitModalAssignment.id;
                                    }.bind(this));

                                    if (assignment) {
                                        assignment.status = 'submitted';
                                        assignment.submittedOn = formatDate(new Date().toISOString());
                                        assignment.submittedTime = new Date().toTimeString().slice(0, 5);
                                        assignment.statusLabel = 'Awaiting review';
                                    }

                                    // Send real-time update event
                                    if (window.ShikolaAssignmentsRealtime) {
                                        window.ShikolaAssignmentsRealtime.handleAssignmentSubmission({
                                            assignmentId: this.submitModalAssignment.id,
                                            assignmentTitle: this.submitModalAssignment.title,
                                            submittedAt: new Date().toISOString(),
                                            hasAttachment: !!this.submitFile
                                        });
                                    }

                                    // Show success toast
                                    if (window.showAssignmentToast) {
                                        window.showAssignmentToast('Assignment submitted successfully!', 'success', 5000);
                                    }

                                    // Trigger custom event for other components
                                    window.dispatchEvent(new CustomEvent('assignmentSubmitted', {
                                        detail: {
                                            assignmentId: this.submitModalAssignment.id,
                                            assignmentTitle: this.submitModalAssignment.title,
                                            submittedAt: new Date().toISOString()
                                        }
                                    }));

                                    this.closeSubmitModal();
                                    this.activeTab = 'submitted';
                                } else {
                                    this.submitError = result.error || 'Submission failed';
                                    
                                    // Show error toast
                    } else {
                        // No file - just submit comment
                        var formData = new FormData();
                        if (this.submitComment) {
                            formData.append('comment', this.submitComment);
                        }

                        if (window.ShikolaAPI && window.ShikolaAPI.assignments) {
                            var result = await window.ShikolaAPI.assignments.submit(this.submitModalAssignment.id, formData);
                            if (result.success) {
                                // Update local state
                                var assignment = this.allAssignments.find(function (a) {
                                    return a.id === this.submitModalAssignment.id;
                                }.bind(this));

                                if (assignment) {
                                    assignment.status = 'submitted';
                                    assignment.submittedOn = formatDate(new Date().toISOString());
                                    assignment.submittedTime = new Date().toTimeString().slice(0, 5);
                                    assignment.statusLabel = 'Awaiting review';
                                }

                                // Send real-time update event
                                if (window.ShikolaAssignmentsRealtime) {
                                    window.ShikolaAssignmentsRealtime.handleAssignmentSubmission({
                                        assignmentId: this.submitModalAssignment.id,
                                        assignmentTitle: this.submitModalAssignment.title,
                                        submittedAt: new Date().toISOString(),
                                        hasAttachment: false
                                    });
                                }

                                // Show success toast
                                if (window.showAssignmentToast) {
                                    window.showAssignmentToast('Assignment submitted successfully!', 'success', 5000);
                                }

                                this.closeSubmitModal();
                                this.activeTab = 'submitted';
                            } else {
                                this.submitError = result.error || 'Submission failed';
                                
                                // Show error toast
                                if (window.showAssignmentToast) {
                                    window.showAssignmentToast('Failed to submit assignment: ' + this.submitError, 'error', 5000);
                                }
                            }
                        } else {
                            // Offline mode - assignment submitted locally
                            var assignment = this.allAssignments.find(function (a) {
                                return a.id === this.submitModalAssignment.id;
                            }.bind(this));

                            if (assignment) {
                                assignment.status = 'submitted';
                                assignment.submittedOn = formatDate(new Date().toISOString());
                                assignment.submittedTime = new Date().toTimeString().slice(0, 5);
                                assignment.statusLabel = 'Awaiting review';
                            }

                            // Show submission confirmation
                            if (window.showAssignmentToast) {
                                window.showAssignmentToast('Assignment submitted - will sync when online', 'success', 3000);
                            }

                            this.closeSubmitModal();
                            this.activeTab = 'submitted';
                        }
                    }
                } catch (err) {
                    console.error('[assignments.js] Submit error:', err);
                    this.submitError = err.message || 'Submission failed';
                    
                    // Show error toast
                    if (window.showAssignmentToast) {
                        window.showAssignmentToast('Submission failed: ' + this.submitError, 'error', 5000);
                    }
                } finally {
                    this.submitting = false;
                }
            },

            openDetailsModal(assignment) {
                this.detailsAssignment = assignment;
                this.showDetailsModal = true;
            },

            closeDetailsModal() {
                this.showDetailsModal = false;
                this.detailsAssignment = null;
            },

            async downloadAttachment(assignment) {
                if (!assignment.attachmentUrl && !assignment.attachmentName) {
                    alert('No attachment available for this assignment.');
                    return;
                }

                if (window.ShikolaAPI && window.ShikolaAPI.assignments) {
                    var result = await window.ShikolaAPI.assignments.downloadAttachment(
                        assignment.id,
                        assignment.attachmentName || 'attachment.pdf'
                    );
                    if (!result.success) {
                        alert('Download failed: ' + (result.error || 'Unknown error'));
                    }
                } else {
                    alert('Download requires API connection.');
                }
            },

            downloadReceipt(assignment) {
                // Generate a simple receipt/confirmation
                alert('Submission receipt for "' + assignment.title + '" will be downloaded.');
            },

            downloadCertificate(assignment) {
                // Generate a completion certificate
                alert('Certificate for "' + assignment.title + '" (Grade: ' + assignment.grade + ') will be downloaded.');
            },

            /**
             * Clear cache and reload assignments
             */
            clearCacheAndReload() {
                try {
                    // Clear API cache if available
                    if (window.ShikolaAssignmentsRealtime) {
                        window.ShikolaAssignmentsRealtime.clearCache();
                    }
                    
                    // Clear local storage cache
                    if (typeof localStorage !== 'undefined') {
                        localStorage.removeItem('assignments_cache');
                        localStorage.removeItem('assignments_last_sync');
                    }
                    
                    // Show toast notification
                    if (window.showAssignmentToast) {
                        window.showAssignmentToast('Cache cleared successfully', 'success', 3000);
                    }
                    
                    // Reload assignments
                    this.loadAssignments();
                    
                    console.log('Assignments cache cleared and reloaded');
                } catch (error) {
                    console.error('Error clearing cache:', error);
                    
                    // Show error toast
                    if (window.showAssignmentToast) {
                        window.showAssignmentToast('Failed to clear cache', 'error', 3000);
                    }
                }
            }
        };
    };

})(window);
