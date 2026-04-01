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
(function() {
    'use strict';

    // Global state management
    const FeesManagement = {
        currentData: {
            invoices: [],
            payments: [],
            feeStructures: [],
            students: [],
            banks: []
        },
        ui: {
            activeTab: 'fee-structure',
            selectedStudents: [],
            selectedInvoices: [],
            searchResults: []
        },
        config: {
            apiBaseUrl: window.SHIKOLA_API_BASE || '/api',
            schoolId: window.currentSchoolId || null
        }
    };

    // Utility functions
    function generateReferenceNumber(prefix = 'REF') {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 5).toUpperCase();
        return `${prefix}${timestamp}${random}`;
    }

    function generateReceiptNumber() {
        return generateReferenceNumber('RCP');
    }

    function generateInvoiceNumber() {
        return generateReferenceNumber('INV');
    }

    function formatCurrency(amount) {
        return new Intl.NumberFormat('en-ZM', {
            style: 'currency',
            currency: 'ZMW',
            minimumFractionDigits: 2
        }).format(amount || 0);
    }

    function formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-ZM');
    }

    function showNotification(message, type = 'info') {
        if (window.showNotification) {
            window.showNotification(message, type);
        } else if (window.Alpine && window.Alpine.store) {
            window.Alpine.store('notifications').add(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }

    // API functions using real backend only
    async function apiRequest(endpoint, options = {}) {
        if (!canUseApi()) {
            throw new Error('API not configured. Please check your connection.');
        }
        
        // Map the endpoint to the correct ShikolaAPI method
        try {
            if (endpoint.includes('/fee-structures')) {
                const response = await window.ShikolaAPI.adminFees.listFeeStructures(options);
                return response || { data: [] };
            } else if (endpoint.includes('/students')) {
                const response = await window.ShikolaAPI.adminFees.listStudents(options);
                return response || { data: [] };
            } else if (endpoint.includes('/fees/invoices')) {
                if (options.method === 'POST') {
                    const response = await window.ShikolaAPI.adminFees.createInvoice(JSON.parse(options.body));
                    return response;
                } else {
                    const response = await window.ShikolaAPI.adminFees.listInvoices(options);
                    return response || { data: [] };
                }
            } else if (endpoint.includes('/fees/payments')) {
                if (options.method === 'POST') {
                    const response = await window.ShikolaAPI.adminFees.recordPayment(JSON.parse(options.body));
                    return response;
                } else {
                    const response = await window.ShikolaAPI.adminFees.listPayments(options);
                    return response || { data: [] };
                }
            } else if (endpoint.includes('/banks')) {
                const response = await window.ShikolaAPI.adminFees.listBanks(options);
                return response || { data: [] };
            } else if (endpoint.includes('/fees/defaulters')) {
                const response = await window.ShikolaAPI.adminFees.listDefaulters(options);
                return response || { data: [] };
            } else if (endpoint.includes('/fees/summary')) {
                const response = await window.ShikolaAPI.adminFees.getFeesSummary(options);
                return response || { data: null };
            } else {
                throw new Error(`Unknown endpoint: ${endpoint}`);
            }
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    function getAuthToken() {
        try {
            return localStorage.getItem('authToken') || 
                   localStorage.getItem('shikola_token') || 
                   sessionStorage.getItem('authToken') || 
                   null;
        } catch (e) {
            return null;
        }
    }

    function canUseApi() {
        return !!(window.ShikolaAPI && window.ShikolaAPI.adminFees && getAuthToken());
    }

    // Data loading functions
    async function loadFeeStructures() {
        try {
            const response = await apiRequest('/feesmanagement/fee-structures');
            FeesManagement.currentData.feeStructures = response.data || [];
            return FeesManagement.currentData.feeStructures;
        } catch (error) {
            console.error('Failed to load fee structures:', error);
            FeesManagement.currentData.feeStructures = [];
            throw error;
        }
    }

    async function loadStudents() {
        try {
            const response = await apiRequest('/feesmanagement/students');
            FeesManagement.currentData.students = response.data || [];
            return FeesManagement.currentData.students;
        } catch (error) {
            console.error('Failed to load students:', error);
            FeesManagement.currentData.students = [];
            throw error;
        }
    }

    async function loadInvoices() {
        try {
            const response = await apiRequest('/feesmanagement/fees/invoices');
            FeesManagement.currentData.invoices = response.data || [];
            return FeesManagement.currentData.invoices;
        } catch (error) {
            console.error('Failed to load invoices:', error);
            FeesManagement.currentData.invoices = [];
            throw error;
        }
    }

    async function loadPayments() {
        try {
            const response = await apiRequest('/feesmanagement/fees/payments');
            FeesManagement.currentData.payments = response.data || [];
            return FeesManagement.currentData.payments;
        } catch (error) {
            console.error('Failed to load payments:', error);
            FeesManagement.currentData.payments = [];
            throw error;
        }
    }

    async function loadBanks() {
        try {
            const response = await apiRequest('/feesmanagement/banks');
            FeesManagement.currentData.banks = response.data || [];
            return FeesManagement.currentData.banks;
        } catch (error) {
            console.error('Failed to load banks:', error);
            FeesManagement.currentData.banks = [];
            throw error;
        }
    }

    async function loadDefaulters() {
        try {
            const response = await apiRequest('/feesmanagement/fees/defaulters');
            return response.data || [];
        } catch (error) {
            console.error('Failed to load defaulters:', error);
            return [];
        }
    }

    async function loadFeesSummary() {
        try {
            const response = await apiRequest('/feesmanagement/fees/summary');
            return response.data;
        } catch (error) {
            console.error('Failed to load fees summary:', error);
            return null;
        }
    }

    // Search and autocomplete functionality
    function initializeStudentSearch() {
        const searchInput = document.getElementById('student-name-id');
        const suggestionsContainer = document.getElementById('student-search-suggestions');
        
        if (!searchInput || !suggestionsContainer) return;

        searchInput.addEventListener('input', async function(e) {
            const query = e.target.value.trim();
            
            if (query.length < 2) {
                suggestionsContainer.classList.add('hidden');
                return;
            }

            try {
                const students = await searchStudents(query);
                displayStudentSuggestions(students, suggestionsContainer, searchInput);
            } catch (error) {
                console.error('Search error:', error);
            }
        });

        // Hide suggestions when clicking outside
        document.addEventListener('click', function(e) {
            if (!searchInput.contains(e.target) && !suggestionsContainer.contains(e.target)) {
                suggestionsContainer.classList.add('hidden');
            }
        });
    }

    async function searchStudents(query) {
        const students = FeesManagement.currentData.students;
        const lowerQuery = query.toLowerCase();
        
        return students.filter(student => 
            (student.firstName && student.firstName.toLowerCase().includes(lowerQuery)) ||
            (student.lastName && student.lastName.toLowerCase().includes(lowerQuery)) ||
            (student.studentId && student.studentId.toLowerCase().includes(lowerQuery)) ||
            (student.className && student.className.toLowerCase().includes(lowerQuery))
        ).slice(0, 10);
    }

    function displayStudentSuggestions(students, container, searchInput) {
        container.innerHTML = '';
        
        if (students.length === 0) {
            container.innerHTML = `
                <div class="p-3 text-center text-slate-500">
                    <i class="fas fa-search mb-2"></i>
                    <p>No students found</p>
                </div>
            `;
            container.classList.remove('hidden');
            return;
        }

        students.forEach(student => {
            const item = document.createElement('div');
            item.className = 'px-3 py-2 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-b-0';
            item.innerHTML = `
                <div class="flex items-center justify-between">
                    <div>
                        <div class="font-medium text-slate-800">${student.firstName} ${student.lastName}</div>
                        <div class="text-xs text-slate-500">ID: ${student.studentId} | Class: ${student.className || 'N/A'}</div>
                    </div>
                    <div class="text-xs text-slate-400">
                        ${student.outstandingFees ? formatCurrency(student.outstandingFees) : 'No outstanding fees'}
                    </div>
                </div>
            `;
            
            item.addEventListener('click', () => selectStudent(student, searchInput, container));
            container.appendChild(item);
        });

        container.classList.remove('hidden');
    }

    function selectStudent(student, searchInput, suggestionsContainer) {
        searchInput.value = `${student.firstName} ${student.lastName} (${student.studentId})`;
        searchInput.dataset.selectedStudent = JSON.stringify(student);
        suggestionsContainer.classList.add('hidden');
        
        // Load outstanding fees for this student
        loadStudentOutstandingFees(student);
    }

    async function loadStudentOutstandingFees(student) {
        try {
            // Get outstanding fees for the selected student
            const studentInvoices = FeesManagement.currentData.invoices.filter(inv => 
                inv.studentId === student.id && inv.status !== 'Paid'
            );
            
            const outstandingFees = studentInvoices.map(invoice => ({
                id: invoice.id,
                description: `${invoice.invoiceNumber} - ${invoice.period}`,
                amount: parseFloat(invoice.totalAmount) || 0,
                dueDate: invoice.dueDate
            }));
            
            displayOutstandingFees(outstandingFees);
        } catch (error) {
            console.error('Failed to load outstanding fees:', error);
        }
    }

    function displayOutstandingFees(fees) {
        const container = document.getElementById('collect-outstanding-list');
        if (!container) return;

        container.innerHTML = '';

        if (fees.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4 text-slate-500">
                    <i class="fas fa-check-circle text-2xl mb-2"></i>
                    <p>No outstanding fees</p>
                </div>
            `;
            updatePaymentSummary(0, 0);
            return;
        }

        let totalDue = 0;
        fees.forEach(fee => {
            totalDue += fee.amount || 0;
            
            const feeItem = document.createElement('div');
            feeItem.className = 'flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200';
            feeItem.innerHTML = `
                <div class="flex items-center gap-3">
                    <input type="checkbox" class="rounded border-slate-300 text-emerald-600 focus:ring-emerald-400" 
                           data-fee-id="${fee.id}" data-fee-amount="${fee.amount}" onchange="updatePaymentSummary()">
                    <div>
                        <div class="text-xs font-medium text-slate-800">${fee.description}</div>
                        <div class="text-[11px] text-slate-500">Due: ${formatDate(fee.dueDate)}</div>
                    </div>
                </div>
                <div class="text-right">
                    <div class="text-xs font-semibold text-orange-600">${formatCurrency(fee.amount)}</div>
                    <div class="text-[11px] text-slate-500">Outstanding</div>
                </div>
            `;
            container.appendChild(feeItem);
        });

        updatePaymentSummary(totalDue, 0);
    }

    function updatePaymentSummary(totalDue = null, amountPaid = null) {
        const totalDueEl = document.querySelector('[data-fees-total-due]');
        const amountPaidEl = document.querySelector('[data-fees-amount-paid]');
        const balanceEl = document.querySelector('[data-fees-balance]');
        
        if (totalDue === null) {
            // Calculate from checked items
            const checkboxes = document.querySelectorAll('#collect-outstanding-list input[type="checkbox"]:checked');
            totalDue = Array.from(checkboxes).reduce((sum, cb) => sum + parseFloat(cb.dataset.feeAmount || 0), 0);
        }
        
        if (amountPaid === null) {
            const amountInput = document.getElementById('amount-paid');
            amountPaid = parseFloat(amountInput?.value) || 0;
        }
        
        const balance = totalDue - amountPaid;
        
        if (totalDueEl) totalDueEl.textContent = formatCurrency(totalDue);
        if (amountPaidEl) amountPaidEl.textContent = formatCurrency(amountPaid);
        if (balanceEl) {
            balanceEl.textContent = formatCurrency(balance);
            balanceEl.className = balance > 0 ? 'font-semibold text-orange-600' : 'font-semibold text-emerald-600';
        }
    }

    // Fee structure management
    function renderFeeStructures() {
        const container = document.querySelector('[data-fee-structures-list]');
        if (!container) return;

        const structures = FeesManagement.currentData.feeStructures;
        
        if (structures.length === 0) {
            container.innerHTML = `
                <div class="text-center py-12">
                    <i class="fas fa-money-bill-wave text-4xl text-slate-300 mb-3"></i>
                    <p class="text-sm text-slate-500">No fee structures defined</p>
                    <p class="text-xs text-slate-400 mt-1">Click "Add Fee Type" to create your first fee structure</p>
                </div>
            `;
            return;
        }

        container.innerHTML = structures.map(structure => `
            <div class="px-4 py-3 grid grid-cols-12 gap-2 items-center border-b border-slate-100">
                <div class="col-span-3">
                    <div class="text-xs font-medium text-slate-800">${structure.name}</div>
                    <div class="text-[11px] text-slate-500">${structure.description || ''}</div>
                </div>
                <div class="col-span-2">
                    <span class="text-xs text-slate-600">${structure.gradeLevel || 'All'}</span>
                </div>
                <div class="col-span-2">
                    <span class="text-xs font-semibold text-slate-800">${formatCurrency(structure.amount)}</span>
                </div>
                <div class="col-span-2">
                    <span class="text-xs text-slate-600">${structure.frequency || 'Monthly'}</span>
                </div>
                <div class="col-span-2">
                    <span class="inline-flex px-2 py-1 text-xs rounded-full ${
                        structure.status === 'Active' 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : 'bg-slate-100 text-slate-600'
                    }">
                        ${structure.status || 'Active'}
                    </span>
                </div>
                <div class="col-span-1">
                    <div class="flex gap-1">
                        <button class="text-blue-500 hover:text-blue-700" onclick="editFeeStructure('${structure.id}')">
                            <i class="fas fa-edit text-xs"></i>
                        </button>
                        <button class="text-red-500 hover:text-red-700" onclick="deleteFeeStructure('${structure.id}')">
                            <i class="fas fa-trash text-xs"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Invoice generation
    async function generateInvoice() {
        try {
            if (!canUseApi()) {
                showNotification('Invoice generation requires backend connection. Please check your internet connection.', 'error');
                return;
            }

            const studentSelect = document.getElementById('invoice-students-select');
            const periodSelect = document.getElementById('invoice-period-select');
            const dueDateInput = document.getElementById('invoice-due-date');
            
            if (!studentSelect.value || !periodSelect.value || !dueDateInput.value) {
                showNotification('Please fill in all required fields', 'error');
                return;
            }

            // Get selected fee items
            const feeItems = [];
            document.querySelectorAll('[data-fee-item] input[type="checkbox"]:checked').forEach(checkbox => {
                const label = checkbox.closest('[data-fee-item]');
                feeItems.push({
                    id: label.dataset.feeItem,
                    name: label.dataset.feeItemName,
                    amount: parseFloat(label.dataset.feeAmount),
                    term: label.dataset.feeTerm
                });
            });

            if (feeItems.length === 0) {
                showNotification('Please select at least one fee item', 'error');
                return;
            }

            const invoiceData = {
                invoiceNumber: generateInvoiceNumber(),
                studentSelection: studentSelect.value,
                period: periodSelect.value,
                dueDate: dueDateInput.value,
                feeItems: feeItems,
                paymentMethods: getSelectedPaymentMethods(),
                totalAmount: feeItems.reduce((sum, item) => sum + item.amount, 0)
            };

            const response = await apiRequest('/accountant/fees/invoices', {
                method: 'POST',
                body: invoiceData
            });

            if (response.success) {
                showNotification('Invoice generated successfully', 'success');
                await loadInvoices();
                renderInvoices();
                
                // Clear form
                studentSelect.value = '';
                periodSelect.value = '';
                dueDateInput.value = '';
                document.querySelectorAll('[data-fee-item] input[type="checkbox"]').forEach(cb => cb.checked = false);
            }
        } catch (error) {
            console.error('Failed to generate invoice:', error);
            showNotification('Failed to generate invoice. Please try again.', 'error');
        }
    }

    function getSelectedPaymentMethods() {
        const methods = [];
        document.querySelectorAll('input[type="checkbox"][value*="cash"], input[type="checkbox"][value*="bank"], input[type="checkbox"][value*="mobile"]').forEach(checkbox => {
            if (checkbox.checked) {
                methods.push(checkbox.value);
            }
        });
        return methods;
    }

    // Payment processing
    async function processPayment() {
        try {
            if (!canUseApi()) {
                showNotification('Payment processing requires backend connection. Please check your internet connection.', 'error');
                return;
            }

            const searchInput = document.getElementById('student-name-id');
            const paymentMethod = document.getElementById('payment-method');
            const paymentBank = document.getElementById('payment-bank');
            const amountPaid = document.getElementById('amount-paid');
            const paymentDate = document.getElementById('payment-date');
            const referenceNumber = document.getElementById('reference-number');

            // Validate inputs
            if (!searchInput.dataset.selectedStudent) {
                showNotification('Please select a student', 'error');
                return;
            }

            if (!paymentMethod.value) {
                showNotification('Please select payment method', 'error');
                return;
            }

            if (!amountPaid.value || parseFloat(amountPaid.value) <= 0) {
                showNotification('Please enter valid amount', 'error');
                return;
            }

            if (!paymentDate.value) {
                showNotification('Please select payment date', 'error');
                return;
            }

            // Get selected fee items
            const selectedFees = [];
            document.querySelectorAll('#collect-outstanding-list input[type="checkbox"]:checked').forEach(checkbox => {
                selectedFees.push({
                    id: checkbox.dataset.feeId,
                    amount: parseFloat(checkbox.dataset.feeAmount)
                });
            });

            if (selectedFees.length === 0) {
                showNotification('Please select at least one fee item', 'error');
                return;
            }

            const student = JSON.parse(searchInput.dataset.selectedStudent);
            const paymentData = {
                receiptNumber: generateReceiptNumber(),
                referenceNumber: referenceNumber.value || generateReferenceNumber('PYM'),
                studentId: student.id,
                paymentMethod: paymentMethod.value,
                bankAccount: paymentBank.value,
                amount: parseFloat(amountPaid.value),
                paymentDate: paymentDate.value,
                feeItems: selectedFees
            };

            const response = await apiRequest('/accountant/fees/payments', {
                method: 'POST',
                body: paymentData
            });

            if (response.success) {
                showNotification('Payment processed successfully', 'success');
                
                // Generate receipt
                generateReceipt(response.data);
                
                // Clear form
                searchInput.value = '';
                searchInput.dataset.selectedStudent = '';
                paymentMethod.value = '';
                paymentBank.value = '';
                amountPaid.value = '';
                paymentDate.value = '';
                referenceNumber.value = '';
                document.querySelectorAll('#collect-outstanding-list input[type="checkbox"]').forEach(cb => cb.checked = false);
                
                // Reload data
                await loadPayments();
                renderPaymentHistory();
                renderReceipts();
            }
        } catch (error) {
            console.error('Failed to process payment:', error);
            showNotification('Failed to process payment. Please try again.', 'error');
        }
    }

    function generateReceipt(payment) {
        // Get school profile for dynamic school details
        const schoolProfile = window.ShikolaSchoolProfile ? window.ShikolaSchoolProfile.getProfile() : null;
        
        // Update receipt preview with school details
        const receiptFields = document.querySelectorAll('[data-receipt-field]');
        receiptFields.forEach(field => {
            const fieldName = field.dataset.receiptField;
            let value = '';
            
            switch(fieldName) {
                case 'number':
                    value = payment.receiptNumber || generateReceiptNumber();
                    break;
                case 'pupil-name':
                    value = payment.studentName || payment.pupilName;
                    break;
                case 'class':
                    value = payment.className || payment.classLabel;
                    break;
                case 'date':
                    value = formatDate(payment.paymentDate || payment.date);
                    break;
                case 'method':
                    value = payment.paymentMethod;
                    break;
                case 'amount':
                    value = formatCurrency(payment.amount || payment.amountPaid);
                    break;
            }
            
            field.textContent = value;
        });

        // Update school details in receipt - use actual school profile or show "No School Configured"
        if (schoolProfile) {
            // Update school name
            const schoolNameElements = document.querySelectorAll('[data-school-name]');
            schoolNameElements.forEach(el => {
                if (el.textContent) {
                    el.textContent = schoolProfile.name || 'School Name Not Set';
                }
            });

            // Update school tagline
            const schoolTaglineElements = document.querySelectorAll('[data-school-tagline]');
            schoolTaglineElements.forEach(el => {
                if (el.textContent) {
                    el.textContent = schoolProfile.tagline || 'School Tagline Not Set';
                }
            });

            // Update school address
            const schoolAddressElements = document.querySelectorAll('[data-school-address]');
            schoolAddressElements.forEach(el => {
                if (el.textContent) {
                    el.textContent = schoolProfile.address || 'School Address Not Set';
                }
            });

            // Update school logo if available
            const schoolLogoElements = document.querySelectorAll('[data-school-logo]');
            schoolLogoElements.forEach(img => {
                if (schoolProfile.logoDataUrl) {
                    img.src = schoolProfile.logoDataUrl;
                    img.onerror = function() {
                        console.warn('Failed to load school logo in receipt, using fallback');
                        img.src = '../../assets/images/logo.png';
                    };
                } else {
                    // Use default logo only if no custom logo is set
                    img.src = '../../assets/images/logo.png';
                }
            });
        } else {
            // No school profile configured - show appropriate defaults
            console.warn('No school profile configured, using defaults');
            const schoolNameElements = document.querySelectorAll('[data-school-name]');
            schoolNameElements.forEach(el => {
                if (el.textContent) {
                    el.textContent = 'School Name Not Configured';
                }
            });
        }

        // Update authorised signatory to show accountant
        const signatoryElements = document.querySelectorAll('[data-authorised-signatory]');
        signatoryElements.forEach(el => {
            if (el.textContent) {
                el.textContent = 'Accountant';
            }
        });

        // Generate QR code for receipt verification
        const qrContainer = document.getElementById('fee-receipt-qr');
        if (qrContainer && window.QRCode) {
            qrContainer.innerHTML = '';
            const receiptNumber = payment.receiptNumber || generateReceiptNumber();
            new QRCode(qrContainer, {
                text: receiptNumber,
                width: 80,
                height: 80
            });
        }

        // Show receipt in sidebar
        const receiptPreview = document.querySelector('[aria-label="Receipt preview (accountant copy)"]');
        if (receiptPreview) {
            receiptPreview.scrollIntoView({ behavior: 'smooth' });
        }
    }

    // Export data functionality
    async function exportData(format, type) {
        try {
            let data = [];
            let filename = '';
            
            // Get data based on type
            switch(type) {
                case 'fee-structures':
                    data = FeesManagement.currentData.feeStructures;
                    filename = `fee-structures-${new Date().toISOString().split('T')[0]}`;
                    break;
                case 'receipts':
                    data = FeesManagement.currentData.payments;
                    filename = `fee-receipts-${new Date().toISOString().split('T')[0]}`;
                    break;
                case 'payment-history':
                    data = FeesManagement.currentData.payments;
                    filename = `payment-history-${new Date().toISOString().split('T')[0]}`;
                    break;
                case 'defaulters':
                    data = FeesManagement.currentData.defaulters;
                    filename = `fee-defaulters-${new Date().toISOString().split('T')[0]}`;
                    break;
                default:
                    data = [];
                    filename = `fees-data-${new Date().toISOString().split('T')[0]}`;
            }
            
            if (format === 'csv') {
                exportToCSV(data, filename);
            } else if (format === 'pdf') {
                await exportToPDF(data, filename, type);
            }
            
            showNotification(`Data exported successfully as ${format.toUpperCase()}`, 'success');
        } catch (error) {
            console.error('Export failed:', error);
            showNotification('Export failed. Please try again.', 'error');
        }
    }
                    // Export to CSV
    function exportToCSV(data, filename) {
        if (!data || data.length === 0) {
            showNotification('No data available to export', 'warning');
            return;
        }
        
        // Convert data to CSV
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => {
                const value = row[header];
                // Handle values that might contain commas
                if (typeof value === 'string' && value.includes(',')) {
                    return `"${value}"`;
                }
                return value || '';
            }).join(','))
        ].join('\n');
        
        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    // Export to PDF (direct download)
    async function exportToPDF(data, filename, type) {
        if (!data || data.length === 0) {
            showNotification('No data available to export', 'warning');
            return;
        }
        
        try {
            // Create PDF content
            const schoolProfile = window.ShikolaSchoolProfile ? window.ShikolaSchoolProfile.getProfile() : null;
            const schoolName = schoolProfile?.name || 'School Name Not Configured';
            
            // Simple PDF generation using browser print functionality
            const printWindow = window.open('', '_blank');
            let htmlContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>${filename}</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        h1 { color: #333; }
                        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f4f4f4; }
                        .header { text-align: center; margin-bottom: 30px; }
                        .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>${schoolName}</h1>
                        <h2>${type.replace('-', ' ').toUpperCase()} REPORT</h2>
                        <p>Generated: ${new Date().toLocaleDateString()}</p>
                    </div>
                    <table>
                        <thead>
                            <tr>
            `;
            
            // Add headers
            const headers = Object.keys(data[0]);
            headers.forEach(header => {
                htmlContent += `<th>${header.replace(/_/g, ' ').toUpperCase()}</th>`;
            });
            htmlContent += `
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            // Add data rows
            data.forEach(row => {
                htmlContent += '<tr>';
                headers.forEach(header => {
                    htmlContent += `<td>${row[header] || ''}</td>`;
                });
                htmlContent += '</tr>';
            });
            
            htmlContent += `
                        </tbody>
                    </table>
                    <div class="footer">
                        <p>Report generated by Shikola School Management System</p>
                    </div>
                </body>
                </html>
            `;
            
            printWindow.document.write(htmlContent);
            printWindow.document.close();
            
            // Wait for content to load, then trigger print and close
            printWindow.onload = function() {
                setTimeout(() => {
                    printWindow.print();
                    printWindow.close();
                }, 500);
            };
            
        } catch (error) {
            console.error('PDF export failed:', error);
            throw error;
        }
    }

    // Helper functions
    function formatDate(date) {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    function formatCurrency(amount) {
        return new Intl.NumberFormat('en-ZM', { 
            style: 'currency', 
            currency: 'ZMW',
            minimumFractionDigits: 2
        }).format(amount || 0);
    }

    function generateInvoiceNumber() {
        const now = new Date();
        const year = now.getFullYear();
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `INV-${year}-${random}`;
    }

    function generateReceiptNumber() {
        const now = new Date();
        const year = now.getFullYear();
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `RCP-${year}-${random}`;
    }

    function generateReferenceNumber(prefix = 'REF') {
        const now = new Date();
        const year = now.getFullYear();
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `${prefix}-${year}-${random}`;
    }

    function generateId(prefix, counters) {
        const counter = counters && typeof counters[prefix] === 'number' ? counters[prefix] : 1;
        const year = new Date().getFullYear();
        const padded = String(counter).padStart(4, '0');
        const id = prefix.toUpperCase() + '-' + year + '-' + padded;
        if (counters) {
            counters[prefix] = counter + 1;
        }
        return id;
    }

    // Update payment summary
    function updatePaymentSummary() {
        const amountInput = document.getElementById('amount-paid');
        const totalDueElement = document.querySelector('[data-fees-total-due]');
        const balanceElement = document.querySelector('[data-fees-balance]');
        
        if (amountInput && totalDueElement && balanceElement) {
            const amountPaid = parseFloat(amountInput.value) || 0;
            const totalDue = parseFloat(totalDueElement.textContent.replace(/[^0-9.-]/g, '')) || 0;
            const balance = totalDue - amountPaid;
            
            balanceElement.textContent = formatCurrency(balance);
            balanceElement.className = balance > 0 ? 'text-orange-600 font-semibold' : 'text-emerald-600 font-semibold';
        }
    }

    // Send reminders function
    async function sendReminders() {
        try {
            if (!canUseApi()) {
                showNotification('Sending reminders requires backend connection', 'error');
                return;
            }

            const defaulters = FeesManagement.currentData.defaulters;
            if (!defaulters || defaulters.length === 0) {
                showNotification('No defaulters to send reminders to', 'info');
                return;
            }

            // Send reminders to defaulters
            const response = await apiRequest('/feesmanagement/send-reminders', {
                method: 'POST',
                body: { defaulterIds: defaulters.map(d => d.id) }
            });

            if (response.success) {
                showNotification(`Reminders sent to ${defaulters.length} pupils`, 'success');
            }
        } catch (error) {
            console.error('Failed to send reminders:', error);
            showNotification('Failed to send reminders', 'error');
        }
    }

    // Search pupils function
    async function searchPupils(query) {
        try {
            const response = await apiRequest(`/students/search?q=${encodeURIComponent(query)}`);
            return response.data || [];
        } catch (error) {
            console.error('Pupil search failed:', error);
            return [];
        }
    }

    // Initialize student search
    function initializeStudentSearch() {
        // Student search functionality would be implemented here
        console.log('Student search initialized');
    }

    // Get export type from context
    function getExportTypeFromContext(button) {
        const section = button.closest('section');
        if (section) {
            if (section.querySelector('[data-fee-structures-list]')) return 'fee-structures';
            if (section.querySelector('#fee-receipts-list')) return 'receipts';
            if (section.querySelector('#fee-payment-history')) return 'payment-history';
            if (section.querySelector('[data-defaulters-list]')) return 'defaulters';
        }
        return 'general';
    }

    function downloadFile(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Data retrieval functions
    async function getDefaultersData() {
        try {
            const response = await apiRequest('/accountant/fees/defaulters');
            return response.data.map(defaulter => ({
                'Student Name': `${defaulter.firstName} ${defaulter.lastName}`,
                'Student ID': defaulter.studentId,
                'Grade': defaulter.className,
                'Outstanding Amount': formatCurrency(defaulter.outstandingAmount),
                'Days Overdue': defaulter.daysOverdue,
                'Last Contact': formatDate(defaulter.lastContact)
            }));
        } catch (error) {
            return [];
        }
    }

    function getReceiptsData() {
        return FeesManagement.currentData.payments.map(payment => ({
            'Receipt #': payment.receiptNumber,
            'Student Name': payment.studentName,
            'Amount': formatCurrency(payment.amount),
            'Date': formatDate(payment.paymentDate),
            'Payment Method': payment.paymentMethod,
            'Status': payment.status
        }));
    }

    function getPaymentHistoryData() {
        return FeesManagement.currentData.payments.map(payment => ({
            'Date': formatDate(payment.paymentDate),
            'Student Name': payment.studentName,
            'Payment Type': payment.paymentType || 'Fee Payment',
            'Amount': formatCurrency(payment.amount),
            'Method': payment.paymentMethod,
            'Status': payment.status
        }));
    }

    // Send reminders functionality
    async function sendReminders() {
        try {
            const selectedDefaulters = getSelectedDefaulters();
            
            if (selectedDefaulters.length === 0) {
                showNotification('Please select defaulters to send reminders', 'error');
                return;
            }

            const response = await apiRequest('/accountant/fees/send-reminders', {
                method: 'POST',
                body: {
                    defaulters: selectedDefaulters,
                    message: 'Reminder: You have outstanding school fees that require immediate attention.'
                }
            });

            if (response.success) {
                showNotification(`Reminders sent to ${selectedDefaulters.length} parents/guardians`, 'success');
            }
        } catch (error) {
            console.error('Failed to send reminders:', error);
        }
    }

    function getSelectedDefaulters() {
        const selected = [];
        document.querySelectorAll('[data-defaulter-checkbox]:checked').forEach(checkbox => {
            selected.push(checkbox.dataset.defaulterId);
        });
        return selected;
    }

    // Rendering functions
    function renderInvoices() {
        const container = document.querySelector('[data-invoices-list]');
        if (!container) return;

        const invoices = FeesManagement.currentData.invoices;
        
        if (invoices.length === 0) {
            container.innerHTML = `
                <div class="text-center py-12">
                    <i class="fas fa-file-invoice text-4xl text-slate-300 mb-3"></i>
                    <p class="text-sm text-slate-500">No invoices generated</p>
                </div>
            `;
            return;
        }

        container.innerHTML = invoices.map(invoice => `
            <div class="px-4 py-3 grid grid-cols-12 gap-2 items-center border-b border-slate-100">
                <div class="col-span-3">
                    <div class="text-xs font-medium text-slate-800">${invoice.invoiceNumber}</div>
                    <div class="text-[11px] text-slate-500">${invoice.studentName}</div>
                </div>
                <div class="col-span-2">
                    <span class="text-xs text-slate-600">${invoice.period}</span>
                </div>
                <div class="col-span-2">
                    <span class="text-xs font-semibold text-slate-800">${formatCurrency(invoice.totalAmount)}</span>
                </div>
                <div class="col-span-2">
                    <span class="text-xs text-slate-600">${formatDate(invoice.dueDate)}</span>
                </div>
                <div class="col-span-2">
                    <span class="inline-flex px-2 py-1 text-xs rounded-full ${
                        invoice.status === 'Paid' 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : invoice.status === 'Partial'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-red-100 text-red-700'
                    }">
                        ${invoice.status}
                    </span>
                </div>
                <div class="col-span-1">
                    <div class="flex gap-1">
                        <button class="text-blue-500 hover:text-blue-700" onclick="viewInvoice('${invoice.id}')">
                            <i class="fas fa-eye text-xs"></i>
                        </button>
                        <button class="text-emerald-500 hover:text-emerald-700" onclick="printInvoice('${invoice.id}')">
                            <i class="fas fa-print text-xs"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    function renderReceipts() {
        const container = document.getElementById('fee-receipts-list');
        if (!container) return;

        const payments = FeesManagement.currentData.payments;
        
        if (payments.length === 0) {
            container.innerHTML = `
                <div class="text-center py-12">
                    <i class="fas fa-receipt text-4xl text-slate-300 mb-3"></i>
                    <p class="text-sm text-slate-500">No fee receipts recorded</p>
                    <p class="text-xs text-slate-400 mt-1">Fee receipts will appear here when payments are recorded</p>
                </div>
            `;
            return;
        }

        container.innerHTML = payments.map(payment => `
            <div class="px-4 py-3 grid grid-cols-12 gap-2 items-center border-b border-slate-100 cursor-pointer hover:bg-slate-50" onclick="selectReceipt('${payment.id}')">
                <div class="col-span-2">
                    <div class="text-xs font-medium text-slate-800">${payment.receiptNumber}</div>
                </div>
                <div class="col-span-3">
                    <div class="text-xs font-medium text-slate-800">${payment.studentName}</div>
                    <div class="text-[11px] text-slate-500">${payment.studentId}</div>
                </div>
                <div class="col-span-2">
                    <span class="text-xs font-semibold text-emerald-600">${formatCurrency(payment.amount)}</span>
                </div>
                <div class="col-span-2">
                    <span class="text-xs text-slate-600">${formatDate(payment.paymentDate)}</span>
                </div>
                <div class="col-span-2">
                    <span class="text-xs text-slate-600">${payment.paymentMethod}</span>
                </div>
                <div class="col-span-1">
                    <div class="flex gap-1">
                        <button class="text-blue-500 hover:text-blue-700" onclick="event.stopPropagation(); printReceipt('${payment.id}')">
                            <i class="fas fa-print text-xs"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    function renderPaymentHistory() {
        const container = document.getElementById('fee-payment-history');
        if (!container) return;

        const payments = FeesManagement.currentData.payments;
        
        if (payments.length === 0) {
            container.innerHTML = `
                <div class="text-center py-12">
                    <i class="fas fa-history text-4xl text-slate-300 mb-3"></i>
                    <p class="text-sm text-slate-500">No payment history recorded</p>
                    <p class="text-xs text-slate-400 mt-1">Payment history will appear here when payments are recorded</p>
                </div>
            `;
            return;
        }

        container.innerHTML = payments.map(payment => `
            <div class="px-4 py-3 grid grid-cols-12 gap-2 items-center border-b border-slate-100">
                <div class="col-span-2">
                    <span class="text-xs text-slate-600">${formatDate(payment.paymentDate)}</span>
                </div>
                <div class="col-span-3">
                    <div class="text-xs font-medium text-slate-800">${payment.studentName}</div>
                    <div class="text-[11px] text-slate-500">${payment.studentId}</div>
                </div>
                <div class="col-span-2">
                    <span class="text-xs text-slate-600">${payment.paymentType || 'Fee Payment'}</span>
                </div>
                <div class="col-span-2">
                    <span class="text-xs font-semibold text-emerald-600">${formatCurrency(payment.amount)}</span>
                </div>
                <div class="col-span-2">
                    <span class="text-xs text-slate-600">${payment.paymentMethod}</span>
                </div>
                <div class="col-span-1">
                    <span class="inline-flex px-2 py-1 text-xs rounded-full bg-emerald-100 text-emerald-700">
                        ${payment.status || 'Completed'}
                    </span>
                </div>
            </div>
        `).join('');
    }

    function renderDefaulters() {
        const container = document.querySelector('[data-defaulters-list]');
        if (!container) return;

        // Load defaulters from API
        loadDefaulters().then(defaulters => {
            if (defaulters.length === 0) {
                container.innerHTML = `
                    <div class="text-center py-12">
                        <i class="fas fa-user-clock text-4xl text-slate-300 mb-3"></i>
                        <p class="text-sm text-slate-500">No fee defaulters found</p>
                        <p class="text-xs text-slate-400 mt-1">All students are up to date with their fee payments</p>
                    </div>
                `;
                return;
            }

            const defaultersHtml = defaulters.map(defaulter => `
                <div class="px-4 py-3 grid grid-cols-12 gap-2 items-center border-b border-slate-100">
                    <div class="col-span-3">
                        <div class="text-xs font-medium text-slate-800">${defaulter.firstName} ${defaulter.lastName}</div>
                        <div class="text-[11px] text-slate-500">${defaulter.studentId}</div>
                    </div>
                    <div class="col-span-2">
                        <span class="text-xs text-slate-600">${defaulter.className}</span>
                    </div>
                    <div class="col-span-2">
                        <span class="text-xs font-semibold text-orange-600">${formatCurrency(defaulter.outstandingAmount)}</span>
                    </div>
                    <div class="col-span-2">
                        <span class="text-xs text-slate-600">${defaulter.daysOverdue} days</span>
                    </div>
                    <div class="col-span-2">
                        <span class="text-xs text-slate-600">${formatDate(defaulter.lastContact)}</span>
                    </div>
                    <div class="col-span-1">
                        <input type="checkbox" class="rounded border-slate-300 text-emerald-600 focus:ring-emerald-400" 
                               data-defaulter-id="${defaulter.id}" data-defaulter-checkbox>
                    </div>
                </div>
            `).join('');

            container.innerHTML = `
                <div class="hidden md:grid grid-cols-12 bg-slate-50 px-4 py-2.5 text-[11px] font-medium text-slate-500">
                    <div class="col-span-3">Student</div>
                    <div class="col-span-2">Grade</div>
                    <div class="col-span-2">Outstanding</div>
                    <div class="col-span-2">Days Overdue</div>
                    <div class="col-span-2">Last Contact</div>
                    <div class="col-span-1">Select</div>
                </div>
                ${defaultersHtml}
            `;
        }).catch(error => {
            console.error('Failed to render defaulters:', error);
            container.innerHTML = `
                <div class="text-center py-12">
                    <i class="fas fa-exclamation-triangle text-4xl text-red-300 mb-3"></i>
                    <p class="text-sm text-slate-500">Failed to load defaulters</p>
                    <p class="text-xs text-slate-400 mt-1">Please try again later</p>
                </div>
            `;
        });
    }

    // Dashboard summary
    async function updateDashboardSummary() {
        try {
            const summary = await loadFeesSummary();
            
            if (!summary) {
                console.error('Failed to load fees summary');
                return;
            }
            
            // Update cards
            const totalCollectedEl = document.querySelector('[data-card="total-collected"]');
            const totalOutstandingEl = document.querySelector('[data-card="total-outstanding"]');
            const pendingInvoicesEl = document.querySelector('[data-card="pending-invoices"]');
            const collectionRateEl = document.querySelector('[data-card="collection-rate"]');

            if (totalCollectedEl) {
                totalCollectedEl.textContent = formatCurrency(summary.totalCollected);
            }

            if (totalOutstandingEl) {
                totalOutstandingEl.textContent = formatCurrency(summary.totalOutstanding);
            }

            if (pendingInvoicesEl) {
                pendingInvoicesEl.textContent = summary.pendingInvoices.toString();
            }

            if (collectionRateEl) {
                collectionRateEl.textContent = `${summary.collectionRate}%`;
            }

            // Update invoice summary
            const studentCountEl = document.querySelector('[data-card="student-count"]');
            const totalAmountEl = document.querySelector('[data-card="total-amount"]');
            const dueDateEl = document.querySelector('[data-card="due-date"]');

            if (studentCountEl) {
                studentCountEl.textContent = summary.totalStudents.toString();
            }

            if (totalAmountEl) {
                totalAmountEl.textContent = formatCurrency(summary.totalCollected + summary.totalOutstanding);
            }

            if (dueDateEl) {
                dueDateEl.textContent = 'N/A';
            }

        } catch (error) {
            console.error('Failed to update dashboard summary:', error);
        }
    }

    // Bank account management
    function populateBankSelect() {
        const bankSelect = document.getElementById('payment-bank');
        if (!bankSelect) return;
        
        bankSelect.innerHTML = '<option value="">Select bank account</option>';
        
        FeesManagement.currentData.banks.forEach(bank => {
            const option = document.createElement('option');
            option.value = bank.id;
            option.textContent = `${bank.bankName} - ${bank.accountNumber}`;
            bankSelect.appendChild(option);
        });
    }

    // Event listeners
    function bindEventListeners() {
        // Add Fee Type button
        const addFeeTypeBtn = document.getElementById('btn-add-fee-type');
        if (addFeeTypeBtn) {
            addFeeTypeBtn.addEventListener('click', openAddFeeTypeModal);
        }

        // Add Fee Type form submission
        const addFeeTypeForm = document.getElementById('add-fee-type-form');
        if (addFeeTypeForm) {
            addFeeTypeForm.addEventListener('submit', handleAddFeeType);
        }

        // Pupil search functionality
        const pupilSearchInput = document.getElementById('pupil-search-input');
        const pupilSearchBtn = document.getElementById('btn-pupil-search');
        const pupilSearchResults = document.getElementById('pupil-search-results');
        
        if (pupilSearchInput && pupilSearchResults) {
            pupilSearchInput.addEventListener('input', debounce(handlePupilSearch, 300));
            pupilSearchInput.addEventListener('focus', () => {
                if (pupilSearchInput.value.length >= 2) {
                    handlePupilSearch();
                }
            });
        }

        if (pupilSearchBtn) {
            pupilSearchBtn.addEventListener('click', handlePupilSearch);
        }

        // Class selection
        const classSelect = document.getElementById('invoice-class-select');
        if (classSelect) {
            classSelect.addEventListener('change', handleClassSelection);
        }

        // Generate invoice button
        const generateInvoiceBtn = document.getElementById('btn-generate-fee-invoice');
        if (generateInvoiceBtn) {
            generateInvoiceBtn.addEventListener('click', generateInvoice);
        }

        // Save draft button
        const saveDraftBtn = document.getElementById('btn-save-fee-invoice-draft');
        if (saveDraftBtn) {
            saveDraftBtn.addEventListener('click', saveInvoiceDraft);
        }

        // Process payment button
        const processPaymentBtn = document.getElementById('btn-process-fee-payment');
        if (processPaymentBtn) {
            processPaymentBtn.addEventListener('click', processPayment);
        }

        // Export buttons
        document.querySelectorAll('[data-action="export"]').forEach(button => {
            button.addEventListener('click', function() {
                const format = this.dataset.format || 'csv';
                const type = getExportTypeFromContext(this);
                exportData(format, type);
            });
        });

        // Send reminders button
        const sendRemindersBtn = document.querySelector('button:has(.fa-envelope)');
        if (sendRemindersBtn) {
            sendRemindersBtn.addEventListener('click', sendReminders);
        }

        // Amount paid input change
        const amountPaidInput = document.getElementById('amount-paid');
        if (amountPaidInput) {
            amountPaidInput.addEventListener('input', updatePaymentSummary);
        }

        // Tab switching
        document.querySelectorAll('[data-tab]').forEach(tab => {
            tab.addEventListener('click', function() {
                const tabName = this.dataset.tab;
                
                // Update internal state
                if (FeesManagement.ui) {
                    FeesManagement.ui.activeTab = tabName;
                }
                
                // Save to localStorage for persistence
                saveActiveTab(tabName);
                
                // Tab switching logic would be handled by Alpine.js
                console.log('Tab switched to:', tabName);
            });
        });

        // Hide search results when clicking outside
        document.addEventListener('click', function(e) {
            if (pupilSearchResults && !pupilSearchResults.contains(e.target) && e.target !== pupilSearchInput) {
                pupilSearchResults.classList.add('hidden');
            }
        });
    }

    // Debounce function for search
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Modal functions
    function openAddFeeTypeModal() {
        const modal = document.getElementById('add-fee-type-modal');
        if (modal) {
            modal.classList.remove('hidden');
            // Reset form
            document.getElementById('add-fee-type-form').reset();
        }
    }

    function closeAddFeeTypeModal() {
        const modal = document.getElementById('add-fee-type-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    function closeInvoicePrintModal() {
        const modal = document.getElementById('invoice-print-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    // Handle add fee type
    async function handleAddFeeType(e) {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('fee-type-name').value,
            gradeLevel: document.getElementById('fee-type-grade').value,
            amount: parseFloat(document.getElementById('fee-type-amount').value),
            frequency: document.getElementById('fee-type-frequency').value,
            description: document.getElementById('fee-type-description').value,
            status: 'Active'
        };

        try {
            if (canUseApi()) {
                const response = await apiRequest('/feesmanagement/fee-structures', {
                    method: 'POST',
                    body: formData
                });
                
                if (response.success) {
                    showNotification('Fee type added successfully', 'success');
                    await loadFeeStructures();
                    renderFeeStructures();
                    closeAddFeeTypeModal();
                }
            } else {
                // Save to localStorage for offline mode
                const feeStructures = JSON.parse(localStorage.getItem('feeStructures') || '[]');
                const newFeeType = {
                    ...formData,
                    id: generateId('FT', { feeType: feeStructures.length + 1 })
                };
                feeStructures.push(newFeeType);
                localStorage.setItem('feeStructures', JSON.stringify(feeStructures));
                
                FeesManagement.currentData.feeStructures = feeStructures;
                renderFeeStructures();
                showNotification('Fee type saved locally', 'success');
                closeAddFeeTypeModal();
            }
        } catch (error) {
            console.error('Failed to add fee type:', error);
            showNotification('Failed to add fee type', 'error');
        }
    }

    // Pupil search functionality
    async function handlePupilSearch() {
        const searchInput = document.getElementById('pupil-search-input');
        const resultsContainer = document.getElementById('pupil-search-results');
        const query = searchInput.value.trim();
        
        if (query.length < 2) {
            resultsContainer.classList.add('hidden');
            return;
        }

        try {
            let pupils = [];
            if (canUseApi()) {
                pupils = await searchPupils(query);
            } else {
                // Use cached pupils
                pupils = FeesManagement.currentData.students.filter(pupil => 
                    (pupil.firstName && pupil.firstName.toLowerCase().includes(query.toLowerCase())) ||
                    (pupil.lastName && pupil.lastName.toLowerCase().includes(query.toLowerCase())) ||
                    (pupil.studentId && pupil.studentId.toLowerCase().includes(query.toLowerCase()))
                );
            }

            displayPupilSearchResults(pupils, resultsContainer);
        } catch (error) {
            console.error('Search failed:', error);
        }
    }

    function displayPupilSearchResults(pupils, container) {
        container.innerHTML = '';
        
        if (pupils.length === 0) {
            container.innerHTML = `
                <div class="p-3 text-center text-slate-500">
                    <i class="fas fa-search mb-2"></i>
                    <p>No pupils found</p>
                </div>
            `;
            container.classList.remove('hidden');
            return;
        }

        pupils.forEach(pupil => {
            const item = document.createElement('div');
            item.className = 'px-3 py-2 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-b-0';
            item.innerHTML = `
                <div class="flex items-center justify-between">
                    <div>
                        <div class="font-medium text-slate-800">${pupil.firstName} ${pupil.lastName}</div>
                        <div class="text-xs text-slate-500">ID: ${pupil.studentId} | Class: ${pupil.className || 'N/A'}</div>
                    </div>
                    <button type="button" class="text-xs bg-emerald-600 text-white px-2 py-1 rounded hover:bg-emerald-700" onclick="selectPupilForInvoice('${pupil.id}')">
                        Select
                    </button>
                </div>
            `;
            container.appendChild(item);
        });

        container.classList.remove('hidden');
    }

    // Class selection handler
    function handleClassSelection() {
        const classSelect = document.getElementById('invoice-class-select');
        const pupilsSelect = document.getElementById('invoice-pupils-select');
        
        if (classSelect.value && pupilsSelect) {
            pupilsSelect.value = `class:${classSelect.value}`;
            updatePupilCount();
        }
    }

    // Update pupil count
    function updatePupilCount() {
        const selection = document.getElementById('invoice-pupils-select').value;
        const classSelect = document.getElementById('invoice-class-select').value;
        const pupilCountElement = document.querySelector('[data-card="pupil-count"]');
        
        let count = 0;
        if (selection.startsWith('class:') || classSelect) {
            const className = classSelect || selection.replace('class:', '');
            count = FeesManagement.currentData.students.filter(p => p.className === className).length;
        }
        
        if (pupilCountElement) {
            pupilCountElement.textContent = count;
        }
    }

    // Save invoice draft to localStorage
    function saveInvoiceDraft() {
        const draftData = {
            pupils: document.getElementById('invoice-pupils-select').value,
            class: document.getElementById('invoice-class-select').value,
            period: document.getElementById('invoice-period-select').value,
            dueDate: document.getElementById('invoice-due-date').value,
            feeItems: getSelectedFeeItems(),
            paymentMethods: getSelectedPaymentMethods(),
            timestamp: new Date().toISOString()
        };

        try {
            localStorage.setItem('shikola_invoice_draft', JSON.stringify(draftData));
            showNotification('Invoice draft saved successfully', 'success');
        } catch (error) {
            console.error('Failed to save draft:', error);
            showNotification('Failed to save draft', 'error');
        }
    }

    // Load invoice draft from localStorage
    function loadInvoiceDraft() {
        try {
            const draftData = JSON.parse(localStorage.getItem('shikola_invoice_draft') || '{}');
            
            if (draftData.pupils) {
                document.getElementById('invoice-pupils-select').value = draftData.pupils;
            }
            if (draftData.class) {
                document.getElementById('invoice-class-select').value = draftData.class;
            }
            if (draftData.period) {
                document.getElementById('invoice-period-select').value = draftData.period;
            }
            if (draftData.dueDate) {
                document.getElementById('invoice-due-date').value = draftData.dueDate;
            }
            
            // Restore fee items selection
            if (draftData.feeItems) {
                draftData.feeItems.forEach(item => {
                    const checkbox = document.querySelector(`[data-fee-item="${item.name}"] input[type="checkbox"]`);
                    if (checkbox) {
                        checkbox.checked = item.selected;
                    }
                });
            }
            
            updatePupilCount();
            // Silent draft loading - no notification
            console.log('Invoice draft loaded successfully');
        } catch (error) {
            console.error('Failed to load draft:', error);
        }
    }

    // Generate 3-copy invoice
    function generateThreeCopyInvoice(invoiceData) {
        const modal = document.getElementById('invoice-print-modal');
        const pupilCopy = document.getElementById('pupil-copy-content');
        const bankCopy = document.getElementById('bank-copy-content');
        const schoolCopy = document.getElementById('school-copy-content');
        
        const invoiceContent = generateInvoiceContent(invoiceData);
        
        pupilCopy.innerHTML = invoiceContent;
        bankCopy.innerHTML = invoiceContent;
        schoolCopy.innerHTML = invoiceContent;
        
        modal.classList.remove('hidden');
    }

    // Generate invoice function
    async function generateInvoice() {
        try {
            // Get form data
            const pupils = document.getElementById('invoice-pupils-select').value;
            const className = document.getElementById('invoice-class-select').value;
            const period = document.getElementById('invoice-period-select').value;
            const dueDate = document.getElementById('invoice-due-date').value;
            
            if (!pupils || !period || !dueDate) {
                showNotification('Please fill in all required fields', 'error');
                return;
            }
            
            // Get selected fee items
            const feeItems = getSelectedFeeItems();
            if (feeItems.length === 0) {
                showNotification('Please select at least one fee item', 'error');
                return;
            }
            
            // Calculate total amount
            const totalAmount = feeItems.reduce((sum, item) => sum + item.amount, 0);
            
            // Create invoice data
            const invoiceData = {
                invoiceNumber: generateInvoiceNumber(),
                pupilName: 'Selected Pupils',
                className: className || 'Multiple Classes',
                pupilId: pupils,
                period: period,
                dueDate: dueDate,
                feeItems: feeItems,
                totalAmount: totalAmount,
                paymentMethods: getSelectedPaymentMethods()
            };
            
            // Generate 3-copy invoice
            generateThreeCopyInvoice(invoiceData);
            
            showNotification('Invoice generated successfully', 'success');
            
        } catch (error) {
            console.error('Failed to generate invoice:', error);
            showNotification('Failed to generate invoice', 'error');
        }
    }

    // Helper function to get selected payment methods
    function getSelectedPaymentMethods() {
        const methods = [];
        document.querySelectorAll('input[type="checkbox"]:checked').forEach(checkbox => {
            const label = checkbox.closest('label');
            if (label && label.textContent.trim()) {
                methods.push(label.textContent.trim());
            }
        });
        return methods;
    }

    function generateInvoiceContent(invoiceData) {
        const schoolProfile = window.ShikolaSchoolProfile ? window.ShikolaSchoolProfile.getProfile() : null;
        
        // Use actual school details or show "Not Configured" message
        const schoolName = schoolProfile?.name || 'School Name Not Configured';
        const schoolTagline = schoolProfile?.tagline || 'School Tagline Not Set';
        const schoolAddress = schoolProfile?.address || 'School Address Not Set';
        const schoolLogo = schoolProfile?.logoDataUrl || '../../assets/images/logo.png';
        const authorisedSignatory = schoolProfile?.headteacher || schoolProfile?.principal || 'Authorised Signatory';
        
        return `
            <div class="border-b-2 border-slate-300 pb-4 mb-4">
                <div class="flex justify-between items-start">
                    <div class="flex items-center gap-4">
                        <img src="${schoolLogo}" alt="School Logo" class="h-16 w-16 object-cover">
                        <div>
                            <h1 class="text-xl font-bold">${schoolName}</h1>
                            <p class="text-sm text-slate-600">${schoolTagline}</p>
                            <p class="text-xs text-slate-500">${schoolAddress}</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <h2 class="text-lg font-bold">FEE INVOICE</h2>
                        <p class="text-sm">Invoice #: ${invoiceData.invoiceNumber || generateInvoiceNumber()}</p>
                        <p class="text-sm">Date: ${formatDate(new Date())}</p>
                        <p class="text-sm">Due: ${formatDate(invoiceData.dueDate)}</p>
                    </div>
                </div>
            </div>
            
            <div class="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <p class="text-sm"><strong>Pupil Name:</strong> ${invoiceData.pupilName}</p>
                    <p class="text-sm"><strong>Class:</strong> ${invoiceData.className}</p>
                    <p class="text-sm"><strong>Pupil ID:</strong> ${invoiceData.pupilId}</p>
                </div>
                <div>
                    <p class="text-sm"><strong>Period:</strong> ${invoiceData.period}</p>
                    <p class="text-sm"><strong>Payment Methods:</strong> ${invoiceData.paymentMethods.join(', ')}</p>
                </div>
            </div>
            
            <table class="w-full border-collapse border border-slate-300 mb-4">
                <thead>
                    <tr class="bg-slate-100">
                        <th class="border border-slate-300 px-4 py-2 text-left">Fee Item</th>
                        <th class="border border-slate-300 px-4 py-2 text-center">Term</th>
                        <th class="border border-slate-300 px-4 py-2 text-right">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    ${invoiceData.feeItems.map(item => `
                        <tr>
                            <td class="border border-slate-300 px-4 py-2">${item.name}</td>
                            <td class="border border-slate-300 px-4 py-2 text-center">${item.term}</td>
                            <td class="border border-slate-300 px-4 py-2 text-right">${formatCurrency(item.amount)}</td>
                        </tr>
                    `).join('')}
                </tbody>
                <tfoot>
                    <tr class="bg-slate-100">
                        <td colspan="2" class="border border-slate-300 px-4 py-2 text-right font-bold">TOTAL:</td>
                        <td class="border border-slate-300 px-4 py-2 text-right font-bold">${formatCurrency(invoiceData.totalAmount)}</td>
                    </tr>
                </tfoot>
            </table>
            
            <div class="mt-8 pt-4 border-t border-slate-300">
                <div class="flex justify-between">
                    <div>
                        <p class="text-sm"><strong>Payment Instructions:</strong></p>
                        <p class="text-xs text-slate-600">Please pay the total amount by the due date. Late payments may incur penalties.</p>
                    </div>
                    <div class="text-right">
                        <p class="text-sm font-bold">Authorised Signature</p>
                        <p class="text-xs text-slate-600 mt-4">_________________________</p>
                        <p class="text-xs text-slate-600">${authorisedSignatory}</p>
                        <p class="text-xs text-slate-600">${schoolName}</p>
                    </div>
                </div>
            </div>
        `;
    }

    // Helper function to get selected fee items
    function getSelectedFeeItems() {
        const feeItems = [];
        document.querySelectorAll('[data-fee-item] input[type="checkbox"]:checked').forEach(checkbox => {
            const label = checkbox.closest('[data-fee-item]');
            feeItems.push({
                name: label.dataset.feeItemName,
                amount: parseFloat(label.dataset.feeAmount),
                term: label.dataset.feeTerm,
                selected: true
            });
        });
        return feeItems;
    }

    // Global functions for HTML onclick handlers
    window.openAddFeeTypeModal = openAddFeeTypeModal;
    window.closeAddFeeTypeModal = closeAddFeeTypeModal;
    window.closeInvoicePrintModal = closeInvoicePrintModal;
    window.selectPupilForInvoice = function(pupilId) {
        const pupil = FeesManagement.currentData.students.find(p => p.id === pupilId);
        if (pupil) {
            document.getElementById('pupil-search-input').value = `${pupil.firstName} ${pupil.lastName} (${pupil.studentId})`;
            document.getElementById('pupil-search-results').classList.add('hidden');
            showNotification('Pupil selected successfully', 'success');
        }
    };

    function getExportTypeFromContext(button) {
        const section = button.closest('section');
        if (section) {
            if (section.querySelector('[data-fee-structures-list]')) return 'fee-structures';
            if (section.querySelector('#fee-receipts-list')) return 'receipts';
            if (section.querySelector('#fee-payment-history')) return 'payment-history';
            if (section.querySelector('[data-defaulters-list]')) return 'defaulters';
        }
        return 'general';
    }

    // Initialize everything
    async function initialize() {
        try {
            // Load local data first
            loadLocalData();
            
            // Apply school profile to receipt area
            if (window.ShikolaSchoolProfile) {
                const receiptArea = document.querySelector('[aria-label="Receipt preview (accountant copy)"]');
                if (receiptArea) {
                    window.ShikolaSchoolProfile.applyProfileToDom(receiptArea);
                }
                
                // Listen for school profile updates
                window.addEventListener('shikola:school-profile-updated', function(e) {
                    if (receiptArea) {
                        window.ShikolaSchoolProfile.applyProfileToDom(receiptArea);
                    }
                });
            }
            
            // Try to load data from backend API, but don't fail if unavailable
            try {
                if (canUseApi()) {
                    await Promise.all([
                        loadFeeStructures(),
                        loadStudents(),
                        loadInvoices(),
                        loadPayments(),
                        loadBanks()
                    ]);
                } else {
                    // Silent offline mode - no notification
                    console.warn('API not available, running in offline mode');
                }
            } catch (apiError) {
                // Silent API loading failure - no notification
                console.warn('API loading failed, continuing with local data:', apiError);
            }

            // Initialize UI components
            initializeStudentSearch();
            populateBankSelect();
            populateClassSelect();
            bindEventListeners();

            // Load invoice draft if exists - silent loading
            loadInvoiceDraft();

            // Restore active tab from localStorage
            restoreActiveTab();

            // Render initial data
            renderFeeStructures();
            renderInvoices();
            renderReceipts();
            renderPaymentHistory();
            renderDefaulters();

            // Update dashboard
            try {
                await updateDashboardSummary();
            } catch (summaryError) {
                console.warn('Dashboard summary update failed:', summaryError);
            }

            // Set current date as default for payment date
            const paymentDateInput = document.getElementById('payment-date');
            if (paymentDateInput) {
                paymentDateInput.value = new Date().toISOString().split('T')[0];
            }

            // Set due date to 30 days from now as default
            const dueDateInput = document.getElementById('invoice-due-date');
            if (dueDateInput) {
                const dueDate = new Date();
                dueDate.setDate(dueDate.getDate() + 30);
                dueDateInput.value = dueDate.toISOString().split('T')[0];
            }

            // Initialize SignalR connection for real-time updates
            initializeSignalR();

            console.log('Fees Management initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Fees Management:', error);
            showNotification('Failed to initialize Fees Management', 'error');
        }
    }

    // Restore active tab from localStorage
    function restoreActiveTab() {
        try {
            const savedTab = localStorage.getItem('shikola_fees_active_tab');
            if (savedTab) {
                console.log('Restoring tab:', savedTab);
                
                // Wait for everything to be loaded
                const restoreTab = () => {
                    // Find the main Alpine.js component
                    const mainElement = document.querySelector('[x-data*="activeTab"]');
                    if (mainElement && mainElement._x_dataStack) {
                        // Update Alpine.js activeTab property directly
                        mainElement._x_dataStack[0].activeTab = savedTab;
                        console.log('Updated Alpine.js activeTab to:', savedTab);
                        
                        // Also update our internal state
                        if (FeesManagement.ui) {
                            FeesManagement.ui.activeTab = savedTab;
                        }
                        
                        // Force Alpine.js reactivity
                        if (mainElement._x_dataStack && mainElement._x_dataStack[0]) {
                            // Trigger reactivity by updating the property
                            mainElement._x_dataStack[0].activeTab = savedTab;
                        }
                    } else {
                        // Fallback: try to find and click the tab button
                        const tabButton = document.querySelector(`[data-tab="${savedTab}"]`);
                        if (tabButton) {
                            tabButton.click();
                            console.log('Clicked tab button for:', savedTab);
                        }
                    }
                };

                // Try multiple times with delays to ensure Alpine.js is ready
                setTimeout(restoreTab, 100);
                setTimeout(restoreTab, 500);
                setTimeout(restoreTab, 1000);
            }
        } catch (error) {
            console.warn('Failed to restore active tab:', error);
        }
    }

    // Save active tab to localStorage when changed
    function saveActiveTab(tabName) {
        try {
            localStorage.setItem('shikola_fees_active_tab', tabName);
        } catch (error) {
            console.warn('Failed to save active tab:', error);
        }
    }

    // Populate class select dropdown
    function populateClassSelect() {
        const classSelect = document.getElementById('invoice-class-select');
        if (!classSelect) return;

        // Get unique classes from students
        const classes = [...new Set(FeesManagement.currentData.students.map(s => s.className).filter(Boolean))];
        
        // Clear existing options except the first one
        while (classSelect.options.length > 1) {
            classSelect.remove(1);
        }

        // Add class options
        classes.sort().forEach(className => {
            const option = document.createElement('option');
            option.value = className;
            option.textContent = className;
            classSelect.appendChild(option);
        });
    }

    function loadLocalData() {
        // Load any cached data from localStorage
        try {
            const cachedInvoices = localStorage.getItem('shikola_fees_invoices');
            const cachedPayments = localStorage.getItem('shikola_fees_payments');
            
            if (cachedInvoices) {
                FeesManagement.currentData.invoices = JSON.parse(cachedInvoices) || [];
            }
            if (cachedPayments) {
                FeesManagement.currentData.payments = JSON.parse(cachedPayments) || [];
            }
        } catch (e) {
            console.warn('Failed to load cached data:', e);
        }
    }

    function initializeSignalR() {
        if (window.connection) {
            // Set up real-time event handlers
            window.connection.on("FeeInvoiceCreated", (update) => {
                console.log('New fee invoice created:', update);
                loadInvoices().then(() => {
                    renderInvoices();
                    updateDashboardSummary();
                });
            });

            window.connection.on("FeePaymentProcessed", (update) => {
                console.log('Fee payment processed:', update);
                loadPayments().then(() => {
                    renderPaymentHistory();
                    renderReceipts();
                    updateDashboardSummary();
                });
            });

            window.connection.on("FeeStructureUpdated", (update) => {
                console.log('Fee structure updated:', update);
                loadFeeStructures().then(() => {
                    renderFeeStructures();
                });
            });

            window.connection.on("FeeReminderSent", (update) => {
                console.log('Fee reminders sent:', update);
                showNotification('Reminders sent successfully', 'success');
            });

            window.connection.on("FeesSummaryUpdated", (update) => {
                console.log('Fees summary updated:', update);
                updateDashboardSummary();
            });

            window.connection.on("FeeDefaulterUpdated", (update) => {
                console.log('Fee defaulter updated:', update);
                renderDefaulters();
            });

            // Join fees group for current school
            const schoolId = getCurrentSchoolId();
            if (schoolId && window.connection.invoke) {
                window.connection.invoke("JoinFeesGroup", schoolId).catch(err => {
                    console.error('Error joining fees group:', err);
                });
            }
        }
    }

    function getCurrentSchoolId() {
        // Get school ID from various sources
        return window.currentSchoolId || 
               localStorage.getItem('currentSchoolId') || 
               document.querySelector('[data-school-id]')?.dataset?.schoolId;
    }

    // Global functions for inline event handlers
    window.selectReceipt = function(receiptId) {
        const payment = FeesManagement.currentData.payments.find(p => p.id === receiptId);
        if (payment) {
            generateReceipt(payment);
        }
    };

    window.printReceipt = function(receiptId) {
        const payment = FeesManagement.currentData.payments.find(p => p.id === receiptId);
        if (payment) {
            generateReceipt(payment);
            window.print();
        }
    };

    window.viewInvoice = function(invoiceId) {
        // Implementation for viewing invoice details
        console.log('View invoice:', invoiceId);
    };

    window.printInvoice = function(invoiceId) {
        // Implementation for printing invoice
        console.log('Print invoice:', invoiceId);
    };

    window.editFeeStructure = function(structureId) {
        // Implementation for editing fee structure
        console.log('Edit fee structure:', structureId);
    };

    window.deleteFeeStructure = function(structureId) {
        if (confirm('Are you sure you want to delete this fee structure?')) {
            console.log('Delete fee structure:', structureId);
        }
    };

    // Export these functions globally for inline onclick handlers
    window.exportData = exportData;
    window.sendReminders = sendReminders;

    // Start initialization when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

})();
