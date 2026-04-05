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
 * Pupil Report Card API Client
 * Provides real-time data fetching and synchronization for pupil report cards
 */
(function(window) {
    'use strict';

    const PupilReportCardAPI = {
        // API endpoints
        endpoints: {
            dashboard: '/api/pupilreportcard/dashboard',
            reportCard: '/api/pupilreportcard/terms/{term}/card-type/{cardType}',
            attendance: '/api/pupilreportcard/terms/{term}/attendance',
            realtimeUpdates: '/api/pupilreportcard/realtime-updates',
            gradingConfig: '/api/ecz-grading/scales',
            generalSettings: '/api/schooladmin/general-settings'
        },

        // Cache for storing fetched data
        cache: new Map(),
        
        // Real-time update interval
        updateInterval: null,
        updateFrequency: 30000, // 30 seconds

        /**
         * Initialize the API client
         */
        init() {
            console.log('Initializing Pupil Report Card API...');
            this.startRealtimeUpdates();
            this.setupEventListeners();
        },

        /**
         * Get report card dashboard data
         */
        async getDashboard() {
            try {
                const response = await this.request(this.endpoints.dashboard);
                
                if (response.success) {
                    this.cache.set('dashboard', {
                        data: response.data,
                        timestamp: Date.now()
                    });
                    return response.data;
                } else {
                    throw new Error(response.message || 'Failed to load dashboard data');
                }
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
                throw error;
            }
        },

        /**
         * Get report card data for specific term and card type
         */
        async getReportCard(term, cardType) {
            try {
                const endpoint = this.endpoints.reportCard
                    .replace('{term}', term)
                    .replace('{cardType}', cardType);
                
                const response = await this.request(endpoint);
                
                if (response.success) {
                    const cacheKey = `report-card-${term}-${cardType}`;
                    this.cache.set(cacheKey, {
                        data: response.data,
                        timestamp: Date.now()
                    });
                    return response.data;
                } else {
                    throw new Error(response.message || 'Failed to load report card');
                }
            } catch (error) {
                console.error(`Error fetching report card for ${term} ${cardType}:`, error);
                throw error;
            }
        },

        /**
         * Get attendance data for a specific term
         */
        async getAttendanceData(term) {
            try {
                const endpoint = this.endpoints.attendance.replace('{term}', term);
                const response = await this.request(endpoint);
                
                if (response.success) {
                    const cacheKey = `attendance-${term}`;
                    this.cache.set(cacheKey, {
                        data: response.data,
                        timestamp: Date.now()
                    });
                    return response.data;
                } else {
                    throw new Error(response.message || 'Failed to load attendance data');
                }
            } catch (error) {
                console.error(`Error fetching attendance data for ${term}:`, error);
                throw error;
            }
        },

        /**
         * Get real-time updates
         */
        async getRealtimeUpdates() {
            try {
                const response = await this.request(this.endpoints.realtimeUpdates);
                
                if (response.success) {
                    this.cache.set('realtime-updates', {
                        data: response.data,
                        timestamp: response.timestamp
                    });
                    return response.data;
                } else {
                    throw new Error(response.message || 'Failed to load real-time updates');
                }
            } catch (error) {
                console.error('Error fetching real-time updates:', error);
                throw error;
            }
        },

        /**
         * Get grading configuration from general settings
         */
        async getGradingConfiguration() {
            try {
                // First try to get from cache
                const cached = this.getCachedData('grading-config', 300000); // 5 minutes cache
                if (cached) {
                    return cached;
                }

                // Fetch grading scales
                const scalesResponse = await this.request(this.endpoints.gradingConfig);
                
                if (!scalesResponse.success) {
                    throw new Error(scalesResponse.message || 'Failed to load grading scales');
                }

                // Fetch general settings
                const settingsResponse = await this.request(this.endpoints.generalSettings);
                
                const gradingConfig = {
                    scales: scalesResponse.data || [],
                    settings: settingsResponse.success ? settingsResponse.data : {},
                    timestamp: Date.now()
                };

                // Cache the configuration
                this.cache.set('grading-config', {
                    data: gradingConfig,
                    timestamp: Date.now()
                });

                return gradingConfig;
            } catch (error) {
                console.error('Error fetching grading configuration:', error);
                // Return default ECZ configuration as fallback
                return this.getDefaultECZConfiguration();
            }
        },

        /**
         * Get default ECZ configuration as fallback
         */
        getDefaultECZConfiguration() {
            return {
                scales: [
                    {
                        id: 'default-primary',
                        name: 'ECZ Primary School Grading',
                        educationLevel: 'primary',
                        isDefault: true,
                        isEczCompliant: true,
                        details: [
                            { gradePoint: 1, gradeLabel: 'Excellent', minPercentage: 85, maxPercentage: 100 },
                            { gradePoint: 2, gradeLabel: 'Very Good', minPercentage: 75, maxPercentage: 84 },
                            { gradePoint: 3, gradeLabel: 'Good', minPercentage: 65, maxPercentage: 74 },
                            { gradePoint: 4, gradeLabel: 'Satisfactory', minPercentage: 55, maxPercentage: 64 },
                            { gradePoint: 5, gradeLabel: 'Pass', minPercentage: 50, maxPercentage: 54 },
                            { gradePoint: 6, gradeLabel: 'Credit', minPercentage: 40, maxPercentage: 49 },
                            { gradePoint: 7, gradeLabel: 'Marginal Pass', minPercentage: 35, maxPercentage: 39 },
                            { gradePoint: 8, gradeLabel: 'Fail', minPercentage: 0, maxPercentage: 34 }
                        ]
                    },
                    {
                        id: 'default-secondary',
                        name: 'ECZ Secondary School Grading',
                        educationLevel: 'secondary',
                        isDefault: true,
                        isEczCompliant: true,
                        details: [
                            { gradePoint: 1, gradeLabel: 'Distinction', minPercentage: 85, maxPercentage: 100 },
                            { gradePoint: 2, gradeLabel: 'Distinction', minPercentage: 75, maxPercentage: 84 },
                            { gradePoint: 3, gradeLabel: 'Very Good', minPercentage: 65, maxPercentage: 74 },
                            { gradePoint: 4, gradeLabel: 'Very Good', minPercentage: 55, maxPercentage: 64 },
                            { gradePoint: 5, gradeLabel: 'Credit', minPercentage: 50, maxPercentage: 54 },
                            { gradePoint: 6, gradeLabel: 'Credit', minPercentage: 40, maxPercentage: 49 },
                            { gradePoint: 7, gradeLabel: 'Pass', minPercentage: 35, maxPercentage: 39 },
                            { gradePoint: 8, gradeLabel: 'Fail', minPercentage: 0, maxPercentage: 34 },
                            { gradePoint: 9, gradeLabel: 'Fail', minPercentage: 0, maxPercentage: 34 }
                        ]
                    }
                ],
                settings: {
                    eczGradingEnabled: true,
                    defaultPrimaryScaleId: 'default-primary',
                    defaultSecondaryScaleId: 'default-secondary',
                    passCriteria: { minimumSubjects: 6, minimumCredits: 1, minimumPercentage: 35.0 },
                    divisionCalculation: { method: 'average_points' }
                },
                timestamp: Date.now()
            };
        },

        /**
         * Calculate grade using school's grading configuration
         */
        async calculateGrade(percentage, gradeLevel = 'primary') {
            try {
                const gradingConfig = await this.getGradingConfiguration();
                
                // Determine which scale to use
                let scaleId;
                if (gradeLevel.toLowerCase().includes('primary') || 
                    (typeof gradeLevel === 'number' && gradeLevel <= 7)) {
                    scaleId = gradingConfig.settings?.defaultPrimaryScaleId;
                } else {
                    scaleId = gradingConfig.settings?.defaultSecondaryScaleId;
                }

                // Find the appropriate scale
                const scale = gradingConfig.scales.find(s => s.id === scaleId) || 
                             gradingConfig.scales.find(s => s.isDefault && s.educationLevel === gradeLevel) ||
                             gradingConfig.scales.find(s => s.isDefault);

                if (!scale || !scale.details) {
                    // Fallback to default ECZ calculation
                    return this.calculateDefaultECZGrade(percentage);
                }

                // Find the grade for this percentage
                const gradeDetail = scale.details.find(d => 
                    percentage >= d.minPercentage && percentage <= d.maxPercentage
                );

                if (gradeDetail) {
                    return {
                        grade: gradeDetail.gradePoint.toString(),
                        label: gradeDetail.gradeLabel,
                        scale: scale.name,
                        isEczCompliant: scale.isEczCompliant || false
                    };
                }

                // If no grade found, return fail
                return {
                    grade: '9',
                    label: 'Fail',
                    scale: scale.name,
                    isEczCompliant: scale.isEczCompliant || false
                };
            } catch (error) {
                console.error('Error calculating grade:', error);
                return this.calculateDefaultECZGrade(percentage);
            }
        },

        /**
         * Default ECZ grade calculation as fallback
         */
        calculateDefaultECZGrade(percentage) {
            let grade, label;
            if (percentage >= 85) { grade = '1'; label = 'Excellent'; }
            else if (percentage >= 75) { grade = '2'; label = 'Very Good'; }
            else if (percentage >= 65) { grade = '3'; label = 'Good'; }
            else if (percentage >= 55) { grade = '4'; label = 'Satisfactory'; }
            else if (percentage >= 45) { grade = '5'; label = 'Pass'; }
            else if (percentage >= 35) { grade = '6'; label = 'Credit'; }
            else if (percentage >= 30) { grade = '7'; label = 'Marginal Pass'; }
            else if (percentage >= 20) { grade = '8'; label = 'Fail'; }
            else { grade = '9'; label = 'Fail'; }

            return {
                grade: grade,
                label: label,
                scale: 'Default ECZ',
                isEczCompliant: true
            };
        },

        /**
         * Check if report card is published
         */
        async isReportCardPublished(term, cardType) {
            try {
                const dashboard = await this.getDashboard();
                return dashboard.publicationStatus[term]?.[cardType] || false;
            } catch (error) {
                console.error('Error checking publication status:', error);
                return false;
            }
        },

        /**
         * Get cached data if available and not too old
         */
        getCachedData(key, maxAge = 60000) { // 1 minute default
            const cached = this.cache.get(key);
            if (cached && (Date.now() - cached.timestamp) < maxAge) {
                return cached.data;
            }
            return null;
        },

        /**
         * Make API request with authentication
         */
        async request(endpoint, options = {}) {
            const url = (window.SHIKOLA_API_BASE || 'http://localhost:3000') + endpoint;
            
            // Skip API calls in demo mode
            if (!window.SHIKOLA_API_BASE || window.SHIKOLA_API_BASE === 'http://localhost:3000') {
                // Return mock data or throw a silent error
                throw new Error('API not configured - demo mode');
            }
            
            const headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            };

            // Add authentication token
            const token = this.getAuthToken();
            if (token) {
                headers['Authorization'] = 'Bearer ' + token;
            }

            const config = {
                method: 'GET',
                headers: headers,
                ...options
            };

            try {
                const response = await fetch(url, config);
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data?.message || `HTTP ${response.status}: ${response.statusText}`);
                }

                return data;
            } catch (error) {
                // Only log errors in production mode, not demo mode
                if (window.SHIKOLA_API_BASE && window.SHIKOLA_API_BASE !== 'http://localhost:3000') {
                    console.error(`API request failed for ${endpoint}:`, error);
                }
                throw error;
            }
        },

        /**
         * Get authentication token
         */
        getAuthToken() {
            try {
                return localStorage.getItem('authToken') || 
                       localStorage.getItem('shikola_token') || 
                       null;
            } catch (error) {
                console.error('Error getting auth token:', error);
                return null;
            }
        },

        /**
         * Start real-time updates
         */
        startRealtimeUpdates() {
            if (this.updateInterval) {
                clearInterval(this.updateInterval);
            }

            this.updateInterval = setInterval(async () => {
                try {
                    const updates = await this.getRealtimeUpdates();
                    this.dispatchUpdateEvent(updates);
                } catch (error) {
                    console.error('Real-time update failed:', error);
                }
            }, this.updateFrequency);

            console.log(`Real-time updates started (interval: ${this.updateFrequency}ms)`);
        },

        /**
         * Stop real-time updates
         */
        stopRealtimeUpdates() {
            if (this.updateInterval) {
                clearInterval(this.updateInterval);
                this.updateInterval = null;
                console.log('Real-time updates stopped');
            }
        },

        /**
         * Dispatch custom event for real-time updates
         */
        dispatchUpdateEvent(updates) {
            const event = new CustomEvent('pupilReportCardUpdate', {
                detail: updates
            });
            window.dispatchEvent(event);
        },

        /**
         * Setup event listeners
         */
        setupEventListeners() {
            // Listen for page visibility changes to pause/resume updates
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    this.stopRealtimeUpdates();
                } else {
                    this.startRealtimeUpdates();
                }
            });

            // Listen for online/offline events
            window.addEventListener('online', () => {
                console.log('Connection restored, resuming updates');
                this.startRealtimeUpdates();
            });

            window.addEventListener('offline', () => {
                console.log('Connection lost, pausing updates');
                this.stopRealtimeUpdates();
            });
        },

        /**
         * Clear cache
         */
        clearCache() {
            this.cache.clear();
            console.log('API cache cleared');
        },

        /**
         * Get cache statistics
         */
        getCacheStats() {
            return {
                size: this.cache.size,
                keys: Array.from(this.cache.keys()),
                totalMemory: this.calculateMemoryUsage()
            };
        },

        /**
         * Calculate approximate memory usage
         */
        calculateMemoryUsage() {
            let totalSize = 0;
            for (const [key, value] of this.cache) {
                totalSize += JSON.stringify(value).length;
            }
            return totalSize;
        },

        /**
         * Batch fetch multiple report cards
         */
        async batchFetchReportCards(terms, cardTypes) {
            const promises = [];
            
            for (const term of terms) {
                for (const cardType of cardTypes) {
                    promises.push(this.getReportCard(term, cardType));
                }
            }

            try {
                const results = await Promise.allSettled(promises);
                return results.map((result, index) => {
                    const [term, cardType] = this.getTermAndCardTypeFromIndex(index, terms, cardTypes);
                    return {
                        term,
                        cardType,
                        success: result.status === 'fulfilled',
                        data: result.status === 'fulfilled' ? result.value : null,
                        error: result.status === 'rejected' ? result.reason : null
                    };
                });
            } catch (error) {
                console.error('Batch fetch failed:', error);
                throw error;
            }
        },

        /**
         * Helper to get term and card type from batch index
         */
        getTermAndCardTypeFromIndex(index, terms, cardTypes) {
            const termIndex = Math.floor(index / cardTypes.length);
            const cardTypeIndex = index % cardTypes.length;
            return [terms[termIndex], cardTypes[cardTypeIndex]];
        },

        /**
         * Preload data for better performance
         */
        async preloadData() {
            try {
                console.log('Preloading report card data...');
                
                // Load dashboard first
                const dashboard = await this.getDashboard();
                
                // Preload available report cards
                const availableTerms = dashboard.availableTerms || [];
                const cardTypes = ['result', 'report'];
                
                if (availableTerms.length > 0) {
                    await this.batchFetchReportCards(availableTerms, cardTypes);
                }
                
                console.log('Data preloading completed');
            } catch (error) {
                console.error('Data preloading failed:', error);
            }
        },

        /**
         * Sync with other portals/pages
         */
        async syncWithOtherPortals() {
            try {
                // Get data from other portals via localStorage events
                const syncData = this.getSyncData();
                
                if (syncData) {
                    this.mergeSyncData(syncData);
                }
                
                // Broadcast current data to other portals
                this.broadcastSyncData();
            } catch (error) {
                console.error('Portal sync failed:', error);
            }
        },

        /**
         * Get sync data from localStorage
         */
        getSyncData() {
            try {
                const syncKey = 'shikola_pupil_sync_data';
                const syncData = localStorage.getItem(syncKey);
                return syncData ? JSON.parse(syncData) : null;
            } catch (error) {
                return null;
            }
        },

        /**
         * Merge sync data
         */
        mergeSyncData(syncData) {
            // Merge cached data with sync data
            for (const [key, value] of Object.entries(syncData.cache || {})) {
                if (!this.cache.has(key) || value.timestamp > this.cache.get(key).timestamp) {
                    this.cache.set(key, value);
                }
            }
        },

        /**
         * Broadcast sync data to other portals
         */
        broadcastSyncData() {
            try {
                const syncData = {
                    cache: Object.fromEntries(this.cache),
                    timestamp: Date.now(),
                    source: 'pupil-report-card'
                };
                
                const syncKey = 'shikola_pupil_sync_data';
                localStorage.setItem(syncKey, JSON.stringify(syncData));
                
                // Dispatch sync event
                const event = new CustomEvent('shikolaDataSync', {
                    detail: syncData
                });
                window.dispatchEvent(event);
            } catch (error) {
                console.error('Broadcast sync failed:', error);
            }
        },

        /**
         * Cleanup resources
         */
        cleanup() {
            this.stopRealtimeUpdates();
            this.clearCache();
            console.log('Pupil Report Card API cleaned up');
        }
    };

    // Export to global scope
    window.PupilReportCardAPI = PupilReportCardAPI;

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            PupilReportCardAPI.init();
        });
    } else {
        PupilReportCardAPI.init();
    }

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        PupilReportCardAPI.cleanup();
    });

})(window);
