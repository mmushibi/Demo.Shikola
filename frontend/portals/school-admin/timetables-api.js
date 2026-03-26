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
    var STORAGE_KEY = 'shikola_timetables_v1';

    function loadAll() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return [];
            var parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            return [];
        }
    }

    function saveAll(list) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.isArray(list) ? list : []));
        } catch (e) {
        }
    }

    function saveMasterTimetable(payload) {
        var list = loadAll();
        var record = {
            id: payload && payload.id ? payload.id : 'TT-' + Date.now().toString(36),
            academicYear: payload && payload.academicYear != null ? payload.academicYear : null,
            academicTerm: payload && payload.academicTerm != null ? payload.academicTerm : null,
            startDate: payload && payload.startDate ? payload.startDate : null,
            baseMode: payload && payload.baseMode ? payload.baseMode : null,
            generatedAt: new Date().toISOString(),
            weekdays: Array.isArray(payload && payload.weekdays) ? payload.weekdays : [],
            periods: Array.isArray(payload && payload.periods) ? payload.periods : [],
            rooms: Array.isArray(payload && payload.rooms) ? payload.rooms : [],
            lessonDefinitions: Array.isArray(payload && payload.lessonDefinitions) ? payload.lessonDefinitions : [],
            slots: Array.isArray(payload && payload.slots) ? payload.slots : []
        };
        list.push(record);
        saveAll(list);
        try {
            window.dispatchEvent(new CustomEvent('shikola:timetables-updated', { detail: record }));
        } catch (e) {
        }
        return record;
    }

    function listTimetables() {
        return loadAll();
    }

    function getLatestMasterTimetable() {
        var list = loadAll();
        if (!Array.isArray(list) || !list.length) return null;
        return list[list.length - 1];
    }

    function buildFilterResult(selector) {
        var latest = getLatestMasterTimetable();
        if (!latest) return null;
        var slots = Array.isArray(latest.slots) ? latest.slots : [];
        var filtered = slots.filter(selector);
        return {
            timetable: latest,
            slots: filtered
        };
    }

    function getClassTimetable(className) {
        if (!className) return null;
        return buildFilterResult(function (slot) {
            return slot && slot.className === className;
        });
    }

    function getTeacherTimetable(teacherName) {
        if (!teacherName) return null;
        return buildFilterResult(function (slot) {
            return slot && slot.teacherName === teacherName;
        });
    }

    function listClassesWithTimetables() {
        var latest = getLatestMasterTimetable();
        if (!latest || !Array.isArray(latest.slots)) return [];
        var seen = {};
        var result = [];
        for (var i = 0; i < latest.slots.length; i++) {
            var s = latest.slots[i];
            if (!s || !s.className) continue;
            var name = String(s.className);
            if (seen[name]) continue;
            seen[name] = true;
            result.push(name);
        }
        return result;
    }

    function listTeachersWithTimetables() {
        var latest = getLatestMasterTimetable();
        if (!latest || !Array.isArray(latest.slots)) return [];
        var seen = {};
        var result = [];
        for (var i = 0; i < latest.slots.length; i++) {
            var s = latest.slots[i];
            if (!s || !s.teacherName) continue;
            var name = String(s.teacherName);
            if (seen[name]) continue;
            seen[name] = true;
            result.push(name);
        }
        return result;
    }

    window.ShikolaTimetablesStore = {
        saveMasterTimetable: saveMasterTimetable,
        listTimetables: listTimetables,
        getLatestMasterTimetable: getLatestMasterTimetable,
        getClassTimetable: getClassTimetable,
        getTeacherTimetable: getTeacherTimetable,
        listClassesWithTimetables: listClassesWithTimetables,
        listTeachersWithTimetables: listTeachersWithTimetables
    };
})();
