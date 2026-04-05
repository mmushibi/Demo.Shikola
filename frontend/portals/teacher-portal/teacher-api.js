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
 * Shikola Teacher Portal API Client
 * Provides unified API access with database integration and localStorage fallback
 */
(function () {
  'use strict';

  // Initialize real-time sync when available
  function initializeRealtimeSync() {
    if (window.TeacherOfflineManager) {
      window.TeacherOfflineManager.init();
    }
    
    if (window.shikolaRealtimeSync) {
      console.log('Teacher real-time sync initialized');
    }
  }

  // Use universal API if available
  function canUseUniversalAPI() {
    return !!(window.ShikolaUniversalAPI && window.ShikolaUniversalAPI.get);
  }

  // Authentication token helper
  function getAuthToken() {
    try {
      return localStorage.getItem('authToken') || localStorage.getItem('shikola_token') || null;
    } catch (e) {
      return null;
    }
  }

  // Legacy API request fallback
  async function legacyApiRequest(endpoint, options) {
    const API_BASE = window.SHIKOLA_API_BASE || '/api';
    
    var url = API_BASE + endpoint;
    var token = getAuthToken();
    var headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    if (token) {
      headers['Authorization'] = 'Bearer ' + token;
    }

    var config = Object.assign({
      method: 'GET',
      headers: headers
    }, options || {});

    try {
      var response = await fetch(url, config);
      var data = await response.json().catch(function () { return null; });
      
      if (!response.ok) {
        // Handle 401 Unauthorized gracefully
        if (response.status === 401) {
          console.warn('Authentication required for', endpoint, '- please log in');
          // Return empty data structure instead of error to prevent UI crashes
          return { 
            success: false, 
            error: 'Authentication required', 
            status: response.status,
            data: endpoint.includes('/classes') ? { classes: [], subjects: [] } :
                  endpoint.includes('/assignments') ? [] :
                  endpoint.includes('/live-classes') ? [] :
                  endpoint.includes('/behaviour-entries') ? [] :
                  endpoint.includes('/dashboard') ? { stats: {}, attendance: {}, upcomingClasses: [] } :
                  null
          };
        }
        return { success: false, error: data?.error || 'Request failed', status: response.status };
      }
      
      return { success: true, data: data, status: response.status };
    } catch (e) {
      console.warn('Network error for', endpoint, ':', e.message);
      return { success: false, error: 'Network error: ' + e.message };
    }
  }

  // Teacher Dashboard with database integration
  async function getDashboard() {
    if (canUseUniversalAPI()) {
      return await window.ShikolaUniversalAPI.get('dashboard');
    }
    return legacyApiRequest('/api/teacher/dashboard');
  }

  
  // Teacher Classes with database integration
  async function getMyClasses() {
    if (canUseUniversalAPI()) {
      return await window.ShikolaUniversalAPI.get('classes');
    }
    return legacyApiRequest('/api/teacher/my-classes');
  }

  async function addClass(classData) {
    if (canUseUniversalAPI()) {
      return await window.ShikolaUniversalAPI.post('classes', classData);
    }
    return legacyApiRequest('/api/teacher/my-classes', {
      method: 'POST',
      body: JSON.stringify(classData),
    });
  }

  // Get pupils for a specific class
  async function getClassPupils(className) {
    if (canUseUniversalAPI()) {
      return await window.ShikolaUniversalAPI.get('pupils', { class: className });
    }
    return legacyApiRequest(`/api/teacher/classes/${encodeURIComponent(className)}/pupils`);
  }

  async function assignPupilToClass(className, pupilId) {
    if (canUseUniversalAPI()) {
      return await window.ShikolaUniversalAPI.post('pupils', { 
        action: 'assign', 
        className: className, 
        pupilId: pupilId 
      });
    }
    return legacyApiRequest(`/api/teacher/classes/${encodeURIComponent(className)}/pupils/${encodeURIComponent(pupilId)}/assign`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async function removePupilFromClass(className, pupilId) {
    if (canUseUniversalAPI()) {
      return await window.ShikolaUniversalAPI.delete('pupils', { 
        action: 'remove', 
        className: className, 
        pupilId: pupilId 
      });
    }
    return legacyApiRequest(`/api/teacher/classes/${encodeURIComponent(className)}/pupils/${encodeURIComponent(pupilId)}/remove`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  // Assignments with database integration
  async function getAssignments() {
    if (canUseUniversalAPI()) {
      return await window.ShikolaUniversalAPI.get('assignments');
    }
    return legacyApiRequest('/api/teacher/assignments');
  }

  async function createAssignment(assignment) {
    if (canUseUniversalAPI()) {
      return await window.ShikolaUniversalAPI.post('assignments', assignment);
    }
    return legacyApiRequest('/api/teacher/assignments', {
      method: 'POST',
      body: JSON.stringify(assignment),
    });
  }

  async function updateAssignment(id, assignment) {
    if (canUseUniversalAPI()) {
      return await window.ShikolaUniversalAPI.put('assignments', { ...assignment, id });
    }
    return legacyApiRequest(`/api/teacher/assignments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(assignment),
    });
  }

  async function deleteAssignment(id) {
    if (canUseUniversalAPI()) {
      return await window.ShikolaUniversalAPI.delete('assignments', id);
    }
    return legacyApiRequest(`/api/teacher/assignments/${id}`, {
      method: 'DELETE',
    });
  }

  async function getAssignmentSubmissions(assignmentId) {
    if (canUseUniversalAPI()) {
      return await window.ShikolaUniversalAPI.get('assignments', { 
        action: 'submissions', 
        assignmentId: assignmentId 
      });
    }
    return legacyApiRequest(`/api/teacher/assignments/${assignmentId}/submissions`);
  }

  async function gradeSubmission(assignmentId, submissionId, marks, feedback) {
    if (canUseUniversalAPI()) {
      return await window.ShikolaUniversalAPI.post('assignments', { 
        action: 'grade', 
        assignmentId: assignmentId, 
        submissionId: submissionId, 
        marks: marks, 
        feedback: feedback 
      });
    }
    return legacyApiRequest(`/api/teacher/assignments/${assignmentId}/grade`, {
      method: 'POST',
      body: JSON.stringify({ submissionId, marks, feedback }),
    });
  }

  // Helper function to get class ID from class name
  async function getClassIdByName(className) {
    try {
      // First try to get from local cache if available
      if (window.ShikolaClassesStore && typeof window.ShikolaClassesStore.getClassByName === 'function') {
        const classInfo = window.ShikolaClassesStore.getClassByName(className);
        if (classInfo && classInfo.id) {
          return classInfo.id;
        }
      }
      
      // Fallback to API call
      const result = await legacyApiRequest('/api/teacher/classes/by-name', {
        method: 'POST',
        body: JSON.stringify({ className })
      });
      
      if (result.success && result.data && result.data.id) {
        return result.data.id;
      }
      
      // If no class ID found, return null
      console.warn('Class ID not found for class name:', className);
      return null;
    } catch (error) {
      console.error('Error getting class ID:', error);
      return null;
    }
  }

  // Attendance with database integration
  async function getAttendance(params = {}) {
    if (canUseUniversalAPI()) {
      return await window.ShikolaUniversalAPI.get('attendance', params);
    }
    const query = new URLSearchParams();
    if (params.className) {
      // Convert className to class_id for backend
      const classId = await getClassIdByName(params.className);
      if (classId) {
        query.set('class_id', classId);
      }
    }
    if (params.date) query.set('date', params.date);
    if (params.startDate) query.set('start_date', params.startDate);
    if (params.endDate) query.set('end_date', params.endDate);
    const queryStr = query.toString();
    return legacyApiRequest(`/api/teacher/attendance${queryStr ? '?' + queryStr : ''}`);
  }

  async function saveAttendance(className, date, attendance, notes) {
    if (canUseUniversalAPI()) {
      return await window.ShikolaUniversalAPI.post('attendance', { 
        className, date, attendance, notes 
      });
    }
    
    // Get class ID for backend
    const classId = await getClassIdByName(className);
    if (!classId) {
      return { success: false, error: 'Class not found: ' + className };
    }
    
    // Transform data for backend API
    const attendanceRecords = Object.entries(attendance || {}).map(([pupilId, status]) => ({
      pupil_id: pupilId,
      status: status,
      notes: notes || ''
    }));

    return legacyApiRequest('/api/teacher/attendance', {
      method: 'POST',
      body: JSON.stringify({ 
        class_id: classId,
        date, 
        attendance_records: attendanceRecords, 
        notes 
      }),
    });
  }

  // Enhanced attendance methods for teacher portal
  async function loadClassAttendance(className, date) {
    try {
      const result = await getAttendance({ className, date });
      if (result.success && result.data) {
        // Transform backend response to frontend format
        const attendanceMap = {};
        const remarksMap = {};
        
        result.data.forEach(record => {
          attendanceMap[record.pupilId || record.pupil_id] = record.status;
          if (record.notes) {
            remarksMap[record.pupilId || record.pupil_id] = record.notes;
          }
        });
        
        return {
          attendance: attendanceMap,
          remarks: remarksMap,
          hasData: result.data.length > 0
        };
      }
      return { attendance: {}, remarks: {}, hasData: false };
    } catch (error) {
      console.error('Failed to load class attendance:', error);
      return { attendance: {}, remarks: {}, hasData: false };
    }
  }

  async function saveClassAttendance(className, date, students, options = {}) {
    try {
      const attendanceRecords = students.map(student => ({
        pupil_id: student.id,
        status: student.status || 'P',
        notes: student.remark || ''
      }));

      const result = await saveAttendance(className, date, 
        students.reduce((acc, student) => {
          acc[student.id] = student.status || 'P';
          return acc;
        }, {}),
        options.notes || ''
      );

      if (result.success) {
        // Dispatch event for real-time updates
        try {
          window.dispatchEvent(new CustomEvent('shikola:attendance-saved', {
            detail: {
              className,
              date,
              students: students,
              timestamp: new Date().toISOString()
            }
          }));
        } catch (e) {
          console.warn('Failed to dispatch attendance event:', e);
        }
      }

      return result;
    } catch (error) {
      console.error('Failed to save class attendance:', error);
      return { success: false, error: error.message || 'Failed to save attendance' };
    }
  }

  async function getAttendanceSummary(className, startDate, endDate) {
    try {
      const params = { className };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      
      const result = await legacyApiRequest('/api/teacher/attendance/summary', {
        method: 'GET',
        query: new URLSearchParams(params).toString()
      });
      
      return result;
    } catch (error) {
      console.error('Failed to get attendance summary:', error);
      return { success: false, error: 'Failed to load attendance summary' };
    }
  }

  async function saveAttendanceRemarks(className, date, remarks) {
    try {
      const classId = await getClassIdByName(className);
      if (!classId) {
        return { success: false, error: 'Class not found: ' + className };
      }

      const remarksData = remarks.map(remark => ({
        pupil_id: remark.id || remark.pupilId,
        remark: remark.remark,
        status: remark.status
      }));

      return legacyApiRequest('/api/teacher/attendance/remarks', {
        method: 'POST',
        body: JSON.stringify({
          class_id: classId,
          date,
          remarks: remarksData
        })
      });
    } catch (error) {
      console.error('Failed to save attendance remarks:', error);
      return { success: false, error: 'Failed to save remarks' };
    }
  }

  // Behaviour Entries with database integration
  async function getBehaviourEntries(params = {}) {
    if (canUseUniversalAPI()) {
      return await window.ShikolaUniversalAPI.get('behaviour', params);
    }
    
    const query = new URLSearchParams();
    if (params.classId) query.set('classId', params.classId);
    if (params.type) query.set('type', params.type);
    const queryStr = query.toString();
    return legacyApiRequest(`/api/teacher/behaviour-entries${queryStr ? '?' + queryStr : ''}`);
  }

  async function createBehaviourEntry(entry) {
    if (canUseUniversalAPI()) {
      return await window.ShikolaUniversalAPI.post('behaviour', entry);
    }
    
    // Transform frontend data to backend format
    const backendEntry = {
      pupilId: entry.pupil || entry.pupilId,
      classId: entry.classId || (entry.className ? await getClassIdByName(entry.className) : null),
      category: entry.type === 'positive' ? 'positive' : 'negative',
      description: entry.note,
      points: entry.type === 'positive' ? 1 : -1,
      incidentDate: new Date().toISOString(),
      actionTaken: entry.actionTaken || null
    };
    
    return legacyApiRequest('/api/teacher/behaviour-entries', {
      method: 'POST',
      body: JSON.stringify(backendEntry),
    });
  }

  async function deleteBehaviourEntry(id) {
    if (canUseUniversalAPI()) {
      return await window.ShikolaUniversalAPI.delete('behaviour', id);
    }
    return legacyApiRequest(`/api/teacher/behaviour-entries/${id}`, {
      method: 'DELETE',
    });
  }

  
  // Live Classes with database integration
  async function getLiveClasses() {
    if (canUseUniversalAPI()) {
      return await window.ShikolaUniversalAPI.get('liveClasses');
    }
    return legacyApiRequest('/api/teacher/live-classes');
  }

  async function scheduleLiveClass(data) {
    if (canUseUniversalAPI()) {
      return await window.ShikolaUniversalAPI.post('liveClasses', data);
    }
    return legacyApiRequest('/api/teacher/live-classes/schedule', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async function startLiveClass(id) {
    if (canUseUniversalAPI()) {
      return await window.ShikolaUniversalAPI.post('liveClasses', { 
        action: 'start', id 
      });
    }
    return legacyApiRequest(`/api/teacher/live-classes/${id}/start`, {
      method: 'POST',
    });
  }

  async function endLiveClass(id) {
    if (canUseUniversalAPI()) {
      return await window.ShikolaUniversalAPI.post('liveClasses', { 
        action: 'end', id 
      });
    }
    return legacyApiRequest(`/api/teacher/live-classes/${id}/end`, {
      method: 'POST',
    });
  }

  async function deleteLiveClass(id) {
    if (canUseUniversalAPI()) {
      return await window.ShikolaUniversalAPI.delete('liveClasses', id);
    }
    return legacyApiRequest(`/api/teacher/live-classes/${id}`, {
      method: 'DELETE',
    });
  }

  // Timetable with database integration
  async function getTimetable(className) {
    if (canUseUniversalAPI()) {
      return await window.ShikolaUniversalAPI.get('timetable', className ? { class: className } : {});
    }
    
    // Try API first, fallback to localStorage if auth fails
    const query = className ? `?className=${encodeURIComponent(className)}` : '';
    const apiResult = await legacyApiRequest(`/api/teacher/timetable${query}`);
    
    if (apiResult.success) {
      return apiResult;
    }
    
    // Fallback to localStorage if API fails (401, network error, etc.)
    if (apiResult.status === 401 || !apiResult.success) {
      try {
        // Try to get timetable from localStorage via ShikolaTimetablesStore
        if (window.ShikolaTimetablesStore && window.ShikolaTimetablesStore.getTeacherTimetable) {
          const currentUser = window.shikolaAuth && window.shikolaAuth.getCurrentUser ? 
            window.shikolaAuth.getCurrentUser() : null;
          const teacherName = currentUser && (currentUser.fullName || currentUser.name || currentUser.email);
          
          if (teacherName) {
            const timetableData = window.ShikolaTimetablesStore.getTeacherTimetable(teacherName);
            if (timetableData) {
              return { success: true, data: timetableData.slots || [], status: 200 };
            }
          }
        }
        
        // Return empty timetable as last resort
        return { success: true, data: [], status: 200 };
      } catch (e) {
        return { success: true, data: [], status: 200 };
      }
    }
    
    return apiResult;
  }

  // Grades with database integration
  async function getGrades(params = {}) {
    if (canUseUniversalAPI()) {
      return await window.ShikolaUniversalAPI.get('grades', params);
    }
    const query = new URLSearchParams();
    if (params.className) query.set('className', params.className);
    if (params.subject) query.set('subject', params.subject);
    if (params.term) query.set('term', params.term);
    const queryStr = query.toString();
    return legacyApiRequest(`/api/teacher/grades${queryStr ? '?' + queryStr : ''}`);
  }

  async function saveGrades(data) {
    if (canUseUniversalAPI()) {
      return await window.ShikolaUniversalAPI.post('grades', data);
    }
    return legacyApiRequest('/api/teacher/grades', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Exams - Chapters (Teachers have limited access)
  async function getExamChapters(params = {}) {
    if (canUseUniversalAPI()) {
      return await window.ShikolaUniversalAPI.get('exam-chapters', params);
    }
    
    // Teachers can view exam chapters for their assigned subjects/classes
    const { className, subject, examId } = params;
    let url = '/api/teacher/exam-chapters';
    const queryParams = [];
    
    if (className) {
      queryParams.push(`class=${encodeURIComponent(className)}`);
    }
    if (subject) {
      queryParams.push(`subject=${encodeURIComponent(subject)}`);
    }
    if (examId) {
      queryParams.push(`examId=${encodeURIComponent(examId)}`);
    }
    
    if (queryParams.length > 0) {
      url += '?' + queryParams.join('&');
    }
    
    try {
      const response = await legacyApiRequest(url);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Failed to fetch exam chapters:', error);
      return [];
    }
  }

  async function createExamChapter(data) {
    // Teachers don't have access to create exam chapters
    console.warn('Teachers do not have permission to create exam chapters');
    return null;
  }

  async function deleteExamChapter(id) {
    // Teachers don't have access to delete exam chapters
    console.warn('Teachers do not have permission to delete exam chapters');
    return false;
  }

  // Exams - Questions (Teachers have limited access)
  async function getQuestionBank(params = {}) {
    if (canUseUniversalAPI()) {
      return await window.ShikolaUniversalAPI.get('question-bank', params);
    }
    
    // Teachers can view question bank for their assigned subjects
    const { className, subject, chapter, difficulty } = params;
    let url = '/api/teacher/question-bank';
    const queryParams = [];
    
    if (className) {
      queryParams.push(`class=${encodeURIComponent(className)}`);
    }
    if (subject) {
      queryParams.push(`subject=${encodeURIComponent(subject)}`);
    }
    if (chapter) {
      queryParams.push(`chapter=${encodeURIComponent(chapter)}`);
    }
    if (difficulty) {
      queryParams.push(`difficulty=${encodeURIComponent(difficulty)}`);
    }
    
    if (queryParams.length > 0) {
      url += '?' + queryParams.join('&');
    }
    
    try {
      const response = await legacyApiRequest(url);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Failed to fetch question bank:', error);
      return [];
    }
  }

  async function createQuestion(data) {
    // Teachers don't have access to create questions
    console.warn('Teachers do not have permission to create questions');
    return null;
  }

  async function deleteQuestion(id) {
    // Teachers don't have access to delete questions
    console.warn('Teachers do not have permission to delete questions');
    return false;
  }

  // Exams - Teacher-specific data fetching (REAL BACKEND INTEGRATION)
  async function getMyExams(className = null, subject = null) {
    try {
      let url = '/api/teacher/my-exams';
      const queryParams = [];
      
      if (className) {
        queryParams.push(`className=${encodeURIComponent(className)}`);
      }
      
      if (subject) {
        queryParams.push(`subject=${encodeURIComponent(subject)}`);
      }
      
      if (queryParams.length > 0) {
        url += '?' + queryParams.join('&');
      }
      
      const response = await legacyApiRequest(url);
      return response && response.success ? response.data : [];
    } catch (error) {
      console.error('Failed to fetch teacher exams:', error);
      return [];
    }
  }

  async function getExamSchedulesForTeacher(className = null, subject = null) {
    try {
      let url = '/api/teacher/exam-schedules';
      const queryParams = [];
      
      if (className) {
        queryParams.push(`className=${encodeURIComponent(className)}`);
      }
      
      if (subject) {
        queryParams.push(`subject=${encodeURIComponent(subject)}`);
      }
      
      if (queryParams.length > 0) {
        url += '?' + queryParams.join('&');
      }
      
      const response = await legacyApiRequest(url);
      return response && response.success ? response.data : [];
    } catch (error) {
      console.error('Failed to fetch exam schedules:', error);
      return [];
    }
  }

  async function createExamSchedule(data) {
    // Teachers don't have permission to create exam schedules
    console.warn('Teachers do not have permission to create exam schedules');
    return null;
  }

  async function getExamMarksForTeacher(examId, className = null, subject = null) {
    if (!examId) return [];
    
    try {
      let url = `/api/teacher/exam-marks/${encodeURIComponent(examId)}`;
      const queryParams = [];
      
      if (className) {
        queryParams.push(`className=${encodeURIComponent(className)}`);
      }
      
      if (subject) {
        queryParams.push(`subject=${encodeURIComponent(subject)}`);
      }
      
      if (queryParams.length > 0) {
        url += '?' + queryParams.join('&');
      }
      
      const response = await legacyApiRequest(url);
      return response && response.success ? response.data : [];
    } catch (error) {
      console.error('Failed to fetch exam marks:', error);
      return [];
    }
  }

  async function saveExamMarks(marksData) {
    if (!marksData || !marksData.examId || !marksData.marks) {
      console.error('Invalid parameters for saveExamMarks');
      return false;
    }
    
    try {
      const response = await legacyApiRequest('/api/teacher/exam-marks', {
        method: 'POST',
        body: JSON.stringify({
          examId: marksData.examId,
          marks: marksData.marks
        }),
      });
      
      return response && response.success;
    } catch (error) {
      console.error('Failed to save exam marks:', error);
      return false;
    }
  }

  // Exams - Chapters (Teachers have read-only access)
  async function getExamChapters(params = {}) {
    try {
      const { className, subject, examId } = params;
      let url = '/api/teacher/exam-chapters';
      const queryParams = [];
      
      if (className) {
        queryParams.push(`className=${encodeURIComponent(className)}`);
      }
      if (subject) {
        queryParams.push(`subject=${encodeURIComponent(subject)}`);
      }
      if (examId) {
        queryParams.push(`examId=${encodeURIComponent(examId)}`);
      }
      
      if (queryParams.length > 0) {
        url += '?' + queryParams.join('&');
      }
      
      const response = await legacyApiRequest(url);
      return response && response.success ? response.data : [];
    } catch (error) {
      console.error('Failed to fetch exam chapters:', error);
      return [];
    }
  }

  // Exams - Questions (Teachers have read-only access)
  async function getQuestionBank(params = {}) {
    try {
      const { className, subject, chapter, difficulty } = params;
      let url = '/api/teacher/question-bank';
      const queryParams = [];
      
      if (className) {
        queryParams.push(`className=${encodeURIComponent(className)}`);
      }
      if (subject) {
        queryParams.push(`subject=${encodeURIComponent(subject)}`);
      }
      if (chapter) {
        queryParams.push(`chapter=${encodeURIComponent(chapter)}`);
      }
      if (difficulty) {
        queryParams.push(`difficulty=${encodeURIComponent(difficulty)}`);
      }
      
      if (queryParams.length > 0) {
        url += '?' + queryParams.join('&');
      }
      
      const response = await legacyApiRequest(url);
      return response && response.success ? response.data : [];
    } catch (error) {
      console.error('Failed to fetch question bank:', error);
      return [];
    }
  }

  // Teachers cannot create or delete questions - these are read-only
  async function createQuestion(data) {
    console.warn('Teachers do not have permission to create questions');
    return null;
  }

  async function deleteQuestion(id) {
    console.warn('Teachers do not have permission to delete questions');
    return false;
  }

  async function createExamChapter(data) {
    console.warn('Teachers do not have permission to create exam chapters');
    return null;
  }

  async function deleteExamChapter(id) {
    console.warn('Teachers do not have permission to delete exam chapters');
    return false;
  }

  // Teacher Role and Assignments (Many-to-Many Support)
  async function getTeacherProfile() {
    try {
      const response = await legacyApiRequest('/api/teacher/profile');
      return response;
    } catch (error) {
      console.error('Failed to fetch teacher profile:', error);
      return null;
    }
  }

  async function getMyClasses() {
    try {
      const response = await legacyApiRequest('/api/teacher/my-classes');
      // Ensure we return an array of class assignments
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Failed to fetch teacher classes:', error);
      return [];
    }
  }

  async function getMySubjects() {
    try {
      const response = await legacyApiRequest('/api/teacher/my-subjects');
      // Ensure we return an array of subject assignments
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Failed to fetch teacher subjects:', error);
      return [];
    }
  }

  // Get teacher's class-subject assignments (many-to-many)
  async function getMyClassSubjectAssignments() {
    try {
      const response = await legacyApiRequest('/api/teacher/my-assignments');
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Failed to fetch teacher assignments:', error);
      return [];
    }
  }

  // Get subjects for a specific class (for this teacher)
  async function getMySubjectsForClass(className) {
    try {
      const response = await legacyApiRequest(`/api/teacher/my-subjects?className=${encodeURIComponent(className)}`);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Failed to fetch subjects for class:', error);
      return [];
    }
  }

  // Get classes for a specific subject (for this teacher)
  async function getMyClassesForSubject(subject) {
    try {
      const response = await legacyApiRequest(`/api/teacher/my-classes?subject=${encodeURIComponent(subject)}`);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Failed to fetch classes for subject:', error);
      return [];
    }
  }

  // Pupils - Get pupils for a class (filtered by teacher role)
  async function getPupils(className, subject = null) {
    if (!className) return [];
    
    try {
      let url = `/api/teacher/pupils?className=${encodeURIComponent(className)}`;
      
      // If subject is specified, add it to filter (for subject teachers)
      if (subject) {
        url += `&subject=${encodeURIComponent(subject)}`;
      }
      
      const response = await legacyApiRequest(url);
      return response || [];
    } catch (error) {
      console.error('Failed to fetch pupils:', error);
      return [];
    }
  }

  // Get pupils filtered by teacher's role and assignments
  async function getMyPupils(className = null, subject = null) {
    try {
      let url = '/api/teacher/my-pupils';
      
      if (className) {
        url += `?className=${encodeURIComponent(className)}`;
      }
      
      if (subject) {
        url += `${className ? '&' : '?'}subject=${encodeURIComponent(subject)}`;
      }
      
      const response = await legacyApiRequest(url);
      return response || [];
    } catch (error) {
      console.error('Failed to fetch teacher pupils:', error);
      return [];
    }
  }

  // Reports - Enhanced with real backend integration
  async function getStudentReportCard(params = {}) {
    const query = new URLSearchParams();
    if (params.className) query.set('className', params.className);
    if (params.term) query.set('term', params.term);
    if (params.year) query.set('year', params.year);
    if (params.pupilId) query.set('pupilId', params.pupilId);
    const queryStr = query.toString();
    
    const response = await legacyApiRequest(`/api/teacher/reports/student-data${queryStr ? '?' + queryStr : ''}`);
    return response && response.success ? response.data : [];
  }

  async function getResultCards(params = {}) {
    const query = new URLSearchParams();
    if (params.className) query.set('className', params.className);
    if (params.term) query.set('term', params.term);
    if (params.year) query.set('year', params.year);
    const queryStr = query.toString();
    
    const response = await legacyApiRequest(`/api/teacher/reports/result-cards${queryStr ? '?' + queryStr : ''}`);
    return response && response.success ? response.data : [];
  }

  async function getAttendanceSummary(params = {}) {
    const query = new URLSearchParams();
    if (params.className) query.set('className', params.className);
    if (params.month) query.set('month', params.month);
    if (params.year) query.set('year', params.year);
    const queryStr = query.toString();
    
    const response = await legacyApiRequest(`/api/teacher/reports/attendance-summary${queryStr ? '?' + queryStr : ''}`);
    return response && response.success ? response.data : [];
  }

  async function saveReportComments(commentsData) {
    if (!commentsData || !commentsData.studentId) {
      return { success: false, error: 'Invalid comments data' };
    }
    
    const response = await legacyApiRequest('/api/teacher/reports/save-comments', {
      method: 'POST',
      body: JSON.stringify(commentsData),
    });
    
    return response;
  }

  // Get class attendance history
  async function getClassAttendanceHistory(className) {
    if (canUseUniversalAPI()) {
      return await window.ShikolaUniversalAPI.get('class-attendance-history', { className });
    }
    
    try {
      const response = await legacyApiRequest(`/api/teacher/attendance-history?className=${encodeURIComponent(className)}`);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Failed to fetch class attendance history:', error);
      return [];
    }
  }

  // School Settings
  async function getSchoolSettings() {
    if (canUseUniversalAPI()) {
      return await window.ShikolaUniversalAPI.get('school/settings');
    }
    return legacyApiRequest('/api/teacher/school/settings');
  }

  // Exam Terms Configuration
  async function getExamTerms() {
    if (canUseUniversalAPI()) {
      return await window.ShikolaUniversalAPI.get('exam-terms');
    }
    return legacyApiRequest('/api/teacher/exam-terms');
  }

  // Signature Management
  async function getSignature() {
    return legacyApiRequest('/api/teacher/signature');
  }

  async function uploadSignature(file) {
    const token = getAuthToken();

    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    const formData = new FormData();
    formData.append('signature', file);

    try {
      const response = await fetch(`${API_BASE}/api/teacher/signature`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data?.message || 'Failed to upload signature.' };
      }

      return { success: true, data: data };
    } catch (error) {
      console.error('Error uploading signature:', error);
      return { success: false, error: 'Failed to upload signature.' };
    }
  }

  async function deleteSignature() {
    return legacyApiRequest('/api/teacher/signature', {
      method: 'DELETE'
    });
  }

  // Password Management
  async function changePassword(passwordData) {
    return legacyApiRequest('/api/teacher/change-password', {
      method: 'POST',
      body: JSON.stringify(passwordData),
    });
  }

  
  // Export API
  window.ShikolaTeacherApi = {
    // Dashboard
    getDashboard,

    // Password Management
    changePassword,

    // Classes
    getMyClasses,
    addClass,
    getClassPupils,
    assignPupilToClass,
    removePupilFromClass,

    // Assignments
    getAssignments,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    getAssignmentSubmissions,
    gradeSubmission,

    // Attendance
    getAttendance,
    saveAttendance,
    loadClassAttendance,
    saveClassAttendance,
    getAttendanceSummary,
    saveAttendanceRemarks,

    // Behaviour
    getBehaviourEntries,
    createBehaviourEntry,
    deleteBehaviourEntry,

    // Class Tests
    getClassTests,
    createClassTest,
    saveClassTestMarks,
    getClassTestMarks,

    // Live Classes
    getLiveClasses,
    scheduleLiveClass,
    startLiveClass,
    endLiveClass,
    deleteLiveClass,

    // Timetable
    getTimetable,

    // Teacher Role and Assignments
    getTeacherProfile,
    getMyClasses,
    getMySubjects,
    getMyClassSubjectAssignments,
    getMySubjectsForClass,
    getMyClassesForSubject,

    // Pupils
    getPupils,
    getMyPupils,


    // Reports
    getStudentReportCard,
    getResultCards,
    getAttendanceSummary,
    saveReportComments,
    getClassAttendanceHistory,

    // School Settings & Configuration
    getSchoolSettings,
    getExamTerms,

    // Utility
    getAuthToken
  };
})();
