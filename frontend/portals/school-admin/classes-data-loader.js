/*
Classes Data Loader for School Admin Portal
Populates classes page with mock data from admin-mock-data.js
*/

(function() {
    'use strict';

    // Initialize classes page with mock data
    function initializeClassesData() {
        console.log('Loading classes data...');
        
        // Wait for admin mock data to be available
        const checkData = setInterval(() => {
            if (window.ShikolaAdminMockData) {
                clearInterval(checkData);
                loadClassesData();
            }
        }, 100);

        // Timeout after 5 seconds
        setTimeout(() => {
            clearInterval(checkData);
            console.warn('Admin mock data not available, using fallback values');
            loadFallbackData();
        }, 5000);
    }

    function loadClassesData() {
        try {
            const classes = window.ShikolaAdminMockData.getClasses();
            const employees = window.ShikolaAdminMockData.getEmployees();
            const pupils = window.ShikolaAdminMockData.getPupils();

            // Update classes grid
            updateClassesGrid(classes, employees);
            
            // Update class statistics
            updateClassStatistics(classes, pupils);
            
            // Setup class interactions
            setupClassInteractions();
            
            console.log('Classes data loaded successfully');
        } catch (error) {
            console.error('Error loading classes data:', error);
            loadFallbackData();
        }
    }

    function updateClassesGrid(classes, employees) {
        // Find the classes container (look for common patterns)
        let container = document.querySelector('[data-list="classes"]') || 
                      document.querySelector('.classes-grid') ||
                      document.querySelector('.grid') ||
                      document.querySelector('main .flex-1 .space-y-6');

        if (!container) {
            console.warn('Classes container not found');
            return;
        }

        // Create classes grid HTML
        let html = '';
        classes.forEach(cls => {
            const teacher = employees.find(emp => emp.id === cls.classTeacherId) || 
                           { fullName: cls.classTeacher || 'Not Assigned' };
            
            const occupancyRate = cls.capacity > 0 ? (cls.enrolled / cls.capacity) * 100 : 0;
            const statusColor = cls.status === 'Active' ? 'green' : 'slate';
            const occupancyColor = occupancyRate > 90 ? 'red' : occupancyRate > 75 ? 'yellow' : 'green';

            html += `
                <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow cursor-pointer class-card" data-class-id="${cls.id}">
                    <div class="flex items-start justify-between mb-4">
                        <div>
                            <h3 class="text-lg font-semibold text-slate-800">${cls.name}</h3>
                            <p class="text-sm text-slate-400 mt-1">Grade ${cls.gradeLevel}</p>
                        </div>
                        <span class="px-2 py-1 text-xs rounded-full bg-${statusColor}-100 text-${statusColor}-600">
                            ${cls.status}
                        </span>
                    </div>
                    
                    <div class="space-y-3">
                        <div class="flex items-center justify-between">
                            <span class="text-sm text-slate-600">Class Teacher</span>
                            <span class="text-sm font-medium text-slate-800">${teacher.fullName}</span>
                        </div>
                        
                        <div class="flex items-center justify-between">
                            <span class="text-sm text-slate-600">Room</span>
                            <span class="text-sm font-medium text-slate-800">${cls.room}</span>
                        </div>
                        
                        <div class="flex items-center justify-between">
                            <span class="text-sm text-slate-600">Enrollment</span>
                            <div class="flex items-center gap-2">
                                <span class="text-sm font-medium text-slate-800">${cls.enrolled}/${cls.capacity}</span>
                                <div class="w-16 bg-slate-100 rounded-full h-2 overflow-hidden">
                                    <div class="h-full bg-${occupancyColor}-500 rounded-full transition-all duration-300" 
                                         style="width: ${occupancyRate}%"></div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="flex items-center justify-between">
                            <span class="text-sm text-slate-600">Avg Attendance</span>
                            <span class="text-sm font-medium text-slate-800">${cls.averageAttendance}%</span>
                        </div>
                        
                        <div class="flex items-center justify-between">
                            <span class="text-sm text-slate-600">Pass Rate</span>
                            <span class="text-sm font-medium text-slate-800">${cls.passRate}%</span>
                        </div>
                    </div>
                    
                    <div class="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                        <div class="text-xs text-slate-400">
                            ${cls.subjects.length} subjects
                        </div>
                        <div class="flex gap-2">
                            <button class="text-xs text-blue-500 hover:text-blue-700 font-medium" onclick="editClass('${cls.id}')">
                                Edit
                            </button>
                            <button class="text-xs text-slate-500 hover:text-slate-700" onclick="viewClassDetails('${cls.id}')">
                                View
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });

        // If we found a grid container, update it
        if (container.classList.contains('grid')) {
            container.innerHTML = html;
        } else {
            // Create a new grid container
            const gridContainer = document.createElement('div');
            gridContainer.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';
            gridContainer.innerHTML = html;
            
            // Replace or append to the found container
            if (container.children.length > 0) {
                container.innerHTML = '';
                container.appendChild(gridContainer);
            } else {
                container.appendChild(gridContainer);
            }
        }
    }

    function updateClassStatistics(classes, pupils) {
        // Calculate statistics
        const totalClasses = classes.length;
        const activeClasses = classes.filter(c => c.status === 'Active').length;
        const totalEnrolled = classes.reduce((sum, c) => sum + c.enrolled, 0);
        const totalCapacity = classes.reduce((sum, c) => sum + c.capacity, 0);
        const averageAttendance = classes.reduce((sum, c) => sum + c.averageAttendance, 0) / classes.length;
        const averagePassRate = classes.reduce((sum, c) => sum + c.passRate, 0) / classes.length;

        // Update statistics elements (look for common patterns)
        updateStatElement('[data-stat="total-classes"]', totalClasses);
        updateStatElement('[data-stat="active-classes"]', activeClasses);
        updateStatElement('[data-stat="total-enrolled"]', totalEnrolled);
        updateStatElement('[data-stat="total-capacity"]', totalCapacity);
        updateStatElement('[data-stat="average-attendance"]', Math.round(averageAttendance) + '%');
        updateStatElement('[data-stat="average-pass-rate"]', Math.round(averagePassRate) + '%');

        // Update occupancy rate
        const occupancyRate = totalCapacity > 0 ? (totalEnrolled / totalCapacity) * 100 : 0;
        updateStatElement('[data-stat="occupancy-rate"]', Math.round(occupancyRate) + '%');
    }

    function updateStatElement(selector, value) {
        const element = document.querySelector(selector);
        if (element) {
            element.textContent = value;
        }
    }

    function setupClassInteractions() {
        // Add click handlers to class cards
        document.querySelectorAll('.class-card').forEach(card => {
            card.addEventListener('click', function(e) {
                // Don't trigger if clicking on buttons
                if (e.target.tagName === 'BUTTON') {
                    return;
                }
                
                const classId = this.getAttribute('data-class-id');
                viewClassDetails(classId);
            });
        });

        // Add search functionality
        setupSearch();
        
        // Add filter functionality
        setupFilters();
    }

    function setupSearch() {
        const searchInput = document.querySelector('input[placeholder*="Search classes"], input[placeholder*="search"]');
        if (!searchInput) return;

        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            filterClasses(searchTerm);
        });
    }

    function setupFilters() {
        // Look for filter buttons
        const filterButtons = document.querySelectorAll('[data-filter], button[class*="filter"]');
        filterButtons.forEach(button => {
            button.addEventListener('click', function() {
                const filter = this.getAttribute('data-filter') || this.textContent.trim();
                applyFilter(filter);
                
                // Update active state
                filterButtons.forEach(btn => btn.classList.remove('active', 'bg-orange-100', 'text-orange-500'));
                this.classList.add('active', 'bg-orange-100', 'text-orange-500');
            });
        });
    }

    function filterClasses(searchTerm) {
        const classCards = document.querySelectorAll('.class-card');
        classCards.forEach(card => {
            const className = card.querySelector('h3').textContent.toLowerCase();
            const teacher = card.textContent.toLowerCase();
            
            if (className.includes(searchTerm) || teacher.includes(searchTerm)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }

    function applyFilter(filter) {
        const classCards = document.querySelectorAll('.class-card');
        classCards.forEach(card => {
            const status = card.querySelector('[class*="bg-"]')?.textContent?.trim();
            const shouldShow = filter === 'All' || status === filter;
            card.style.display = shouldShow ? 'block' : 'none';
        });
    }

    function loadFallbackData() {
        console.log('Loading fallback classes data...');
        
        // Show empty state
        const container = document.querySelector('.grid') || document.querySelector('main .flex-1');
        if (container) {
            container.innerHTML = `
                <div class="text-center py-12">
                    <div class="text-slate-400 mb-4">
                        <i class="fas fa-chalkboard text-6xl"></i>
                    </div>
                    <h3 class="text-lg font-medium text-slate-800 mb-2">No Classes Found</h3>
                    <p class="text-slate-400 mb-6">Get started by creating your first class.</p>
                    <button class="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
                        <i class="fas fa-plus mr-2"></i>Add Class
                    </button>
                </div>
            `;
        }

        // Set default statistics
        updateStatElement('[data-stat="total-classes"]', '0');
        updateStatElement('[data-stat="active-classes"]', '0');
        updateStatElement('[data-stat="total-enrolled"]', '0');
        updateStatElement('[data-stat="total-capacity"]', '0');
        updateStatElement('[data-stat="average-attendance"]', '0%');
        updateStatElement('[data-stat="average-pass-rate"]', '0%');
        updateStatElement('[data-stat="occupancy-rate"]', '0%');
    }

    // Global functions for class interactions
    window.editClass = function(classId) {
        console.log('Edit class:', classId);
        // This would typically open a modal or navigate to edit page
        alert(`Edit class functionality for class ID: ${classId}`);
    };

    window.viewClassDetails = function(classId) {
        console.log('View class details:', classId);
        // This would typically navigate to class details page
        // For now, show some basic info
        const classes = window.ShikolaAdminMockData?.getClasses() || [];
        const cls = classes.find(c => c.id === classId);
        if (cls) {
            alert(`Class Details:\n\nName: ${cls.name}\nTeacher: ${cls.classTeacher}\nEnrolled: ${cls.enrolled}/${cls.capacity}\nRoom: ${cls.room}\nStatus: ${cls.status}`);
        }
    };

    // Initialize when DOM is ready
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initializeClassesData);
        } else {
            initializeClassesData();
        }
    }

    // Listen for admin mock data initialization
    if (window.addEventListener) {
        window.addEventListener('shikola:admin-mock-data-initialized', function(event) {
            console.log('Admin mock data initialized, loading classes...');
            loadClassesData();
        });
    }

    // Auto-refresh data every 60 seconds
    setInterval(() => {
        if (window.ShikolaAdminMockData) {
            loadClassesData();
        }
    }, 60000);

    // Initialize
    init();

})();
