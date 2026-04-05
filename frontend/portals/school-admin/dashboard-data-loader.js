/*
Dashboard Data Loader for School Admin Portal
Populates dashboard with mock data from admin-mock-data.js
*/

(function() {
    'use strict';

    // Initialize dashboard with mock data
    function initializeDashboardData() {
        console.log('Loading dashboard data...');
        
        // Wait for admin mock data to be available
        const checkData = setInterval(() => {
            if (window.ShikolaAdminMockData) {
                clearInterval(checkData);
                loadDashboardData();
            }
        }, 100);

        // Timeout after 5 seconds
        setTimeout(() => {
            clearInterval(checkData);
            console.warn('Admin mock data not available, using fallback values');
            loadFallbackData();
        }, 5000);
    }

    function loadDashboardData() {
        try {
            const reportsData = window.ShikolaAdminMockData.getReportsData();
            const pupils = window.ShikolaAdminMockData.getPupils();
            const employees = window.ShikolaAdminMockData.getEmployees();
            const classes = window.ShikolaAdminMockData.getClasses();

            // Update quick stats
            updateQuickStats(reportsData, pupils, employees);
            
            // Update management value chart
            updateManagementChart(reportsData);
            
            // Update pupils per class
            updatePupilsPerClass(classes, pupils);
            
            // Update today's overview
            updateTodaysOverview(pupils, employees, classes);
            
            console.log('Dashboard data loaded successfully');
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            loadFallbackData();
        }
    }

    function updateQuickStats(reportsData, pupils, employees) {
        // Update total students
        const studentsElement = document.querySelector('[data-stat="total-students"]');
        if (studentsElement) {
            studentsElement.textContent = reportsData.enrollment?.totalPupils || pupils.length || 0;
        }

        // Update total teachers
        const teachersElement = document.querySelector('[data-stat="total-teachers"]');
        if (teachersElement) {
            teachersElement.textContent = reportsData.staff?.teachingStaff || employees.filter(e => e.position.includes('Teacher')).length || 0;
        }
    }

    function updateManagementChart(reportsData) {
        // Generate sample data for the management chart
        const chartData = generateChartData(reportsData);
        
        // Update chart area
        const areaElement = document.querySelector('[data-management-area]');
        if (areaElement && chartData.area) {
            areaElement.setAttribute('d', chartData.area);
        }

        // Update chart line
        const lineElement = document.querySelector('[data-management-line]');
        if (lineElement && chartData.line) {
            lineElement.setAttribute('d', chartData.line);
        }

        // Update labels
        const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        document.querySelectorAll('[data-management-label]').forEach((el, index) => {
            if (labels[index]) {
                el.textContent = labels[index];
            }
        });
    }

    function generateChartData(reportsData) {
        // Generate realistic chart data based on financial data
        const baseValue = reportsData.financial?.totalRevenue || 100000;
        const points = [];
        
        for (let i = 0; i < 6; i++) {
            const variation = Math.random() * 0.3 - 0.15; // ±15% variation
            const value = baseValue * (1 + variation);
            const y = 120 - (value / baseValue) * 80; // Scale to chart height
            const x = 20 + (i * 60);
            points.push(`${x},${y}`);
        }

        const linePath = `M${points.join(' L')}`;
        const areaPath = `${linePath} L320,120 L20,120 Z`;

        return {
            line: linePath,
            area: areaPath
        };
    }

    function updatePupilsPerClass(classes, pupils) {
        const container = document.querySelector('[data-list="pupils-per-class"]');
        const emptyMessage = document.querySelector('[data-empty="pupils-per-class"]');
        const totalElement = document.querySelector('[data-stat="total-pupils-per-class"]');
        const classesLabelElement = document.querySelector('[data-stat="total-classes-label"]');

        if (!container) return;

        // Count pupils per class
        const classCounts = {};
        pupils.forEach(pupil => {
            const className = pupil.className || pupil.classGrade;
            if (className) {
                classCounts[className] = (classCounts[className] || 0) + 1;
            }
        });

        // Create class list HTML
        const classEntries = Object.entries(classCounts)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .slice(0, 5); // Show top 5 classes

        if (classEntries.length > 0) {
            let html = '';
            classEntries.forEach(([className, count]) => {
                const percentage = (count / pupils.length) * 100;
                html += `
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <div class="h-2 w-2 rounded-full bg-orange-400"></div>
                            <span class="text-slate-700">${className}</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <div class="w-20 bg-slate-100 rounded-full h-2 overflow-hidden">
                                <div class="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-500" 
                                     style="width: ${percentage}%"></div>
                            </div>
                            <span class="text-slate-500 w-8 text-right">${count}</span>
                        </div>
                    </div>
                `;
            });
            container.innerHTML = html;

            if (emptyMessage) {
                emptyMessage.style.display = 'none';
            }

            if (totalElement) {
                totalElement.textContent = `${pupils.length} pupils`;
            }

            if (classesLabelElement) {
                classesLabelElement.textContent = `(${classes.length} classes)`;
            }
        } else {
            if (emptyMessage) {
                emptyMessage.style.display = 'block';
            }
        }
    }

    function updateTodaysOverview(pupils, employees, classes) {
        // Find the recent activities section
        const activitiesSection = document.querySelector('.recent-activities');
        if (!activitiesSection) return;

        // Generate today's activities
        const activities = generateTodaysActivities(pupils, employees, classes);
        
        // Find the container for activities
        const activitiesContainer = activitiesSection.querySelector('.mt-5');
        if (activitiesContainer) {
            let html = '';
            activities.forEach(activity => {
                html += `
                    <div class="flex items-start gap-3 py-3 border-b border-slate-50 last:border-b-0">
                        <div class="h-8 w-8 rounded-full ${activity.iconBg} flex items-center justify-center flex-shrink-0">
                            <i class="${activity.icon} text-xs"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="text-sm text-slate-800 font-medium">${activity.title}</div>
                            <div class="text-xs text-slate-400 mt-0.5">${activity.description}</div>
                            <div class="text-[11px] text-slate-300 mt-1">${activity.time}</div>
                        </div>
                    </div>
                `;
            });
            activitiesContainer.innerHTML = html;
        }
    }

    function generateTodaysActivities(pupils, employees, classes) {
        const activities = [];
        const now = new Date();

        // New pupil registration
        if (pupils.length > 0 && Math.random() > 0.3) {
            const pupil = pupils[Math.floor(Math.random() * pupils.length)];
            activities.push({
                title: 'New Pupil Registered',
                description: `${pupil.fullName} enrolled in ${pupil.className}`,
                time: `${Math.floor(Math.random() * 8) + 1} hours ago`,
                icon: 'fas fa-user-plus',
                iconBg: 'bg-green-100 text-green-500'
            });
        }

        // Employee activity
        if (employees.length > 0 && Math.random() > 0.3) {
            const employee = employees[Math.floor(Math.random() * employees.length)];
            activities.push({
                title: 'Staff Update',
                description: `${employee.fullName} (${employee.position}) updated profile`,
                time: `${Math.floor(Math.random() * 6) + 1} hours ago`,
                icon: 'fas fa-users',
                iconBg: 'bg-blue-100 text-blue-500'
            });
        }

        // Class activity
        if (classes.length > 0 && Math.random() > 0.3) {
            const cls = classes[Math.floor(Math.random() * classes.length)];
            activities.push({
                title: 'Class Update',
                description: `${cls.name} attendance marked - ${cls.averageAttendance}% present`,
                time: `${Math.floor(Math.random() * 4) + 1} hours ago`,
                icon: 'fas fa-chalkboard',
                iconBg: 'bg-purple-100 text-purple-500'
            });
        }

        // Financial activity
        if (Math.random() > 0.5) {
            const amount = Math.floor(Math.random() * 5000) + 1000;
            activities.push({
                title: 'Fee Payment Received',
                description: `K ${amount.toLocaleString()} collected from parents`,
                time: `${Math.floor(Math.random() * 3) + 1} hours ago`,
                icon: 'fas fa-dollar-sign',
                iconBg: 'bg-orange-100 text-orange-500'
            });
        }

        // System update
        if (Math.random() > 0.7) {
            activities.push({
                title: 'System Update',
                description: 'Database backup completed successfully',
                time: `${Math.floor(Math.random() * 2) + 1} hours ago`,
                icon: 'fas fa-database',
                iconBg: 'bg-slate-100 text-slate-500'
            });
        }

        return activities.slice(0, 4); // Return max 4 activities
    }

    function loadFallbackData() {
        console.log('Loading fallback dashboard data...');
        
        // Set default values
        const studentsElement = document.querySelector('[data-stat="total-students"]');
        if (studentsElement) {
            studentsElement.textContent = '0';
        }

        const teachersElement = document.querySelector('[data-stat="total-teachers"]');
        if (teachersElement) {
            teachersElement.textContent = '0';
        }

        // Show empty state for pupils per class
        const emptyMessage = document.querySelector('[data-empty="pupils-per-class"]');
        if (emptyMessage) {
            emptyMessage.style.display = 'block';
        }

        // Hide activities list or show empty state
        const activitiesSection = document.querySelector('.recent-activities');
        if (activitiesSection) {
            const container = activitiesSection.querySelector('.mt-5');
            if (container) {
                container.innerHTML = '<div class="text-center text-slate-400 py-8">No recent activities</div>';
            }
        }
    }

    // Initialize when DOM is ready
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initializeDashboardData);
        } else {
            initializeDashboardData();
        }
    }

    // Listen for admin mock data initialization
    if (window.addEventListener) {
        window.addEventListener('shikola:all-mock-data-initialized', function(event) {
            console.log('Admin mock data initialized, loading dashboard...');
            loadDashboardData();
        });
    }

    // Auto-refresh data every 30 seconds
    setInterval(() => {
        if (window.ShikolaAdminMockData) {
            loadDashboardData();
        }
    }, 30000);

    // Initialize
    init();

})();
