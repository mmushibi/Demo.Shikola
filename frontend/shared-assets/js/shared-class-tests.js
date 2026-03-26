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
 * Shikola Shared Class Tests Service
 * Provides common functionality for class tests across all portals
 */

(function() {
    'use strict';

    // Shared Class Tests Store
    window.ShikolaClassTestsStore = {
        // Storage for class tests data
        tests: {},
        
        // Initialize the store
        init: function() {
            this.loadFromStorage();
        },
        
        // Load data from localStorage
        loadFromStorage: function() {
            try {
                const stored = localStorage.getItem('shikola_class_tests_v1');
                if (stored) {
                    this.tests = JSON.parse(stored);
                }
            } catch (e) {
                console.warn('Failed to load class tests from storage:', e);
                this.tests = {};
            }
        },
        
        // Save data to localStorage
        saveToStorage: function() {
            try {
                localStorage.setItem('shikola_class_tests_v1', JSON.stringify(this.tests));
            } catch (e) {
                console.warn('Failed to save class tests to storage:', e);
            }
        },
        
        // Get a specific test
        getTest: function(identifier) {
            const key = this.generateKey(identifier);
            return this.tests[key] || null;
        },
        
        // Save or update a test
        saveTest: function(identifier, testData) {
            const key = this.generateKey(identifier);
            this.tests[key] = {
                ...testData,
                updatedAt: new Date().toISOString(),
                ...identifier
            };
            this.saveToStorage();
            return this.tests[key];
        },
        
        // Delete a test
        deleteTest: function(identifier) {
            const key = this.generateKey(identifier);
            delete this.tests[key];
            this.saveToStorage();
        },
        
        // Get all tests for a class
        getClassTests: function(className) {
            const results = [];
            for (const key in this.tests) {
                if (this.tests[key].className === className) {
                    results.push(this.tests[key]);
                }
            }
            return results;
        },
        
        // Generate storage key
        generateKey: function(identifier) {
            return `${identifier.className}_${identifier.subject}_${identifier.test}_${identifier.term}`;
        },
        
        // Clear all data
        clear: function() {
            this.tests = {};
            this.saveToStorage();
        }
    };

    // Shared Class Tests Helper Functions
    window.ShikolaClassTestsHelpers = {
        // Calculate average marks for a test
        calculateAverage: function(marks) {
            if (!Array.isArray(marks) || marks.length === 0) return 0;
            
            const validMarks = marks.filter(m => m.marks != null && !isNaN(m.marks));
            if (validMarks.length === 0) return 0;
            
            const sum = validMarks.reduce((acc, m) => acc + parseFloat(m.marks), 0);
            return (sum / validMarks.length).toFixed(2);
        },
        
        // Calculate grade based on marks
        calculateGrade: function(marks, totalMarks) {
            if (marks == null || totalMarks == null) return 'N/A';
            
            const percentage = (parseFloat(marks) / parseFloat(totalMarks)) * 100;
            
            if (percentage >= 90) return 'A+';
            if (percentage >= 80) return 'A';
            if (percentage >= 70) return 'B';
            if (percentage >= 60) return 'C';
            if (percentage >= 50) return 'D';
            if (percentage >= 40) return 'E';
            return 'F';
        },
        
        // Validate test data
        validateTestData: function(testData) {
            const errors = [];
            
            if (!testData.className) errors.push('Class name is required');
            if (!testData.subject) errors.push('Subject is required');
            if (!testData.test) errors.push('Test name is required');
            if (!testData.term) errors.push('Term is required');
            if (!testData.totalMarks || testData.totalMarks <= 0) errors.push('Total marks must be greater than 0');
            
            if (testData.pupils && Array.isArray(testData.pupils)) {
                testData.pupils.forEach((pupil, index) => {
                    if (!pupil.id) errors.push(`Pupil ${index + 1}: ID is required`);
                    if (!pupil.name) errors.push(`Pupil ${index + 1}: Name is required`);
                    if (pupil.marks != null && (parseFloat(pupil.marks) < 0 || parseFloat(pupil.marks) > testData.totalMarks)) {
                        errors.push(`Pupil ${index + 1}: Marks must be between 0 and ${testData.totalMarks}`);
                    }
                });
            }
            
            return errors;
        },
        
        // Export test data to CSV
        exportToCSV: function(testData) {
            if (!testData || !testData.pupils) return null;
            
            const headers = ['Pupil ID', 'Name', 'Marks', 'Grade', 'Percentage'];
            const rows = [headers];
            
            testData.pupils.forEach(pupil => {
                const grade = this.calculateGrade(pupil.marks, testData.totalMarks);
                const percentage = pupil.marks != null ? 
                    ((parseFloat(pupil.marks) / parseFloat(testData.totalMarks)) * 100).toFixed(2) + '%' : 
                    'N/A';
                
                rows.push([
                    pupil.id || '',
                    pupil.name || '',
                    pupil.marks || '',
                    grade,
                    percentage
                ]);
            });
            
            return rows.map(row => row.join(',')).join('\n');
        },
        
        // Generate test summary statistics
        generateStatistics: function(testData) {
            if (!testData || !testData.pupils || testData.pupils.length === 0) {
                return {
                    totalPupils: 0,
                    average: 0,
                    highest: 0,
                    lowest: 0,
                    passRate: 0,
                    gradeDistribution: {}
                };
            }
            
            const marks = testData.pupils
                .filter(p => p.marks != null && !isNaN(p.marks))
                .map(p => parseFloat(p.marks));
            
            if (marks.length === 0) {
                return {
                    totalPupils: testData.pupils.length,
                    average: 0,
                    highest: 0,
                    lowest: 0,
                    passRate: 0,
                    gradeDistribution: {}
                };
            }
            
            const average = marks.reduce((a, b) => a + b, 0) / marks.length;
            const highest = Math.max(...marks);
            const lowest = Math.min(...marks);
            const passCount = marks.filter(m => m >= (testData.totalMarks * 0.4)).length; // 40% pass mark
            const passRate = (passCount / marks.length) * 100;
            
            // Grade distribution
            const gradeDistribution = {};
            testData.pupils.forEach(pupil => {
                const grade = this.calculateGrade(pupil.marks, testData.totalMarks);
                gradeDistribution[grade] = (gradeDistribution[grade] || 0) + 1;
            });
            
            return {
                totalPupils: testData.pupils.length,
                average: average.toFixed(2),
                highest: highest.toFixed(2),
                lowest: lowest.toFixed(2),
                passRate: passRate.toFixed(2),
                gradeDistribution
            };
        }
    };

    // Initialize the store when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            window.ShikolaClassTestsStore.init();
        });
    } else {
        window.ShikolaClassTestsStore.init();
    }

    // Log initialization
    console.log('Shikola Shared Class Tests Service loaded successfully');
})();
