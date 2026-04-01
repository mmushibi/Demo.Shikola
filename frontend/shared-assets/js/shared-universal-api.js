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
// Shared Universal API Functions
class UniversalApi {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    // Generic data fetching with caching
    async fetchData(endpoint, options = {}) {
        const cacheKey = JSON.stringify({ endpoint, options });

        // Check cache first
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                return cached.data;
            }
            this.cache.delete(cacheKey);
        }

        try {
            const data = await apiClient.get(endpoint);

            // Cache the result
            this.cache.set(cacheKey, {
                data: data,
                timestamp: Date.now()
            });

            return data;
        } catch (error) {
            console.error(`Failed to fetch data from ${endpoint}:`, error);
            throw error;
        }
    }

    // Academic years
    async getAcademicYears() {
        return this.fetchData('/api/timetable/academic-years');
    }

    // Terms
    async getTerms() {
        return this.fetchData('/api/timetable/terms');
    }

    // Classes
    async getClasses() {
        return this.fetchData('/api/timetable/classes');
    }

    // Subjects
    async getSubjects() {
        return this.fetchData('/api/timetable/subjects');
    }

    // Teachers
    async getTeachers() {
        return this.fetchData('/api/timetable/teachers');
    }

    // Rooms
    async getRooms() {
        return this.fetchData('/api/timetable/rooms');
    }

    // Provinces
    async getProvinces() {
        return this.fetchData('/api/schoolregistration/provinces');
    }

    // Towns by province
    async getTownsByProvince(province) {
        return this.fetchData(`/api/schoolregistration/towns/${encodeURIComponent(province)}`);
    }

    // Subscription tiers
    async getSubscriptionTiers() {
        return this.fetchData('/api/schoolregistration/subscription-tiers');
    }

    // School availability check
    async checkSchoolAvailability(schoolData) {
        try {
            const response = await apiClient.post('/api/schoolregistration/check-availability', schoolData);
            return response;
        } catch (error) {
            console.error('School availability check failed:', error);
            throw error;
        }
    }

    // Signup/registration
    async signup(schoolData) {
        try {
            const response = await apiClient.post('/api/signup', schoolData);
            return response;
        } catch (error) {
            console.error('Signup failed:', error);
            throw error;
        }
    }

    // Complete signup
    async completeSignup(signupId) {
        try {
            const response = await apiClient.post(`/api/schoolregistration/complete/${signupId}`);
            return response;
        } catch (error) {
            console.error('Complete signup failed:', error);
            throw error;
        }
    }

    // Get signup data
    async getSignupData(signupId) {
        try {
            const response = await apiClient.get(`/api/schoolregistration/${signupId}`);
            return response;
        } catch (error) {
            console.error('Get signup data failed:', error);
            throw error;
        }
    }

    // Get signup data by email
    async getSignupDataByEmail(email) {
        try {
            const response = await apiClient.get(`/api/schoolregistration/by-email/${encodeURIComponent(email)}`);
            return response;
        } catch (error) {
            console.error('Get signup data by email failed:', error);
            throw error;
        }
    }

    // Get onboarding progress
    async getOnboardingProgress(userId) {
        try {
            const response = await apiClient.get(`/api/schoolregistration/onboarding-progress/${userId}`);
            return response;
        } catch (error) {
            console.error('Get onboarding progress failed:', error);
            throw error;
        }
    }

    // Update onboarding progress
    async updateOnboardingProgress(userId, progressData) {
        try {
            const response = await apiClient.put(`/api/schoolregistration/onboarding-progress/${userId}`, progressData);
            return response;
        } catch (error) {
            console.error('Update onboarding progress failed:', error);
            throw error;
        }
    }

    // Clear cache
    clearCache() {
        this.cache.clear();
    }

    // Get cached data size
    getCacheSize() {
        return this.cache.size;
    }
}

// Global universal API instance
const universalApi = new UniversalApi();
window.universalApi = universalApi;
