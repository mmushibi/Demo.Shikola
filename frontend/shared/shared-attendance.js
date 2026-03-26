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
(function (window) {
  var PREFIX = 'shikola_attendance_v1';

  function keyForStudents(date, className) {
    if (!date || !className) return null;
    return PREFIX + ':students:' + date + ':' + className;
  }

  function keyForEmployees(date, department) {
    if (!date || !department) return null;
    return PREFIX + ':employees:' + date + ':' + department;
  }

  function saveStudentAttendanceForClass(date, className, entries) {
    var key = keyForStudents(date, className);
    if (!key) return null;
    var payload = { attendance: {}, remarks: {} };
    if (Array.isArray(entries)) {
      for (var i = 0; i < entries.length; i++) {
        var e = entries[i];
        if (!e || !e.id) continue;
        var id = String(e.id);
        var status = e.status || 'P';
        payload.attendance[id] = status;
        if (e.remark && String(e.remark).trim()) {
          payload.remarks[id] = String(e.remark);
        }
      }
    }
    try {
      localStorage.setItem(key, JSON.stringify(payload));
    } catch (e) {
    }
    try {
      window.dispatchEvent(new CustomEvent('shikola:attendance-updated', {
        detail: {
          scope: 'students',
          date: date,
          className: className,
          payload: payload
        }
      }));
    } catch (e) {
    }
    return payload;
  }

  function loadStudentAttendanceForClass(date, className) {
    var key = keyForStudents(date, className);
    if (!key) return null;
    var raw;
    try {
      raw = localStorage.getItem(key);
    } catch (e) {
      raw = null;
    }
    if (!raw) return null;
    var parsed;
    try {
      parsed = JSON.parse(raw) || {};
    } catch (e) {
      return null;
    }
    if (!parsed.attendance || typeof parsed.attendance !== 'object') {
      parsed.attendance = {};
    }
    if (!parsed.remarks || typeof parsed.remarks !== 'object') {
      parsed.remarks = {};
    }
    return parsed;
  }

  function saveEmployeeAttendanceForDepartment(date, department, entries) {
    var key = keyForEmployees(date, department);
    if (!key) return null;
    var payload = { attendance: {}, remarks: {} };
    if (Array.isArray(entries)) {
      for (var i = 0; i < entries.length; i++) {
        var e = entries[i];
        if (!e || !e.id) continue;
        var id = String(e.id);
        var status = e.status || 'P';
        payload.attendance[id] = status;
        if (e.remark && String(e.remark).trim()) {
          payload.remarks[id] = String(e.remark);
        }
      }
    }
    try {
      localStorage.setItem(key, JSON.stringify(payload));
    } catch (e) {
    }
    try {
      window.dispatchEvent(new CustomEvent('shikola:attendance-updated', {
        detail: {
          scope: 'employees',
          date: date,
          department: department,
          payload: payload
        }
      }));
    } catch (e) {
    }
    return payload;
  }

  function loadEmployeeAttendanceForDepartment(date, department) {
    var key = keyForEmployees(date, department);
    if (!key) return null;
    var raw;
    try {
      raw = localStorage.getItem(key);
    } catch (e) {
      raw = null;
    }
    if (!raw) return null;
    var parsed;
    try {
      parsed = JSON.parse(raw) || {};
    } catch (e) {
      return null;
    }
    if (!parsed.attendance || typeof parsed.attendance !== 'object') {
      parsed.attendance = {};
    }
    if (!parsed.remarks || typeof parsed.remarks !== 'object') {
      parsed.remarks = {};
    }
    return parsed;
  }

  function getStudentStatusForDate(studentId, date) {
    if (!studentId || !date) return null;
    var id = String(studentId);
    var prefix = PREFIX + ':students:' + date + ':';
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (!key || key.indexOf(prefix) !== 0) continue;
        var raw = localStorage.getItem(key);
        if (!raw) continue;
        var parsed;
        try {
          parsed = JSON.parse(raw) || {};
        } catch (e) {
          continue;
        }
        var attendance = parsed.attendance || {};
        if (Object.prototype.hasOwnProperty.call(attendance, id)) {
          return attendance[id] || null;
        }
      }
    } catch (e) {
    }
    return null;
  }

  function computeDailyStudentStats(date) {
    var stats = { present: 0, late: 0, absent: 0, leave: 0, totalMarked: 0 };
    if (!date) return stats;
    var prefix = PREFIX + ':students:' + date + ':';
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (!key || key.indexOf(prefix) !== 0) continue;
        var raw = localStorage.getItem(key);
        if (!raw) continue;
        var parsed;
        try {
          parsed = JSON.parse(raw) || {};
        } catch (e) {
          continue;
        }
        var attendance = parsed.attendance || {};
        for (var id in attendance) {
          if (!Object.prototype.hasOwnProperty.call(attendance, id)) continue;
          var status = attendance[id];
          stats.totalMarked += 1;
          if (status === 'P') stats.present += 1;
          else if (status === 'A') stats.absent += 1;
          else if (status === 'L') stats.late += 1;
          else if (status === 'Lv') stats.leave += 1;
        }
      }
    } catch (e) {
    }
    return stats;
  }

  function computeDailyEmployeeStats(date) {
    var stats = { present: 0, late: 0, absent: 0, leave: 0, totalMarked: 0 };
    if (!date) return stats;
    var prefix = PREFIX + ':employees:' + date + ':';
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (!key || key.indexOf(prefix) !== 0) continue;
        var raw = localStorage.getItem(key);
        if (!raw) continue;
        var parsed;
        try {
          parsed = JSON.parse(raw) || {};
        } catch (e) {
          continue;
        }
        var attendance = parsed.attendance || {};
        for (var id in attendance) {
          if (!Object.prototype.hasOwnProperty.call(attendance, id)) continue;
          var status = attendance[id];
          stats.totalMarked += 1;
          if (status === 'P') stats.present += 1;
          else if (status === 'A') stats.absent += 1;
          else if (status === 'L') stats.late += 1;
          else if (status === 'Lv') stats.leave += 1;
        }
      }
    } catch (e) {
    }
    return stats;
  }

  window.ShikolaAttendanceStore = {
    PREFIX: PREFIX,
    keyForStudents: keyForStudents,
    keyForEmployees: keyForEmployees,
    saveStudentAttendanceForClass: saveStudentAttendanceForClass,
    loadStudentAttendanceForClass: loadStudentAttendanceForClass,
    saveEmployeeAttendanceForDepartment: saveEmployeeAttendanceForDepartment,
    loadEmployeeAttendanceForDepartment: loadEmployeeAttendanceForDepartment,
    getStudentStatusForDate: getStudentStatusForDate,
    computeDailyStudentStats: computeDailyStudentStats,
    computeDailyEmployeeStats: computeDailyEmployeeStats
  };
})(window);
