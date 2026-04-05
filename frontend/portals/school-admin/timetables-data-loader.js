/*
Timetables Data Loader for School Admin Portal
Populates timetables page with mock data from admin-mock-data.js
*/

(function() {
    'use strict';

    // Initialize timetables page with mock data
    function initializeTimetablesData() {
        console.log('Loading timetables data...');
        
        // Wait for admin mock data to be available
        const checkData = setInterval(() => {
            if (window.ShikolaAdminMockData) {
                clearInterval(checkData);
                loadTimetablesData();
            }
        }, 100);

        // Timeout after 5 seconds
        setTimeout(() => {
            clearInterval(checkData);
            console.warn('Admin mock data not available, using fallback values');
            loadFallbackData();
        }, 5000);
    }

    function loadTimetablesData() {
        try {
            const timetables = window.ShikolaAdminMockData.getTimetables();
            const classes = window.ShikolaAdminMockData.getClasses();
            const employees = window.ShikolaAdminMockData.getEmployees();

            // Update timetables view
            updateTimetableView(timetables, classes, employees);
            
            // Update timetable statistics
            updateTimetableStatistics(timetables, classes, employees);
            
            // Setup timetable interactions
            setupTimetableInteractions();
            
            console.log('Timetables data loaded successfully');
        } catch (error) {
            console.error('Error loading timetables data:', error);
            loadFallbackData();
        }
    }

    function updateTimetableView(timetables, classes, employees) {
        // Find the timetable container
        let container = document.querySelector('[data-list="timetables"]') || 
                        document.querySelector('.timetable-container') ||
                        document.querySelector('main .flex-1 .space-y-6');

        if (!container) {
            console.warn('Timetable container not found');
            return;
        }

        // Group timetables by class
        const timetablesByClass = groupTimetablesByClass(timetables);
        
        // Create timetable HTML
        let html = '';
        Object.keys(timetablesByClass).forEach(classId => {
            const classTimetables = timetablesByClass[classId];
            const cls = classes.find(c => c.id === classId) || { name: 'Unknown Class' };
            
            html += `
                <div class="mb-8">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-semibold text-slate-800">${cls.name} Timetable</h3>
                        <div class="flex gap-2">
                            <button class="text-sm text-blue-500 hover:text-blue-700" onclick="editTimetable('${classId}')">
                                <i class="fas fa-edit mr-1"></i>Edit
                            </button>
                            <button class="text-sm text-slate-500 hover:text-slate-700" onclick="printTimetable('${classId}')">
                                <i class="fas fa-print mr-1"></i>Print
                            </button>
                        </div>
                    </div>
                    ${createTimetableTable(classTimetables, employees)}
                </div>
            `;
        });

        // Update container
        container.innerHTML = html;
    }

    function createTimetableTable(classTimetables, employees) {
        // Create a weekly timetable grid
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        const timeSlots = [
            '08:00-09:00', '09:00-10:00', '10:30-11:30', '11:30-12:30',
            '14:00-15:00', '15:00-16:00'
        ];

        // Create a grid of timetables
        const timetableGrid = {};
        days.forEach(day => {
            timetableGrid[day] = {};
            timeSlots.forEach(time => {
                timetableGrid[day][time] = null;
            });
        });

        // Fill the grid with timetables
        classTimetables.forEach(timetable => {
            if (timetableGrid[timetable.day] && timetableGrid[timetable.day][timetable.time]) {
                const employee = employees.find(e => e.id === timetable.teacherId) || { fullName: 'Unknown Teacher' };
                timetableGrid[timetable.day][timetable.time] = {
                    ...timetable,
                    teacherName: employee.fullName
                };
            }
        });

        // Generate HTML table
        let html = `
            <div class="overflow-x-auto">
                <table class="w-full border-collapse border border-slate-200">
                    <thead class="bg-slate-50">
                        <tr>
                            <th class="border border-slate-200 px-4 py-2 text-left text-xs font-medium text-slate-600 uppercase">Time/Day</th>
                            ${days.map(day => `
                                <th class="border border-slate-200 px-4 py-2 text-center text-xs font-medium text-slate-600 uppercase">${day}</th>
                            `).join('')}
                        </tr>
                    </thead>
                    <tbody class="bg-white">
                        ${timeSlots.map(time => `
                            <tr>
                                <td class="border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-50">${time}</td>
                                ${days.map(day => {
                                    const entry = timetableGrid[day][time];
                                    if (entry) {
                                        return `
                                            <td class="border border-slate-200 px-2 py-2 text-xs">
                                                <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded p-2 h-full min-h-[60px]">
                                                    <div class="font-medium text-slate-800">${entry.subject}</div>
                                                    <div class="text-slate-600">${entry.teacherName}</div>
                                                    <div class="text-slate-400">${entry.room}</div>
                                                </div>
                                            </td>
                                        `;
                                    } else {
                                        return `
                                            <td class="border border-slate-200 px-2 py-2 text-xs">
                                                <div class="h-full min-h-[60px]"></div>
                                            </td>
                                        `;
                                    }
                                }).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        return html;
    }

    function updateTimetableStatistics(timetables, classes, employees) {
        // Calculate statistics
        const totalClasses = classes.length;
        const totalTimetables = timetables.length;
        const totalTeachers = employees.filter(e => e.position.includes('Teacher')).length;
        const subjectsCovered = [...new Set(timetables.map(t => t.subject))].length;
        const roomsUsed = [...new Set(timetables.map(t => t.room))].length;

        // Calculate timetable coverage
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        const timeSlots = 6; // Based on our time slots
        const totalPossibleSlots = totalClasses * days.length * timeSlots;
        const coverageRate = totalPossibleSlots > 0 ? (totalTimetables / totalPossibleSlots) * 100 : 0;

        // Update statistics elements
        updateStatElement('[data-stat="total-classes"]', totalClasses);
        updateStatElement('[data-stat="total-timetables"]', totalTimetables);
        updateStatElement('[data-stat="total-teachers"]', totalTeachers);
        updateStatElement('[data-stat="subjects-covered"]', subjectsCovered);
        updateStatElement('[data-stat="rooms-used"]', roomsUsed);
        updateStatElement('[data-stat="coverage-rate"]', Math.round(coverageRate) + '%');
    }

    function groupTimetablesByClass(timetables) {
        const grouped = {};
        timetables.forEach(timetable => {
            if (!grouped[timetable.classId]) {
                grouped[timetable.classId] = [];
            }
            grouped[timetable.classId].push(timetable);
        });
        return grouped;
    }

    function updateStatElement(selector, value) {
        const element = document.querySelector(selector);
        if (element) {
            element.textContent = value;
        }
    }

    function setupTimetableInteractions() {
        // Add class selector functionality
        setupClassSelector();
        
        // Add teacher view functionality
        setupTeacherView();
        
        // Add room view functionality
        setupRoomView();
        
        // Add export functionality
        setupExportButtons();
    }

    function setupClassSelector() {
        const classSelector = document.querySelector('select[name="class-selector"]');
        if (!classSelector) return;

        classSelector.addEventListener('change', function() {
            const selectedClassId = this.value;
            filterTimetablesByClass(selectedClassId);
        });
    }

    function setupTeacherView() {
        const teacherViewButton = document.querySelector('[data-action="teacher-view"]');
        if (!teacherViewButton) return;

        teacherViewButton.addEventListener('click', function() {
            showTeacherTimetableView();
        });
    }

    function setupRoomView() {
        const roomViewButton = document.querySelector('[data-action="room-view"]');
        if (!roomViewButton) return;

        roomViewButton.addEventListener('click', function() {
            showRoomTimetableView();
        });
    }

    function setupExportButtons() {
        const exportButtons = document.querySelectorAll('[data-export]');
        exportButtons.forEach(button => {
            button.addEventListener('click', function() {
                const exportType = this.getAttribute('data-export');
                exportTimetable(exportType);
            });
        });
    }

    function filterTimetablesByClass(classId) {
        const classContainers = document.querySelectorAll('[data-class-id]');
        classContainers.forEach(container => {
            if (classId === 'all' || container.getAttribute('data-class-id') === classId) {
                container.style.display = 'block';
            } else {
                container.style.display = 'none';
            }
        });
    }

    function showTeacherTimetableView() {
        const timetables = window.ShikolaAdminMockData?.getTimetables() || [];
        const employees = window.ShikolaAdminMockData?.getEmployees() || [];
        
        // Group timetables by teacher
        const timetablesByTeacher = {};
        timetables.forEach(timetable => {
            if (!timetablesByTeacher[timetable.teacherId]) {
                timetablesByTeacher[timetable.teacherId] = [];
            }
            timetablesByTeacher[timetable.teacherId].push(timetable);
        });

        // Create teacher view HTML
        let html = '<div class="space-y-6">';
        Object.keys(timetablesByTeacher).forEach(teacherId => {
            const teacherTimetables = timetablesByTeacher[teacherId];
            const teacher = employees.find(e => e.id === teacherId) || { fullName: 'Unknown Teacher' };
            
            html += `
                <div class="bg-white rounded-lg border border-slate-200 p-4">
                    <h4 class="font-semibold text-slate-800 mb-3">${teacher.fullName}</h4>
                    <div class="grid grid-cols-5 gap-2 text-xs">
                        ${teacherTimetables.map(tt => `
                            <div class="bg-slate-50 rounded p-2">
                                <div class="font-medium">${tt.subject}</div>
                                <div class="text-slate-400">${tt.day} ${tt.time}</div>
                                <div class="text-slate-400">${tt.room}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        });
        html += '</div>';

        // Update container
        const container = document.querySelector('main .flex-1') || document.querySelector('.space-y-6');
        if (container) {
            container.innerHTML = html;
        }
    }

    function showRoomTimetableView() {
        const timetables = window.ShikolaAdminMockData?.getTimetables() || [];
        
        // Group timetables by room
        const timetablesByRoom = {};
        timetables.forEach(timetable => {
            if (!timetablesByRoom[timetable.room]) {
                timetablesByRoom[timetable.room] = [];
            }
            timetablesByRoom[timetable.room].push(timetable);
        });

        // Create room view HTML
        let html = '<div class="space-y-6">';
        Object.keys(timetablesByRoom).sort().forEach(room => {
            const roomTimetables = timetablesByRoom[room];
            
            html += `
                <div class="bg-white rounded-lg border border-slate-200 p-4">
                    <h4 class="font-semibold text-slate-800 mb-3">${room}</h4>
                    <div class="grid grid-cols-5 gap-2 text-xs">
                        ${roomTimetables.map(tt => `
                            <div class="bg-slate-50 rounded p-2">
                                <div class="font-medium">${tt.subject}</div>
                                <div class="text-slate-400">${tt.day} ${tt.time}</div>
                                <div class="text-slate-400">${tt.teacherName || 'Teacher'}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        });
        html += '</div>';

        // Update container
        const container = document.querySelector('main .flex-1') || document.querySelector('.space-y-6');
        if (container) {
            container.innerHTML = html;
        }
    }

    function exportTimetable(exportType) {
        console.log('Exporting timetable:', exportType);
        // This would typically generate and download a timetable
        alert(`Export timetable as ${exportType} functionality - would generate PDF/Excel file`);
    }

    function loadFallbackData() {
        console.log('Loading fallback timetables data...');
        
        // Show empty state
        const container = document.querySelector('main .flex-1') || document.querySelector('.space-y-6');
        if (container) {
            container.innerHTML = `
                <div class="text-center py-12">
                    <div class="text-slate-400 mb-4">
                        <i class="fas fa-calendar-alt text-6xl"></i>
                    </div>
                    <h3 class="text-lg font-medium text-slate-800 mb-2">No Timetables Found</h3>
                    <p class="text-slate-400 mb-6">Create timetables to manage class schedules here.</p>
                    <button class="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
                        <i class="fas fa-plus mr-2"></i>Create Timetable
                    </button>
                </div>
            `;
        }

        // Set default statistics
        updateStatElement('[data-stat="total-classes"]', '0');
        updateStatElement('[data-stat="total-timetables"]', '0');
        updateStatElement('[data-stat="total-teachers"]', '0');
        updateStatElement('[data-stat="subjects-covered"]', '0');
        updateStatElement('[data-stat="rooms-used"]', '0');
        updateStatElement('[data-stat="coverage-rate"]', '0%');
    }

    // Global functions for timetable interactions
    window.editTimetable = function(classId) {
        console.log('Edit timetable for class:', classId);
        // This would typically open a modal for editing timetable
        alert(`Edit timetable functionality for class ID: ${classId}`);
    };

    window.printTimetable = function(classId) {
        console.log('Print timetable for class:', classId);
        // This would typically print the timetable
        window.print();
    };

    window.createTimetable = function() {
        console.log('Create new timetable');
        // This would typically open a modal for creating new timetable
        alert('Create timetable functionality - would open modal to create new timetable');
    };

    // Initialize when DOM is ready
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initializeTimetablesData);
        } else {
            initializeTimetablesData();
        }
    }

    // Listen for admin mock data initialization
    if (window.addEventListener) {
        window.addEventListener('shikola:admin-mock-data-initialized', function(event) {
            console.log('Admin mock data initialized, loading timetables...');
            loadTimetablesData();
        });
    }

    // Auto-refresh data every 60 seconds
    setInterval(() => {
        if (window.ShikolaAdminMockData) {
            loadTimetablesData();
        }
    }, 60000);

    // Initialize
    init();

})();
