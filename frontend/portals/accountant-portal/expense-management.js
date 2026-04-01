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
 * Expense Management JavaScript
 * Handles all expense management functionality for the accountant portal
 */
(function() {
    'use strict';

    // Expense data state
    const expenseData = {
        expenses: [],
        categories: [],
        stats: {
            totalExpenses: 0,
            salaries: 0,
            operations: 0,
            budgetUsed: 0,
            todayTotal: 0,
            monthTotal: 0,
            transactionCount: 0
        },
        loading: false,
        error: null
    };

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
     * Initialize expense management
     */
    function initExpenseManagement() {
        console.log('Initializing Expense Management...');

        // Load categories from localStorage
        loadCategoriesFromStorage();

        // Setup event listeners
        setupEventListeners();

        // Load initial data
        loadExpenseData();
        loadExpenseCategories();

        console.log('Expense Management initialized successfully');
    }

    /**
     * Load expense data from API
     */
    async function loadExpenseData() {
        try {
            expenseData.loading = true;
            expenseData.error = null;

            const apiUrl = '/api/expensemanagement/expenses?page=1&pageSize=1000';

            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + (getAuthToken() || '')
                }
            });

            if (!response.ok) {
                throw new Error('HTTP error! status: ' + response.status);
            }

            const result = await response.json();

            if (result.success && result.data) {
                expenseData.expenses = result.data;
            } else {
                throw new Error(result.message || 'Failed to load expense data');
            }

            // Calculate statistics
            calculateExpenseStats();

        } catch (error) {
            console.error('Error loading expense data:', error);
            expenseData.error = error.message;
            expenseData.expenses = [];
            calculateExpenseStats();
        } finally {
            expenseData.loading = false;
            updateStatCards();
            updateExpenseRecords();
        }
    }

    /**
     * Load expense categories
     */
    async function loadExpenseCategories() {
        try {
            const apiUrl = '/api/expensemanagement/categories';

            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + (getAuthToken() || '')
                }
            });

            if (!response.ok) {
                throw new Error('HTTP error! status: ' + response.status);
            }

            const result = await response.json();

            if (result.success && result.data) {
                expenseData.categories = result.data;
            } else {
                throw new Error(result.message || 'Failed to load expense categories');
            }
        } catch (error) {
            console.error('Error loading expense categories:', error);
            expenseData.categories = [];
        }

        updateCategorySelects();
    }

    /**
     * Calculate expense statistics
     */
    function calculateExpenseStats() {
        expenseData.stats = {
            totalExpenses: 0,
            salaries: 0,
            operations: 0,
            budgetUsed: 0,
            todayTotal: 0,
            monthTotal: 0,
            transactionCount: expenseData.expenses.length
        };

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        expenseData.expenses.forEach(expense => {
            const amount = parseFloat(expense.amount) || 0;
            const expenseDate = new Date(expense.expenseDate || expense.createdAt);

            expenseData.stats.totalExpenses += amount;

            if (expense.category && expense.category.includes('Salaries')) {
                expenseData.stats.salaries += amount;
            } else if (expense.category && (expense.category.includes('Utilities') || expense.category.includes('Rent') || expense.category.includes('Maintenance') || expense.category.includes('Supplies'))) {
                expenseData.stats.operations += amount;
            }

            if (expenseDate >= today) {
                expenseData.stats.todayTotal += amount;
            }
            if (expenseDate >= thisMonth) {
                expenseData.stats.monthTotal += amount;
            }
        });
    }

    /**
     * Update stat cards with real data
     */
    function updateStatCards() {
        const totalExpensesEl = document.querySelector('[data-card="total-expenses"]');
        if (totalExpensesEl) {
            totalExpensesEl.textContent = 'K ' + expenseData.stats.totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }

        const salariesEl = document.querySelector('[data-card="salaries"]');
        if (salariesEl) {
            salariesEl.textContent = 'K ' + expenseData.stats.salaries.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }

        const operationsEl = document.querySelector('[data-card="operations"]');
        if (operationsEl) {
            operationsEl.textContent = 'K ' + expenseData.stats.operations.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }

        const todayEl = document.querySelector('[data-card="today-expenses"]');
        if (todayEl) {
            todayEl.textContent = 'K ' + expenseData.stats.todayTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }

        const monthEl = document.querySelector('[data-card="month-expenses"]');
        if (monthEl) {
            monthEl.textContent = 'K ' + expenseData.stats.monthTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }

        const countEl = document.querySelector('[data-card="transaction-count"]');
        if (countEl) {
            countEl.textContent = expenseData.stats.transactionCount;
        }
    }

    /**
     * Update expense records table
     */
    function updateExpenseRecords() {
        const container = document.querySelector('[data-expense-records-container]');
        if (!container) return;

        if (expenseData.expenses.length === 0) {
            container.innerHTML = '<div class="text-center py-8 text-slate-500">No expense records found</div>';
            return;
        }

        const recordsHtml = expenseData.expenses.map(expense => {
            return '<div class="grid grid-cols-12 px-4 py-3 border-b border-slate-100 hover:bg-slate-50 text-xs">' +
                '<div class="col-span-2">' + formatDate(expense.expenseDate || expense.createdAt) + '</div>' +
                '<div class="col-span-3">' + (expense.category || '') + '</div>' +
                '<div class="col-span-2">K ' + (parseFloat(expense.amount) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '</div>' +
                '<div class="col-span-2">' + (expense.paymentMethod || '') + '</div>' +
                '<div class="col-span-2">' + (expense.paidTo || '') + '</div>' +
                '<div class="col-span-1 flex gap-1">' +
                    '<button onclick="window.ExpenseManagement.editExpense(\'' + expense.id + '\')" class="text-blue-600 hover:text-blue-800" title="Edit">' +
                        '<i class="fas fa-edit"></i>' +
                    '</button>' +
                    '<button onclick="window.ExpenseManagement.deleteExpense(\'' + expense.id + '\')" class="text-red-600 hover:text-red-800" title="Delete">' +
                        '<i class="fas fa-trash"></i>' +
                    '</button>' +
                '</div>' +
            '</div>';
        }).join('');

        container.innerHTML = recordsHtml;
    }

    /**
     * Update category selects
     */
    function updateCategorySelects() {
        const selects = document.querySelectorAll('select[name="category"], #expense-category');
        selects.forEach(select => {
            const currentValue = select.value;
            select.innerHTML = '<option value="">Select Category</option>' +
                expenseData.categories.map(category =>
                    '<option value="' + category + '"' + (currentValue === category ? ' selected' : '') + '>' + category + '</option>'
                ).join('');
        });
    }

    /**
     * Setup event listeners
     */
    function setupEventListeners() {
        // Add expense form
        const addExpenseForm = document.getElementById('add-expense-form');
        if (addExpenseForm) {
            addExpenseForm.addEventListener('submit', handleAddExpense);
        }

        // Clear button
        const clearBtn = document.getElementById('clear-expense-form-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', handleClearForm);
        }

        // Export buttons
        const exportExpensesBtn = document.getElementById('export-expenses-btn');
        if (exportExpensesBtn) {
            exportExpensesBtn.addEventListener('click', handleExportData);
        }

        const exportReportsBtn = document.getElementById('export-reports-btn');
        if (exportReportsBtn) {
            exportReportsBtn.addEventListener('click', handleExportData);
        }

        // Add category button
        const addCategoryBtn = document.getElementById('add-category-btn');
        if (addCategoryBtn) {
            addCategoryBtn.addEventListener('click', handleAddCategory);
        }

        console.log('Event listeners setup complete');
    }

    /**
     * Handle add expense form submission
     */
    async function handleAddExpense(event) {
        event.preventDefault();

        const form = event.target;
        if (!form) return;

        const formData = new FormData(form);
        const data = {
            description: (formData.get('description') || '').trim(),
            amount: parseFloat(formData.get('amount')) || 0,
            category: (formData.get('category') || '').trim(),
            paymentMethod: (formData.get('paymentMethod') || '').trim(),
            expenseDate: (formData.get('date') || new Date().toISOString().split('T')[0]).trim(),
            notes: (formData.get('notes') || '').trim()
        };

        if (!data.description || !data.amount || !data.category || !data.paymentMethod) {
            showNotification('Please fill in all required fields', 'error');
            return;
        }

        try {
            const apiUrl = '/api/expensemanagement/expenses';

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + (getAuthToken() || '')
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'HTTP error! status: ' + response.status);
            }

            const result = await response.json();

            if (result.success && result.data) {
                expenseData.expenses.unshift(result.data);
                calculateExpenseStats();
                updateStatCards();
                updateExpenseRecords();
                handleClearForm();
                showNotification('Expense recorded successfully', 'success');
            } else {
                throw new Error(result.message || 'Failed to record expense');
            }

        } catch (error) {
            console.error('Error adding expense:', error);
            showNotification(error.message || 'Failed to record expense', 'error');
        }
    }

    /**
     * Handle clear form
     */
    function handleClearForm() {
        const form = document.querySelector('section[x-show*="add-expense"]');
        if (!form) return;

        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            if (input.type === 'checkbox' || input.type === 'radio') {
                input.checked = false;
            } else {
                input.value = '';
            }
        });

        const dateInput = form.querySelector('#date');
        if (dateInput) {
            dateInput.value = new Date().toISOString().split('T')[0];
        }
    }

    /**
     * Handle export data
     */
    async function handleExportData(event) {
        event.preventDefault();

        try {
            const apiUrl = '/api/expensemanagement/export';

            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + (getAuthToken() || '')
                }
            });

            if (!response.ok) {
                throw new Error('HTTP error! status: ' + response.status);
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'expense_export_' + new Date().toISOString().split('T')[0] + '.csv';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            showNotification('Export completed successfully', 'success');

        } catch (error) {
            console.error('Error exporting data:', error);
            showNotification('Failed to export data', 'error');
        }
    }

    /**
     * Handle add category
     */
    function handleAddCategory() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = '<div class="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4">' +
            '<div class="px-6 py-4 border-b border-slate-200">' +
                '<h3 class="text-lg font-semibold text-slate-800">Add New Category</h3>' +
                '<p class="text-sm text-slate-500 mt-1">Enter category details</p>' +
            '</div>' +
            '<form id="add-category-form" class="px-6 py-4 space-y-4">' +
                '<div class="grid grid-cols-3 gap-3">' +
                    '<div>' +
                        '<label class="block text-xs font-medium text-slate-700 mb-1">Code</label>' +
                        '<input type="text" name="code" placeholder="2001" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500" required>' +
                    '</div>' +
                    '<div class="col-span-2">' +
                        '<label class="block text-xs font-medium text-slate-700 mb-1">Category Name</label>' +
                        '<input type="text" name="name" placeholder="Teacher Salaries" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500" required>' +
                    '</div>' +
                '</div>' +
                '<div>' +
                    '<label class="block text-xs font-medium text-slate-700 mb-1">Description</label>' +
                    '<input type="text" name="description" placeholder="Monthly teacher salary payments" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500">' +
                '</div>' +
            '</form>' +
            '<div class="px-6 py-4 border-t border-slate-200 flex justify-end gap-3">' +
                '<button type="button" id="cancel-category-btn" class="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg">Cancel</button>' +
                '<button type="button" id="save-category-btn" class="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg">Add Category</button>' +
            '</div>' +
        '</div>';

        document.body.appendChild(modal);

        const firstInput = modal.querySelector('input[name="code"]');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }

        const form = modal.querySelector('#add-category-form');
        const saveBtn = modal.querySelector('#save-category-btn');
        const cancelBtn = modal.querySelector('#cancel-category-btn');

        const submitForm = () => {
            const formData = new FormData(form);
            const code = (formData.get('code') || '').trim();
            const name = (formData.get('name') || '').trim();

            if (!code || !name) {
                showNotification('Code and name are required', 'error');
                return;
            }

            const categoryFullName = code + ' - ' + name;

            if (expenseData.categories.some(c => c === categoryFullName)) {
                showNotification('Category already exists', 'error');
                return;
            }

            expenseData.categories.push(categoryFullName);
            updateCategorySelects();
            saveCategoriesToStorage();
            modal.remove();
            showNotification('Category added successfully', 'success');
        };

        saveBtn.addEventListener('click', submitForm);
        cancelBtn.addEventListener('click', () => modal.remove());

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            submitForm();
        });

        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    /**
     * Show notification
     */
    function showNotification(message, type) {
        if (window.showNotification) {
            window.showNotification(message, type);
            return;
        }

        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 ' +
            (type === 'success' ? 'bg-emerald-500 text-white' :
             type === 'error' ? 'bg-red-500 text-white' :
             'bg-blue-500 text-white');
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    /**
     * Delete expense
     */
    async function deleteExpense(expenseId) {
        if (!confirm('Are you sure you want to delete this expense record?')) return;

        try {
            const response = await fetch('/api/expensemanagement/expenses/' + expenseId, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + (getAuthToken() || '')
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'HTTP error! status: ' + response.status);
            }

            const result = await response.json();

            if (result.success) {
                expenseData.expenses = expenseData.expenses.filter(e => e.id !== expenseId);
                calculateExpenseStats();
                updateStatCards();
                updateExpenseRecords();
                showNotification('Expense record deleted successfully', 'success');
            } else {
                throw new Error(result.message || 'Failed to delete expense record');
            }

        } catch (error) {
            console.error('Error deleting expense:', error);
            showNotification(error.message || 'Failed to delete expense record', 'error');
        }
    }

    /**
     * Delete category
     */
    function deleteCategory(categoryName) {
        if (!confirm('Are you sure you want to delete the "' + categoryName + '" category?')) return;

        const hasTransactions = expenseData.expenses.some(e => e.category === categoryName);
        if (hasTransactions) {
            showNotification('Cannot delete category with existing transactions', 'error');
            return;
        }

        expenseData.categories = expenseData.categories.filter(c => c !== categoryName);
        updateCategorySelects();
        saveCategoriesToStorage();
        showNotification('Category deleted successfully', 'success');
    }

    /**
     * Save categories to storage
     */
    function saveCategoriesToStorage() {
        localStorage.setItem('shikola_expense_categories_v1', JSON.stringify(expenseData.categories));
    }

    /**
     * Load categories from storage
     */
    function loadCategoriesFromStorage() {
        const storedCategories = localStorage.getItem('shikola_expense_categories_v1');
        if (storedCategories) {
            expenseData.categories = JSON.parse(storedCategories);
        }
    }

    /**
     * Format date
     */
    function formatDate(dateString) {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            return dateString;
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initExpenseManagement);
    } else {
        initExpenseManagement();
    }

    // Expose functions for global access
    window.ExpenseManagement = {
        loadData: loadExpenseData,
        refresh: () => {
            loadExpenseData();
            loadExpenseCategories();
        },
        editExpense: (id) => showNotification('Edit functionality coming soon', 'info'),
        deleteExpense: deleteExpense,
        deleteCategory: deleteCategory,
        viewCategoryTransactions: (category) => showNotification('View transactions: ' + category, 'info')
    };

    // Also expose global functions for onclick handlers
    window.handleRecordExpense = handleAddExpense;
    window.handleClearExpenseForm = handleClearForm;
    window.handleExportExpenses = handleExportData;
    window.handleAddCategory = handleAddCategory;

})();
