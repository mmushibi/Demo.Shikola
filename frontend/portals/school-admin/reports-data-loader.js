/*
Reports Data Loader for School Admin Portal
Populates reports page with mock data from admin-mock-data.js
*/

(function() {
    'use strict';

    // Initialize reports page with mock data
    function initializeReportsData() {
        console.log('Loading reports data...');
        
        // Wait for admin mock data to be available
        const checkData = setInterval(() => {
            if (window.ShikolaAdminMockData) {
                clearInterval(checkData);
                loadReportsData();
            }
        }, 100);

        // Timeout after 5 seconds
        setTimeout(() => {
            clearInterval(checkData);
            console.warn('Admin mock data not available, using fallback values');
            loadFallbackData();
        }, 5000);
    }

    function loadReportsData() {
        try {
            const reportsData = window.ShikolaAdminMockData.getReportsData();
            const pupils = window.ShikolaAdminMockData.getPupils();
            const employees = window.ShikolaAdminMockData.getEmployees();
            const classes = window.ShikolaAdminMockData.getClasses();
            const examResults = window.ShikolaAdminMockData.getExamResults();
            const financialRecords = window.ShikolaAdminMockData.getFinancialRecords();

            // Update enrollment reports
            updateEnrollmentReports(reportsData.enrollment, classes);
            
            // Update academic performance reports
            updateAcademicReports(reportsData.academic, examResults);
            
            // Update financial reports
            updateFinancialReports(reportsData.financial, financialRecords);
            
            // Update staff reports
            updateStaffReports(reportsData.staff, employees);
            
            // Setup report interactions
            setupReportInteractions();
            
            console.log('Reports data loaded successfully');
        } catch (error) {
            console.error('Error loading reports data:', error);
            loadFallbackData();
        }
    }

    function updateEnrollmentReports(enrollmentData, classes) {
        // Update enrollment statistics
        updateStatElement('[data-stat="total-pupils"]', enrollmentData.totalPupils);
        updateStatElement('[data-stat="male-pupils"]', enrollmentData.malePupils);
        updateStatElement('[data-stat="female-pupils"]', enrollmentData.femalePupils);
        updateStatElement('[data-stat="new-admissions"]', enrollmentData.newAdmissions);
        updateStatElement('[data-stat="transfers"]', enrollmentData.transfers);
        updateStatElement('[data-stat="graduations"]', enrollmentData.graduations);

        // Create enrollment chart
        createEnrollmentChart(enrollmentData);
        
        // Create class distribution chart
        createClassDistributionChart(classes);
    }

    function updateAcademicReports(academicData, examResults) {
        // Update academic statistics
        updateStatElement('[data-stat="average-attendance"]', Math.round(academicData.averageAttendance) + '%');
        updateStatElement('[data-stat="average-grade"]', Math.round(academicData.averageGrade) + '%');
        updateStatElement('[data-stat="pass-rate"]', Math.round(academicData.passRate) + '%');
        updateStatElement('[data-stat="failure-rate"]', Math.round(academicData.failureRate) + '%');
        updateStatElement('[data-stat="top-class"]', academicData.topPerformingClass);
        updateStatElement('[data-stat="needs-improvement"]', academicData.needsImprovement);

        // Create academic performance chart
        createAcademicPerformanceChart(academicData);
        
        // Create grade distribution chart
        createGradeDistributionChart(examResults);
    }

    function updateFinancialReports(financialData, financialRecords) {
        // Update financial statistics
        updateStatElement('[data-stat="total-revenue"]', 'K ' + financialData.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }));
        updateStatElement('[data-stat="total-expenses"]', 'K ' + financialData.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }));
        updateStatElement('[data-stat="net-profit"]', 'K ' + financialData.netProfit.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }));
        updateStatElement('[data-stat="fees-collected"]', 'K ' + financialData.feesCollected.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }));
        updateStatElement('[data-stat="fees-outstanding"]', 'K ' + financialData.feesOutstanding.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }));
        updateStatElement('[data-stat="salary-expenses"]', 'K ' + financialData.salaryExpenses.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }));

        // Create financial chart
        createFinancialChart(financialData);
        
        // Create expense breakdown chart
        createExpenseBreakdownChart(financialRecords);
    }

    function updateStaffReports(staffData, employees) {
        // Update staff statistics
        updateStatElement('[data-stat="total-employees"]', staffData.totalEmployees);
        updateStatElement('[data-stat="teaching-staff"]', staffData.teachingStaff);
        updateStatElement('[data-stat="non-teaching-staff"]', staffData.nonTeachingStaff);
        updateStatElement('[data-stat="average-experience"]', Math.round(staffData.averageExperience) + ' years');
        updateStatElement('[data-stat="training-hours"]', staffData.trainingHours);

        // Create staff composition chart
        createStaffCompositionChart(staffData);
        
        // Create experience distribution chart
        createExperienceDistributionChart(employees);
    }

    function createEnrollmentChart(enrollmentData) {
        const container = document.querySelector('[data-chart="enrollment"]');
        if (!container) return;

        const data = [
            { label: 'Male', value: enrollmentData.malePupils, color: '#3b82f6' },
            { label: 'Female', value: enrollmentData.femalePupils, color: '#ec4899' }
        ];

        const html = `
            <div class="space-y-4">
                <div class="flex items-center justify-between">
                    <span class="text-sm font-medium text-slate-700">Gender Distribution</span>
                    <span class="text-xs text-slate-400">Total: ${enrollmentData.totalPupils}</span>
                </div>
                <div class="space-y-2">
                    ${data.map(item => `
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-2">
                                <div class="w-3 h-3 rounded-full" style="background-color: ${item.color}"></div>
                                <span class="text-sm text-slate-600">${item.label}</span>
                            </div>
                            <span class="text-sm font-medium text-slate-800">${item.value}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="w-full bg-slate-100 rounded-full h-4 overflow-hidden">
                    ${data.map(item => `
                        <div class="h-full float-left" style="width: ${(item.value / enrollmentData.totalPupils) * 100}%; background-color: ${item.color}"></div>
                    `).join('')}
                </div>
            </div>
        `;

        container.innerHTML = html;
    }

    function createClassDistributionChart(classes) {
        const container = document.querySelector('[data-chart="class-distribution"]');
        if (!container) return;

        // Group classes by grade level
        const gradeGroups = {};
        classes.forEach(cls => {
            const grade = `Grade ${cls.gradeLevel}`;
            if (!gradeGroups[grade]) {
                gradeGroups[grade] = 0;
            }
            gradeGroups[grade] += cls.enrolled;
        });

        const data = Object.entries(gradeGroups)
            .sort((a, b) => parseInt(a[0].match(/\d+/)[0]) - parseInt(b[0].match(/\d+/)[0]))
            .slice(0, 6); // Show top 6 grades

        const maxEnrollment = Math.max(...data.map(d => d[1]));

        const html = `
            <div class="space-y-4">
                <div class="text-sm font-medium text-slate-700">Enrollment by Grade</div>
                <div class="space-y-2">
                    ${data.map(([grade, enrollment]) => `
                        <div class="space-y-1">
                            <div class="flex items-center justify-between">
                                <span class="text-xs text-slate-600">${grade}</span>
                                <span class="text-xs font-medium text-slate-800">${enrollment} pupils</span>
                            </div>
                            <div class="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                <div class="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-500" 
                                     style="width: ${(enrollment / maxEnrollment) * 100}%"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        container.innerHTML = html;
    }

    function createAcademicPerformanceChart(academicData) {
        const container = document.querySelector('[data-chart="academic-performance"]');
        if (!container) return;

        const data = [
            { label: 'Pass Rate', value: academicData.passRate, color: '#10b981' },
            { label: 'Failure Rate', value: academicData.failureRate, color: '#ef4444' }
        ];

        const html = `
            <div class="space-y-4">
                <div class="text-sm font-medium text-slate-700">Academic Performance</div>
                <div class="grid grid-cols-2 gap-4">
                    ${data.map(item => `
                        <div class="text-center p-4 bg-slate-50 rounded-lg">
                            <div class="text-2xl font-bold" style="color: ${item.color}">${Math.round(item.value)}%</div>
                            <div class="text-xs text-slate-400 mt-1">${item.label}</div>
                        </div>
                    `).join('')}
                </div>
                <div class="text-xs text-slate-400">
                    Top Class: ${academicData.topPerformingClass}<br>
                    Needs Improvement: ${academicData.needsImprovement}
                </div>
            </div>
        `;

        container.innerHTML = html;
    }

    function createGradeDistributionChart(examResults) {
        const container = document.querySelector('[data-chart="grade-distribution"]');
        if (!container) return;

        // Count grades
        const gradeCounts = {};
        examResults.forEach(result => {
            const grade = result.grade;
            gradeCounts[grade] = (gradeCounts[grade] || 0) + 1;
        });

        const data = Object.entries(gradeCounts)
            .sort((a, b) => {
                const gradeOrder = ['A+', 'A', 'B', 'C', 'D', 'F'];
                return gradeOrder.indexOf(a[0]) - gradeOrder.indexOf(b[0]);
            });

        const total = Object.values(gradeCounts).reduce((sum, count) => sum + count, 0);

        const html = `
            <div class="space-y-4">
                <div class="text-sm font-medium text-slate-700">Grade Distribution</div>
                <div class="space-y-2">
                    ${data.map(([grade, count]) => {
                        const percentage = (count / total) * 100;
                        const color = getGradeColor(grade);
                        return `
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-2">
                                    <div class="w-3 h-3 rounded-full bg-${color}-500"></div>
                                    <span class="text-sm text-slate-600">Grade ${grade}</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <span class="text-sm font-medium text-slate-800">${count}</span>
                                    <span class="text-xs text-slate-400">(${Math.round(percentage)}%)</span>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;

        container.innerHTML = html;
    }

    function createFinancialChart(financialData) {
        const container = document.querySelector('[data-chart="financial"]');
        if (!container) return;

        const data = [
            { label: 'Revenue', value: financialData.totalRevenue, color: '#10b981' },
            { label: 'Expenses', value: financialData.totalExpenses, color: '#ef4444' },
            { label: 'Net Profit', value: financialData.netProfit, color: '#3b82f6' }
        ];

        const maxValue = Math.max(...data.map(d => d.value));

        const html = `
            <div class="space-y-4">
                <div class="text-sm font-medium text-slate-700">Financial Overview</div>
                <div class="space-y-3">
                    ${data.map(item => `
                        <div class="space-y-1">
                            <div class="flex items-center justify-between">
                                <span class="text-sm text-slate-600">${item.label}</span>
                                <span class="text-sm font-medium text-slate-800">K ${item.value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
                            </div>
                            <div class="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                                <div class="h-full bg-${item.color}-500 rounded-full transition-all duration-500" 
                                     style="width: ${(item.value / maxValue) * 100}%"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        container.innerHTML = html;
    }

    function createExpenseBreakdownChart(financialRecords) {
        const container = document.querySelector('[data-chart="expense-breakdown"]');
        if (!container) return;

        // Group expenses by category
        const expensesByCategory = {};
        financialRecords
            .filter(record => record.type === 'expense')
            .forEach(record => {
                const category = record.category;
                expensesByCategory[category] = (expensesByCategory[category] || 0) + record.amount;
            });

        const data = Object.entries(expensesByCategory)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5); // Show top 5 expense categories

        const totalExpenses = Object.values(expensesByCategory).reduce((sum, amount) => sum + amount, 0);

        const html = `
            <div class="space-y-4">
                <div class="text-sm font-medium text-slate-700">Top Expense Categories</div>
                <div class="space-y-2">
                    ${data.map(([category, amount]) => {
                        const percentage = (amount / totalExpenses) * 100;
                        return `
                            <div class="flex items-center justify-between">
                                <span class="text-sm text-slate-600">${category}</span>
                                <div class="flex items-center gap-2">
                                    <span class="text-sm font-medium text-slate-800">K ${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
                                    <span class="text-xs text-slate-400">(${Math.round(percentage)}%)</span>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;

        container.innerHTML = html;
    }

    function createStaffCompositionChart(staffData) {
        const container = document.querySelector('[data-chart="staff-composition"]');
        if (!container) return;

        const data = [
            { label: 'Teaching Staff', value: staffData.teachingStaff, color: '#3b82f6' },
            { label: 'Non-Teaching Staff', value: staffData.nonTeachingStaff, color: '#8b5cf6' }
        ];

        const html = `
            <div class="space-y-4">
                <div class="text-sm font-medium text-slate-700">Staff Composition</div>
                <div class="grid grid-cols-2 gap-4">
                    ${data.map(item => `
                        <div class="text-center p-4 bg-slate-50 rounded-lg">
                            <div class="text-2xl font-bold" style="color: ${item.color}">${item.value}</div>
                            <div class="text-xs text-slate-400 mt-1">${item.label}</div>
                        </div>
                    `).join('')}
                </div>
                <div class="text-xs text-slate-400 text-center">
                    Average Experience: ${Math.round(staffData.averageExperience)} years<br>
                    Training Hours: ${staffData.trainingHours}
                </div>
            </div>
        `;

        container.innerHTML = html;
    }

    function createExperienceDistributionChart(employees) {
        const container = document.querySelector('[data-chart="experience-distribution"]');
        if (!container) return;

        // Group employees by experience
        const experienceGroups = {
            '0-2 years': 0,
            '3-5 years': 0,
            '6-10 years': 0,
            '10+ years': 0
        };

        employees.forEach(employee => {
            const experience = getYearsOfExperience(employee.startDate);
            if (experience <= 2) experienceGroups['0-2 years']++;
            else if (experience <= 5) experienceGroups['3-5 years']++;
            else if (experience <= 10) experienceGroups['6-10 years']++;
            else experienceGroups['10+ years']++;
        });

        const data = Object.entries(experienceGroups);

        const html = `
            <div class="space-y-4">
                <div class="text-sm font-medium text-slate-700">Experience Distribution</div>
                <div class="space-y-2">
                    ${data.map(([range, count]) => {
                        const percentage = (count / employees.length) * 100;
                        return `
                            <div class="flex items-center justify-between">
                                <span class="text-sm text-slate-600">${range}</span>
                                <div class="flex items-center gap-2">
                                    <span class="text-sm font-medium text-slate-800">${count}</span>
                                    <span class="text-xs text-slate-400">(${Math.round(percentage)}%)</span>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;

        container.innerHTML = html;
    }

    function getGradeColor(grade) {
        switch (grade) {
            case 'A+': return 'green';
            case 'A': return 'blue';
            case 'B': return 'yellow';
            case 'C': return 'orange';
            case 'D': return 'red';
            case 'F': return 'slate';
            default: return 'slate';
        }
    }

    function getYearsOfExperience(startDate) {
        const start = new Date(startDate);
        const now = new Date();
        return Math.floor((now - start) / (365.25 * 24 * 60 * 60 * 1000));
    }

    function updateStatElement(selector, value) {
        const element = document.querySelector(selector);
        if (element) {
            element.textContent = value;
        }
    }

    function setupReportInteractions() {
        // Add export functionality
        setupExportButtons();
        
        // Add date range filters
        setupDateRangeFilters();
        
        // Add report type filters
        setupReportTypeFilters();
    }

    function setupExportButtons() {
        const exportButtons = document.querySelectorAll('[data-export]');
        exportButtons.forEach(button => {
            button.addEventListener('click', function() {
                const exportType = this.getAttribute('data-export');
                exportReport(exportType);
            });
        });
    }

    function setupDateRangeFilters() {
        const startDateInput = document.querySelector('input[name="start-date"]');
        const endDateInput = document.querySelector('input[name="end-date"]');
        const applyButton = document.querySelector('button[data-action="apply-date-range"]');
        
        if (startDateInput && endDateInput && applyButton) {
            applyButton.addEventListener('click', function() {
                const startDate = startDateInput.value;
                const endDate = endDateInput.value;
                applyDateRangeFilter(startDate, endDate);
            });
        }
    }

    function setupReportTypeFilters() {
        const filterButtons = document.querySelectorAll('[data-report-type]');
        filterButtons.forEach(button => {
            button.addEventListener('click', function() {
                const reportType = this.getAttribute('data-report-type');
                applyReportTypeFilter(reportType);
                
                // Update active state
                filterButtons.forEach(btn => btn.classList.remove('active', 'bg-orange-100', 'text-orange-500'));
                this.classList.add('active', 'bg-orange-100', 'text-orange-500');
            });
        });
    }

    function exportReport(exportType) {
        console.log('Exporting report:', exportType);
        // This would typically generate and download a report
        alert(`Export ${exportType} report functionality - would generate PDF/Excel file`);
    }

    function applyDateRangeFilter(startDate, endDate) {
        console.log('Applying date range filter:', startDate, endDate);
        // This would filter the displayed data based on date range
        alert(`Apply date range filter: ${startDate} to ${endDate}`);
    }

    function applyReportTypeFilter(reportType) {
        console.log('Applying report type filter:', reportType);
        // This would show/hide relevant report sections
        alert(`Apply report type filter: ${reportType}`);
    }

    function loadFallbackData() {
        console.log('Loading fallback reports data...');
        
        // Show empty state
        const container = document.querySelector('main .flex-1') || document.querySelector('.space-y-6');
        if (container) {
            container.innerHTML = `
                <div class="text-center py-12">
                    <div class="text-slate-400 mb-4">
                        <i class="fas fa-chart-line text-6xl"></i>
                    </div>
                    <h3 class="text-lg font-medium text-slate-800 mb-2">No Report Data Available</h3>
                    <p class="text-slate-400 mb-6">Generate reports to see analytics and insights here.</p>
                    <button class="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
                        <i class="fas fa-chart-bar mr-2"></i>Generate Reports
                    </button>
                </div>
            `;
        }
    }

    // Global functions for report interactions
    window.generateReport = function(reportType) {
        console.log('Generate report:', reportType);
        alert(`Generate ${reportType} report functionality - would create detailed report`);
    };

    window.printReport = function() {
        console.log('Print report');
        window.print();
    };

    // Initialize when DOM is ready
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initializeReportsData);
        } else {
            initializeReportsData();
        }
    }

    // Listen for admin mock data initialization
    if (window.addEventListener) {
        window.addEventListener('shikola:admin-mock-data-initialized', function(event) {
            console.log('Admin mock data initialized, loading reports...');
            loadReportsData();
        });
    }

    // Auto-refresh data every 60 seconds
    setInterval(() => {
        if (window.ShikolaAdminMockData) {
            loadReportsData();
        }
    }, 60000);

    // Initialize
    init();

})();
