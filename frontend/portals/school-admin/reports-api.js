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
    var REPORTS_KEY = 'shikola_reports_v1';

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

    function canUseApi() {
        var base = window.SHIKOLA_API_BASE;
        var token = getAuthToken();
        return !!(base && token);
    }

    async function apiRequest(endpoint, options) {
        var base = window.SHIKOLA_API_BASE;
        if (!base) return { success: false, error: 'API not configured' };
        
        try {
            var response = await fetch(base + endpoint, Object.assign({
                headers: buildAuthHeaders()
            }, options || {}));
            
            var data = await response.json().catch(function () { return null; });
            
            if (!response.ok) {
                return { success: false, error: data?.error || 'Request failed', status: response.status };
            }
            
            return { success: true, data: data, status: response.status };
        } catch (e) {
            return { success: false, error: 'Network error: ' + e.message };
        }
    }

    function loadLocalReports() {
        try {
            var raw = localStorage.getItem(REPORTS_KEY);
            if (!raw) return [];
            var data = JSON.parse(raw);
            return Array.isArray(data) ? data : [];
        } catch (e) {
            return [];
        }
    }

    function saveLocalReports(list) {
        try {
            localStorage.setItem(REPORTS_KEY, JSON.stringify(Array.isArray(list) ? list : []));
        } catch (e) {
        }
    }

    async function getStudentReports(params) {
        if (!canUseApi()) {
            var localReports = loadLocalReports();
            var studentReports = localReports.filter(function (report) {
                return report.type === 'student';
            });
            return { success: true, data: studentReports };
        }

        var queryString = '';
        if (params && typeof params === 'object') {
            var parts = [];
            for (var key in params) {
                if (Object.prototype.hasOwnProperty.call(params, key) && params[key] != null) {
                    parts.push(encodeURIComponent(key) + '=' + encodeURIComponent(params[key]));
                }
            }
            if (parts.length) {
                queryString = '?' + parts.join('&');
            }
        }

        return await apiRequest('/api/admin/reports/students' + queryString, { method: 'GET' });
    }

    async function getClassReports(params) {
        if (!canUseApi()) {
            var localReports = loadLocalReports();
            var classReports = localReports.filter(function (report) {
                return report.type === 'class';
            });
            return { success: true, data: classReports };
        }

        var queryString = '';
        if (params && typeof params === 'object') {
            var parts = [];
            for (var key in params) {
                if (Object.prototype.hasOwnProperty.call(params, key) && params[key] != null) {
                    parts.push(encodeURIComponent(key) + '=' + encodeURIComponent(params[key]));
                }
            }
            if (parts.length) {
                queryString = '?' + parts.join('&');
            }
        }

        return await apiRequest('/api/admin/reports/classes' + queryString, { method: 'GET' });
    }

    async function getAttendanceReports(params) {
        if (!canUseApi()) {
            var attendanceData = [];
            
            if (window.ShikolaAttendanceStore) {
                try {
                    var attendanceRecords = window.ShikolaAttendanceStore.getAllRecords() || [];
                    var groupedByDate = {};
                    
                    attendanceRecords.forEach(function (record) {
                        var date = record.date;
                        if (!groupedByDate[date]) {
                            groupedByDate[date] = { present: 0, absent: 0, late: 0, total: 0 };
                        }
                        groupedByDate[date].total++;
                        if (record.status === 'P') groupedByDate[date].present++;
                        else if (record.status === 'A') groupedByDate[date].absent++;
                        else if (record.status === 'L') groupedByDate[date].late++;
                    });
                    
                    Object.keys(groupedByDate).forEach(function (date) {
                        attendanceData.push({
                            date: date,
                            present: groupedByDate[date].present,
                            absent: groupedByDate[date].absent,
                            late: groupedByDate[date].late,
                            total: groupedByDate[date].total
                        });
                    });
                } catch (e) {
                }
            }
            
            return { success: true, data: attendanceData };
        }

        var queryString = '';
        if (params && typeof params === 'object') {
            var parts = [];
            for (var key in params) {
                if (Object.prototype.hasOwnProperty.call(params, key) && params[key] != null) {
                    parts.push(encodeURIComponent(key) + '=' + encodeURIComponent(params[key]));
                }
            }
            if (parts.length) {
                queryString = '?' + parts.join('&');
            }
        }

        return await apiRequest('/api/admin/reports/attendance' + queryString, { method: 'GET' });
    }

    async function getFinancialReports(params) {
        if (!canUseApi()) {
            var financialData = {
                revenue: 0,
                expenses: 0,
                profit: 0,
                period: 'monthly'
            };

            if (window.ShikolaFeesApi) {
                try {
                    var feesResult = await window.ShikolaFeesApi.getFeesSummary();
                    if (feesResult.success && feesResult.data) {
                        financialData.revenue = feesResult.data.totalPaid || 0;
                    }
                } catch (e) {
                }
            }

            return { success: true, data: financialData };
        }

        var queryString = '';
        if (params && typeof params === 'object') {
            var parts = [];
            for (var key in params) {
                if (Object.prototype.hasOwnProperty.call(params, key) && params[key] != null) {
                    parts.push(encodeURIComponent(key) + '=' + encodeURIComponent(params[key]));
                }
            }
            if (parts.length) {
                queryString = '?' + parts.join('&');
            }
        }

        return await apiRequest('/api/admin/reports/financial' + queryString, { method: 'GET' });
    }

    async function getAcademicReports(params) {
        if (!canUseApi()) {
            var academicData = [];
            
            if (window.ShikolaPupilsApi) {
                try {
                    var pupils = await window.ShikolaPupilsApi.listPupils();
                    if (Array.isArray(pupils)) {
                        var classPerformance = {};
                        
                        pupils.forEach(function (pupil) {
                            var className = pupil.classGrade || pupil.classLabel || 'Unassigned';
                            if (!classPerformance[className]) {
                                classPerformance[className] = {
                                    totalStudents: 0,
                                    averagePerformance: 0
                                };
                            }
                            classPerformance[className].totalStudents++;
                        });
                        
                        Object.keys(classPerformance).forEach(function (className) {
                            academicData.push({
                                className: className,
                                totalStudents: classPerformance[className].totalStudents,
                                averagePerformance: classPerformance[className].averagePerformance
                            });
                        });
                    }
                } catch (e) {
                }
            }
            
            return { success: true, data: academicData };
        }

        var queryString = '';
        if (params && typeof params === 'object') {
            var parts = [];
            for (var key in params) {
                if (Object.prototype.hasOwnProperty.call(params, key) && params[key] != null) {
                    parts.push(encodeURIComponent(key) + '=' + encodeURIComponent(params[key]));
                }
            }
            if (parts.length) {
                queryString = '?' + parts.join('&');
            }
        }

        return await apiRequest('/api/admin/reports/academic' + queryString, { method: 'GET' });
    }

    async function generateReport(reportType, params) {
        var reportData = {
            id: 'RPT-' + Date.now().toString(36).toUpperCase(),
            type: reportType,
            generatedAt: new Date().toISOString(),
            parameters: params || {}
        };

        switch (reportType) {
            case 'student_enrollment':
                var studentResult = await getStudentReports(params);
                if (studentResult.success) {
                    reportData.data = studentResult.data;
                }
                break;
            case 'class_performance':
                var classResult = await getClassReports(params);
                if (classResult.success) {
                    reportData.data = classResult.data;
                }
                break;
            case 'attendance_summary':
                var attendanceResult = await getAttendanceReports(params);
                if (attendanceResult.success) {
                    reportData.data = attendanceResult.data;
                }
                break;
            case 'financial_summary':
                var financialResult = await getFinancialReports(params);
                if (financialResult.success) {
                    reportData.data = financialResult.data;
                }
                break;
            case 'academic_performance':
                var academicResult = await getAcademicReports(params);
                if (academicResult.success) {
                    reportData.data = academicResult.data;
                }
                break;
            default:
                return { success: false, error: 'Unknown report type: ' + reportType };
        }

        var localReports = loadLocalReports();
        localReports.push(reportData);
        saveLocalReports(localReports);

        return { success: true, data: reportData };
    }

    async function exportReport(reportId, format) {
        if (!canUseApi()) {
            var localReports = loadLocalReports();
            var report = localReports.find(function (r) { return r.id === reportId; });
            
            if (!report) {
                return { success: false, error: 'Report not found' };
            }

            var csvContent = '';
            if (Array.isArray(report.data)) {
                var headers = Object.keys(report.data[0] || {}).join(',');
                csvContent = headers + '\n';
                report.data.forEach(function (row) {
                    var values = Object.values(row).map(function (val) {
                        return '"' + String(val).replace(/"/g, '""') + '"';
                    }).join(',');
                    csvContent += values + '\n';
                });
            }

            return { success: true, data: csvContent };
        }

        return await apiRequest('/api/admin/reports/' + encodeURIComponent(reportId) + '/export?format=' + encodeURIComponent(format || 'csv'), {
            method: 'GET'
        });
    }

    window.ShikolaReportsApi = {
        getStudentReports: getStudentReports,
        getClassReports: getClassReports,
        getAttendanceReports: getAttendanceReports,
        getFinancialReports: getFinancialReports,
        getAcademicReports: getAcademicReports,
        generateReport: generateReport,
        exportReport: exportReport,
        getLocalReports: loadLocalReports,
        canUseApi: canUseApi
    };

    window.ShikolaReportsStore = {
        getReports: loadLocalReports,
        saveReports: saveLocalReports
    };

})();
