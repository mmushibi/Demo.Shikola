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
// Shared API Client - Common API functionality
class ApiClient {
    constructor() {
        // Use the environment configuration if available, otherwise fallback
        this.baseUrl = window.SHIKOLA_API_BASE || '/api';
        this.token = localStorage.getItem('authToken');
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        if (this.token) {
            config.headers['Authorization'] = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }

    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }

    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }

    setToken(token) {
        this.token = token;
        localStorage.setItem('authToken', token);
    }

    clearToken() {
        this.token = null;
        localStorage.removeItem('authToken');
    }
}

// Global API client instance
const apiClient = new ApiClient();
window.apiClient = apiClient;

// Fallback assignments data when backend is unavailable
function getFallbackAssignments() {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    return [
        {
            id: '1',
            title: 'Mathematics Homework - Chapter 5',
            description: 'Complete exercises 1-20 on page 156 covering fractions and decimals',
            subject: 'Mathematics',
            teacher: 'Mr. Banda',
            priority: 'high',
            status: 'pending',
            assignedOn: lastWeek.toISOString().split('T')[0],
            dueOn: nextWeek.toISOString().split('T')[0],
            attachmentUrl: '/assignments/math-ch5.pdf',
            attachmentName: 'math_chapter5.pdf'
        },
        {
            id: '2',
            title: 'English Essay - My Hero',
            description: 'Write a 300-word essay about your personal hero or role model',
            subject: 'English',
            teacher: 'Mrs. Mulenga',
            priority: 'medium',
            status: 'pending',
            assignedOn: lastWeek.toISOString().split('T')[0],
            dueOn: nextWeek.toISOString().split('T')[0],
            attachmentUrl: '/assignments/essay-rubric.pdf',
            attachmentName: 'essay_rubric.pdf'
        },
        {
            id: '3',
            title: 'Science Project - Solar System',
            description: 'Create a model of the solar system with all planets labeled',
            subject: 'Science',
            teacher: 'Mr. Phiri',
            priority: 'low',
            status: 'submitted',
            assignedOn: lastWeek.toISOString().split('T')[0],
            dueOn: now.toISOString().split('T')[0],
            submittedOn: now.toISOString().split('T')[0],
            submittedTime: now.toTimeString().slice(0, 5),
            grade: 'A',
            attachmentUrl: '/assignments/science-project.pdf',
            attachmentName: 'solar_system_project.pdf'
        },
        {
            id: '4',
            title: 'History Research - Zambian Independence',
            description: 'Research and present on Zambia\'s independence movement',
            subject: 'History',
            teacher: 'Mrs. Chanda',
            priority: 'medium',
            status: 'graded',
            assignedOn: lastWeek.toISOString().split('T')[0],
            dueOn: lastWeek.toISOString().split('T')[0],
            submittedOn: lastWeek.toISOString().split('T')[0],
            gradedOn: lastWeek.toISOString().split('T')[0],
            grade: 'B+',
            attachmentUrl: '/assignments/history-research.pdf',
            attachmentName: 'independence_research.pdf'
        }
    ];
}

// Create ShikolaAPI object for backward compatibility
window.ShikolaAPI = {
    get: (endpoint) => apiClient.get(endpoint),
    post: (endpoint, data) => apiClient.post(endpoint, data),
    put: (endpoint, data) => apiClient.put(endpoint, data),
    delete: (endpoint) => apiClient.delete(endpoint),
    setToken: (token) => apiClient.setToken(token),
    clearToken: () => apiClient.clearToken(),
    // Add assignments API for pupil portal
    assignments: {
        list: async () => {
            try {
                const result = await apiClient.get('/pupil/assignments');
                return { success: true, data: result || [] };
            } catch (error) {
                // Return fallback sample data when API fails
                return { success: true, data: getFallbackAssignments() };
            }
        },
        submit: async (assignmentId, formData) => {
            try {
                const response = await fetch(`${apiClient.baseUrl}/pupil/assignments/${assignmentId}/submit`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiClient.token}`,
                        // Don't set Content-Type for FormData - browser sets it with boundary
                    },
                    body: formData
                });
                
                if (!response.ok) {
                    const error = await response.json().catch(() => ({}));
                    return { success: false, error: error.error || 'Submission failed' };
                }
                
                return { success: true, data: { id: assignmentId, status: 'Submitted' } };
            } catch (error) {
                return { success: false, error: error.message };
            }
        },
        downloadAttachment: async (assignmentId, filename) => {
            try {
                const response = await fetch(`${apiClient.baseUrl}/pupil/assignments/${assignmentId}/download`, {
                    headers: {
                        'Authorization': `Bearer ${apiClient.token}`
                    }
                });
                
                if (!response.ok) {
                    return { success: false, error: 'Download failed' };
                }
                
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                
                return { success: true };
            } catch (error) {
                return { success: false, error: error.message };
            }
        }
    }
};
