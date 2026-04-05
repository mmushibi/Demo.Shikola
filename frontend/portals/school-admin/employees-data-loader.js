/*
Employees Data Loader for School Admin Portal
Populates employees page with mock data from admin-mock-data.js
*/

(function() {
    'use strict';

    // Initialize employees page with mock data
    function initializeEmployeesData() {
        console.log('Loading employees data...');
        
        // Wait for admin mock data to be available
        const checkData = setInterval(() => {
            if (window.ShikolaAdminMockData) {
                clearInterval(checkData);
                loadEmployeesData();
            }
        }, 100);

        // Timeout after 5 seconds
        setTimeout(() => {
            clearInterval(checkData);
            console.warn('Admin mock data not available, using fallback values');
            loadFallbackData();
        }, 5000);
    }

    function loadEmployeesData() {
        try {
            const employees = window.ShikolaAdminMockData.getEmployees();

            // Update employees table
            updateEmployeesTable(employees);
            
            // Update employee statistics
            updateEmployeeStatistics(employees);
            
            // Setup employee interactions
            setupEmployeeInteractions();
            
            console.log('Employees data loaded successfully');
        } catch (error) {
            console.error('Error loading employees data:', error);
            loadFallbackData();
        }
    }

    function updateEmployeesTable(employees) {
        // Find the employees table container
        let tableContainer = document.querySelector('[data-list="employees"]') || 
                           document.querySelector('table tbody') ||
                           document.querySelector('.overflow-x-auto') ||
                           document.querySelector('main .flex-1 .space-y-6');

        if (!tableContainer) {
            console.warn('Employees table container not found');
            return;
        }

        // Create employees table HTML
        let html = '';
        employees.forEach(employee => {
            const statusColor = getStatusColor(employee.status);
            const genderColor = employee.gender === 'Male' ? 'blue' : 'pink';
            const experienceColor = getExperienceColor(employee.age);

            html += `
                <tr class="hover:bg-slate-50 transition-colors employee-row" data-employee-id="${employee.id}">
                    <td class="px-4 py-3">
                        <div class="flex items-center gap-3">
                            <div class="h-8 w-8 rounded-full bg-${genderColor}-100 text-${genderColor}-600 flex items-center justify-center text-xs font-medium">
                                ${employee.firstName.charAt(0)}${employee.lastName.charAt(0)}
                            </div>
                            <div>
                                <div class="text-sm font-medium text-slate-800">${employee.fullName}</div>
                                <div class="text-xs text-slate-400">${employee.staffId}</div>
                            </div>
                        </div>
                    </td>
                    <td class="px-4 py-3">
                        <div class="text-sm text-slate-800">${employee.position}</div>
                        <div class="text-xs text-slate-400">${employee.department}</div>
                    </td>
                    <td class="px-4 py-3">
                        <div class="text-sm text-slate-800">${employee.gender}</div>
                        <div class="text-xs text-slate-400">${employee.age} years</div>
                    </td>
                    <td class="px-4 py-3">
                        <div class="text-sm text-slate-800">${employee.email}</div>
                        <div class="text-xs text-slate-400">${employee.phone}</div>
                    </td>
                    <td class="px-4 py-3">
                        <div class="text-sm text-slate-800">${employee.qualification}</div>
                        <div class="text-xs text-slate-400">${employee.specialization}</div>
                    </td>
                    <td class="px-4 py-3">
                        <div class="text-sm text-slate-800">K ${employee.salary.toLocaleString()}</div>
                        <div class="text-xs text-slate-400">${employee.employmentType}</div>
                    </td>
                    <td class="px-4 py-3">
                        <div class="text-sm text-slate-800">${employee.startDate}</div>
                        <div class="text-xs text-${experienceColor}-600">${getYearsOfExperience(employee.startDate)} years</div>
                    </td>
                    <td class="px-4 py-3">
                        <span class="px-2 py-1 text-xs rounded-full bg-${statusColor}-100 text-${statusColor}-600">
                            ${employee.status}
                        </span>
                    </td>
                    <td class="px-4 py-3">
                        <div class="flex items-center gap-2">
                            <button class="text-blue-500 hover:text-blue-700 text-sm font-medium" onclick="editEmployee('${employee.id}')">
                                Edit
                            </button>
                            <button class="text-slate-500 hover:text-slate-700 text-sm" onclick="viewEmployeeDetails('${employee.id}')">
                                View
                            </button>
                            <button class="text-red-500 hover:text-red-700 text-sm" onclick="deleteEmployee('${employee.id}')">
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
                                <th class="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Employee</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Position</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Gender/Age</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Contact</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Qualification</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Salary</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Experience</th>
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

    function updateEmployeeStatistics(employees) {
        // Calculate statistics
        const totalEmployees = employees.length;
        const activeEmployees = employees.filter(e => e.status === 'Active').length;
        const teachingStaff = employees.filter(e => e.position.includes('Teacher')).length;
        const nonTeachingStaff = employees.filter(e => !e.position.includes('Teacher')).length;
        const maleEmployees = employees.filter(e => e.gender === 'Male').length;
        const femaleEmployees = employees.filter(e => e.gender === 'Female').length;
        const averageExperience = employees.reduce((sum, e) => sum + getYearsOfExperience(e.startDate), 0) / employees.length;
        const totalSalaryBill = employees.reduce((sum, e) => sum + e.salary, 0);

        // Update statistics elements
        updateStatElement('[data-stat="total-employees"]', totalEmployees);
        updateStatElement('[data-stat="active-employees"]', activeEmployees);
        updateStatElement('[data-stat="teaching-staff"]', teachingStaff);
        updateStatElement('[data-stat="non-teaching-staff"]', nonTeachingStaff);
        updateStatElement('[data-stat="male-employees"]', maleEmployees);
        updateStatElement('[data-stat="female-employees"]', femaleEmployees);
        updateStatElement('[data-stat="average-experience"]', Math.round(averageExperience) + ' years');
        updateStatElement('[data-stat="total-salary-bill"]', 'K ' + totalSalaryBill.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }));
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
            case 'On Leave': return 'yellow';
            case 'Suspended': return 'orange';
            case 'Terminated': return 'red';
            case 'Contract': return 'blue';
            default: return 'slate';
        }
    }

    function getExperienceColor(experience) {
        if (experience >= 10) return 'green';
        if (experience >= 5) return 'yellow';
        if (experience >= 2) return 'orange';
        return 'red';
    }

    function getYearsOfExperience(startDate) {
        const start = new Date(startDate);
        const now = new Date();
        return Math.floor((now - start) / (365.25 * 24 * 60 * 60 * 1000));
    }

    function setupEmployeeInteractions() {
        // Add click handlers to employee rows
        document.querySelectorAll('.employee-row').forEach(row => {
            row.addEventListener('click', function(e) {
                // Don't trigger if clicking on buttons
                if (e.target.tagName === 'BUTTON') {
                    return;
                }
                
                const employeeId = this.getAttribute('data-employee-id');
                viewEmployeeDetails(employeeId);
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
        const searchInput = document.querySelector('input[placeholder*="Search employees"], input[placeholder*="search"]');
        if (!searchInput) return;

        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            filterEmployees(searchTerm);
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
                sortEmployees(sortBy);
                
                // Update sort indicator
                document.querySelectorAll('th').forEach(th => th.classList.remove('text-orange-500'));
                this.classList.add('text-orange-500');
            });
        });
    }

    function filterEmployees(searchTerm) {
        const employeeRows = document.querySelectorAll('.employee-row');
        employeeRows.forEach(row => {
            const text = row.textContent.toLowerCase();
            if (text.includes(searchTerm)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }

    function applyFilter(filter) {
        const employeeRows = document.querySelectorAll('.employee-row');
        employeeRows.forEach(row => {
            const statusCell = row.querySelector('td:nth-child(8) span');
            const status = statusCell?.textContent?.trim();
            const shouldShow = filter === 'All' || status === filter;
            row.style.display = shouldShow ? '' : 'none';
        });
    }

    function sortEmployees(sortBy) {
        const tbody = document.querySelector('tbody');
        const rows = Array.from(tbody.querySelectorAll('.employee-row'));
        
        rows.sort((a, b) => {
            let aValue, bValue;
            
            switch (sortBy) {
                case 'name':
                    aValue = a.querySelector('td:first-child .text-sm').textContent;
                    bValue = b.querySelector('td:first-child .text-sm').textContent;
                    break;
                case 'position':
                    aValue = a.querySelector('td:nth-child(2) .text-sm').textContent;
                    bValue = b.querySelector('td:nth-child(2) .text-sm').textContent;
                    break;
                case 'salary':
                    aValue = parseInt(a.querySelector('td:nth-child(6) .text-sm').textContent.replace(/[^\d]/g, ''));
                    bValue = parseInt(b.querySelector('td:nth-child(6) .text-sm').textContent.replace(/[^\d]/g, ''));
                    break;
                case 'experience':
                    aValue = parseInt(a.querySelector('td:nth-child(7) .text-xs').textContent);
                    bValue = parseInt(b.querySelector('td:nth-child(7) .text-xs').textContent);
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
        console.log('Loading fallback employees data...');
        
        // Show empty state
        const container = document.querySelector('.overflow-x-auto') || document.querySelector('main .flex-1');
        if (container) {
            container.innerHTML = `
                <div class="text-center py-12">
                    <div class="text-slate-400 mb-4">
                        <i class="fas fa-users text-6xl"></i>
                    </div>
                    <h3 class="text-lg font-medium text-slate-800 mb-2">No Employees Found</h3>
                    <p class="text-slate-400 mb-6">Get started by adding your first employee.</p>
                    <button class="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
                        <i class="fas fa-plus mr-2"></i>Add Employee
                    </button>
                </div>
            `;
        }

        // Set default statistics
        updateStatElement('[data-stat="total-employees"]', '0');
        updateStatElement('[data-stat="active-employees"]', '0');
        updateStatElement('[data-stat="teaching-staff"]', '0');
        updateStatElement('[data-stat="non-teaching-staff"]', '0');
        updateStatElement('[data-stat="male-employees"]', '0');
        updateStatElement('[data-stat="female-employees"]', '0');
        updateStatElement('[data-stat="average-experience"]', '0 years');
        updateStatElement('[data-stat="total-salary-bill"]', 'K 0');
    }

    // Global functions for employee interactions
    window.editEmployee = function(employeeId) {
        console.log('Edit employee:', employeeId);
        // This would typically open a modal or navigate to edit page
        alert(`Edit employee functionality for employee ID: ${employeeId}`);
    };

    window.viewEmployeeDetails = function(employeeId) {
        console.log('View employee details:', employeeId);
        // This would typically navigate to employee details page
        const employees = window.ShikolaAdminMockData?.getEmployees() || [];
        const employee = employees.find(e => e.id === employeeId);
        if (employee) {
            const details = `
Employee Details:

Name: ${employee.fullName}
Staff ID: ${employee.staffId}
Position: ${employee.position}
Department: ${employee.department}
Gender: ${employee.gender}
Age: ${employee.age}
Email: ${employee.email}
Phone: ${employee.phone}
Qualification: ${employee.qualification}
Specialization: ${employee.specialization}
Salary: K ${employee.salary.toLocaleString()}
Employment Type: ${employee.employmentType}
Start Date: ${employee.startDate}
Status: ${employee.status}
NRC: ${employee.nrcNumber}
Bank: ${employee.bankName}
Account: ${employee.bankAccount}
            `;
            alert(details.trim());
        }
    };

    window.deleteEmployee = function(employeeId) {
        console.log('Delete employee:', employeeId);
        // This would typically show a confirmation dialog
        if (confirm('Are you sure you want to delete this employee?')) {
            alert(`Delete employee functionality for employee ID: ${employeeId}`);
        }
    };

    // Initialize when DOM is ready
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initializeEmployeesData);
        } else {
            initializeEmployeesData();
        }
    }

    // Listen for admin mock data initialization
    if (window.addEventListener) {
        window.addEventListener('shikola:all-mock-data-initialized', function(event) {
            console.log('Admin mock data initialized, loading employees...');
            loadEmployeesData();
        });
    }

    // Auto-refresh data every 60 seconds
    setInterval(() => {
        if (window.ShikolaAdminMockData) {
            loadEmployeesData();
        }
    }, 60000);

    // Initialize
    init();

})();
