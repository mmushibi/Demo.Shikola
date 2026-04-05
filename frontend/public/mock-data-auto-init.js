/*
Mock Data Auto-Initializer
Ensures mock data is available when pages load
*/

(function() {
    'use strict';

    console.log('Mock Data Auto-Initializer loaded');

    // Function to initialize all mock data
    function initializeAllMockData() {
        console.log('Initializing all mock data...');
        
        try {
            // Initialize comprehensive mock data if available
            if (window.ShikolaMockData && typeof window.ShikolaMockData.initializeAll === 'function') {
                window.ShikolaMockData.initializeAll();
                console.log('Comprehensive mock data initialized');
            }
            
            // Force compatibility bridge initialization
            if (window.ShikolaMockData && !window.ShikolaAdminMockData) {
                // Trigger compatibility bridge manually
                setTimeout(() => {
                    if (typeof initializeCompatibility === 'function') {
                        initializeCompatibility();
                    }
                }, 100);
            }
            
            // Verify data is available
            setTimeout(() => {
                const checks = {
                    'ShikolaMockData': !!window.ShikolaMockData,
                    'ShikolaAdminMockData': !!window.ShikolaAdminMockData,
                    'ShikolaTeacherMockData': !!window.ShikolaTeacherMockData,
                    'ShikolaPupilMockData': !!window.ShikolaPupilMockData
                };
                
                console.log('Mock data availability check:', checks);
                
                // Log sample data if available
                if (window.ShikolaMockData) {
                    console.log('Sample pupil:', window.ShikolaMockData.pupils[0]);
                    console.log('Sample employee:', window.ShikolaMockData.employees[0]);
                    console.log('Sample class:', window.ShikolaMockData.classes[0]);
                }
                
            }, 500);
            
        } catch (error) {
            console.error('Error initializing mock data:', error);
        }
    }

    // Initialize at different stages to ensure data is available
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeAllMockData);
    } else {
        initializeAllMockData();
    }

    // Also initialize after window load to catch any late-loading scripts
    window.addEventListener('load', initializeAllMockData);

})();
