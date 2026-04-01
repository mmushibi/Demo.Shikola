/*
Shikola Academy Data Initializer
Loads Zambian mock data into the system for demos
*/

(function() {
    'use strict';

    // Data files to load
    const DATA_FILES = {
        pupils: '/frontend/public/pupils_template.csv',
        employees: '/frontend/public/employees_template.csv',
        classes: '/frontend/public/classes_template.csv',
        subjects: '/frontend/public/subjects_template.csv',
        fees: '/frontend/public/fees_template.csv',
        exams: '/frontend/public/exams_template.csv',
        timetable: '/frontend/public/timetable_template.csv'
    };

    // Storage keys
    const STORAGE_KEYS = {
        pupils: 'shikola_pupils',
        employees: 'shikola_employees',
        classes: 'shikola_classes',
        subjects: 'shikola_subjects',
        fees: 'shikola_fees',
        exams: 'shikola_exams',
        timetable: 'shikola_timetable',
        schoolConfig: 'shikola_school_config',
        initialized: 'shikola_data_initialized'
    };

    // Parse CSV data
    function parseCSV(csvText) {
        const lines = csvText.trim().split('\n');
        if (lines.length < 2) return [];
        
        const headers = lines[0].split(',').map(h => h.trim());
        const data = [];
        
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            if (values.length === headers.length) {
                const obj = {};
                headers.forEach((header, index) => {
                    obj[header] = values[index];
                });
                data.push(obj);
            }
        }
        
        return data;
    }

    // Load CSV file
    async function loadCSV(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                console.warn(`Failed to load ${url}: ${response.status}`);
                return [];
            }
            const text = await response.text();
            return parseCSV(text);
        } catch (error) {
            console.warn(`Error loading ${url}:`, error);
            return [];
        }
    }

    // Save data to localStorage
    function saveToStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            console.log(`Saved ${data.length} items to ${key}`);
        } catch (error) {
            console.error(`Error saving to ${key}:`, error);
        }
    }

    // Load school configuration
    async function loadSchoolConfig() {
        try {
            const response = await fetch('/frontend/public/school_config.json');
            if (response.ok) {
                const config = await response.json();
                saveToStorage(STORAGE_KEYS.schoolConfig, config);
                console.log('School configuration loaded');
            }
        } catch (error) {
            console.warn('Error loading school config:', error);
        }
    }

    // Initialize all data
    async function initializeData() {
        console.log('Initializing Shikola Academy data...');
        
        // Always initialize for demo purposes
        // const initialized = localStorage.getItem(STORAGE_KEYS.initialized);
        // if (initialized) {
        //     console.log('Data already initialized. Skipping...');
        //     return;
        // }

        try {
            // Load school configuration first
            await loadSchoolConfig();

            // Load all data files
            for (const [type, url] of Object.entries(DATA_FILES)) {
                console.log(`Loading ${type} data...`);
                const data = await loadCSV(url);
                if (data.length > 0) {
                    saveToStorage(STORAGE_KEYS[type], data);
                }
            }

            // Mark as initialized
            localStorage.setItem(STORAGE_KEYS.initialized, new Date().toISOString());
            console.log('Data initialization complete!');

            // Trigger events for UI updates
            window.dispatchEvent(new CustomEvent('shikola:data-initialized', {
                detail: { success: true, timestamp: new Date() }
            }));

        } catch (error) {
            console.error('Error during data initialization:', error);
        }
    }

    // Reset data (for testing)
    function resetData() {
        console.log('Resetting Shikola Academy data...');
        Object.values(STORAGE_KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
        console.log('Data reset complete');
    }

    // Make functions available globally
    window.ShikolaDataInitializer = {
        initializeData,
        resetData,
        isInitialized: () => !!localStorage.getItem(STORAGE_KEYS.initialized)
    };

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeData);
    } else {
        // Initialize after a short delay to ensure other scripts are loaded
        setTimeout(initializeData, 1000);
    }

    // Also provide manual trigger for demo purposes
    window.loadShikolaDemoData = initializeData;
    window.resetShikolaDemoData = resetData;

})();
