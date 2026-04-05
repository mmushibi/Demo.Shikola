/*
Pupils Data Loader for School Admin Portal
Populates pupils page with mock data from admin-mock-data.js
*/

(function() {
    'use strict';

    // Initialize pupils page with mock data
    function initializePupilsData() {
        console.log('Loading pupils data...');
        
        // Wait for admin mock data to be available
        const checkData = setInterval(() => {
            if (window.ShikolaAdminMockData) {
                clearInterval(checkData);
                loadPupilsData();
            }
        }, 100);

        // Timeout after 5 seconds
        setTimeout(() => {
            clearInterval(checkData);
            console.warn('Admin mock data not available, using fallback values');
            loadFallbackData();
        }, 5000);
    }

    function loadPupilsData() {
        try {
            const pupils = window.ShikolaAdminMockData.getPupils();
            const classes = window.ShikolaAdminMockData.getClasses();

            // Update pupils table
            updatePupilsTable(pupils, classes);
            
            // Update pupil statistics
            updatePupilStatistics(pupils);
            
            // Setup pupil interactions
            setupPupilInteractions();
            
            console.log('Pupils data loaded successfully');
        } catch (error) {
            console.error('Error loading pupils data:', error);
            loadFallbackData();
        }
    }

    function updatePupilsTable(pupils, classes) {
        // Find the pupils table container
        let tableContainer = document.querySelector('[data-list="pupils"]') || 
                           document.querySelector('table tbody') ||
                           document.querySelector('.overflow-x-auto') ||
                           document.querySelector('main .flex-1 .space-y-6');

        if (!tableContainer) {
            console.warn('Pupils table container not found');
            return;
        }

        // Create pupils table HTML
        let html = '';
        pupils.forEach(pupil => {
            const statusColor = getStatusColor(pupil.status);
            const genderColor = pupil.gender === 'Male' ? 'blue' : 'pink';
            const attendanceColor = getAttendanceColor(pupil.attendanceRate);
            const gradeColor = getGradeColor(pupil.averageGrade);

            html += `
                <tr class="hover:bg-slate-50 transition-colors pupil-row" data-pupil-id="${pupil.id}">
                    <td class="px-4 py-3">
                        <div class="flex items-center gap-3">
                            <div class="h-8 w-8 rounded-full bg-${genderColor}-100 text-${genderColor}-600 flex items-center justify-center text-xs font-medium">
                                ${pupil.firstName.charAt(0)}${pupil.lastName.charAt(0)}
                            </div>
                            <div>
                                <div class="text-sm font-medium text-slate-800">${pupil.fullName}</div>
                                <div class="text-xs text-slate-400">${pupil.admissionNo}</div>
                            </div>
                        </div>
                    </td>
                    <td class="px-4 py-3">
                        <div class="text-sm text-slate-800">${pupil.className}</div>
                        <div class="text-xs text-slate-400">Roll No: ${pupil.rollNumber}</div>
                    </td>
                    <td class="px-4 py-3">
                        <div class="text-sm text-slate-800">${pupil.gender}</div>
                        <div class="text-xs text-slate-400">${pupil.age} years</div>
                    </td>
                    <td class="px-4 py-3">
                        <div class="text-sm text-slate-800">${pupil.parentName}</div>
                        <div class="text-xs text-slate-400">${pupil.parentPhone}</div>
                    </td>
                    <td class="px-4 py-3">
                        <div class="flex items-center gap-2">
                            <span class="text-sm font-medium text-${attendanceColor}-600">${pupil.attendanceRate}%</span>
                            <div class="w-12 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div class="h-full bg-${attendanceColor}-500 rounded-full transition-all duration-300" 
                                     style="width: ${pupil.attendanceRate}%"></div>
                            </div>
                        </div>
                    </td>
                    <td class="px-4 py-3">
                        <div class="flex items-center gap-2">
                            <span class="text-sm font-medium text-${gradeColor}-600">${pupil.averageGrade}%</span>
                            <div class="w-12 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div class="h-full bg-${gradeColor}-500 rounded-full transition-all duration-300" 
                                     style="width: ${pupil.averageGrade}%"></div>
                            </div>
                        </div>
                    </td>
                    <td class="px-4 py-3">
                        <span class="px-2 py-1 text-xs rounded-full bg-${statusColor}-100 text-${statusColor}-600">
                            ${pupil.status}
                        </span>
                    </td>
                    <td class="px-4 py-3">
                        <div class="flex items-center gap-2">
                            <button class="text-blue-500 hover:text-blue-700 text-sm font-medium" onclick="editPupil('${pupil.id}')">
                                Edit
                            </button>
                            <button class="text-slate-500 hover:text-slate-700 text-sm" onclick="viewPupilDetails('${pupil.id}')">
                                View
                            </button>
                            <button class="text-red-500 hover:text-red-700 text-sm" onclick="deletePupil('${pupil.id}')">
                                Delete
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });

        // If we found a table body, update it
        if (tableContainer.tagName === 'TBODY') {
            tableContainer.innerHTML = html;
        } else {
            // Create a new table structure
            const tableHtml = `
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead class="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th class="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Pupil</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Class</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Gender/Age</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Parent</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Attendance</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Grade</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Status</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-slate-100">
                            ${html}
                        </tbody>
                    </table>
                </div>
            `;
            
            // Replace or append to the found container
            if (tableContainer.children.length > 0) {
                tableContainer.innerHTML = tableHtml;
            } else {
                tableContainer.innerHTML = tableHtml;
            }
        }
    }

    function updatePupilStatistics(pupils) {
        // Calculate statistics
        const totalPupils = pupils.length;
        const activePupils = pupils.filter(p => p.status === 'Active').length;
        const malePupils = pupils.filter(p => p.gender === 'Male').length;
        const femalePupils = pupils.filter(p => p.gender === 'Female').length;
        const averageAttendance = pupils.reduce((sum, p) => sum + p.attendanceRate, 0) / pupils.length;
        const averageGrade = pupils.reduce((sum, p) => sum + p.averageGrade, 0) / pupils.length;
        const outstandingFees = pupils.reduce((sum, p) => sum + p.feesBalance, 0);

        // Update statistics elements
        updateStatElement('[data-stat="total-pupils"]', totalPupils);
        updateStatElement('[data-stat="active-pupils"]', activePupils);
        updateStatElement('[data-stat="male-pupils"]', malePupils);
        updateStatElement('[data-stat="female-pupils"]', femalePupils);
        updateStatElement('[data-stat="average-attendance"]', Math.round(averageAttendance) + '%');
        updateStatElement('[data-stat="average-grade"]', Math.round(averageGrade) + '%');
        updateStatElement('[data-stat="outstanding-fees"]', 'K ' + outstandingFees.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }));
    }

    function updateStatElement(selector, value) {
        const element = document.querySelector(selector);
        if (element) {
            element.textContent = value;
        }
    }

    function getStatusColor(status) {
        switch (status) {
            case 'Active': return 'green';
            case 'Transferred': return 'blue';
            case 'Graduated': return 'purple';
            case 'Suspended': return 'yellow';
            case 'Inactive': return 'slate';
            default: return 'slate';
        }
    }

    function getAttendanceColor(rate) {
        if (rate >= 90) return 'green';
        if (rate >= 75) return 'yellow';
        if (rate >= 60) return 'orange';
        return 'red';
    }

    function getGradeColor(grade) {
        if (grade >= 80) return 'green';
        if (grade >= 70) return 'yellow';
        if (grade >= 60) return 'orange';
        return 'red';
    }

    function setupPupilInteractions() {
        // Add click handlers to pupil rows
        document.querySelectorAll('.pupil-row').forEach(row => {
            row.addEventListener('click', function(e) {
                // Don't trigger if clicking on buttons
                if (e.target.tagName === 'BUTTON') {
                    return;
                }
                
                const pupilId = this.getAttribute('data-pupil-id');
                viewPupilDetails(pupilId);
            });
        });

        // Add search functionality
        setupSearch();
        
        // Add filter functionality
        setupFilters();
        
        // Add sorting functionality
        setupSorting();
    }

    function setupSearch() {
        const searchInput = document.querySelector('input[placeholder*="Search pupils"], input[placeholder*="search"]');
        if (!searchInput) return;

        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            filterPupils(searchTerm);
        });
    }

    function setupFilters() {
        // Look for filter buttons or dropdowns
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

    function setupSorting() {
        // Look for sortable table headers
        const sortableHeaders = document.querySelectorAll('th[data-sort]');
        sortableHeaders.forEach(header => {
            header.addEventListener('click', function() {
                const sortBy = this.getAttribute('data-sort');
                sortPupils(sortBy);
                
                // Update sort indicator
                document.querySelectorAll('th').forEach(th => th.classList.remove('text-orange-500'));
                this.classList.add('text-orange-500');
            });
        });
    }

    function filterPupils(searchTerm) {
        const pupilRows = document.querySelectorAll('.pupil-row');
        pupilRows.forEach(row => {
            const text = row.textContent.toLowerCase();
            if (text.includes(searchTerm)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }

    function applyFilter(filter) {
        const pupilRows = document.querySelectorAll('.pupil-row');
        pupilRows.forEach(row => {
            const statusCell = row.querySelector('td:nth-child(7) span');
            const status = statusCell?.textContent?.trim();
            const shouldShow = filter === 'All' || status === filter;
            row.style.display = shouldShow ? '' : 'none';
        });
    }

    function sortPupils(sortBy) {
        const tbody = document.querySelector('tbody');
        const rows = Array.from(tbody.querySelectorAll('.pupil-row'));
        
        rows.sort((a, b) => {
            let aValue, bValue;
            
            switch (sortBy) {
                case 'name':
                    aValue = a.querySelector('td:first-child .text-sm').textContent;
                    bValue = b.querySelector('td:first-child .text-sm').textContent;
                    break;
                case 'class':
                    aValue = a.querySelector('td:nth-child(2) .text-sm').textContent;
                    bValue = b.querySelector('td:nth-child(2) .text-sm').textContent;
                    break;
                case 'attendance':
                    aValue = parseFloat(a.querySelector('td:nth-child(5) .text-sm').textContent);
                    bValue = parseFloat(b.querySelector('td:nth-child(5) .text-sm').textContent);
                    break;
                case 'grade':
                    aValue = parseFloat(a.querySelector('td:nth-child(6) .text-sm').textContent);
                    bValue = parseFloat(b.querySelector('td:nth-child(6) .text-sm').textContent);
                    break;
                default:
                    return 0;
            }
            
            if (typeof aValue === 'string') {
                return aValue.localeCompare(bValue);
            }
            return aValue - bValue;
        });
        
        // Re-append sorted rows
        rows.forEach(row => tbody.appendChild(row));
    }

    function loadFallbackData() {
        console.log('Loading fallback pupils data...');
        
        // Show empty state
        const container = document.querySelector('.overflow-x-auto') || document.querySelector('main .flex-1');
        if (container) {
            container.innerHTML = `
                <div class="text-center py-12">
                    <div class="text-slate-400 mb-4">
                        <i class="fas fa-user-graduate text-6xl"></i>
                    </div>
                    <h3 class="text-lg font-medium text-slate-800 mb-2">No Pupils Found</h3>
                    <p class="text-slate-400 mb-6">Get started by registering your first pupil.</p>
                    <button class="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
                        <i class="fas fa-plus mr-2"></i>Add Pupil
                    </button>
                </div>
            `;
        }

        // Set default statistics
        updateStatElement('[data-stat="total-pupils"]', '0');
        updateStatElement('[data-stat="active-pupils"]', '0');
        updateStatElement('[data-stat="male-pupils"]', '0');
        updateStatElement('[data-stat="female-pupils"]', '0');
        updateStatElement('[data-stat="average-attendance"]', '0%');
        updateStatElement('[data-stat="average-grade"]', '0%');
        updateStatElement('[data-stat="outstanding-fees"]', 'K 0');
    }

    // Global functions for pupil interactions
    window.editPupil = function(pupilId) {
        console.log('Edit pupil:', pupilId);
        // This would typically open a modal or navigate to edit page
        alert(`Edit pupil functionality for pupil ID: ${pupilId}`);
    };

    window.viewPupilDetails = function(pupilId) {
        console.log('View pupil details:', pupilId);
        // This would typically navigate to pupil details page
        const pupils = window.ShikolaAdminMockData?.getPupils() || [];
        const pupil = pupils.find(p => p.id === pupilId);
        if (pupil) {
            const details = `
Pupil Details:

Name: ${pupil.fullName}
Admission No: ${pupil.admissionNo}
Class: ${pupil.className}
Gender: ${pupil.gender}
Age: ${pupil.age}
Parent: ${pupil.parentName}
Parent Phone: ${pupil.parentPhone}
Attendance: ${pupil.attendanceRate}%
Average Grade: ${pupil.averageGrade}%
Status: ${pupil.status}
Fees Balance: K ${pupil.feesBalance.toLocaleString()}
            `;
            alert(details.trim());
        }
    };

    window.deletePupil = function(pupilId) {
        console.log('Delete pupil:', pupilId);
        // This would typically show a confirmation dialog
        if (confirm('Are you sure you want to delete this pupil?')) {
            alert(`Delete pupil functionality for pupil ID: ${pupilId}`);
        }
    };

    // Initialize when DOM is ready
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initializePupilsData);
        } else {
            initializePupilsData();
        }
    }

    // Listen for admin mock data initialization
    if (window.addEventListener) {
        window.addEventListener('shikola:admin-mock-data-initialized', function(event) {
            console.log('Admin mock data initialized, loading pupils...');
            loadPupilsData();
        });
    }

    // Auto-refresh data every 60 seconds
    setInterval(() => {
        if (window.ShikolaAdminMockData) {
            loadPupilsData();
        }
    }, 60000);

    // Initialize
    init();

})();
