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
    if (window.ShikolaClassTestsHelpers) return;

    function normalizeStringList(list) {
        if (!Array.isArray(list)) return [];
        var seen = {};
        var result = [];
        for (var i = 0; i < list.length; i++) {
            var raw = list[i];
            if (raw == null) continue;
            var value = String(raw).trim();
            if (!value || seen[value]) continue;
            seen[value] = true;
            result.push(value);
        }
        return result;
    }

    function readFromLocalStorage(key) {
        try {
            var raw = localStorage.getItem(key);
            if (!raw) return null;
            var parsed = JSON.parse(raw);
            return parsed == null ? null : parsed;
        } catch (e) {
            return null;
        }
    }

    function buildTermOption(term) {
        if (!term || typeof term !== 'object') return null;
        var name = (term.name || term.termName || '').trim();
        if (!name) return null;
        var start = term.startDate || term.start_date || '';
        var end = term.endDate || term.end_date || '';
        var label = name;
        var parts = [];
        if (start) parts.push(start);
        if (end) parts.push(end);
        if (parts.length) {
            label += ' · ' + parts.join(' – ');
        }
        return {
            value: term.id || name,
            label: label
        };
    }

    function collectSubjectList() {
        var subjects = [];
        try {
            if (window.ShikolaClassesStore && typeof window.ShikolaClassesStore.listSubjects === 'function') {
                subjects = window.ShikolaClassesStore.listSubjects() || [];
            }
        } catch (e) {}
        if (!subjects.length) {
            var stored = readFromLocalStorage('shikola_subjects_v1');
            if (Array.isArray(stored)) {
                subjects = stored;
            }
        }
        if (!subjects.length) {
            var legacy = readFromLocalStorage('shikola_subjects');
            if (Array.isArray(legacy)) {
                subjects = legacy;
            }
        }
        return normalizeStringList(subjects);
    }

    function collectTermRecords() {
        var terms = [];
        var stored = readFromLocalStorage('shikola_fees_terms');
        if (Array.isArray(stored)) {
            terms = stored.slice();
        }
        return terms;
    }

    window.ShikolaClassTestsHelpers = {
        defaultSubjects: [],
        defaultTermOptions: [
            { value: 'Term 1', label: 'Term 1' },
            { value: 'Term 2', label: 'Term 2' },
            { value: 'Term 3', label: 'Term 3' }
        ],
        getSubjectOptions: function () {
            var list = collectSubjectList();
            if (list.length) return list;
            return this.defaultSubjects.slice();
        },
        getTermOptions: function () {
            var snapshot = collectTermRecords();
            var options = [];
            for (var i = 0; i < snapshot.length; i++) {
                var entry = buildTermOption(snapshot[i]);
                if (entry) options.push(entry);
            }
            if (options.length) return options;
            return this.buildDefaultTermOptions();
        },
        buildDefaultTermOptions: function () {
            return this.defaultTermOptions.slice();
        }
    };
})();

(function () {
    if (window.testResultPage) return;

    window.testResultPage = function () {
        return {
            filterMode: 'class-wise',
            selectedClass: '',
            selectedSubject: '',
            selectedTest: '',
            selectedTerm: '',
            summary: {
                average: null,
                highest: null,
                lowest: null,
                passRate: 0,
                passCount: 0,
                totalCount: 0
            },
            rows: [],
            get classOptions() {
                if (window.ShikolaClassesUi && typeof window.ShikolaClassesUi.getClassOptions === 'function') {
                    return window.ShikolaClassesUi.getClassOptions(['Grade 1A', 'Grade 2A', 'Grade 3A']);
                }
                return ['Grade 1A', 'Grade 2A', 'Grade 3A'];
            },
            get hasSelection() {
                return this.selectedClass;
            },
            get subjectOptions() {
                if (window.ShikolaClassTestsHelpers && typeof window.ShikolaClassTestsHelpers.getSubjectOptions === 'function') {
                    return window.ShikolaClassTestsHelpers.getSubjectOptions();
                }
                return window.ShikolaClassTestsHelpers ? window.ShikolaClassTestsHelpers.defaultSubjects.slice() : [];
            },
            get termOptions() {
                if (window.ShikolaClassTestsHelpers && typeof window.ShikolaClassTestsHelpers.getTermOptions === 'function') {
                    return window.ShikolaClassTestsHelpers.getTermOptions();
                }
                return window.ShikolaClassTestsHelpers ? window.ShikolaClassTestsHelpers.buildDefaultTermOptions() : [];
            },
            get testOptions() {
                return ['Test 1', 'Test 2', 'Test 3'];
            },
            async loadResults() {
                if (!this.hasSelection) {
                    this.rows = [];
                    this.summary = {
                        average: null,
                        highest: null,
                        lowest: null,
                        passRate: 0,
                        passCount: 0,
                        totalCount: 0
                    };
                    return;
                }

                this.rows = [];
                this.summary = {
                    average: null,
                    highest: null,
                    lowest: null,
                    passRate: 0,
                    passCount: 0,
                    totalCount: 0
                };

                try {
                    if (window.ShikolaClassTestsStore && typeof window.ShikolaClassTestsStore.getResults === 'function') {
                        var local = window.ShikolaClassTestsStore.getResults({
                            className: this.selectedClass,
                            subject: this.selectedSubject,
                            test: this.selectedTest,
                            term: this.selectedTerm
                        });
                        if (local && Array.isArray(local.rows) && local.rows.length) {
                            this.rows = local.rows;
                            if (local.summary && typeof local.summary === 'object') {
                                this.summary = local.summary;
                            } else {
                                this.recomputeSummary();
                            }
                            return;
                        }
                    }
                } catch (e) {
                    console.error('Failed to load local class test results', e);
                }

                try {
                    var base = window.SHIKOLA_API_BASE || '';
                    if (!base) {
                        this.recomputeSummary();
                        return;
                    }
                    var url = new URL(base + '/api/admin/class-tests/results');
                    url.searchParams.set('class', this.selectedClass);
                    url.searchParams.set('subject', this.selectedSubject);
                    url.searchParams.set('test', this.selectedTest);
                    url.searchParams.set('term', this.selectedTerm);
                    var response = await fetch(url.toString());
                    if (!response.ok) throw new Error('HTTP ' + response.status);
                    var data = await response.json();
                    var rows = Array.isArray(data.rows) ? data.rows : [];
                    this.rows = rows.map(function (r, idx) {
                        return {
                            no: idx + 1,
                            pupilId: r.pupilId || r.pupil_id || r.id || ('P' + (idx + 1)),
                            name: r.name || r.pupil_name || ('Student ' + (idx + 1)),
                            className: r.className || r.class_name || '',
                            marks: r.marks != null ? r.marks : null,
                            totalMarks: r.totalMarks != null ? r.totalMarks : null
                        };
                    });
                    if (data.summary && typeof data.summary === 'object') {
                        this.summary = data.summary;
                    } else {
                        this.recomputeSummary();
                    }
                } catch (e) {
                    console.error('Failed to load class test results', e);
                    this.rows = [];
                    this.summary = {
                        average: null,
                        highest: null,
                        lowest: null,
                        passRate: 0,
                        passCount: 0,
                        totalCount: 0
                    };
                }
            },
            recomputeSummary() {
                var rows = this.rows || [];
                if (!rows.length) {
                    this.summary = {
                        average: null,
                        highest: null,
                        lowest: null,
                        passRate: 0,
                        passCount: 0,
                        totalCount: 0
                    };
                    return;
                }
                var totalMarks = rows[0].totalMarks ? Number(rows[0].totalMarks) : 0;
                if (!totalMarks) {
                    this.summary = {
                        average: null,
                        highest: null,
                        lowest: null,
                        passRate: 0,
                        passCount: 0,
                        totalCount: rows.length
                    };
                    return;
                }
                var highest = null;
                var lowest = null;
                var sumMarks = 0;
                var countWithMarks = 0;
                var passCount = 0;
                var passThresholdPercent = 50;
                rows.forEach(function (row) {
                    if (row.marks == null) return;
                    var m = Number(row.marks);
                    if (!Number.isFinite(m)) return;
                    countWithMarks++;
                    sumMarks += m;
                    if (highest == null || m > highest) highest = m;
                    if (lowest == null || m < lowest) lowest = m;
                    var percent = (m / totalMarks) * 100;
                    if (percent >= passThresholdPercent) passCount++;
                });
                var averagePercent = totalMarks && countWithMarks ? (sumMarks / (countWithMarks * totalMarks)) * 100 : null;
                var totalCount = rows.length;
                var passRate = totalCount ? (passCount / totalCount) * 100 : 0;
                this.summary = {
                    average: averagePercent,
                    highest: highest,
                    lowest: lowest,
                    passRate: passRate,
                    passCount: passCount,
                    totalCount: totalCount
                };
            },
            gradeForRow(row) {
                var total = row && row.totalMarks ? Number(row.totalMarks) : 0;
                if (!total || row.marks == null) return '-';
                var m = Number(row.marks);
                if (!Number.isFinite(m)) return '-';
                var percent = (m / total) * 100;
                if (percent >= 80) return 'A';
                if (percent >= 65) return 'B';
                if (percent >= 50) return 'C';
                if (percent >= 40) return 'D';
                return 'E';
            },
            isPassRow(row) {
                var total = row && row.totalMarks ? Number(row.totalMarks) : 0;
                if (!total || row.marks == null) return false;
                var m = Number(row.marks);
                if (!Number.isFinite(m)) return false;
                var percent = (m / total) * 100;
                return percent >= 50;
            },
            exportResults() {
                var rows = this.rows || [];
                if (!this.hasSelection) {
                    alert('Select class, subject, test and term before exporting results.');
                    return;
                }
                if (!rows.length) {
                    alert('No results available to export.');
                    return;
                }
                var defaultFormat = 'csv';
                var choice = window.prompt('Export format (csv or pdf):', defaultFormat);
                var format = defaultFormat;
                if (choice && typeof choice === 'string') {
                    var lower = choice.toLowerCase();
                    if (lower === 'csv' || lower === 'pdf') {
                        format = lower;
                    }
                }
                if (format === 'pdf') {
                    alert('PDF export is not implemented yet. Please use CSV.');
                    return;
                }
                var header = ['Pupil', 'Class', 'Score', 'Grade', 'Status'];
                var lines = [header.join(',')];
                var self = this;
                rows.forEach(function (row) {
                    var total = row.totalMarks ? Number(row.totalMarks) : 0;
                    var scoreText = (row.marks != null && total) ? (row.marks + ' / ' + total) : '--';
                    var grade = self.gradeForRow(row);
                    var status = self.isPassRow(row) ? 'Passed' : 'Failed';
                    var values = [
                        row.name,
                        row.className || self.selectedClass || '',
                        scoreText,
                        grade,
                        status
                    ];
                    var safe = values.map(function (v) {
                        var s = v == null ? '' : String(v);
                        if (s.indexOf(',') !== -1 || s.indexOf('"') !== -1) {
                            s = '"' + s.replace(/"/g, '""') + '"';
                        }
                        return s;
                    });
                    lines.push(safe.join(','));
                });
                var csv = lines.join('\n');
                try {
                    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                    var url = URL.createObjectURL(blob);
                    var a = document.createElement('a');
                    a.href = url;
                    var fileName = (this.selectedClass || 'class') + '_' + (this.selectedSubject || 'subject') + '_' + (this.selectedTest || 'test') + '_results.csv';
                    a.download = fileName.replace(/\s+/g, '_');
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                } catch (e) {
                    console.error('Failed to export CSV', e);
                }
            }
        };
    };
})();
