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
// Break Configuration API Integration for Shikola Timetables
(function(window) {
    'use strict';

    const BreakConfigAPI = {
        // API base configuration
        apiBase: window.SHIKOLA_API_BASE || '/api',
        
        // Get authentication token
        getAuthToken: function() {
            return localStorage.getItem('shikola_token') || localStorage.getItem('authToken');
        },
        
        // Fetch break configuration for a school
        getBreakConfig: async function(schoolId) {
            try {
                const token = this.getAuthToken();
                if (!token) {
                    throw new Error('Authentication required');
                }
                
                const response = await fetch(`${this.apiBase}/api/timetable/break-config?school_id=${schoolId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!response.ok) {
                    throw new Error('Failed to fetch break configuration');
                }
                
                const data = await response.json();
                return data;
            } catch (error) {
                console.error('Error fetching break config:', error);
                throw error;
            }
        },
        
        // Update break configuration
        updateBreakConfig: async function(schoolId, breakConfig) {
            try {
                const token = this.getAuthToken();
                if (!token) {
                    throw new Error('Authentication required');
                }
                
                // Validate configuration before sending
                const validation = this.validateBreakConfig(breakConfig);
                if (!validation.valid) {
                    throw new Error(validation.errors.join(', '));
                }
                
                const response = await fetch(`${this.apiBase}/api/timetable/break-config`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        school_id: schoolId,
                        break_config: breakConfig
                    })
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to update break configuration');
                }
                
                const data = await response.json();
                return data;
            } catch (error) {
                console.error('Error updating break config:', error);
                throw error;
            }
        },
        
        // Generate timetable preview with breaks
        generatePreview: async function(classId, breakConfig) {
            try {
                const token = this.getAuthToken();
                if (!token) {
                    throw new Error('Authentication required');
                }
                
                const response = await fetch(`${this.apiBase}/api/timetable/preview-timetable`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        class_id: classId,
                        break_config: breakConfig
                    })
                });
                
                if (!response.ok) {
                    throw new Error('Failed to generate timetable preview');
                }
                
                const data = await response.json();
                return data;
            } catch (error) {
                console.error('Error generating preview:', error);
                throw error;
            }
        },
        
        // Client-side validation for break configuration
        validateBreakConfig: function(config) {
            const errors = [];
            
            // Validate time format
            const timeFields = ['school_start', 'school_end', 'lunch_start', 'morning_break_start', 'afternoon_break_start'];
            timeFields.forEach(field => {
                if (config[field] && !this.isValidTime(config[field])) {
                    errors.push(`${field} must be a valid time format (HH:MM)`);
                }
            });
            
            // Validate durations are positive numbers
            const durationFields = ['period_duration', 'break_duration', 'lunch_duration', 'morning_break_duration', 'afternoon_break_duration'];
            durationFields.forEach(field => {
                if (config[field] !== undefined && (typeof config[field] !== 'number' || config[field] <= 0)) {
                    errors.push(`${field} must be a positive number`);
                }
            });
            
            // Validate logical time order
            if (config.school_start && config.school_end) {
                const startMinutes = this.timeToMinutes(config.school_start);
                const endMinutes = this.timeToMinutes(config.school_end);
                
                if (startMinutes >= endMinutes) {
                    errors.push('School start time must be before school end time');
                }
            }
            
            // Validate lunch is within school hours
            if (config.school_start && config.school_end && config.lunch_start) {
                const startMinutes = this.timeToMinutes(config.school_start);
                const endMinutes = this.timeToMinutes(config.school_end);
                const lunchMinutes = this.timeToMinutes(config.lunch_start);
                
                if (lunchMinutes <= startMinutes || lunchMinutes >= endMinutes) {
                    errors.push('Lunch time must be within school hours');
                }
            }
            
            // Validate break frequency
            if (config.short_break_frequency !== undefined && (typeof config.short_break_frequency !== 'number' || config.short_break_frequency < 1)) {
                errors.push('Short break frequency must be a positive number');
            }
            
            return {
                valid: errors.length === 0,
                errors: errors
            };
        },
        
        // Helper function to validate time format
        isValidTime: function(time) {
            const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
            return timeRegex.test(time);
        },
        
        // Convert time string to minutes
        timeToMinutes: function(time) {
            const [hours, minutes] = time.split(':').map(Number);
            return hours * 60 + minutes;
        },
        
        // Format minutes to time string
        minutesToTime: function(minutes) {
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
        },
        
        // Get default break configuration
        getDefaultConfig: function() {
            return {
                school_start: '08:00',
                school_end: '15:30',
                period_duration: 40,
                break_duration: 10,
                lunch_duration: 60,
                lunch_start: '12:00',
                short_break_frequency: 2,
                morning_break_start: '10:20',
                morning_break_duration: 15,
                afternoon_break_start: '14:00',
                afternoon_break_duration: 10,
                break_types: {
                    morning_break: { name: 'Morning Break', duration: 15, color: '#10b981' },
                    lunch: { name: 'Lunch Break', duration: 60, color: '#f59e0b' },
                    afternoon_break: { name: 'Afternoon Break', duration: 10, color: '#3b82f6' },
                    short_break: { name: 'Short Break', duration: 10, color: '#6b7280' }
                }
            };
        },
        
        // Format break configuration for display
        formatConfigForDisplay: function(config) {
            const formatted = { ...config };
            
            // Add human-readable duration labels
            if (formatted.period_duration) {
                formatted.period_duration_label = `${formatted.period_duration} minutes`;
            }
            if (formatted.lunch_duration) {
                formatted.lunch_duration_label = `${formatted.lunch_duration} minutes`;
            }
            if (formatted.morning_break_duration) {
                formatted.morning_break_duration_label = `${formatted.morning_break_duration} minutes`;
            }
            if (formatted.afternoon_break_duration) {
                formatted.afternoon_break_duration_label = `${formatted.afternoon_break_duration} minutes`;
            }
            
            return formatted;
        }
    };
    
    // Export to global scope
    window.BreakConfigAPI = BreakConfigAPI;
    
})(window);
