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
// Accountant Portal Interactive Functions
// This file contains all interactive JavaScript functions for the accountant portal

// Global variables
let currentUser = null;
let chartInstances = {};

// Initialize the portal
document.addEventListener('DOMContentLoaded', function() {
    initializePortal();
    setupEventListeners();
    loadDashboardData();
    initializeCharts();
});

// Portal initialization
function initializePortal() {
    // Check authentication
    if (!checkAuthentication()) {
        // Skip redirect for super-admin console
        if (!window.location.pathname.includes('super-admin')) {
            window.location.href = '../frontend/public/index.html';
        }
        return;
    }
    
    // Set current user
    currentUser = getCurrentUser();
    
    // Initialize tooltips
    initializeTooltips();
    
    // Setup responsive sidebar
    setupResponsiveSidebar();
}

// Authentication functions
function checkAuthentication() {
    const authData = localStorage.getItem('shikolaAuth');
    if (!authData) return false;
    
    const parsed = JSON.parse(authData);
    return parsed.user && parsed.user.role === 'accountant';
}

function getCurrentUser() {
    const authData = localStorage.getItem('shikolaAuth');
    if (!authData) return null;
    
    const parsed = JSON.parse(authData);
    return parsed.user;
}

// Event listeners setup
function setupEventListeners() {
    // Form submissions
    document.addEventListener('submit', handleFormSubmit);
    
    // Button clicks
    document.addEventListener('click', handleButtonClick);
    
    // Tab switching
    document.addEventListener('click', handleTabSwitch);
    
    // Modal triggers
    document.addEventListener('click', handleModalTrigger);
    
    // Search functionality
    document.addEventListener('input', handleSearch);
    
    // Filter functionality
    document.addEventListener('change', handleFilter);
}

// Form handling
function handleFormSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    
    // Show loading state
    showLoading(form);
    
    // Simulate API call
    setTimeout(() => {
        const action = form.dataset.action;
        
        switch(action) {
            case 'add-income':
                handleAddIncome(formData);
                break;
            case 'add-expense':
                handleAddExpense(formData);
                break;
            case 'add-account':
                handleAddAccount(formData);
                break;
            case 'process-payroll':
                handleProcessPayroll(formData);
                break;
            case 'create-budget':
                handleCreateBudget(formData);
                break;
            default:
                showNotification('Form submitted successfully', 'success');
        }
        
        hideLoading(form);
        form.reset();
    }, 1000);
}

// Button click handling
function handleButtonClick(event) {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    
    const action = button.dataset.action;
    
    switch(action) {
        case 'export-data':
            exportData(button.dataset.exportType);
            break;
        case 'print-report':
            printReport();
            break;
        case 'refresh-data':
            refreshData();
            break;
        case 'delete-item':
            deleteItem(button.dataset.itemId);
            break;
        case 'edit-item':
            editItem(button.dataset.itemId);
            break;
        case 'reject-transaction':
            rejectTransaction(button.dataset.transactionId);
            break;
        default:
            console.log('Unknown action:', action);
    }
}

// Tab switching
function handleTabSwitch(event) {
    const tabButton = event.target.closest('button[data-tab]');
    if (!tabButton) return;
    
    const tabName = tabButton.dataset.tab;
    const tabContainer = tabButton.closest('[x-data]');
    
    // Update active tab
    if (tabContainer._x_dataStack) {
        tabContainer._x_dataStack[0].activeTab = tabName;
    }
    
    // Update button states
    const allTabs = tabButton.parentElement.querySelectorAll('button[data-tab]');
    allTabs.forEach(tab => {
        tab.classList.remove('bg-slate-900', 'text-white');
        tab.classList.add('bg-slate-50', 'text-slate-500');
    });
    
    tabButton.classList.remove('bg-slate-50', 'text-slate-500');
    tabButton.classList.add('bg-slate-900', 'text-white');
    
    // Load tab-specific data
    loadTabData(tabName);
}

// Modal handling
function handleModalTrigger(event) {
    const trigger = event.target.closest('[data-modal]');
    if (!trigger) return;
    
    const modalId = trigger.dataset.modal;
    const modal = document.getElementById(modalId);
    
    if (modal) {
        modal.classList.toggle('hidden');
        modal.classList.toggle('flex');
    }
}

// Search functionality
function handleSearch(event) {
    const searchInput = event.target;
    const searchTerm = searchInput.value.toLowerCase();
    const searchContainer = searchInput.closest('.search-container');
    
    if (searchContainer) {
        const items = searchContainer.querySelectorAll('.searchable-item');
        items.forEach(item => {
            const text = item.textContent.toLowerCase();
            item.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    }
}

// Filter functionality
function handleFilter(event) {
    const filterSelect = event.target;
    const filterValue = filterSelect.value;
    const filterContainer = filterSelect.closest('.filter-container');
    
    if (filterContainer) {
        const items = filterContainer.querySelectorAll('.filterable-item');
        items.forEach(item => {
            const itemValue = item.dataset.filterValue;
            item.style.display = filterValue === 'all' || itemValue === filterValue ? '' : 'none';
        });
    }
}

// Income management functions
function handleAddIncome(formData) {
    const incomeData = {
        id: generateId(),
        date: formData.get('date'),
        amount: formData.get('amount'),
        category: formData.get('category'),
        description: formData.get('description'),
        paymentMethod: formData.get('paymentMethod'),
        recordedBy: currentUser.name,
        timestamp: new Date().toISOString()
    };
    
    // Save to localStorage (in real app, this would be an API call)
    saveIncomeRecord(incomeData);
    
    // Update UI
    addIncomeToTable(incomeData);
    updateIncomeStats();
    
    showNotification('Income recorded successfully', 'success');
}

function saveIncomeRecord(incomeData) {
    let incomeRecords = JSON.parse(localStorage.getItem('incomeRecords') || '[]');
    incomeRecords.push(incomeData);
    localStorage.setItem('incomeRecords', JSON.stringify(incomeRecords));
}

function addIncomeToTable(incomeData) {
    const tableBody = document.querySelector('#income-records tbody');
    if (!tableBody) return;
    
    const row = document.createElement('tr');
    row.className = 'hover:bg-slate-50';
    row.innerHTML = `
        <td class="px-4 py-3 text-xs text-slate-500">${incomeData.date}</td>
        <td class="px-4 py-3">
            <div class="text-xs font-medium text-slate-800">${incomeData.description}</div>
            <div class="text-[11px] text-slate-400">${incomeData.category}</div>
        </td>
        <td class="px-4 py-3 text-emerald-600 text-xs font-semibold">K ${incomeData.amount}</td>
        <td class="px-4 py-3 text-slate-500 text-xs">${incomeData.paymentMethod}</td>
        <td class="px-4 py-3">
            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">Complete</span>
        </td>
        <td class="px-4 py-3">
            <button class="text-slate-400 hover:text-slate-600" onclick="editIncome('${incomeData.id}')">
                <i class="fas fa-edit"></i>
            </button>
        </td>
    `;
    
    tableBody.insertBefore(row, tableBody.firstChild);
}

// Expense management functions
function handleAddExpense(formData) {
    const expenseData = {
        id: generateId(),
        date: formData.get('date'),
        amount: formData.get('amount'),
        category: formData.get('category'),
        description: formData.get('description'),
        vendor: formData.get('vendor'),
        recordedBy: currentUser.name,
        timestamp: new Date().toISOString()
    };
    
    saveExpenseRecord(expenseData);
    addExpenseToTable(expenseData);
    updateExpenseStats();
    
    showNotification('Expense recorded successfully', 'success');
}

function saveExpenseRecord(expenseData) {
    let expenseRecords = JSON.parse(localStorage.getItem('expenseRecords') || '[]');
    expenseRecords.push(expenseData);
    localStorage.setItem('expenseRecords', JSON.stringify(expenseRecords));
}

function addExpenseToTable(expenseData) {
    const tableBody = document.querySelector('#expense-records tbody');
    if (!tableBody) return;
    
    const row = document.createElement('tr');
    row.className = 'hover:bg-slate-50';
    row.innerHTML = `
        <td class="px-4 py-3 text-xs text-slate-500">${expenseData.date}</td>
        <td class="px-4 py-3">
            <div class="text-xs font-medium text-slate-800">${expenseData.description}</div>
            <div class="text-[11px] text-slate-400">${expenseData.vendor}</div>
        </td>
        <td class="px-4 py-3 text-red-600 text-xs font-semibold">K ${expenseData.amount}</td>
        <td class="px-4 py-3 text-slate-500 text-xs">${expenseData.category}</td>
        <td class="px-4 py-3">
            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">Complete</span>
        </td>
        <td class="px-4 py-3">
            <button class="text-slate-400 hover:text-slate-600" onclick="editExpense('${expenseData.id}')">
                <i class="fas fa-edit"></i>
            </button>
        </td>
    `;
    
    tableBody.insertBefore(row, tableBody.firstChild);
}

// Account management functions
function handleAddAccount(formData) {
    const accountData = {
        id: generateId(),
        name: formData.get('accountName'),
        type: formData.get('accountType'),
        code: formData.get('accountCode'),
        description: formData.get('description'),
        openingBalance: formData.get('openingBalance'),
        createdBy: currentUser.name,
        timestamp: new Date().toISOString()
    };
    
    saveAccountRecord(accountData);
    addAccountToTable(accountData);
    
    showNotification('Account created successfully', 'success');
}

function saveAccountRecord(accountData) {
    let accounts = JSON.parse(localStorage.getItem('chartOfAccounts') || '[]');
    accounts.push(accountData);
    localStorage.setItem('chartOfAccounts', JSON.stringify(accounts));
}

function addAccountToTable(accountData) {
    const tableBody = document.querySelector('#accounts-list tbody');
    if (!tableBody) return;
    
    const row = document.createElement('tr');
    row.className = 'hover:bg-slate-50';
    row.innerHTML = `
        <td class="px-4 py-3 text-xs text-slate-500">${accountData.code}</td>
        <td class="px-4 py-3">
            <div class="text-xs font-medium text-slate-800">${accountData.name}</div>
            <div class="text-[11px] text-slate-400">${accountData.description}</div>
        </td>
        <td class="px-4 py-3 text-slate-500 text-xs">${accountData.type}</td>
        <td class="px-4 py-3 text-slate-800 text-xs font-semibold">K ${accountData.openingBalance}</td>
        <td class="px-4 py-3">
            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">Active</span>
        </td>
        <td class="px-4 py-3">
            <button class="text-slate-400 hover:text-slate-600" onclick="editAccount('${accountData.id}')">
                <i class="fas fa-edit"></i>
            </button>
        </td>
    `;
    
    tableBody.insertBefore(row, tableBody.firstChild);
}

// Payroll functions
function handleProcessPayroll(formData) {
    const payrollData = {
        id: generateId(),
        month: formData.get('month'),
        year: formData.get('year'),
        totalAmount: formData.get('totalAmount'),
        processedBy: currentUser.name,
        timestamp: new Date().toISOString()
    };
    
    // Process payroll for selected staff
    const selectedStaff = formData.getAll('staffIds');
    selectedStaff.forEach(staffId => {
        processStaffSalary(staffId, payrollData);
    });
    
    showNotification('Payroll processed successfully', 'success');
}

function processStaffSalary(staffId, payrollData) {
    // In a real application, this would calculate and process individual salaries
    const salaryRecord = {
        id: generateId(),
        staffId: staffId,
        payrollId: payrollData.id,
        month: payrollData.month,
        year: payrollData.year,
        status: 'Processed',
        processedBy: currentUser.name,
        timestamp: new Date().toISOString()
    };
    
    let salaryRecords = JSON.parse(localStorage.getItem('salaryRecords') || '[]');
    salaryRecords.push(salaryRecord);
    localStorage.setItem('salaryRecords', JSON.stringify(salaryRecords));
}

// Budget management functions
function handleCreateBudget(formData) {
    const budgetData = {
        id: generateId(),
        name: formData.get('budgetName'),
        department: formData.get('department'),
        period: formData.get('period'),
        totalBudget: formData.get('totalBudget'),
        startDate: formData.get('startDate'),
        endDate: formData.get('endDate'),
        description: formData.get('description'),
        createdBy: currentUser.name,
        timestamp: new Date().toISOString()
    };
    
    saveBudgetRecord(budgetData);
    addBudgetToTable(budgetData);
    
    showNotification('Budget created successfully', 'success');
}

function saveBudgetRecord(budgetData) {
    let budgets = JSON.parse(localStorage.getItem('budgets') || '[]');
    budgets.push(budgetData);
    localStorage.setItem('budgets', JSON.stringify(budgets));
}

function addBudgetToTable(budgetData) {
    const tableBody = document.querySelector('#budget-list tbody');
    if (!tableBody) return;
    
    const row = document.createElement('tr');
    row.className = 'hover:bg-slate-50';
    row.innerHTML = `
        <td class="px-4 py-3">
            <div class="text-xs font-medium text-slate-800">${budgetData.name}</div>
            <div class="text-[11px] text-slate-400">${budgetData.startDate} - ${budgetData.endDate}</div>
        </td>
        <td class="px-4 py-3 text-slate-500 text-xs">${budgetData.department}</td>
        <td class="px-4 py-3 text-green-600 text-xs font-semibold">K ${budgetData.totalBudget}</td>
        <td class="px-4 py-3 text-blue-600 text-xs font-semibold">K 0</td>
        <td class="px-4 py-3">
            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">Active</span>
        </td>
        <td class="px-4 py-3">
            <button class="text-slate-400 hover:text-slate-600" onclick="editBudget('${budgetData.id}')">
                <i class="fas fa-edit"></i>
            </button>
        </td>
    `;
    
    tableBody.insertBefore(row, tableBody.firstChild);
}


function rejectTransaction(transactionId) {
    showNotification('Transaction rejected', 'warning');
    // Update transaction status
}

// Data export functions
function exportData(exportType) {
    switch(exportType) {
        case 'income':
            exportIncomeData();
            break;
        case 'expense':
            exportExpenseData();
            break;
        case 'accounts':
            exportAccountsData();
            break;
        case 'reports':
            exportFinancialReports();
            break;
        default:
            showNotification('Export functionality not available', 'warning');
    }
}

function exportIncomeData() {
    const incomeRecords = JSON.parse(localStorage.getItem('incomeRecords') || '[]');
    const csv = convertToCSV(incomeRecords);
    downloadCSV(csv, 'income-records.csv');
    showNotification('Income data exported successfully', 'success');
}

function exportExpenseData() {
    const expenseRecords = JSON.parse(localStorage.getItem('expenseRecords') || '[]');
    const csv = convertToCSV(expenseRecords);
    downloadCSV(csv, 'expense-records.csv');
    showNotification('Expense data exported successfully', 'success');
}

function exportAccountsData() {
    const accounts = JSON.parse(localStorage.getItem('chartOfAccounts') || '[]');
    const csv = convertToCSV(accounts);
    downloadCSV(csv, 'chart-of-accounts.csv');
    showNotification('Accounts data exported successfully', 'success');
}

function exportFinancialReports() {
    showNotification('Financial reports exported successfully', 'success');
    // In a real application, this would generate comprehensive financial reports
}

// Utility functions
function convertToCSV(data) {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');
    
    const csvRows = data.map(row => {
        return headers.map(header => {
            const value = row[header];
            return typeof value === 'string' ? `"${value}"` : value;
        }).join(',');
    });
    
    return [csvHeaders, ...csvRows].join('\n');
}

function downloadCSV(csv, filename) {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm ${
        type === 'success' ? 'bg-green-500 text-white' :
        type === 'error' ? 'bg-red-500 text-white' :
        type === 'warning' ? 'bg-yellow-500 text-white' :
        'bg-blue-500 text-white'
    }`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function showLoading(element) {
    element.classList.add('opacity-50', 'pointer-events-none');
    
    const loader = document.createElement('div');
    loader.className = 'absolute inset-0 flex items-center justify-center bg-white bg-opacity-75';
    loader.innerHTML = '<i class="fas fa-spinner fa-spin text-blue-500"></i>';
    
    element.style.position = 'relative';
    element.appendChild(loader);
}

function hideLoading(element) {
    element.classList.remove('opacity-50', 'pointer-events-none');
    const loader = element.querySelector('.absolute');
    if (loader) loader.remove();
}

function printReport() {
    window.print();
}

function refreshData() {
    loadDashboardData();
    showNotification('Data refreshed successfully', 'success');
}

function deleteItem(itemId) {
    if (confirm('Are you sure you want to delete this item?')) {
        // Remove from localStorage
        // Update UI
        showNotification('Item deleted successfully', 'success');
    }
}

function editItem(itemId) {
    // Open edit modal with item data
    showNotification('Edit functionality coming soon', 'info');
}

function editIncome(incomeId) {
    editItem(incomeId);
}

function editExpense(expenseId) {
    editItem(expenseId);
}

function editAccount(accountId) {
    editItem(accountId);
}

function editBudget(budgetId) {
    editItem(budgetId);
}

// Dashboard data loading
function loadDashboardData() {
    // Load financial overview data
    loadFinancialOverview();
    
    // Load recent transactions
    loadRecentTransactions();
    
    // Load chart data
    loadChartData();
}

function loadFinancialOverview() {
    // Calculate totals from localStorage
    const incomeRecords = JSON.parse(localStorage.getItem('incomeRecords') || '[]');
    const expenseRecords = JSON.parse(localStorage.getItem('expenseRecords') || '[]');
    
    const totalIncome = incomeRecords.reduce((sum, record) => sum + parseFloat(record.amount || 0), 0);
    const totalExpenses = expenseRecords.reduce((sum, record) => sum + parseFloat(record.amount || 0), 0);
    const netProfit = totalIncome - totalExpenses;
    
    // Update dashboard cards
    updateDashboardCard('total-income', totalIncome);
    updateDashboardCard('total-expenses', totalExpenses);
    updateDashboardCard('net-profit', netProfit);
}

function updateDashboardCard(cardId, value) {
    const card = document.getElementById(cardId);
    if (card) {
        const valueElement = card.querySelector('.text-2xl');
        if (valueElement) {
            valueElement.textContent = `K ${value.toLocaleString()}`;
        }
    }
}

function loadRecentTransactions() {
    // Load and display recent transactions
    const incomeRecords = JSON.parse(localStorage.getItem('incomeRecords') || '[]');
    const expenseRecords = JSON.parse(localStorage.getItem('expenseRecords') || '[]');
    
    const allTransactions = [...incomeRecords, ...expenseRecords]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 5);
    
    // Update recent transactions table
    const tableBody = document.querySelector('#recent-transactions tbody');
    if (tableBody) {
        tableBody.innerHTML = '';
        allTransactions.forEach(transaction => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-slate-50';
            row.innerHTML = `
                <td class="px-4 py-3 text-xs text-slate-500">${transaction.date}</td>
                <td class="px-4 py-3">
                    <div class="text-xs font-medium text-slate-800">${transaction.description}</div>
                    <div class="text-[11px] text-slate-400">${transaction.category || transaction.vendor || 'N/A'}</div>
                </td>
                <td class="px-4 py-3 ${incomeRecords.includes(transaction) ? 'text-emerald-600' : 'text-red-600'} text-xs font-semibold">
                    ${incomeRecords.includes(transaction) ? '+' : '-'}K ${transaction.amount}
                </td>
                <td class="px-4 py-3">
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">Complete</span>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }
}

function loadChartData() {
    // Prepare data for charts
    const incomeRecords = JSON.parse(localStorage.getItem('incomeRecords') || '[]');
    const expenseRecords = JSON.parse(localStorage.getItem('expenseRecords') || '[]');
    
    // Group by month
    const monthlyData = groupTransactionsByMonth(incomeRecords, expenseRecords);
    
    // Update charts
    updateRevenueChart(monthlyData);
    updateExpenseChart(monthlyData);
}

function groupTransactionsByMonth(incomeRecords, expenseRecords) {
    const monthlyData = {};
    
    // Process income records
    incomeRecords.forEach(record => {
        const month = record.date ? record.date.substring(0, 7) : new Date().toISOString().substring(0, 7);
        if (!monthlyData[month]) {
            monthlyData[month] = { income: 0, expenses: 0 };
        }
        monthlyData[month].income += parseFloat(record.amount || 0);
    });
    
    // Process expense records
    expenseRecords.forEach(record => {
        const month = record.date ? record.date.substring(0, 7) : new Date().toISOString().substring(0, 7);
        if (!monthlyData[month]) {
            monthlyData[month] = { income: 0, expenses: 0 };
        }
        monthlyData[month].expenses += parseFloat(record.amount || 0);
    });
    
    return monthlyData;
}

function updateRevenueChart(monthlyData) {
    // Update revenue chart with monthly data
    // This would integrate with a charting library like Chart.js
}

function updateExpenseChart(monthlyData) {
    // Update expense chart with monthly data
    // This would integrate with a charting library like Chart.js
}

function loadTabData(tabName) {
    // Load data specific to the active tab
    switch(tabName) {
        case 'income-records':
            loadIncomeRecords();
            break;
        case 'expense-records':
            loadExpenseRecords();
            break;
        case 'accounts':
            loadAccounts();
            break;
        case 'transactions':
            loadTransactions();
            break;
        default:
            break;
    }
}

function loadIncomeRecords() {
    const incomeRecords = JSON.parse(localStorage.getItem('incomeRecords') || '[]');
    const tableBody = document.querySelector('#income-records tbody');
    
    if (tableBody) {
        tableBody.innerHTML = '';
        incomeRecords.forEach(record => {
            addIncomeToTable(record);
        });
    }
}

function loadExpenseRecords() {
    const expenseRecords = JSON.parse(localStorage.getItem('expenseRecords') || '[]');
    const tableBody = document.querySelector('#expense-records tbody');
    
    if (tableBody) {
        tableBody.innerHTML = '';
        expenseRecords.forEach(record => {
            addExpenseToTable(record);
        });
    }
}

function loadAccounts() {
    const accounts = JSON.parse(localStorage.getItem('chartOfAccounts') || '[]');
    const tableBody = document.querySelector('#accounts-list tbody');
    
    if (tableBody) {
        tableBody.innerHTML = '';
        accounts.forEach(account => {
            addAccountToTable(account);
        });
    }
}

function loadTransactions() {
    // Load and display all transactions
    loadRecentTransactions();
}

// Chart initialization
function initializeCharts() {
    // Initialize any chart libraries
    // This would set up Chart.js or similar charting library
}

// Tooltip initialization
function initializeTooltips() {
    // Initialize tooltip functionality
    const tooltipElements = document.querySelectorAll('[data-tooltip]');
    tooltipElements.forEach(element => {
        element.addEventListener('mouseenter', showTooltip);
        element.addEventListener('mouseleave', hideTooltip);
    });
}

function showTooltip(event) {
    const element = event.target;
    const tooltipText = element.dataset.tooltip;
    
    const tooltip = document.createElement('div');
    tooltip.className = 'absolute z-50 px-2 py-1 text-xs text-white bg-gray-800 rounded shadow-lg';
    tooltip.textContent = tooltipText;
    
    document.body.appendChild(tooltip);
    
    const rect = element.getBoundingClientRect();
    tooltip.style.left = rect.left + 'px';
    tooltip.style.top = (rect.top - 30) + 'px';
}

function hideTooltip() {
    const tooltips = document.querySelectorAll('.absolute.z-50.px-2.py-1');
    tooltips.forEach(tooltip => tooltip.remove());
}

// Responsive sidebar
function setupResponsiveSidebar() {
    const sidebarToggle = document.querySelector('[data-sidebar-toggle]');
    const sidebar = document.querySelector('.sidebar');
    
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('hidden');
            sidebar.classList.toggle('lg:flex');
        });
    }
}

// Update statistics functions
function updateIncomeStats() {
    const incomeRecords = JSON.parse(localStorage.getItem('incomeRecords') || '[]');
    const totalIncome = incomeRecords.reduce((sum, record) => sum + parseFloat(record.amount || 0), 0);
    
    // Update income statistics display
    const incomeTotalElement = document.querySelector('#income-total');
    if (incomeTotalElement) {
        incomeTotalElement.textContent = `K ${totalIncome.toLocaleString()}`;
    }
}

function updateExpenseStats() {
    const expenseRecords = JSON.parse(localStorage.getItem('expenseRecords') || '[]');
    const totalExpenses = expenseRecords.reduce((sum, record) => sum + parseFloat(record.amount || 0), 0);
    
    // Update expense statistics display
    const expenseTotalElement = document.querySelector('#expense-total');
    if (expenseTotalElement) {
        expenseTotalElement.textContent = `K ${totalExpenses.toLocaleString()}`;
    }
}

// Keyboard shortcuts
document.addEventListener('keydown', function(event) {
    // Ctrl/Cmd + S for save
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        const activeForm = document.querySelector('form:focus-within');
        if (activeForm) {
            activeForm.dispatchEvent(new Event('submit'));
        }
    }
    
    // Ctrl/Cmd + E for export
    if ((event.ctrlKey || event.metaKey) && event.key === 'e') {
        event.preventDefault();
        const exportButton = document.querySelector('[data-action="export-data"]');
        if (exportButton) {
            exportButton.click();
        }
    }
    
    // Escape to close modals
    if (event.key === 'Escape') {
        const openModals = document.querySelectorAll('.modal:not(.hidden)');
        openModals.forEach(modal => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        });
    }
});

// Auto-save functionality
function setupAutoSave() {
    const forms = document.querySelectorAll('form[data-auto-save]');
    
    forms.forEach(form => {
        const inputs = form.querySelectorAll('input, textarea, select');
        
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                const formData = new FormData(form);
                const formDataObject = Object.fromEntries(formData);
                
                // Save to localStorage
                const formId = form.id || 'unsaved-form';
                localStorage.setItem(`autosave-${formId}`, JSON.stringify(formDataObject));
            });
        });
    });
}

// Initialize auto-save
setupAutoSave();
