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
// Pupil Report Card Functionality - Enhanced with Real Backend Integration and Real-time Data Sync
(function(window) {
    'use strict';

    function pupilReportCardPage() {
        return {
            sidebarOpen: false,
            loading: true,
            activeCardType: 'result', // 'result' or 'report'
            activeTerm: 'term1',
            isPublished: false,
            currentUser: null,
            schoolProfile: null,
            reportData: {
                term1: null,
                term2: null,
                term3: null,
                annual: null
            },
            attendanceData: {
                term1: null,
                term2: null,
                term3: null,
                annual: null
            },
            subjectOrder: [],
            dashboardData: null,
            realtimeUpdates: null,
            lastSyncTime: null,
            syncStatus: 'connected', // 'connected', 'syncing', 'offline', 'error'
            cacheStats: null,

            init() {
                console.log('Initializing pupil report card page with real backend...');
                try {
                    this.loadCurrentUser();
                    this.initializeAPI();
                    this.loadDashboardData();
                    this.initWatchers();
                    this.initRealtimeSync();
                    console.log('Pupil report card page initialized with backend');
                } catch (error) {
                    console.error('Error during initialization:', error);
                    this.loading = false;
                    this.syncStatus = 'error';
                }
            },

            /**
             * Initialize API client
             */
            initializeAPI() {
                if (window.PupilReportCardAPI) {
                    window.PupilReportCardAPI.init();
                    console.log('Pupil Report Card API initialized');
                } else {
                    console.warn('Pupil Report Card API not available');
                }
            },

            /**
             * Load dashboard data first
             */
            async loadDashboardData() {
                try {
                    if (!window.PupilReportCardAPI) {
                        throw new Error('API client not available');
                    }

                    console.log('Loading dashboard data...');
                    this.dashboardData = await window.PupilReportCardAPI.getDashboard();
                    
                    if (this.dashboardData) {
                        this.currentUser = this.dashboardData.pupilInfo;
                        this.schoolProfile = this.dashboardData.schoolProfile;
                        this.lastSyncTime = new Date();
                        
                        // Load data for available terms
                        await this.loadAvailableReportData();
                        
                        console.log('Dashboard data loaded successfully');
                    }
                } catch (error) {
                    console.error('Error loading dashboard data:', error);
                    this.syncStatus = 'error';
                    // Fallback to basic user loading
                    await this.loadCurrentUser();
                } finally {
                    this.loading = false;
                }
            },

            /**
             * Load report data for available terms only
             */
            async loadAvailableReportData() {
                if (!this.dashboardData?.availableTerms) return;

                const terms = this.dashboardData.availableTerms;
                const cardTypes = ['result', 'report'];

                for (const term of terms) {
                    for (const cardType of cardTypes) {
                        const isPublished = this.dashboardData.publicationStatus[term]?.[cardType];
                        if (isPublished) {
                            try {
                                await this.loadTermData(term, cardType);
                            } catch (error) {
                                console.warn(`Failed to load ${term} ${cardType}:`, error);
                            }
                        }
                    }
                }
            },

            /**
             * Initialize real-time synchronization
             */
            initRealtimeSync() {
                // Listen for real-time updates
                window.addEventListener('pupilReportCardUpdate', (event) => {
                    this.handleRealtimeUpdate(event.detail);
                });

                // Listen for sync events from other portals
                window.addEventListener('shikolaDataSync', (event) => {
                    this.handlePortalSync(event.detail);
                });

                // Listen for online/offline events
                window.addEventListener('online', () => {
                    this.syncStatus = 'connected';
                    this.refreshData();
                });

                window.addEventListener('offline', () => {
                    this.syncStatus = 'offline';
                });

                // Start periodic sync
                this.startPeriodicSync();
            },

            /**
             * Handle real-time updates
             */
            handleRealtimeUpdate(updates) {
                console.log('Received real-time update:', updates);
                this.realtimeUpdates = updates;
                this.lastSyncTime = new Date();

                // Update relevant data
                if (updates.latestGrades && updates.latestGrades.length > 0) {
                    this.refreshCurrentTermData();
                }

                // Show notification for new data
                this.showUpdateNotification(updates);
            },

            /**
             * Handle data synchronization from other portals
             */
            handlePortalSync(syncData) {
                if (syncData.source === 'pupil-report-card') return;

                console.log('Syncing data from other portal:', syncData.source);
                this.lastSyncTime = new Date();
                
                // Refresh current view if needed
                if (this.reportData[this.activeTerm]) {
                    this.refreshCurrentTermData();
                }
            },

            /**
             * Show update notification
             */
            showUpdateNotification(updates) {
                if (!updates.latestGrades || updates.latestGrades.length === 0) return;

                const latestGrade = updates.latestGrades[0];
                const message = `New grade available: ${latestGrade.subjectName} - ${latestGrade.grade}`;
                
                // Dispatch notification event
                const notificationEvent = new CustomEvent('showNotification', {
                    detail: {
                        type: 'info',
                        message: message,
                        duration: 5000
                    }
                });
                window.dispatchEvent(notificationEvent);
            },

            /**
             * Start periodic synchronization
             */
            startPeriodicSync() {
                setInterval(async () => {
                    if (this.syncStatus === 'connected' && !document.hidden) {
                        try {
                            await this.syncWithBackend();
                        } catch (error) {
                            console.error('Periodic sync failed:', error);
                            this.syncStatus = 'error';
                        }
                    }
                }, 60000); // Sync every minute
            },

            /**
             * Sync with backend
             */
            async syncWithBackend() {
                this.syncStatus = 'syncing';
                
                try {
                    if (window.PupilReportCardAPI) {
                        const updates = await window.PupilReportCardAPI.getRealtimeUpdates();
                        this.handleRealtimeUpdate(updates);
                        this.syncStatus = 'connected';
                    }
                } catch (error) {
                    console.error('Backend sync failed:', error);
                    this.syncStatus = 'error';
                    throw error;
                }
            },

            /**
             * Refresh current term data
             */
            async refreshCurrentTermData() {
                try {
                    await this.loadTermData(this.activeTerm, this.activeCardType);
                } catch (error) {
                    console.error('Failed to refresh current term data:', error);
                }
            },

            /**
             * Refresh all data
             */
            async refreshData() {
                this.loading = true;
                try {
                    await this.loadDashboardData();
                } catch (error) {
                    console.error('Failed to refresh data:', error);
                } finally {
                    this.loading = false;
                }
            },

            initWatchers() {
                this.$watch('activeCardType', () => {
                    this.loadTermData(this.activeTerm, this.activeCardType);
                });
                
                this.$watch('activeTerm', () => {
                    this.loadTermData(this.activeTerm, this.activeCardType);
                });
            },

            async loadCurrentUser() {
                try {
                    // Try API first
                    if (window.ShikolaAPI && window.ShikolaAPI.get) {
                        const response = await window.ShikolaAPI.get('/api/auth/me');
                        if (response && response.success) {
                            this.currentUser = response.data;
                            console.log('User loaded from API:', response.data);
                            return;
                        }
                    }

                    // Fallback to dashboard data
                    if (this.dashboardData?.pupilInfo) {
                        this.currentUser = this.dashboardData.pupilInfo;
                        return;
                    }

                    console.log('No user data available');
                } catch (error) {
                    console.error('Error loading current user:', error);
                }
            },

            async loadSchoolProfile() {
                // School profile is now loaded from dashboard
                return this.schoolProfile;
            },

            async loadSubjectOrder() {
                try {
                    // Subject order would come from school settings
                    // For now, use alphabetical order
                    if (this.reportData[this.activeTerm]?.subjects) {
                        this.subjectOrder = this.reportData[this.activeTerm].subjects
                            .map(s => s.subjectName)
                            .sort();
                    }
                } catch (error) {
                    console.error('Error loading subject order:', error);
                }
            },

            async loadReportData() {
                // This is now handled by loadDashboardData
                console.log('Report data loading handled by dashboard');
            },

            /**
             * Load term data using real API
             */
            async loadTermData(term, cardType = null) {
                const actualCardType = cardType || this.activeCardType;
                
                console.log(`Loading term data: ${term}, card type: ${actualCardType}`);
                
                if (!this.currentUser) {
                    console.log('No user available for term data loading');
                    this.isPublished = false;
                    return;
                }

                try {
                    if (!window.PupilReportCardAPI) {
                        throw new Error('API client not available');
                    }

                    // Check if report card is published
                    const isPublished = await window.PupilReportCardAPI.isReportCardPublished(term, actualCardType);
                    
                    if (!isPublished) {
                        this.isPublished = false;
                        console.log(`Report card not published for ${term} ${actualCardType}`);
                        return;
                    }

                    this.isPublished = true;

                    // Fetch report card data
                    const cardData = await window.PupilReportCardAPI.getReportCard(term, actualCardType);

                    if (cardData && cardData.subjects && cardData.subjects.length > 0) {
                        // Apply school's grading configuration to subjects
                        await this.applyGradingConfiguration(cardData.subjects);
                        
                        this.reportData[term] = cardData;
                        this.attendanceData[term] = cardData.attendance || {};
                        
                        // Update subject order
                        this.subjectOrder = cardData.subjects
                            .map(s => s.subjectName)
                            .sort();
                        
                        // Generate and display the card
                        await this.generateAndDisplayCard(term);
                        
                        console.log(`Successfully loaded ${term} ${actualCardType} data`);
                    } else {
                        this.isPublished = false;
                        console.log(`No data available for ${term} ${actualCardType}`);
                    }
                } catch (error) {
                    console.error(`Error loading ${term} ${actualCardType} data:`, error);
                    this.isPublished = false;
                    this.syncStatus = 'error';
                }
            },

            /**
             * Apply school's grading configuration to subject grades
             */
            async applyGradingConfiguration(subjects) {
                try {
                    if (!window.PupilReportCardAPI) {
                        console.warn('Grading API not available, using existing grades');
                        return;
                    }

                    // Get pupil's grade level (from class or user data)
                    const gradeLevel = await this.getPupilGradeLevel();
                    
                    // Apply grading configuration to each subject
                    for (const subject of subjects) {
                        if (subject.percentage !== undefined) {
                            const gradeInfo = await window.PupilReportCardAPI.calculateGrade(
                                subject.percentage, 
                                gradeLevel
                            );
                            
                            // Update subject with grading configuration data
                            subject.grade = gradeInfo.grade;
                            subject.gradeLabel = gradeInfo.label;
                            subject.gradingScale = gradeInfo.scale;
                            subject.isEczCompliant = gradeInfo.isEczCompliant;
                            
                            console.log(`Applied grading for ${subject.subjectName}: ${gradeInfo.grade} (${gradeInfo.label})`);
                        }
                    }
                } catch (error) {
                    console.error('Error applying grading configuration:', error);
                    // Continue with existing grades if grading configuration fails
                }
            },

            /**
             * Get pupil's grade level
             */
            async getPupilGradeLevel() {
                try {
                    // Try to get grade level from class information
                    if (this.currentUser?.class) {
                        const className = this.currentUser.class;
                        
                        // Extract grade from class name (e.g., "Grade 5A" -> 5)
                        const gradeMatch = className.match(/grade\s*(\d+)/i);
                        if (gradeMatch) {
                            const grade = parseInt(gradeMatch[1]);
                            return grade <= 7 ? 'primary' : 'secondary';
                        }
                    }
                    
                    // Try to get from dashboard data
                    if (this.dashboardData?.pupilInfo?.class) {
                        const className = this.dashboardData.pupilInfo.class;
                        const gradeMatch = className.match(/grade\s*(\d+)/i);
                        if (gradeMatch) {
                            const grade = parseInt(gradeMatch[1]);
                            return grade <= 7 ? 'primary' : 'secondary';
                        }
                    }
                    
                    // Default to primary if unable to determine
                    return 'primary';
                } catch (error) {
                    console.error('Error determining grade level:', error);
                    return 'primary';
                }
            },

            async generateAndDisplayCard(term) {
                try {
                    const data = this.reportData[term];
                    if (!data || !this.schoolProfile) return;

                    // Use UnifiedReportCards if available, otherwise create simple display
                    if (window.UnifiedReportCards && window.UnifiedReportCards.generateCard) {
                        const cardConfig = {
                            cardType: this.activeCardType,
                            schoolProfile: this.schoolProfile,
                            pupilData: {
                                name: this.currentUser?.name || data.pupilInfo?.name,
                                admissionNo: this.currentUser?.admissionNumber || data.pupilInfo?.admissionNumber,
                                className: this.currentUser?.class || data.pupilInfo?.class
                            },
                            termData: {
                                reportLabel: this.getReportLabel(term),
                                termInfo: this.getTermInfo(term)
                            },
                            attendanceData: data.attendance || {},
                            subjects: data.subjects || [],
                            summary: {
                                totalAverage: data.totalAverage || 0,
                                classPosition: data.classPosition || 'N/A',
                                gpa: data.gpa || 'N/A',
                                division: data.division || 'N/A',
                                teacherComment: data.teacherComments || 'No comments available.'
                            },
                            teacherNames: {
                                classTeacher: data.classTeacherName,
                                headTeacher: data.headTeacherName
                            }
                        };

                        const cardHTML = await window.UnifiedReportCards.generateCard(cardConfig);
                        
                        const cardContent = document.getElementById('cardContent');
                        if (cardContent) {
                            cardContent.innerHTML = cardHTML;
                        }
                    } else {
                        // Fallback to simple display
                        this.displaySimpleReportCard(data, term);
                    }
                } catch (error) {
                    console.error('Error generating card:', error);
                    this.isPublished = false;
                }
            },

            /**
             * Simple report card display fallback
             */
            displaySimpleReportCard(data, term) {
                const cardHTML = `
                    <div class="report-card-simple">
                        <h3>${this.getReportLabel(term)}</h3>
                        <div class="pupil-info">
                            <p><strong>Name:</strong> ${data.pupilInfo?.name || 'N/A'}</p>
                            <p><strong>Class:</strong> ${data.pupilInfo?.class || 'N/A'}</p>
                            <p><strong>Term:</strong> ${term}</p>
                        </div>
                        <div class="subjects">
                            <h4>Subjects</h4>
                            ${data.subjects?.map(subject => `
                                <div class="subject">
                                    <span>${subject.subjectName}</span>
                                    <span>${subject.grade} (${subject.percentage}%)</span>
                                </div>
                            `).join('') || '<p>No subjects available</p>'}
                        </div>
                        <div class="summary">
                            <p><strong>Average:</strong> ${data.totalAverage || 'N/A'}%</p>
                            <p><strong>Position:</strong> ${data.classPosition || 'N/A'} / ${data.classSize || 'N/A'}</p>
                            <p><strong>Division:</strong> ${data.division || 'N/A'}</p>
                        </div>
                    </div>
                `;

                const cardContent = document.getElementById('cardContent');
                if (cardContent) {
                    cardContent.innerHTML = cardHTML;
                }
            },

            getReportLabel(term) {
                const year = new Date().getFullYear();
                const termLabels = {
                    'term1': `TERM 1 ${this.activeCardType === 'result' ? 'RESULT' : 'REPORT'} CARD - ${year}`,
                    'term2': `TERM 2 ${this.activeCardType === 'result' ? 'RESULT' : 'REPORT'} CARD - ${year}`,
                    'term3': `TERM 3 ${this.activeCardType === 'result' ? 'RESULT' : 'REPORT'} CARD - ${year}`,
                    'annual': `ANNUAL ${this.activeCardType === 'result' ? 'RESULTS' : 'REPORTS'} SUMMARY - ${year}`
                };
                return termLabels[term] || `${this.activeCardType === 'result' ? 'RESULT' : 'REPORT'} CARD - ${year}`;
            },

            getTermInfo(term) {
                const termInfos = {
                    'term1': 'Term 1 (January - April 2026)',
                    'term2': 'Term 2 (May - August 2026)',
                    'term3': 'Term 3 (September - December 2026)',
                    'annual': 'Annual Summary (January - December 2026)'
                };
                return termInfos[term] || term;
            },

            setActiveCardType(type) {
                console.log('Setting active card type:', type);
                this.activeCardType = type;
                this.isPublished = false;
                try {
                    this.loadTermData(this.activeTerm, type);
                } catch (error) {
                    console.error('Error loading term data after card type change:', error);
                }
            },

            setActiveTerm(term) {
                console.log('Setting active term:', term);
                this.activeTerm = term;
                this.isPublished = false;
                try {
                    this.loadTermData(term);
                } catch (error) {
                    console.error('Error loading term data after term change:', error);
                }
            },

            /**
             * Get sync status display
             */
            getSyncStatusDisplay() {
                const statusMap = {
                    'connected': { text: 'Connected', color: 'green', icon: '✓' },
                    'syncing': { text: 'Syncing...', color: 'blue', icon: '⟳' },
                    'offline': { text: 'Offline', color: 'orange', icon: '⚡' },
                    'error': { text: 'Error', color: 'red', icon: '✗' }
                };
                
                return statusMap[this.syncStatus] || statusMap['error'];
            },

            /**
             * Format last sync time
             */
            formatLastSyncTime() {
                if (!this.lastSyncTime) return 'Never';
                
                const now = new Date();
                const diff = now - this.lastSyncTime;
                const seconds = Math.floor(diff / 1000);
                const minutes = Math.floor(seconds / 60);
                const hours = Math.floor(minutes / 60);
                
                if (seconds < 60) return 'Just now';
                if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
                if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
                
                return this.lastSyncTime.toLocaleDateString();
            },

            /**
             * Manual refresh
             */
            manualRefresh() {
                this.refreshData();
            },

            /**
             * Clear cache and reload
             */
            clearCacheAndReload() {
                if (window.PupilReportCardAPI) {
                    window.PupilReportCardAPI.clearCache();
                }
                this.refreshData();
            },

            getPupilName() {
                if (this.currentUser?.name) return this.currentUser.name;
                if (this.dashboardData?.pupilInfo?.name) return this.dashboardData.pupilInfo.name;
                if (this.reportData[this.activeTerm]?.pupilInfo?.name) {
                    return this.reportData[this.activeTerm].pupilInfo.name;
                }
                return 'Pupil';
            },

            getClassName() {
                if (this.currentUser?.class) return this.currentUser.class;
                if (this.dashboardData?.pupilInfo?.class) return this.dashboardData.pupilInfo.class;
                if (this.reportData[this.activeTerm]?.pupilInfo?.class) {
                    return this.reportData[this.activeTerm].pupilInfo.class;
                }
                return 'Class';
            }
        };
    }

    // Export to global scope IMMEDIATELY
    window.pupilReportCardPage = pupilReportCardPage;
    
    // Also add a backup initialization check
    console.log('pupilReportCardPage function exported to window:', typeof window.pupilReportCardPage);

})(window);
                                                                                                                                                                        
