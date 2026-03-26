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
 * Income Management JavaScript
 * Handles all income management functionality for the accountant portal
 */
(function() {
    'use strict';

    // Income Management State
    let incomeData = {
        incomes: [],
        categories: [],
        stats: {
            totalIncome: 0,
            tuitionFees: 0,
            otherIncome: 0,
            growthRate: 0,
            todayTotal: 0,
            monthTotal: 0,
            transactionCount: 0
        },
        loading: false,
        error: null
    };

    // Edit mode state
    let editId = null;

    // Default income categories
    const DEFAULT_CATEGORIES = [
        'Tuition Fees',
        'Registration Fees', 
        'Transport Fees',
        'Examination Fees',
        'Book Sales',
        'Uniform Sales',
        'Donations',
        'Other Income'
    ];

    /**
     * Get auth token
     */
    function getAuthToken() {
        try {
            return localStorage.getItem('authToken') || localStorage.getItem('shikola_token') || null;
        } catch (e) {
            return null;
        }
    }

    /**
     * Initialize income management
     */
    function initIncomeManagement() {
        console.log('Initializing Income Management...');
        
        // Load initial data
        loadIncomeData();
        loadIncomeCategories();
        
        // Set up event listeners
        setupEventListeners();
        
        // Set up real-time updates
        setupRealTimeUpdates();
        
        // Update UI
        updateStatCards();
        updateIncomeRecords();
    }

    /**
     * Load income data from API
     */
    async function loadIncomeData() {
        try {
            incomeData.loading = true;
            incomeData.error = null;
            
            // Build query parameters
            const params = new URLSearchParams({
                page: 1,
                pageSize: 1000 // Load more data for better statistics
            });

            const response = await fetch(`/api/incomemanagement/incomes?${params}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getAuthToken()}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.success && result.data) {
                incomeData.incomes = result.data;
            } else {
                throw new Error(result.message || 'Failed to load income data');
            }
            
            // Calculate statistics
            calculateIncomeStats();
            
        } catch (error) {
            console.error('Error loading income data:', error);
            incomeData.error = error.message;
        } finally {
            incomeData.loading = false;
            updateStatCards();
            updateIncomeRecords();
        }
    }

    /**
     * Load income categories
     */
    async function loadIncomeCategories() {
        try {
            const response = await fetch('/api/incomemanagement/categories', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getAuthToken()}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.success && result.data) {
                incomeData.categories = result.data;
            } else {
                throw new Error(result.message || 'Failed to load income categories');
            }
        } catch (error) {
            console.error('Error loading income categories:', error);
            // Load default categories as fallback
            incomeData.categories = DEFAULT_CATEGORIES;
        }
        
        updateCategorySelects();
    }

    /**
     * Calculate income statistics
     */
    function calculateIncomeStats() {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

        let totalIncome = 0;
        let tuitionFees = 0;
        let otherIncome = 0;
        let todayTotal = 0;
        let monthTotal = 0;
        let lastMonthTotal = 0;

        incomeData.incomes.forEach(income => {
            const amount = parseFloat(income.amount) || 0;
            const incomeDate = new Date(income.date || income.createdAt);
            
            totalIncome += amount;
            
            // Categorize income
            if (income.category === 'Tuition Fees') {
                tuitionFees += amount;
            } else {
                otherIncome += amount;
            }
            
            // Time-based calculations
            if (incomeDate >= today) {
                todayTotal += amount;
            }
            if (incomeDate >= thisMonth) {
                monthTotal += amount;
            }
            if (incomeDate >= lastMonth && incomeDate <= lastMonthEnd) {
                lastMonthTotal += amount;
            }
        });

        // Calculate growth rate
        let growthRate = 0;
        if (lastMonthTotal > 0) {
            growthRate = ((monthTotal - lastMonthTotal) / lastMonthTotal) * 100;
        } else if (monthTotal > 0) {
            growthRate = 100; // First month with income
        }

        incomeData.stats = {
            totalIncome,
            tuitionFees,
            otherIncome,
            growthRate,
            todayTotal,
            monthTotal,
            transactionCount: incomeData.incomes.length
        };
    }


    /**
     * Update stat cards with real data
     */
    function updateStatCards() {
        // Update total income
        const totalIncomeEl = document.querySelector('[data-card="total-income"]');
        if (totalIncomeEl) {
            totalIncomeEl.textContent = `K ${incomeData.stats.totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }

        // Update tuition fees
        const tuitionFeesEl = document.querySelector('[data-card="tuition-fees"]');
        if (tuitionFeesEl) {
            tuitionFeesEl.textContent = `K ${incomeData.stats.tuitionFees.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }

        // Update other income
        const otherIncomeEl = document.querySelector('[data-card="other-income"]');
        if (otherIncomeEl) {
            otherIncomeEl.textContent = `K ${incomeData.stats.otherIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }

        // Update growth rate
        const growthRateEl = document.querySelector('[data-card="growth-rate"]');
        if (growthRateEl) {
            const growth = incomeData.stats.growthRate;
            growthRateEl.textContent = `${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%`;
        }

        // Update summary texts
        const incomeCountEl = document.querySelector('[data-summary="income-count"]');
        if (incomeCountEl) {
            incomeCountEl.textContent = incomeData.incomes.length > 0 ? `${incomeData.incomes.length} transactions` : 'No income recorded';
        }

        const tuitionCountEl = document.querySelector('[data-summary="tuition-count"]');
        if (tuitionCountEl) {
            const tuitionTransactions = incomeData.incomes.filter(i => i.category === 'Tuition Fees').length;
            tuitionCountEl.textContent = tuitionTransactions > 0 ? `${tuitionTransactions} payments` : 'No fees collected';
        }

        const otherCountEl = document.querySelector('[data-summary="other-count"]');
        if (otherCountEl) {
            const otherTransactions = incomeData.incomes.filter(i => i.category !== 'Tuition Fees').length;
            otherCountEl.textContent = otherTransactions > 0 ? `${otherTransactions} transactions` : 'No other income';
        }

        const growthStatusEl = document.querySelector('[data-summary="growth-status"]');
        if (growthStatusEl) {
            const growth = incomeData.stats.growthRate;
            if (growth > 0) {
                growthStatusEl.textContent = 'Growing';
            } else if (growth < 0) {
                growthStatusEl.textContent = 'Declining';
            } else {
                growthStatusEl.textContent = 'Stable';
            }
        }

        // Update today's stats in form
        const todayTotalEl = document.querySelector('[data-card="today-total"]');
        if (todayTotalEl) {
            todayTotalEl.textContent = `K ${incomeData.stats.todayTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }

        const monthTotalEl = document.querySelector('[data-card="month-total"]');
        if (monthTotalEl) {
            monthTotalEl.textContent = `K ${incomeData.stats.monthTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }

        const transactionCountEl = document.querySelector('[data-card="transaction-count"]');
        if (transactionCountEl) {
            transactionCountEl.textContent = incomeData.stats.transactionCount.toString();
        }
    }

    /**
     * Update income records table
     */
    function updateIncomeRecords() {
        const container = document.getElementById('income-records-container');
        if (!container) return;

        // Clear existing content
        container.innerHTML = '';

        if (incomeData.incomes.length === 0) {
            // Show empty state
            container.innerHTML = `
                <div class="text-center py-12">
                    <i class="fas fa-arrow-down text-4xl text-slate-300 mb-3"></i>
                    <p class="text-sm text-slate-500">No income records found</p>
                    <p class="text-xs text-slate-400 mt-1">Record your first income transaction to get started</p>
                </div>
            `;
            return;
        }

        // Create table structure
        const tableContainer = document.createElement('div');
        tableContainer.className = 'overflow-x-auto';

        const table = document.createElement('table');
        table.className = 'w-full text-xs';

        // Table header
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr class="bg-slate-50">
                <th class="px-4 py-2.5 text-left text-[11px] font-medium text-slate-500">Date</th>
                <th class="px-4 py-2.5 text-left text-[11px] font-medium text-slate-500">Category</th>
                <th class="px-4 py-2.5 text-left text-[11px] font-medium text-slate-500">Amount</th>
                <th class="px-4 py-2.5 text-left text-[11px] font-medium text-slate-500">Method</th>
                <th class="px-4 py-2.5 text-left text-[11px] font-medium text-slate-500">Received From</th>
                <th class="px-4 py-2.5 text-left text-[11px] font-medium text-slate-500">Actions</th>
            </tr>
        `;
        table.appendChild(thead);

        // Table body
        const tbody = document.createElement('tbody');
        
        incomeData.incomes.forEach(income => {
            const row = document.createElement('tr');
            row.className = 'border-b border-slate-100 hover:bg-slate-50';
            
            row.innerHTML = `
                <td class="px-4 py-2.5 text-slate-600">${formatDate(income.date || income.createdAt)}</td>
                <td class="px-4 py-2.5">
                    <span class="px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(income.category)}">
                        ${income.category}
                    </span>
                </td>
                <td class="px-4 py-2.5 font-semibold text-emerald-600">K ${parseFloat(income.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                <td class="px-4 py-2.5 text-slate-600">${income.paymentMethod}</td>
                <td class="px-4 py-2.5 text-slate-600">${income.receivedFrom || '-'}</td>
                <td class="px-4 py-2.5">
                    <button class="text-blue-600 hover:text-blue-700 mr-2" onclick="window.IncomeManagement.editIncome('${income.id}')" title="Edit">
                        <i class="fas fa-edit text-xs"></i>
                    </button>
                    <button class="text-red-600 hover:text-red-700" onclick="window.IncomeManagement.deleteIncome('${income.id}')" title="Delete">
                        <i class="fas fa-trash text-xs"></i>
                    </button>
                </td>
            `;
            
            tbody.appendChild(row);
        });

        table.appendChild(tbody);
        tableContainer.appendChild(table);
        container.appendChild(tableContainer);
    }

    /**
     * Update category select elements
     */
    function updateCategorySelects() {
        const selects = document.querySelectorAll('select[name="category"], #filter-category');
        
        selects.forEach(select => {
            // Clear existing options except first one
            while (select.children.length > 1) {
                select.removeChild(select.lastChild);
            }
            
            // Add category options
            incomeData.categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                select.appendChild(option);
            });
        });

        // Update categories display
        updateCategoriesDisplay();
    }

    /**
     * Update categories display
     */
    function updateCategoriesDisplay() {
        const container = document.getElementById('categories-container');
        if (!container) return;

        container.innerHTML = '';

        incomeData.categories.forEach(category => {
            const categoryCard = document.createElement('div');
            categoryCard.className = 'bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow';
            
            const incomeCount = incomeData.incomes.filter(i => i.category === category).length;
            const totalAmount = incomeData.incomes
                .filter(i => i.category === category)
                .reduce((sum, i) => sum + parseFloat(i.amount || 0), 0);

            categoryCard.innerHTML = `
                <div class="flex items-center justify-between mb-3">
                    <h3 class="text-sm font-semibold text-slate-800">${category}</h3>
                    <span class="px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(category)}">
                        ${incomeCount} transactions
                    </span>
                </div>
                <div class="text-xs text-slate-600">
                    <div class="flex justify-between mb-1">
                        <span>Total Amount:</span>
                        <span class="font-semibold text-emerald-600">K ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div class="flex justify-between">
                        <span>Average:</span>
                        <span class="font-medium">K ${incomeCount > 0 ? (totalAmount / incomeCount).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}</span>
                    </div>
                </div>
                <div class="mt-3 flex gap-2">
                    <button class="flex-1 px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100" onclick="window.IncomeManagement.viewCategoryTransactions('${category}')">
                        View Transactions
                    </button>
                    ${!DEFAULT_CATEGORIES.includes(category) ? `
                        <button class="px-2 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100" onclick="window.IncomeManagement.deleteCategory('${category}')">
                            Delete
                        </button>
                    ` : ''}
                </div>
            `;

            container.appendChild(categoryCard);
        });

        if (incomeData.categories.length === 0) {
            container.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <i class="fas fa-folder text-4xl text-slate-300 mb-3"></i>
                    <p class="text-sm text-slate-500">No income categories found</p>
                    <p class="text-xs text-slate-400 mt-1">Add your first income category to get started</p>
                </div>
            `;
        }
    }

    /**
     * Setup event listeners
     */
    function setupEventListeners() {
        // Add income form
        const addIncomeForm = document.getElementById('add-income-form');
        if (addIncomeForm) {
            addIncomeForm.addEventListener('submit', handleAddIncome);
        }

        // Record income button (fallback)
        const recordIncomeBtns = document.querySelectorAll('button[type="submit"]');
        recordIncomeBtns.forEach(btn => {
            if (btn.textContent.includes('Record Income')) {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const form = btn.closest('form');
                    if (form) {
                        handleAddIncome({ preventDefault: () => {}, target: form });
                    }
                });
            }
        });

        // Clear button
        const clearBtn = document.getElementById('clear-form-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', handleClearForm);
        }

        // Export button
        const exportBtn = document.getElementById('export-income-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', handleExportData);
        }

        // Add category button
        const addCategoryBtn = document.getElementById('add-category-btn');
        if (addCategoryBtn) {
            addCategoryBtn.addEventListener('click', handleAddCategory);
        }

        // Search and filter
        const searchInput = document.getElementById('search-income');
        if (searchInput) {
            searchInput.addEventListener('input', handleSearch);
        }

        const filterSelect = document.getElementById('filter-category');
        if (filterSelect) {
            filterSelect.addEventListener('change', handleFilter);
        }

        // Report period
        const reportPeriod = document.getElementById('report-period');
        if (reportPeriod) {
            reportPeriod.addEventListener('change', handleReportPeriodChange);
        }

        // Export reports button
        const exportReportsBtn = document.getElementById('export-reports-btn');
        if (exportReportsBtn) {
            exportReportsBtn.addEventListener('click', handleExportReports);
        }
    }

    /**
     * Handle add income form submission
     */
    async function handleAddIncome(event) {
        event.preventDefault();
        
        const form = event.target;
        if (!form) return;

        // Get form data using FormData
        const formData = new FormData(form);
        const data = {
            description: formData.get('description') || formData.get('receivedFrom') || 'Income Transaction',
            amount: parseFloat(formData.get('amount')),
            category: formData.get('category'),
            paymentMethod: formData.get('paymentMethod'),
            incomeDate: formData.get('date'),
            notes: `${formData.get('referenceNumber') ? `Reference: ${formData.get('referenceNumber')}\n` : ''}${formData.get('receivedFrom') ? `Received From: ${formData.get('receivedFrom')}` : ''}${formData.get('description') ? `\n${formData.get('description')}` : ''}`
        };

        // Validate required fields
        if (!data.category || !data.amount || !data.paymentMethod) {
            showNotification('Please fill in all required fields', 'error');
            return;
        }

        try {
            const isEdit = editId !== null;
            const url = isEdit ? `/api/incomemanagement/incomes/${editId}` : '/api/incomemanagement/incomes';
            const method = isEdit ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getAuthToken()}`
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.success && result.data) {
                if (isEdit) {
                    // Update existing income
                    const index = incomeData.incomes.findIndex(i => i.id === editId);
                    if (index !== -1) {
                        incomeData.incomes[index] = result.data;
                    }
                    showNotification('Income updated successfully', 'success');
                } else {
                    // Add to local data
                    incomeData.incomes.unshift(result.data);
                    showNotification('Income recorded successfully', 'success');
                }
                
                // Recalculate stats
                calculateIncomeStats();
                
                // Update UI
                updateStatCards();
                updateIncomeRecords();
                
                // Clear form and edit mode
                handleClearForm();
                if (isEdit) {
                    editId = null;
                    const submitBtn = document.querySelector('#add-income-form button[type="submit"]');
                    if (submitBtn) submitBtn.textContent = 'Record Income';
                }
            } else {
                throw new Error(result.message || 'Failed to save income');
            }
            
        } catch (error) {
            console.error('Error saving income:', error);
            showNotification(error.message || 'Failed to save income', 'error');
        }
    }

    /**
     * Handle clear form
     */
    function handleClearForm() {
        const form = document.querySelector('section[x-show*="add-income"]');
        if (!form) return;

        // Clear all inputs
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            if (input.type === 'checkbox' || input.type === 'radio') {
                input.checked = false;
            } else {
                input.value = '';
            }
        });

        // Set default date to today
        const dateInput = form.querySelector('input[type="date"]');
        if (dateInput) {
            dateInput.value = new Date().toISOString().split('T')[0];
        }
    }

    /**
     * Handle report period change
     */
    function handleReportPeriodChange(event) {
        const period = event.target.value;
        updateReports(period);
    }

    /**
     * Handle export reports
     */
    function handleExportReports() {
        try {
            const period = document.getElementById('report-period').value;
            const csvContent = generateReportsCSV(period);
            downloadCSV(csvContent, `income-reports-${period}.csv`);
            showNotification('Reports exported successfully', 'success');
        } catch (error) {
            console.error('Error exporting reports:', error);
            showNotification('Failed to export reports', 'error');
        }
    }

    /**
     * Update reports
     */
    function updateReports(period) {
        // Update category chart
        updateCategoryChart();
        
        // Update trend chart based on period
        updateTrendChart(period);
    }

    /**
     * Update category chart
     */
    function updateCategoryChart() {
        const container = document.getElementById('category-chart');
        if (!container) return;

        const categoryData = {};
        incomeData.categories.forEach(category => {
            const total = incomeData.incomes
                .filter(i => i.category === category)
                .reduce((sum, i) => sum + parseFloat(i.amount || 0), 0);
            categoryData[category] = total;
        });

        if (Object.values(categoryData).every(total => total === 0)) {
            container.innerHTML = `
                <p class="text-sm text-slate-500">No income data available</p>
                <p class="text-xs text-slate-400 mt-1">Start recording income to see reports</p>
            `;
            return;
        }

        // Create simple bar chart
        const maxAmount = Math.max(...Object.values(categoryData));
        const chartHTML = Object.entries(categoryData)
            .filter(([_, amount]) => amount > 0)
            .map(([category, amount]) => {
                const percentage = (amount / maxAmount) * 100;
                return `
                    <div class="mb-2">
                        <div class="flex justify-between text-xs mb-1">
                            <span class="text-slate-600">${category}</span>
                            <span class="font-semibold text-emerald-600">K ${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div class="w-full bg-slate-200 rounded-full h-2">
                            <div class="bg-emerald-500 h-2 rounded-full" style="width: ${percentage}%"></div>
                        </div>
                    </div>
                `;
            }).join('');

        container.innerHTML = `<div class="space-y-2">${chartHTML}</div>`;
    }

    /**
     * Update trend chart
     */
    function updateTrendChart(period) {
        // This is a placeholder for trend chart updates
        // In a real implementation, you would calculate monthly/quarterly trends
        console.log('Updating trend chart for period:', period);
    }

    /**
     * Generate reports CSV
     */
    function generateReportsCSV(period) {
        const headers = ['Category', 'Total Amount', 'Transaction Count', 'Average Amount'];
        const rows = incomeData.categories.map(category => {
            const transactions = incomeData.incomes.filter(i => i.category === category);
            const total = transactions.reduce((sum, i) => sum + parseFloat(i.amount || 0), 0);
            const count = transactions.length;
            const average = count > 0 ? total / count : 0;

            return [category, total, count, average];
        });

        return [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');
    }

    /**
     * Handle add category
     */
    function handleAddCategory() {
        const categoryName = prompt('Enter new income category name:');
        if (!categoryName || !categoryName.trim()) return;

        const normalized = categoryName.trim();
        if (incomeData.categories.includes(normalized)) {
            showNotification('Category already exists', 'error');
            return;
        }

        incomeData.categories.push(normalized);
        
        // Save to local storage
        try {
            localStorage.setItem('shikola_income_categories', JSON.stringify(incomeData.categories));
        } catch (error) {
            console.error('Error saving categories:', error);
        }

        // Update UI
        updateCategorySelects();
        showNotification('Category added successfully', 'success');
    }

    /**
     * Handle search
     */
    function handleSearch(event) {
        const searchTerm = event.target.value.toLowerCase();
        filterIncomeRecords(searchTerm, null);
    }

    /**
     * Handle filter
     */
    function handleFilter(event) {
        const category = event.target.value;
        filterIncomeRecords(null, category);
    }

    /**
     * Filter income records
     */
    function filterIncomeRecords(searchTerm, category) {
        let filtered = incomeData.incomes;

        if (searchTerm) {
            filtered = filtered.filter(income => 
                (income.category && income.category.toLowerCase().includes(searchTerm)) ||
                (income.receivedFrom && income.receivedFrom.toLowerCase().includes(searchTerm)) ||
                (income.description && income.description.toLowerCase().includes(searchTerm)) ||
                (income.referenceNumber && income.referenceNumber.toLowerCase().includes(searchTerm))
            );
        }

        if (category && category !== 'All Categories') {
            filtered = filtered.filter(income => income.category === category);
        }

        // Update display with filtered results
        displayFilteredRecords(filtered);
    }

    /**
     * Display filtered records
     */
    function displayFilteredRecords(records) {
        // Store original data
        const originalData = incomeData.incomes;
        
        // Temporarily replace data
        incomeData.incomes = records;
        updateIncomeRecords();
        
        // Restore original data
        incomeData.incomes = originalData;
    }

    /**
     * Setup real-time updates
     */
    function setupRealTimeUpdates() {
        // Refresh data every 30 seconds
        setInterval(() => {
            loadIncomeData();
        }, 30000);

        // Listen for storage events (for cross-tab updates)
        window.addEventListener('storage', (event) => {
            if (event.key === 'shikola_accountant_incomes_v1') {
                loadIncomeData();
            }
        });
    }

    /**
     * Format date for input field (YYYY-MM-DD)
     */
    function formatDateForInput(dateString) {
        try {
            const date = new Date(dateString);
            return date.toISOString().split('T')[0];
        } catch (error) {
            return new Date().toISOString().split('T')[0];
        }
    }

    /**
     * Get category color
     */
    function getCategoryColor(category) {
        const colors = {
            'Tuition Fees': 'bg-blue-100 text-blue-700',
            'Registration Fees': 'bg-green-100 text-green-700',
            'Transport Fees': 'bg-purple-100 text-purple-700',
            'Examination Fees': 'bg-orange-100 text-orange-700',
            'Book Sales': 'bg-pink-100 text-pink-700',
            'Uniform Sales': 'bg-indigo-100 text-indigo-700',
            'Donations': 'bg-emerald-100 text-emerald-700',
            'Other Income': 'bg-slate-100 text-slate-700'
        };
        
        return colors[category] || 'bg-slate-100 text-slate-700';
    }

    /**
     * Generate income CSV
     */
    function generateIncomeCSV() {
        const headers = ['Date', 'Category', 'Amount', 'Payment Method', 'Received From', 'Reference Number', 'Description'];
        const rows = incomeData.incomes.map(income => [
            formatDate(income.date || income.createdAt),
            income.category || '',
            income.amount || 0,
            income.paymentMethod || '',
            income.receivedFrom || '',
            income.referenceNumber || '',
            income.description || ''
        ]);

        return [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');
    }

    /**
     * Download CSV file
     */
    function downloadCSV(content, filename) {
        const blob = new Blob([content], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    /**
     * Show notification
     */
    function showNotification(message, type = 'info') {
        // Try to use global notification system
        if (window.showNotification) {
            window.showNotification(message, type);
            return;
        }

        // Fallback notification
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 ${
            type === 'success' ? 'bg-emerald-500 text-white' :
            type === 'error' ? 'bg-red-500 text-white' :
            'bg-blue-500 text-white'
        }`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    /**
     * Handle export data
     */
    async function handleExportData() {
        try {
            const response = await fetch('/api/incomemanagement/export', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getAuthToken()}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Create blob and download
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `income_export_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            showNotification('Income data exported successfully', 'success');
        } catch (error) {
            console.error('Error exporting data:', error);
            showNotification('Failed to export data', 'error');
        }
    }

    /**
     * Edit income (populate form for editing)
     */
    function editIncome(incomeId) {
        const income = incomeData.incomes.find(i => i.id === incomeId);
        if (!income) return;

        // Populate the form
        const form = document.getElementById('add-income-form');
        if (!form) return;

        form.querySelector('[name="description"]').value = income.description || '';
        form.querySelector('[name="amount"]').value = income.amount || '';
        form.querySelector('[name="category"]').value = income.category || '';
        form.querySelector('[name="paymentMethod"]').value = income.paymentMethod || '';
        form.querySelector('[name="date"]').value = formatDateForInput(income.incomeDate || income.createdAt);
        form.querySelector('[name="receivedFrom"]').value = income.receivedFrom || '';
        form.querySelector('[name="referenceNumber"]').value = income.referenceNumber || '';

        // Set edit mode
        editId = incomeId;

        // Change button text
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.textContent = 'Update Income';

        // Scroll to form
        form.scrollIntoView({ behavior: 'smooth' });

        showNotification('Edit the income details and click Update', 'info');
    }

    /**
     * Delete category
     */
    function deleteCategory(categoryName) {
        if (!confirm(`Are you sure you want to delete the "${categoryName}" category?`)) return;

        // Check if category has transactions
        const hasTransactions = incomeData.incomes.some(i => i.category === categoryName);
        if (hasTransactions) {
            showNotification('Cannot delete category with existing transactions', 'error');
            return;
        }

        // Remove category
        incomeData.categories = incomeData.categories.filter(c => c !== categoryName);
        
        // Save to local storage
        try {
            localStorage.setItem('shikola_income_categories', JSON.stringify(incomeData.categories));
        } catch (error) {
            console.error('Error saving categories:', error);
        }

        // Update UI
        updateCategorySelects();
        showNotification('Category deleted successfully', 'success');
    }

    /**
     * View category transactions
     */
    function viewCategoryTransactions(categoryName) {
        // Switch to records tab and filter by category
        const filterSelect = document.getElementById('filter-category');
        if (filterSelect) {
            filterSelect.value = categoryName;
            handleFilter({ target: filterSelect });
        }

        // Switch to records tab
        const tabButton = document.querySelector('button[click*="income-records"]');
        if (tabButton) {
            tabButton.click();
        }
    }

    /**
     * Delete income
     */
    async function deleteIncome(incomeId) {
        if (!confirm('Are you sure you want to delete this income record?')) return;

        try {
            const response = await fetch(`/api/incomemanagement/incomes/${incomeId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getAuthToken()}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.success) {
                // Remove from local data
                incomeData.incomes = incomeData.incomes.filter(i => i.id !== incomeId);
                
                // Update UI
                calculateIncomeStats();
                updateStatCards();
                updateIncomeRecords();
                
                showNotification('Income record deleted successfully', 'success');
            } else {
                throw new Error(result.message || 'Failed to delete income record');
            }
            
        } catch (error) {
            console.error('Error deleting income:', error);
            showNotification(error.message || 'Failed to delete income record', 'error');
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initIncomeManagement);
    } else {
        initIncomeManagement();
    }

    // Expose functions for global access
    window.IncomeManagement = {
        loadData: loadIncomeData,
        refresh: () => {
            loadIncomeData();
            loadIncomeCategories();
        },
        editIncome: editIncome,
        deleteIncome: deleteIncome,
        deleteCategory: deleteCategory,
        viewCategoryTransactions: viewCategoryTransactions
    };

    // Also expose global functions for onclick handlers
    window.editIncome = editIncome;
    window.deleteIncome = deleteIncome;

})();
