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
    var STORAGE_KEY = 'shikola_exam_results_v1';

    function loadAll() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return { marks: [], reportCards: [] };
            var parsed = JSON.parse(raw);
            if (!parsed || typeof parsed !== 'object') return { marks: [], reportCards: [] };
            if (!Array.isArray(parsed.marks)) parsed.marks = [];
            if (!Array.isArray(parsed.reportCards)) parsed.reportCards = [];
            // Backfill status on existing marks so we can control visibility to pupils.
            if (Array.isArray(parsed.marks)) {
                parsed.marks.forEach(function (row) {
                    if (row && !('status' in row)) {
                        // Set status to published for existing data
                        row.status = 'published';
                    }
                });
            }
            return parsed;
        } catch (e) {
            return { marks: [], reportCards: [] };
        }
    }

    function saveAll(data) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data || { marks: [], reportCards: [] }));
        } catch (e) {
        }
    }

    function buildMarkKey(entry) {
        var pupilId = entry && entry.pupilId ? String(entry.pupilId) : '';
        var examId = entry && entry.examId ? String(entry.examId) : '';
        var subject = entry && entry.subject ? String(entry.subject) : '';
        return pupilId + '::' + examId + '::' + subject;
    }

    function normalizeExamMark(entry) {
        if (!entry) return null;
        var marks = typeof entry.marks === 'number' ? entry.marks : Number(entry.marks || 0);
        if (!isFinite(marks) || marks < 0) marks = 0;
        var maxMarks = typeof entry.maxMarks === 'number' ? entry.maxMarks : Number(entry.maxMarks || 100);
        if (!isFinite(maxMarks) || maxMarks <= 0) maxMarks = 100;
        var percent = (marks / maxMarks) * 100;
        var examType = entry.examType || '';
        var term = entry.term || '';
        var year = entry.year || '';
        var subject = entry.subject || '';
        var rawStatus = entry.status || 'draft';
        var status = rawStatus === 'published' ? 'published' : 'draft';
        return {
            key: buildMarkKey(entry),
            pupilId: entry.pupilId || '',
            pupilName: entry.pupilName || '',
            className: entry.className || '',
            examId: entry.examId || '',
            examTitle: entry.examTitle || '',
            examType: examType,
            term: term,
            year: year,
            subject: subject,
            marks: marks,
            maxMarks: maxMarks,
            percentage: percent,
            status: status,
            createdAt: entry.createdAt || new Date().toISOString()
        };
    }

    function addExamMark(entry) {
        var normalized = normalizeExamMark(entry);
        if (!normalized || !normalized.pupilId || !normalized.examId) return;
        var store = loadAll();
        var list = store.marks || [];
        var key = normalized.key;
        var index = -1;
        for (var i = 0; i < list.length; i++) {
            if (list[i] && list[i].key === key) {
                index = i;
                break;
            }
        }
        if (index >= 0) {
            list[index] = normalized;
        } else {
            list.push(normalized);
        }
        store.marks = list;
        saveAll(store);
        try {
            localStorage.setItem('shikola_last_exam_pupil_id', String(normalized.pupilId || ''));
            if (normalized.pupilName) {
                localStorage.setItem('shikola_last_exam_pupil_name', String(normalized.pupilName));
            }
            if (normalized.className) {
                localStorage.setItem('shikola_last_exam_pupil_class', String(normalized.className));
            }
            if (typeof window.dispatchEvent === 'function' && typeof window.CustomEvent === 'function') {
                window.dispatchEvent(new CustomEvent('shikola:exam-mark-added', { detail: normalized }));
            }
        } catch (e) {
        }
    }

    function normalizeExamType(value) {
        if (!value) return '';
        var v = String(value).toLowerCase();
        if (v.indexOf('mid') !== -1) return 'midterm';
        if (v.indexOf('final') !== -1) return 'final';
        if (v.indexOf('mock') !== -1) return 'mock';
        return v;
    }

    function setExamTypeStatusForAll(examType, status) {
        var store = loadAll();
        var list = store.marks || [];
        var normalizedType = normalizeExamType(examType);
        if (!normalizedType || !list.length) return 0;
        var targetStatus = status === 'published' ? 'published' : 'draft';
        var count = 0;
        for (var i = 0; i < list.length; i++) {
            var row = list[i];
            if (!row) continue;
            if (normalizeExamType(row.examType) !== normalizedType) continue;
            if (row.status === targetStatus) continue;
            row.status = targetStatus;
            count++;
        }
        if (count > 0) {
            store.marks = list;
            saveAll(store);
        }
        return count;
    }

    function getExamSummaryForPupil(pupilId, options) {
        var id = pupilId ? String(pupilId) : '';
        if (!id) return null;
        var store = loadAll();
        var list = store.marks || [];
        var examTypeFilter = options && options.examType ? normalizeExamType(options.examType) : '';
        var termFilter = options && options.term ? String(options.term) : '';
        var yearFilter = options && options.year ? String(options.year) : '';
        var classFilter = options && options.className ? String(options.className) : '';
        var examIdFilter = options && options.examId ? String(options.examId) : '';
        var subjectsMap = {};
        var any = false;
        var pupilName = '';
        var className = '';
        var term = '';
        var year = '';
        list.forEach(function (row) {
            if (!row || String(row.pupilId) !== id) return;
            if (examTypeFilter) {
                if (normalizeExamType(row.examType) !== examTypeFilter) return;
            }
            if (examIdFilter && String(row.examId || '') !== examIdFilter) return;
            if (termFilter && String(row.term || '') !== termFilter) return;
            if (yearFilter && String(row.year || '') !== yearFilter) return;
            if (classFilter && String(row.className || '') !== classFilter) return;
            // By default, only include marks that have been published to the pupil portal.
            var requireStatus = options && options.includeDraft ? '' : 'published';
            if (requireStatus) {
                var rowStatus = row.status || 'draft';
                if (rowStatus !== requireStatus) return;
            }
            any = true;
            if (!pupilName && row.pupilName) pupilName = row.pupilName;
            if (!className && row.className) className = row.className;
            if (!term && row.term) term = row.term;
            if (!year && row.year) year = row.year;
            var subject = row.subject || row.examTitle || 'Subject';
            var key = subject;
            var existing = subjectsMap[key];
            if (!existing || (row.createdAt && existing.createdAt && row.createdAt > existing.createdAt)) {
                subjectsMap[key] = {
                    subject: subject,
                    marks: row.marks,
                    maxMarks: row.maxMarks,
                    percentage: row.percentage,
                    createdAt: row.createdAt
                };
            }
        });
        if (!any) return null;
        var subjects = [];
        var totalMarks = 0;
        var totalMax = 0;
        for (var subjectName in subjectsMap) {
            if (!Object.prototype.hasOwnProperty.call(subjectsMap, subjectName)) continue;
            var s = subjectsMap[subjectName];
            subjects.push({
                subject: s.subject,
                marks: s.marks,
                maxMarks: s.maxMarks,
                percentage: s.percentage
            });
            totalMarks += s.marks;
            totalMax += s.maxMarks;
        }
        subjects.sort(function (a, b) {
            return String(a.subject).localeCompare(String(b.subject));
        });
        var overallPercentage = totalMax > 0 ? (totalMarks / totalMax) * 100 : 0;
        return {
            pupilId: id,
            pupilName: pupilName,
            className: className,
            term: term,
            year: year,
            totalSubjects: subjects.length,
            totalMarks: totalMarks,
            totalMaxMarks: totalMax,
            overallPercentage: overallPercentage,
            subjects: subjects
        };
    }

    function gradeFromPercentage(percent) {
        if (!percent && percent !== 0) return '';
        if (percent >= 80) return 'A+';
        if (percent >= 70) return 'A';
        if (percent >= 60) return 'B';
        if (percent >= 50) return 'C';
        if (percent >= 40) return 'D';
        return 'E';
    }

    function initialsFromName(name) {
        if (!name) return '';
        var parts = String(name).trim().split(/\s+/);
        if (!parts.length) return '';
        if (parts.length === 1) return parts[0].charAt(0);
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }

    function getTopPupils(options) {
        var store = loadAll();
        var list = store.marks || [];
        if (!list.length) return [];
        var examTypeFilter = options && options.examType ? normalizeExamType(options.examType) : '';
        var termFilter = options && options.term ? String(options.term) : '';
        var yearFilter = options && options.year ? String(options.year) : '';
        var classFilter = options && options.className ? String(options.className) : '';
        var limit = options && typeof options.limit === 'number' ? options.limit : 3;
        var byPupil = {};
        for (var i = 0; i < list.length; i++) {
            var row = list[i];
            if (!row || !row.pupilId) continue;
            if (examTypeFilter) {
                if (normalizeExamType(row.examType) !== examTypeFilter) continue;
            }
            if (termFilter && String(row.term || '') !== termFilter) continue;
            if (yearFilter && String(row.year || '') !== yearFilter) continue;
            if (classFilter && String(row.className || '') !== classFilter) continue;
            var id = String(row.pupilId);
            if (!byPupil[id]) {
                byPupil[id] = {
                    pupilId: id,
                    name: row.pupilName || '',
                    className: row.className || '',
                    totalMarks: 0,
                    totalMax: 0
                };
            }
            byPupil[id].totalMarks += row.marks || 0;
            byPupil[id].totalMax += row.maxMarks || 0;
            if (!byPupil[id].name && row.pupilName) {
                byPupil[id].name = row.pupilName;
            }
            if (!byPupil[id].className && row.className) {
                byPupil[id].className = row.className;
            }
        }
        var pupils = [];
        for (var key in byPupil) {
            if (!Object.prototype.hasOwnProperty.call(byPupil, key)) continue;
            var p = byPupil[key];
            if (!p.totalMax) continue;
            var pct = (p.totalMarks / p.totalMax) * 100;
            pupils.push({
                pupilId: p.pupilId,
                name: p.name,
                className: p.className,
                overallPercentage: pct,
                grade: gradeFromPercentage(pct),
                initials: initialsFromName(p.name)
            });
        }
        pupils.sort(function (a, b) {
            return (b.overallPercentage || 0) - (a.overallPercentage || 0);
        });
        if (limit > 0 && pupils.length > limit) {
            return pupils.slice(0, limit);
        }
        return pupils;
    }

    function getClassResultSheet(options) {
        var store = loadAll();
        var list = store.marks || [];
        if (!list.length) return { examId: '', className: '', totalPupils: 0, rows: [] };
        var examIdFilter = options && options.examId ? String(options.examId) : '';
        var classFilter = options && options.className ? String(options.className) : '';
        var examTypeFilter = options && options.examType ? normalizeExamType(options.examType) : '';
        var includeDraft = !!(options && options.includeDraft);
        var orderBy = options && options.orderBy ? String(options.orderBy).toLowerCase() : '';
        var byPupil = {};
        for (var i = 0; i < list.length; i++) {
            var row = list[i];
            if (!row || !row.pupilId) continue;
            if (examIdFilter && String(row.examId || '') !== examIdFilter) continue;
            if (classFilter && String(row.className || '') !== classFilter) continue;
            if (examTypeFilter) {
                if (normalizeExamType(row.examType) !== examTypeFilter) continue;
            }
            if (!includeDraft) {
                var st = row.status || 'draft';
                if (st !== 'published') continue;
            }
            var pid = String(row.pupilId);
            if (!byPupil[pid]) {
                byPupil[pid] = {
                    pupilId: pid,
                    pupilName: row.pupilName || '',
                    className: row.className || classFilter || '',
                    totalMarks: 0,
                    totalMax: 0,
                    subjectsMap: {}
                };
            }
            var group = byPupil[pid];
            group.totalMarks += row.marks || 0;
            group.totalMax += row.maxMarks || 0;
            var subjectKey = row.subject || row.examTitle || 'Subject';
            var existing = group.subjectsMap[subjectKey];
            if (!existing || (row.createdAt && existing.createdAt && row.createdAt > existing.createdAt)) {
                group.subjectsMap[subjectKey] = {
                    subject: subjectKey,
                    marks: row.marks || 0,
                    maxMarks: row.maxMarks || 0,
                    createdAt: row.createdAt || ''
                };
            }
        }
        var rows = [];
        for (var key in byPupil) {
            if (!Object.prototype.hasOwnProperty.call(byPupil, key)) continue;
            var p = byPupil[key];
            if (!p.totalMax) continue;
            var pct = (p.totalMarks / p.totalMax) * 100;
            var grade = gradeFromPercentage(pct);
            var resultLabel = pct >= 40 ? 'PASS' : 'FAIL';
            var subjects = [];
            var subjectsSummaryParts = [];
            for (var subjName in p.subjectsMap) {
                if (!Object.prototype.hasOwnProperty.call(p.subjectsMap, subjName)) continue;
                var s = p.subjectsMap[subjName];
                var sPct = s.maxMarks > 0 ? (s.marks / s.maxMarks) * 100 : 0;
                var sGrade = gradeFromPercentage(sPct);
                subjects.push({
                    subject: s.subject,
                    marks: s.marks,
                    maxMarks: s.maxMarks,
                    percentage: sPct,
                    grade: sGrade
                });
                if (sGrade) {
                    subjectsSummaryParts.push(s.subject + ' (' + sGrade + ')');
                } else {
                    subjectsSummaryParts.push(s.subject);
                }
            }
            subjects.sort(function (a, b) {
                return String(a.subject).localeCompare(String(b.subject));
            });
            var subjectsSummary = subjectsSummaryParts.join(', ');
            rows.push({
                pupilId: p.pupilId,
                pupilName: p.pupilName,
                className: p.className,
                totalMarks: p.totalMarks,
                totalMaxMarks: p.totalMax,
                overallPercentage: pct,
                grade: grade,
                resultLabel: resultLabel,
                subjects: subjects,
                subjectsSummary: subjectsSummary,
                position: 0,
                examNo: ''
            });
        }
        if (!rows.length) {
            return { examId: examIdFilter, className: classFilter, totalPupils: 0, rows: [] };
        }
        var asc = (orderBy && (orderBy.indexOf('asc') !== -1 || orderBy.indexOf('low') !== -1));
        rows.sort(function (a, b) {
            var av = a.overallPercentage || 0;
            var bv = b.overallPercentage || 0;
            return asc ? (av - bv) : (bv - av);
        });
        for (var idx = 0; idx < rows.length; idx++) {
            rows[idx].position = idx + 1;
            rows[idx].examNo = 'EXM-' + (idx + 1);
        }
        return {
            examId: examIdFilter,
            className: classFilter,
            totalPupils: rows.length,
            rows: rows
        };
    }

    window.ShikolaExamResults = {
        addExamMark: addExamMark,
        getExamSummaryForPupil: getExamSummaryForPupil,
        getTopPupils: getTopPupils,
        getClassResultSheet: getClassResultSheet,
        setExamTypeStatusForAll: setExamTypeStatusForAll
    };
})(window);
