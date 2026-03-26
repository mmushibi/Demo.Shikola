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
// SMS Gateway API Integration
class SmsGatewayAPI {
    constructor() {
        this.baseURL = window.SHIKOLA_API_BASE || 'http://localhost:3000';
        this.token = null;
        this.init();
    }

    init() {
        this.token = localStorage.getItem('shikola_token') || localStorage.getItem('authToken');
        if (!this.token) {
            console.warn('No authentication token found for SMS gateway');
        }
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}/api/smsgateway${endpoint}`;
        const config = {
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        try {
            const response = await fetch(url, config);
            
            if (response.status === 401) {
                this.redirectToLogin();
                return null;
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('SMS gateway API error:', error);
            throw error;
        }
    }

    redirectToLogin() {
        window.location.href = '../../public/index.html';
    }

    // Get SMS gateway settings
    async getSmsGatewaySettings() {
        return await this.request('/sms-gateway');
    }

    // Update SMS gateway settings
    async updateSmsGatewaySettings(settings) {
        return await this.request('/sms-gateway', {
            method: 'PUT',
            body: JSON.stringify(settings)
        });
    }

    // Test SMS gateway connection
    async testSmsGateway() {
        return await this.request('/test-connection', {
            method: 'POST'
        });
    }

    // Send test SMS
    async sendTestSms(phoneNumber, message) {
        return await this.request('/send-test', {
            method: 'POST',
            body: JSON.stringify({ phoneNumber, message })
        });
    }

    // Get SMS logs
    async getSmsLogs(filters = {}) {
        const params = new URLSearchParams();
        
        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);
        if (filters.status) params.append('status', filters.status);
        if (filters.type) params.append('type', filters.type);
        if (filters.page) params.append('page', filters.page);
        if (filters.limit) params.append('limit', filters.limit);
        
        const queryString = params.toString();
        return await this.request(`/logs${queryString ? '?' + queryString : ''}`);
    }

    // Get SMS statistics
    async getSmsStatistics(filters = {}) {
        const params = new URLSearchParams();
        
        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);
        if (filters.period) params.append('period', filters.period);
        
        const queryString = params.toString();
        return await this.request(`/statistics${queryString ? '?' + queryString : ''}`);
    }

    // Get SMS templates
    async getSmsTemplates() {
        return await this.request('/templates');
    }

    // Create SMS template
    async createSmsTemplate(template) {
        return await this.request('/templates', {
            method: 'POST',
            body: JSON.stringify(template)
        });
    }

    // Update SMS template
    async updateSmsTemplate(templateId, template) {
        return await this.request(`/templates/${templateId}`, {
            method: 'PUT',
            body: JSON.stringify(template)
        });
    }

    // Delete SMS template
    async deleteSmsTemplate(templateId) {
        return await this.request(`/templates/${templateId}`, {
            method: 'DELETE'
        });
    }

    // Send bulk SMS
    async sendBulkSms(recipients, message, options = {}) {
        return await this.request('/send-bulk', {
            method: 'POST',
            body: JSON.stringify({
                recipients,
                message,
                ...options
            })
        });
    }

    // Get SMS delivery status
    async getSmsDeliveryStatus(messageId) {
        return await this.request(`/delivery-status/${messageId}`);
    }

    // Get SMS providers
    async getSmsProviders() {
        return await this.request('/providers');
    }

    // Validate phone number
    async validatePhoneNumber(phoneNumber) {
        return await this.request('/validate-phone', {
            method: 'POST',
            body: JSON.stringify({ phoneNumber })
        });
    }
}

// Initialize the API
window.smsGatewayAPI = new SmsGatewayAPI();

// Alpine.js component for SMS Gateway Admin
function smsGatewayAdmin() {
    return {
        settings: null,
        logs: [],
        statistics: null,
        templates: [],
        providers: [],
        selectedTemplate: null,
        loading: false,
        error: null,
        showTestModal: false,
        showTemplateModal: false,
        showBulkModal: false,
        testPhoneNumber: '',
        testMessage: '',
        bulkRecipients: '',
        bulkMessage: '',
        filters: {
            startDate: '',
            endDate: '',
            status: '',
            type: '',
            page: 1,
            limit: 20
        },
        templateForm: {
            name: '',
            content: '',
            type: 'notification',
            variables: []
        },
        availableVariables: ['{student_name}', '{parent_name}', '{teacher_name}', '{class_name}', '{school_name}', '{date}', '{time}', '{subject}', '{grade}'],

        async init() {
            await this.loadSettings();
            await this.loadTemplates();
            await this.loadProviders();
            await this.loadStatistics();
            this.setupRealtimeUpdates();
        },

        async loadSettings() {
            this.loading = true;
            
            try {
                const response = await window.smsGatewayAPI.getSmsGatewaySettings();
                if (response && response.success) {
                    this.settings = response.data;
                } else {
                    this.error = 'Failed to load SMS gateway settings';
                }
            } catch (error) {
                console.error('Error loading settings:', error);
                this.error = 'Failed to load SMS gateway settings';
            } finally {
                this.loading = false;
            }
        },

        async loadLogs() {
            this.loading = true;
            
            try {
                const response = await window.smsGatewayAPI.getSmsLogs(this.filters);
                if (response && response.success) {
                    this.logs = response.data || [];
                } else {
                    this.error = 'Failed to load SMS logs';
                }
            } catch (error) {
                console.error('Error loading logs:', error);
                this.error = 'Failed to load SMS logs';
            } finally {
                this.loading = false;
            }
        },

        async loadStatistics() {
            try {
                const response = await window.smsGatewayAPI.getSmsStatistics(this.filters);
                if (response && response.success) {
                    this.statistics = response.data;
                }
            } catch (error) {
                console.error('Error loading statistics:', error);
            }
        },

        async loadTemplates() {
            try {
                const response = await window.smsGatewayAPI.getSmsTemplates();
                if (response && response.success) {
                    this.templates = response.data || [];
                }
            } catch (error) {
                console.error('Error loading templates:', error);
            }
        },

        async loadProviders() {
            try {
                const response = await window.smsGatewayAPI.getSmsProviders();
                if (response && response.success) {
                    this.providers = response.data || [];
                }
            } catch (error) {
                console.error('Error loading providers:', error);
            }
        },

        async saveSettings() {
            if (!this.settings) return;

            this.loading = true;
            
            try {
                const response = await window.smsGatewayAPI.updateSmsGatewaySettings(this.settings);
                if (response && response.success) {
                    this.showNotification('SMS gateway settings saved successfully', 'success');
                } else {
                    this.showNotification('Failed to save settings', 'error');
                }
            } catch (error) {
                console.error('Error saving settings:', error);
                this.showNotification('Failed to save settings', 'error');
            } finally {
                this.loading = false;
            }
        },

        async testConnection() {
            this.loading = true;
            
            try {
                const response = await window.smsGatewayAPI.testSmsGateway();
                if (response && response.success) {
                    // Backend connection test success should not show as frontend toasts
                    // this.showNotification('Connection test successful', 'success');
                    console.log('SMS Gateway connection test successful');
                } else {
                    // Backend connection test failure should not show as frontend toasts
                    // this.showNotification('Connection test failed', 'error');
                    console.error('SMS Gateway connection test failed');
                }
            } catch (error) {
                console.error('Error testing connection:', error);
                // Backend connection test errors should not show as frontend toasts
                // this.showNotification('Connection test failed', 'error');
            } finally {
                this.loading = false;
            }
        },

        async sendTestSms() {
            if (!this.testPhoneNumber || !this.testMessage) {
                this.showNotification('Please fill in all fields', 'warning');
                return;
            }

            this.loading = true;
            
            try {
                const response = await window.smsGatewayAPI.sendTestSms(this.testPhoneNumber, this.testMessage);
                if (response && response.success) {
                    this.showNotification('Test SMS sent successfully', 'success');
                    this.showTestModal = false;
                    this.testPhoneNumber = '';
                    this.testMessage = '';
                    await this.loadLogs();
                } else {
                    this.showNotification('Failed to send test SMS', 'error');
                }
            } catch (error) {
                console.error('Error sending test SMS:', error);
                this.showNotification('Failed to send test SMS', 'error');
            } finally {
                this.loading = false;
            }
        },

        async sendBulkSms() {
            if (!this.bulkRecipients || !this.bulkMessage) {
                this.showNotification('Please fill in all fields', 'warning');
                return;
            }

            this.loading = true;
            
            try {
                const recipients = this.bulkRecipients.split('\n').map(r => r.trim()).filter(r => r);
                const response = await window.smsGatewayAPI.sendBulkSms(recipients, this.bulkMessage);
                
                if (response && response.success) {
                    this.showNotification('Bulk SMS sent successfully', 'success');
                    this.showBulkModal = false;
                    this.bulkRecipients = '';
                    this.bulkMessage = '';
                    await this.loadLogs();
                } else {
                    this.showNotification('Failed to send bulk SMS', 'error');
                }
            } catch (error) {
                console.error('Error sending bulk SMS:', error);
                this.showNotification('Failed to send bulk SMS', 'error');
            } finally {
                this.loading = false;
            }
        },

        async saveTemplate() {
            if (!this.templateForm.name || !this.templateForm.content) {
                this.showNotification('Please fill in all required fields', 'warning');
                return;
            }

            this.loading = true;
            
            try {
                let response;
                if (this.selectedTemplate) {
                    response = await window.smsGatewayAPI.updateSmsTemplate(this.selectedTemplate.id, this.templateForm);
                } else {
                    response = await window.smsGatewayAPI.createSmsTemplate(this.templateForm);
                }
                
                if (response && response.success) {
                    this.showNotification('Template saved successfully', 'success');
                    this.showTemplateModal = false;
                    this.resetTemplateForm();
                    await this.loadTemplates();
                } else {
                    this.showNotification('Failed to save template', 'error');
                }
            } catch (error) {
                console.error('Error saving template:', error);
                this.showNotification('Failed to save template', 'error');
            } finally {
                this.loading = false;
            }
        },

        async deleteTemplate(templateId) {
            if (!confirm('Are you sure you want to delete this template?')) return;

            try {
                const response = await window.smsGatewayAPI.deleteSmsTemplate(templateId);
                if (response && response.success) {
                    this.showNotification('Template deleted successfully', 'success');
                    await this.loadTemplates();
                } else {
                    this.showNotification('Failed to delete template', 'error');
                }
            } catch (error) {
                console.error('Error deleting template:', error);
                this.showNotification('Failed to delete template', 'error');
            }
        },

        editTemplate(template) {
            this.selectedTemplate = template;
            this.templateForm = {
                name: template.name,
                content: template.content,
                type: template.type,
                variables: template.variables || []
            };
            this.showTemplateModal = true;
        },

        resetTemplateForm() {
            this.selectedTemplate = null;
            this.templateForm = {
                name: '',
                content: '',
                type: 'notification',
                variables: []
            };
        },

        addVariable(variable) {
            if (!this.templateForm.variables.includes(variable)) {
                this.templateForm.variables.push(variable);
                this.templateForm.content += ` ${variable}`;
            }
        },

        getStatusColor(status) {
            switch (status) {
                case 'sent': return 'text-green-600 bg-green-100';
                case 'delivered': return 'text-blue-600 bg-blue-100';
                case 'failed': return 'text-red-600 bg-red-100';
                case 'pending': return 'text-yellow-600 bg-yellow-100';
                default: return 'text-gray-600 bg-gray-100';
            }
        },

        getTypeColor(type) {
            switch (type) {
                case 'notification': return 'text-blue-600 bg-blue-100';
                case 'alert': return 'text-red-600 bg-red-100';
                case 'reminder': return 'text-yellow-600 bg-yellow-100';
                case 'marketing': return 'text-purple-600 bg-purple-100';
                default: return 'text-gray-600 bg-gray-100';
            }
        },

        formatDate(dateString) {
            return new Date(dateString).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        },

        formatNumber(number) {
            return new Intl.NumberFormat().format(number);
        },

        setupRealtimeUpdates() {
            // Listen for real-time SMS updates
            if (window.connection) {
                window.connection.on('SmsUpdate', (update) => {
                    this.loadLogs();
                    this.loadStatistics();
                });
            }
        },

        showNotification(message, type = 'info') {
            // Show notification using existing notification system
            if (window.showNotification) {
                window.showNotification(message, type);
            } else {
                console.log(`[${type.toUpperCase()}] ${message}`);
            }
        },

        applyFilters() {
            this.loadLogs();
            this.loadStatistics();
        },

        clearFilters() {
            this.filters = {
                startDate: '',
                endDate: '',
                status: '',
                type: '',
                page: 1,
                limit: 20
            };
            this.loadLogs();
            this.loadStatistics();
        }
    };
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SmsGatewayAPI, smsGatewayAdmin };
}
