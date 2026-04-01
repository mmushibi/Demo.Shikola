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
(function () {
    var STORAGE_KEY = 'shikola_employee_attendance';
    var __listEmployeesForAttendanceInFlight = null;
    var __listEmployeesForAttendanceLastOkAt = 0;
    var __listEmployeesForAttendance429Until = 0;

    function getAuthToken() {
        try {
            return localStorage.getItem('authToken') || localStorage.getItem('shikola_token') || null;
        } catch (e) {
            return null;
        }
    }

    function buildAuthHeaders() {
        var headers = { 'Content-Type': 'application/json' };
        var token = getAuthToken();
        if (token) {
            headers['Authorization'] = 'Bearer ' + token;
        }
        return headers;
    }

    async function loadEmployeesForAttendance(department, date) {
        var now = Date.now();
        if (__listEmployeesForAttendanceInFlight) {
            return __listEmployeesForAttendanceInFlight;
        }
        if (__listEmployeesForAttendance429Until && now < __listEmployeesForAttendance429Until) {
            return [];
        }
        if (__listEmployeesForAttendanceLastOkAt && (now - __listEmployeesForAttendanceLastOkAt) < 15000) {
            return [];
        }

        __listEmployeesForAttendanceLastOkAt = now;

        __listEmployeesForAttendanceInFlight = (async function () {
            try {
                var base = window.SHIKOLA_API_BASE;
                var token = getAuthToken();
                if (!base || !token) {
                    return [];
                }

                var params = [];
                if (department) params.push('department=' + encodeURIComponent(department));
                if (date) params.push('date=' + encodeURIComponent(date));
                var query = params.length ? '?' + params.join('&') : '';

                var response = await fetch(base + '/api/admin/attendance/employees/list' + query, {
                    headers: buildAuthHeaders()
                });

                if (response.status === 429) {
                    __listEmployeesForAttendance429Until = Date.now() + 60000;
                    return [];
                }

                if (!response.ok) {
                    return [];
                }

                var data = await response.json().catch(function () { return null; });
                if (data && data.employees && Array.isArray(data.employees)) {
                    return data.employees;
                }
            } catch (e) {
            }

            return [];
        })();

        try {
            return await __listEmployeesForAttendanceInFlight;
        } finally {
            __listEmployeesForAttendanceInFlight = null;
        }
    }

    async function saveEmployeeAttendance(attendanceData) {
        var base = window.SHIKOLA_API_BASE;
        var token = getAuthToken();
        if (!base || !token) {
            throw new Error('No API base or token');
        }

        var response = await fetch(base + '/api/admin/attendance/employees', {
            method: 'POST',
            headers: buildAuthHeaders(),
            body: JSON.stringify(attendanceData)
        });

        if (!response.ok) {
            throw new Error('Failed to save employee attendance');
        }

        var data = await response.json().catch(function () { return null; });
        return data;
    }

    window.ShikolaEmployeeAttendanceApi = {
        loadEmployeesForAttendance: loadEmployeesForAttendance,
        saveEmployeeAttendance: saveEmployeeAttendance
    };

})(window);
