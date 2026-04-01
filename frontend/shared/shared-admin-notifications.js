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
    if (window.ShikolaAdminNotifications) return;

    function dropdown(options) {
        options = options || {};
        var linkOverrides = (options && options.links) ? options.links : null;
        function resolveLink(key, fallback) {
            if (linkOverrides && typeof linkOverrides === 'object' && linkOverrides[key]) {
                return String(linkOverrides[key]);
            }
            return fallback;
        }
        return {
            open: false,
            notifications: [],
            serverNotifications: [],
            localNotifications: [],
            storageKey: 'shikola_notifications_v1',
            init() {
                this.loadFromStorage();
                this.loadServerNotifications();
                var self = this;

                try {
                    window.addEventListener('shikola:pupil-created', function (evt) {
                        var p = evt && evt.detail ? evt.detail : {};
                        var name = (p.fullName || ((p.firstName || '') + ' ' + (p.lastName || ''))).trim() || (p.admissionNo || p.id || 'Pupil');
                        var cls = p.classGrade || p.classLabel || p.className || '';
                        var msg = name + (cls ? (' enrolled in ' + cls) : ' enrolled');
                        self.addNotification({
                            title: 'New pupil registered',
                            message: msg,
                            link: resolveLink('pupilCreated', 'pupils.html')
                        });
                    });
                } catch (e) {}

                try {
                    window.addEventListener('shikola:employee-created', function (evt) {
                        var emp = evt && evt.detail ? evt.detail : {};
                        var name = (emp.fullName || emp.name || '').trim() || (emp.staffId || emp.id || 'Employee');
                        var dept = emp.department || emp.role || '';
                        var msg = name + (dept ? (' added to ' + dept) : ' added');
                        self.addNotification({
                            title: 'New employee added',
                            message: msg,
                            link: resolveLink('employeeCreated', 'employees.html')
                        });
                    });
                } catch (e) {}

                try {
                    window.addEventListener('shikola:attendance-updated', function (evt) {
                        var d = evt && evt.detail ? evt.detail : {};
                        var scope = d.scope || '';
                        var date = d.date || '';
                        var target = '';
                        if (scope === 'students') {
                            target = d.className || 'students';
                        } else if (scope === 'employees') {
                            target = d.department || 'employees';
                        }
                        var label = scope === 'students' ? 'Pupil attendance' : 'Staff attendance';
                        var msg = label + ' marked for ' + (target || 'group') + (date ? (' on ' + date) : '');
                        self.addNotification({
                            title: 'Attendance updated',
                            message: msg,
                            link: resolveLink('attendanceUpdated', 'attendance.html')
                        });
                    });
                } catch (e) {}

                try {
                    window.addEventListener('shikola:fees-payment-recorded', function (evt) {
                        var pay = evt && evt.detail ? evt.detail : {};
                        var pupil = pay.pupilName || pay.pupilId || 'Pupil';
                        var cls = pay.classLabel || '';
                        var amount = pay.amountPaid != null ? Number(pay.amountPaid) : 0;
                        var method = pay.paymentMethod || '';
                        var parts = [];
                        if (amount) {
                            try {
                                parts.push('K ' + amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }));
                            } catch (e) {
                                parts.push('Amount ' + amount);
                            }
                        }
                        parts.push('from ' + pupil);
                        if (cls) {
                            parts.push('(' + cls + ')');
                        }
                        if (method) {
                            parts.push('via ' + method);
                        }
                        var msg = parts.join(' ');
                        self.addNotification({
                            title: 'Fee payment recorded',
                            message: msg,
                            link: resolveLink('feesPaymentRecorded', 'accounts.html')
                        });
                    });
                } catch (e) {}

                try {
                    var refreshMs = 20000;
                    setInterval(function () {
                        try { if (document.hidden) return; } catch (e) {}
                        self.loadServerNotifications();
                    }, refreshMs);
                } catch (e) {}
            },
            apiBase() {
                return window.SHIKOLA_API_BASE || '/api';
            },
            getToken() {
                try {
                    return localStorage.getItem('shikola_token') || localStorage.getItem('authToken');
                } catch (e) {
                    return null;
                }
            },
            async fetchJson(path, options) {
                var token = this.getToken();
                if (!token) return null;
                var base = this.apiBase();
                var headers = Object.assign({
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/json'
                }, (options && options.headers) ? options.headers : {});
                var opts = Object.assign({}, options || {}, { headers: headers });
                var res = await fetch(base + path, opts);
                if (!res.ok) {
                    return null;
                }
                try { return await res.json(); } catch (e) { return null; }
            },
            isUuid(value) {
                var v = (value || '').toString();
                return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
            },
            formatTimeLabel(value) {
                if (!value) return '';
                try {
                    var d = new Date(value);
                    if (isNaN(d.getTime())) return '';
                    return d.toLocaleString();
                } catch (e) {
                    return '';
                }
            },
            async loadServerNotifications() {
                var data = await this.fetchJson('/api/notifications?limit=30&offset=0');
                if (!data || !Array.isArray(data.data)) {
                    this.buildCombined();
                    return;
                }
                var mapped = [];
                for (var i = 0; i < data.data.length; i++) {
                    var n = data.data[i] || {};
                    mapped.push({
                        id: n.id,
                        title: n.title || 'Notification',
                        message: n.message || '',
                        createdAt: n.createdAt || null,
                        time: this.formatTimeLabel(n.createdAt) || '',
                        read: !!n.read,
                        link: n.actionUrl || '',
                        actionUrl: n.actionUrl || '',
                        origin: 'server'
                    });
                }
                this.serverNotifications = mapped;
                this.buildCombined();
            },
            timeBucket(value) {
                if (!value) return '';
                try {
                    var d = new Date(value);
                    if (isNaN(d.getTime())) return '';
                    return d.toISOString().slice(0, 16);
                } catch (e) {
                    return '';
                }
            },
            normalizeKeyText(value) {
                return String(value || '')
                    .toLowerCase()
                    .replace(/\s+/g, ' ')
                    .trim();
            },
            fingerprint(notification) {
                if (!notification) return '';
                var title = this.normalizeKeyText(notification.title);
                var message = this.normalizeKeyText(notification.message);
                var url = this.normalizeKeyText(notification.actionUrl || notification.link);
                var bucket = this.timeBucket(notification.createdAt);
                return [title, message, url, bucket].join('|');
            },
            buildCombined() {
                var merged = [];
                var seen = {};
                var seenFp = {};
                var server = Array.isArray(this.serverNotifications) ? this.serverNotifications : [];
                var local = Array.isArray(this.localNotifications) ? this.localNotifications : [];

                var self = this;
                function addItem(item) {
                    if (!item) return;
                    var id = item.id;
                    var fp = self.fingerprint(item);
                    if (id && seen[id]) return;
                    if (fp && seenFp[fp]) return;
                    if (id) seen[id] = true;
                    if (fp) seenFp[fp] = true;
                    merged.push(item);
                }

                for (var i = 0; i < server.length; i++) {
                    var s = server[i];
                    if (!s || !s.id) continue;
                    addItem(s);
                }
                for (var j = 0; j < local.length; j++) {
                    var l = local[j];
                    if (!l || !l.id) continue;
                    if (!l.origin) l.origin = 'local';
                    addItem(l);
                }

                merged.sort(function (a, b) {
                    var ta = a && a.createdAt ? new Date(a.createdAt).getTime() : 0;
                    var tb = b && b.createdAt ? new Date(b.createdAt).getTime() : 0;
                    return (tb || 0) - (ta || 0);
                });

                if (merged.length > 50) {
                    merged = merged.slice(0, 50);
                }

                this.notifications = merged;
                try { window.shikolaNotificationLog = merged.slice(0, 30); } catch (e) {}
            },
            loadFromStorage() {
                var raw;
                try {
                    raw = localStorage.getItem(this.storageKey);
                } catch (e) {
                    raw = null;
                }
                if (!raw) {
                    this.localNotifications = [];
                    this.buildCombined();
                    return;
                }
                try {
                    var parsed = JSON.parse(raw);
                    this.localNotifications = Array.isArray(parsed) ? parsed : [];
                } catch (e) {
                    this.localNotifications = [];
                }
                try {
                    for (var k = 0; k < this.localNotifications.length; k++) {
                        var it = this.localNotifications[k];
                        if (!it) continue;
                        if (!it.origin) it.origin = 'local';
                    }
                } catch (e) {}
                this.buildCombined();
            },
            saveToStorage() {
                try {
                    localStorage.setItem(this.storageKey, JSON.stringify(this.localNotifications || []));
                } catch (e) {}
            },
            addNotification(payload) {
                if (!payload) return;
                var now = new Date();
                var item = {
                    id: 'NTF-' + now.getTime().toString(36) + '-' + Math.random().toString(36).slice(2, 6),
                    title: payload.title || 'Notification',
                    message: payload.message || '',
                    time: payload.time || 'Just now',
                    createdAt: now.toISOString(),
                    read: false,
                    link: payload.link || '',
                    actionUrl: payload.actionUrl || payload.link || ''
                };
                item.origin = 'local';
                this.localNotifications.unshift(item);
                if (this.localNotifications.length > 50) {
                    this.localNotifications = this.localNotifications.slice(0, 50);
                }
                this.saveToStorage();
                this.buildCombined();
            },
            unreadCount() {
                var list = this.notifications || [];
                var count = 0;
                for (var i = 0; i < list.length; i++) {
                    if (list[i] && !list[i].read) count++;
                }
                return count;
            },
            async markServerRead(notification) {
                if (!notification || !notification.id) return;
                if (!this.isUuid(notification.id)) return;
                await this.fetchJson('/api/notifications/' + encodeURIComponent(notification.id) + '/read', {
                    method: 'POST',
                    body: JSON.stringify({})
                });
            },
            async markAllRead() {
                var list = this.notifications || [];
                var serverToMark = [];
                for (var i = 0; i < list.length; i++) {
                    if (!list[i] || list[i].read) continue;
                    list[i].read = true;
                    if (list[i].origin === 'server') {
                        serverToMark.push(list[i]);
                    }
                }

                var local = this.localNotifications || [];
                for (var j = 0; j < local.length; j++) {
                    if (local[j]) local[j].read = true;
                }
                this.localNotifications = local;
                this.saveToStorage();

                try {
                    await Promise.all(serverToMark.map(function (n) { return this.markServerRead(n); }.bind(this)));
                } catch (e) {}

                this.loadServerNotifications();
            },
            clearAll() {
                this.localNotifications = [];
                this.saveToStorage();
                this.buildCombined();
            },
            async handleClick(notification) {
                if (!notification) return;
                notification.read = true;
                if (notification.origin !== 'server') {
                    notification.origin = 'local';
                    this.saveToStorage();
                } else if (notification.origin === 'server') {
                    try { await this.markServerRead(notification); } catch (e) {}
                }

                this.buildCombined();

                var target = notification.actionUrl || notification.link;
                if (target) {
                    try { window.location.href = target; } catch (e) {}
                }
            }
        };
    }

    window.ShikolaAdminNotifications = {
        dropdown: dropdown
    };
})(window);
