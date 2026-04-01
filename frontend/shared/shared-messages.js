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
    var PREFIX = 'shikola_messages_v1';
    var STORAGE_KEY = PREFIX + ':all';
    var THREADS_CACHE_KEY = PREFIX + ':threads';
    var OUTBOX_KEY = PREFIX + ':outbox';
    var THREAD_MAP_KEY = PREFIX + ':thread_map';
    var ATTACHMENTS_KEY = PREFIX + ':attachments';
    
    // Flag to track if we're using API or localStorage
    var useAPI = false;
    var apiAvailable = false;

    function unwrapApiData(data) {
        if (!data) return data;
        if (typeof data === 'object' && data.success === true && data.data != null) {
            return data.data;
        }
        return data;
    }

    function looksLikeUuid(value) {
        var v = String(value || '').trim();
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
    }

    function safeParse(json, fallback) {
        if (!json) return fallback;
        try {
            var v = JSON.parse(json);
            return v || fallback;
        } catch (e) {
            return fallback;
        }
    }

    function loadAll() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            var list = safeParse(raw, []);
            return Array.isArray(list) ? list : [];
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

    function getScopedKey(baseKey, user) {
        var u = user ? normaliseUser(user) : getCurrentUserFromAuth();
        var uid = (u && u.id != null) ? String(u.id) : '';
        return baseKey + ':' + (uid || 'anon');
    }

    function loadCachedThreadsForUser(user) {
        try {
            var raw = localStorage.getItem(getScopedKey(THREADS_CACHE_KEY, user));
            var list = safeParse(raw, []);
            return Array.isArray(list) ? list : [];
        } catch (e) {
            return [];
        }
    }

    function saveCachedThreadsForUser(user, threads) {
        try {
            localStorage.setItem(getScopedKey(THREADS_CACHE_KEY, user), JSON.stringify(Array.isArray(threads) ? threads : []));
        } catch (e) {
        }
    }

    function loadOutboxForUser(user) {
        try {
            var raw = localStorage.getItem(getScopedKey(OUTBOX_KEY, user));
            var list = safeParse(raw, []);
            return Array.isArray(list) ? list : [];
        } catch (e) {
            return [];
        }
    }

    function saveOutboxForUser(user, items) {
        try {
            localStorage.setItem(getScopedKey(OUTBOX_KEY, user), JSON.stringify(Array.isArray(items) ? items : []));
        } catch (e) {
        }
    }

    function loadThreadMapForUser(user) {
        try {
            var raw = localStorage.getItem(getScopedKey(THREAD_MAP_KEY, user));
            var map = safeParse(raw, {});
            return (map && typeof map === 'object') ? map : {};
        } catch (e) {
            return {};
        }
    }

    function saveThreadMapForUser(user, map) {
        try {
            localStorage.setItem(getScopedKey(THREAD_MAP_KEY, user), JSON.stringify(map && typeof map === 'object' ? map : {}));
        } catch (e) {
        }
    }

    function loadAttachmentsCacheForUser(user) {
        try {
            var raw = localStorage.getItem(getScopedKey(ATTACHMENTS_KEY, user));
            var map = safeParse(raw, {});
            return (map && typeof map === 'object') ? map : {};
        } catch (e) {
            return {};
        }
    }

    function saveAttachmentsCacheForUser(user, map) {
        try {
            localStorage.setItem(getScopedKey(ATTACHMENTS_KEY, user), JSON.stringify(map && typeof map === 'object' ? map : {}));
        } catch (e) {
        }
    }

    function normaliseAttachment(a) {
        if (!a) return null;
        var id = a.id != null ? String(a.id) : '';
        if (!id) return null;
        return {
            id: id,
            originalName: a.originalName != null ? String(a.originalName) : (a.original_name != null ? String(a.original_name) : ''),
            mimeType: a.mimeType != null ? String(a.mimeType) : (a.mime_type != null ? String(a.mime_type) : ''),
            size: a.size != null ? Number(a.size) : null,
            url: a.url != null ? String(a.url) : ''
        };
    }

    async function fetchAndCacheAttachment(user, attachment) {
        if (!checkAPIAvailable()) return null;
        var u = user ? normaliseUser(user) : getCurrentUserFromAuth();
        if (!u) return null;

        var a = normaliseAttachment(attachment);
        if (!a || !a.id) return null;

        try {
            var cached = loadAttachmentsCacheForUser(u);
            if (cached && cached[a.id] && cached[a.id].dataUrl) {
                return cached[a.id];
            }
        } catch (e) {}

        try {
            var endpoint = (a.url && String(a.url).trim()) ? String(a.url).trim() : ('/api/communication/attachments/' + a.id);
            var result = await window.ShikolaAPI.request(endpoint, { method: 'GET' });
            if (!result || !result.success || !(result.data instanceof Blob)) {
                return null;
            }
            var blob = result.data;

            var dataUrl = await new Promise(function (resolve) {
                try {
                    var reader = new FileReader();
                    reader.onloadend = function () {
                        resolve(reader.result || '');
                    };
                    reader.onerror = function () {
                        resolve('');
                    };
                    reader.readAsDataURL(blob);
                } catch (err) {
                    resolve('');
                }
            });

            if (!dataUrl) return null;

            var map = loadAttachmentsCacheForUser(u);
            map[a.id] = {
                id: a.id,
                originalName: a.originalName || ('attachment-' + a.id),
                mimeType: a.mimeType || (blob.type || ''),
                size: a.size != null ? a.size : blob.size,
                dataUrl: dataUrl,
                cachedAt: new Date().toISOString()
            };
            saveAttachmentsCacheForUser(u, map);
            return map[a.id];
        } catch (e) {
            return null;
        }
    }

    async function cacheFileForAttachment(user, attachment, file) {
        var u = user ? normaliseUser(user) : getCurrentUserFromAuth();
        if (!u) return;
        var a = normaliseAttachment(attachment);
        if (!a || !a.id) return;
        if (!file || !(file instanceof Blob)) return;

        try {
            var dataUrl = await new Promise(function (resolve) {
                try {
                    var reader = new FileReader();
                    reader.onloadend = function () {
                        resolve(reader.result || '');
                    };
                    reader.onerror = function () {
                        resolve('');
                    };
                    reader.readAsDataURL(file);
                } catch (err) {
                    resolve('');
                }
            });
            if (!dataUrl) return;

            var map = loadAttachmentsCacheForUser(u);
            map[a.id] = {
                id: a.id,
                originalName: a.originalName || (file && file.name) || ('attachment-' + a.id),
                mimeType: a.mimeType || (file && file.type) || '',
                size: a.size != null ? a.size : (file && file.size) || null,
                dataUrl: dataUrl,
                cachedAt: new Date().toISOString()
            };
            saveAttachmentsCacheForUser(u, map);
        } catch (e) {
        }
    }

    function mapThreadIdForUser(user, threadId) {
        var raw = String(threadId || '').trim();
        if (!raw) return raw;
        var map = loadThreadMapForUser(user);
        return (map && map[raw]) ? String(map[raw]) : raw;
    }

    function upsertMessages(messages) {
        if (!Array.isArray(messages) || !messages.length) return;
        var all = loadAll();
        var index = {};
        for (var i = 0; i < all.length; i++) {
            var msg = all[i];
            if (msg && msg.id != null) {
                index[String(msg.id)] = i;
            }
        }
        var changed = false;
        for (var j = 0; j < messages.length; j++) {
            var m = messages[j];
            if (!m || m.id == null) continue;
            var id = String(m.id);
            if (index[id] != null) {
                all[index[id]] = Object.assign({}, all[index[id]], m);
                changed = true;
            } else {
                all.push(m);
                index[id] = all.length - 1;
                changed = true;
            }
        }
        if (changed) {
            saveAll(all);
        }
    }

    // Check if API is available
    function checkAPIAvailable() {
        return window.ShikolaAPI && 
               window.ShikolaAPI.messages && 
               window.ShikolaAPI.getAuthToken && 
               window.ShikolaAPI.getAuthToken();
    }

    // Async method to load threads from API
    async function loadThreadsFromAPI() {
        if (!checkAPIAvailable()) return null;
        
        try {
            var result = await window.ShikolaAPI.messages.getThreads();
            if (result && result.success) {
                var data = unwrapApiData(result.data);
                if (Array.isArray(data)) {
                    apiAvailable = true;
                    return data;
                }
            }
        } catch (e) {
            console.warn('[ShikolaMessagesStore] API unavailable, using localStorage');
        }
        return null;
    }

    async function uploadAttachmentsForMessage(messageId, files) {
        if (!checkAPIAvailable()) return [];
        var mid = String(messageId || '').trim();
        if (!mid) return [];
        if (!files || !files.length) return [];

        var uploaded = [];
        for (var i = 0; i < files.length; i++) {
            var f = files[i];
            if (!f) continue;
            try {
                if (window.ShikolaAPI.messages && typeof window.ShikolaAPI.messages.uploadAttachment === 'function') {
                    var res = await window.ShikolaAPI.messages.uploadAttachment(mid, f);
                    if (res && res.success) {
                        uploaded.push(unwrapApiData(res.data));
                    }
                }
            } catch (e) {
            }
        }

        return uploaded;
    }

    // Async method to load messages from API
    async function loadMessagesFromAPI(threadId) {
        if (!checkAPIAvailable()) return null;
        
        try {
            var result = await window.ShikolaAPI.messages.getMessages(threadId);
            if (result && result.success) {
                var data = unwrapApiData(result.data);
                if (Array.isArray(data)) {
                    return data;
                }
            }
        } catch (e) {
            console.warn('[ShikolaMessagesStore] Failed to load messages from API');
        }
        return null;
    }

    // Async method to send message via API
    async function sendMessageViaAPI(payload) {
        if (!checkAPIAvailable()) return null;
        
        try {
            var apiPayload = {
                recipient: {
                    id: payload.to.id,
                    name: payload.to.name,
                    role: payload.to.role,
                    email: payload.to.email
                },
                message: payload.body,
                messageType: 'internal'
            };

            if (payload.threadId) {
                apiPayload.threadId = payload.threadId;
            }
            
            var result = await window.ShikolaAPI.messages.send(apiPayload);
            if (result && result.success) {
                var data = unwrapApiData(result.data);
                if (data) {
                    return data;
                }
            }
        } catch (e) {
            console.warn('[ShikolaMessagesStore] Failed to send via API, falling back to localStorage');
        }
        return null;
    }

    // Load contacts from API
    async function loadContactsFromAPI() {
        if (!checkAPIAvailable()) return null;
        
        try {
            var result = await window.ShikolaAPI.messages.getContacts();
            if (result && result.success) {
                var data = unwrapApiData(result.data);
                if (Array.isArray(data)) {
                    return data;
                }
            }
        } catch (e) {
            console.warn('[ShikolaMessagesStore] Failed to load contacts');
        }
        return null;
    }

    var __contactsCache = {
        at: 0,
        list: []
    };

    function normaliseContactRecord(rec) {
        if (!rec) return null;
        var id = rec.id != null ? String(rec.id).trim() : '';
        var email = rec.email != null ? String(rec.email).trim() : '';
        if (!id && email) id = email;
        if (!id) return null;
        var name = rec.name != null ? String(rec.name).trim() : '';
        if (!name && email) {
            name = (email.split('@')[0] || '').trim();
        }
        var role = rec.role != null ? String(rec.role).trim().toLowerCase() : '';
        return {
            id: id,
            email: email,
            name: name || id,
            role: role || 'unknown'
        };
    }

    async function loadContactsCached(force) {
        var now = Date.now();
        if (!force && __contactsCache.at && (now - __contactsCache.at) < 5 * 60 * 1000 && Array.isArray(__contactsCache.list) && __contactsCache.list.length) {
            return __contactsCache.list;
        }
        var list = await loadContactsFromAPI();
        var out = [];
        if (Array.isArray(list)) {
            for (var i = 0; i < list.length; i++) {
                var n = normaliseContactRecord(list[i]);
                if (n) out.push(n);
            }
        }
        __contactsCache.at = now;
        __contactsCache.list = out;
        return out;
    }

    function contactMatchesQuery(contact, query) {
        if (!contact) return false;
        var q = String(query || '').trim().toLowerCase();
        if (!q) return true;
        var id = String(contact.id || '').toLowerCase();
        var email = String(contact.email || '').toLowerCase();
        var name = String(contact.name || '').toLowerCase();
        return id.indexOf(q) !== -1 || email.indexOf(q) !== -1 || name.indexOf(q) !== -1;
    }

    function dedupeContacts(list) {
        var out = [];
        var seen = {};
        for (var i = 0; i < (Array.isArray(list) ? list.length : 0); i++) {
            var c = list[i];
            if (!c) continue;
            var key = String(c.role || 'unknown') + ':' + String(c.id || '');
            if (!key || seen[key]) continue;
            seen[key] = true;
            out.push(c);
        }
        return out;
    }

    function normalisePupilToContact(p) {
        if (!p) return null;
        var pid = (p.accountId || (p.payload && p.payload.accountId) || p.loginEmail || (p.payload && p.payload.loginEmail) || p.id);
        pid = pid != null ? String(pid).trim() : '';
        if (!pid) return null;
        var name = (p.fullName || (String((p.firstName || '') + ' ' + (p.lastName || '')).trim()) || pid);
        var email = (p.loginEmail || (p.payload && p.payload.loginEmail) || '');
        return {
            id: pid,
            email: email ? String(email).trim() : '',
            name: String(name || pid).trim(),
            role: 'pupil'
        };
    }

    function normaliseGuardianToContact(p) {
        if (!p) return null;
        var email = (p.guardianEmail || '');
        var id = email ? String(email).trim() : '';
        if (!id) return null;
        var name = (p.guardianName || p.guardian || '').trim();
        return {
            id: id,
            email: email ? String(email).trim() : '',
            name: (name || id),
            role: 'parent'
        };
    }

    function normaliseEmployeeToContact(emp) {
        if (!emp) return null;
        var meta = emp.metadata || {};
        var id = (emp.accountId || meta.accountId || emp.loginEmail || meta.loginEmail || emp.email || emp.id || emp.staffId);
        id = id != null ? String(id).trim() : '';
        if (!id) return null;
        var email = (emp.loginEmail || meta.loginEmail || emp.email || '');
        var name = (emp.fullName || emp.name || '').trim();
        var role = (emp.systemRole || emp.role || meta.loginRole || 'teacher');
        role = String(role || '').trim().toLowerCase();
        if (!role) role = 'teacher';
        return {
            id: id,
            email: email ? String(email).trim() : '',
            name: (name || id),
            role: role
        };
    }

    async function searchPupilsFromAPI(query) {
        var q = String(query || '').trim();
        if (!q) return [];
        if (!checkAPIAvailable()) return [];
        if (!window.ShikolaAPI || typeof window.ShikolaAPI.get !== 'function') return [];
        try {
            var result = await window.ShikolaAPI.get('/api/pupils/search', { q: q });
            if (result && result.success && Array.isArray(result.data)) {
                return result.data;
            }
        } catch (_e) {
        }
        return [];
    }

    async function searchRecipients(query, opts) {
        var q = String(query || '').trim();
        if (!q) return [];

        var options = opts && typeof opts === 'object' ? opts : {};
        var roleHint = String(options.role || '').trim().toLowerCase();
        var limit = options.limit != null ? Number(options.limit) : 12;
        if (!isFinite(limit) || limit <= 0) limit = 12;
        limit = Math.min(30, Math.max(1, limit));

        var results = [];

        try {
            if (window.shikolaAuth && typeof window.shikolaAuth.getCurrentUser === 'function') {
                var u0 = window.shikolaAuth.getCurrentUser();
                var schoolId = u0 && (u0.schoolId || u0.school_id);
                if (schoolId != null && String(schoolId).trim()) {
                    var sid = String(schoolId).trim();
                    var sname = (u0 && (u0.schoolName || u0.school_name)) ? String(u0.schoolName || u0.school_name).trim() : '';
                    var uid = u0 && u0.id != null ? String(u0.id).trim() : '';
                    if (!uid || sid !== uid) {
                        results.push({
                            id: sid,
                            email: '',
                            name: sname || 'School Admin',
                            role: 'admin'
                        });
                    }
                }
            }
        } catch (_e0) {
        }

        try {
            var contacts = await loadContactsCached(false);
            if (Array.isArray(contacts) && contacts.length) {
                for (var i = 0; i < contacts.length; i++) {
                    var c = contacts[i];
                    if (!c) continue;
                    if (roleHint && String(c.role || '').toLowerCase() !== roleHint) continue;
                    if (!contactMatchesQuery(c, q)) continue;
                    results.push(c);
                }
            }
        } catch (_e) {
        }

        try {
            var wantsPupil = !roleHint || roleHint === 'pupil';
            var wantsParent = !roleHint || roleHint === 'parent';
            if (wantsPupil || wantsParent) {
                var pupils = [];
                if (window.ShikolaPupilsApi && typeof window.ShikolaPupilsApi.searchPupils === 'function') {
                    pupils = await window.ShikolaPupilsApi.searchPupils(q);
                } else {
                    pupils = await searchPupilsFromAPI(q);
                }
                if (Array.isArray(pupils)) {
                    for (var pi = 0; pi < pupils.length; pi++) {
                        var p = pupils[pi];
                        if (wantsPupil) {
                            var pc = normalisePupilToContact(p);
                            if (pc && contactMatchesQuery(pc, q)) results.push(pc);
                        }
                        if (wantsParent) {
                            var gc = normaliseGuardianToContact(p);
                            if (gc && contactMatchesQuery(gc, q)) results.push(gc);
                        }
                    }
                }
            }
        } catch (_e2) {
        }

        try {
            if ((!roleHint || roleHint === 'teacher' || roleHint === 'admin' || roleHint === 'accountant') && window.ShikolaEmployeesApi && typeof window.ShikolaEmployeesApi.searchLocalEmployees === 'function') {
                var localEmployees = window.ShikolaEmployeesApi.searchLocalEmployees(q);
                if (Array.isArray(localEmployees)) {
                    for (var ei = 0; ei < localEmployees.length; ei++) {
                        var ec = normaliseEmployeeToContact(localEmployees[ei]);
                        if (!ec) continue;
                        if (roleHint && String(ec.role || '').toLowerCase() !== roleHint) continue;
                        if (!contactMatchesQuery(ec, q)) continue;
                        results.push(ec);
                    }
                }
            }
        } catch (_e3) {
        }

        results = dedupeContacts(results);
        results.sort(function (a, b) {
            var an = String(a && a.name || '').toLowerCase();
            var bn = String(b && b.name || '').toLowerCase();
            if (an === bn) return 0;
            return an < bn ? -1 : 1;
        });

        return results.slice(0, limit);
    }

    function normaliseUser(u) {
        if (!u) return null;
        var id = u.id != null ? String(u.id) : '';
        var email = u.email != null ? String(u.email) : '';
        if (!id && email) {
            id = email;
        }
        if (!id) return null;
        var name = u.name != null ? String(u.name) : '';
        if (!name && email) {
            name = email.split('@')[0] || '';
        }
        var role = u.role != null ? String(u.role) : 'unknown';
        return {
            id: id,
            name: name || id,
            role: role.toLowerCase()
        };
    }

    function normaliseEndpoint(endpoint) {
        if (!endpoint) return null;
        var id = endpoint.id != null ? String(endpoint.id) : '';
        var email = endpoint.email != null ? String(endpoint.email) : '';
        if (!id && email) {
            id = email;
        }
        if (!id) return null;
        var name = endpoint.name != null ? String(endpoint.name) : '';
        if (!name && email) {
            name = email.split('@')[0] || '';
        }
        var role = endpoint.role != null ? String(endpoint.role) : 'unknown';
        return {
            id: id,
            name: name || id,
            role: role.toLowerCase()
        };
    }

    function buildThreadId(a, b, context) {
        var pa = a.role + ':' + a.id;
        var pb = b.role + ':' + b.id;
        var pair = [pa, pb].sort();
        var base = 'direct:' + pair[0] + '|' + pair[1];
        if (context && context.className) {
            base += ':class=' + String(context.className);
        }
        return base;
    }

    function isParticipant(msg, user) {
        if (!msg || !user) return false;
        var key = user.role + ':' + user.id;
        var fromKey = (msg.from && (msg.from.role + ':' + msg.from.id)) || '';
        var toKey = (msg.to && (msg.to.role + ':' + msg.to.id)) || '';
        return key === fromKey || key === toKey;
    }

    function getPeer(msg, user) {
        if (!msg || !user) return null;
        var from = msg.from || null;
        var to = msg.to || null;
        if (from && (from.id !== user.id || from.role !== user.role)) return from;
        if (to && (to.id !== user.id || to.role !== user.role)) return to;
        return from || to;
    }

    function getCurrentUserFromAuth() {
        try {
            if (window.shikolaAuth && typeof window.shikolaAuth.getCurrentUser === 'function') {
                return normaliseUser(window.shikolaAuth.getCurrentUser());
            }
        } catch (e) {
        }
        return null;
    }

    var flushingOutbox = false;

    async function flushOutbox(user) {
        if (flushingOutbox) return;
        if (!checkAPIAvailable()) return;
        flushingOutbox = true;

        try {
            var u = user ? normaliseUser(user) : getCurrentUserFromAuth();
            if (!u) {
                flushingOutbox = false;
                return;
            }

            var outbox = loadOutboxForUser(u);
            if (!outbox.length) {
                flushingOutbox = false;
                return;
            }

            var remaining = [];
            var all = loadAll();

            for (var i = 0; i < outbox.length; i++) {
                var item = outbox[i];
                if (!item || !item.localId || !item.payload) continue;

                var payload = item.payload || {};
                if (payload.threadId) {
                    payload.threadId = mapThreadIdForUser(u, payload.threadId);
                }

                var apiResult = await sendMessageViaAPI(payload);
                if (!apiResult) {
                    remaining.push(item);
                    continue;
                }

                var serverThreadId = String(apiResult.threadId || payload.threadId || item.threadId || '').trim();
                var serverMessageId = String(apiResult.id || apiResult.messageId || '').trim();
                var serverSentAt = apiResult.sentAt || apiResult.createdAt || null;

                if (item.threadId && serverThreadId && String(item.threadId) !== String(serverThreadId) && looksLikeUuid(serverThreadId)) {
                    var map = loadThreadMapForUser(u);
                    map[String(item.threadId)] = String(serverThreadId);
                    saveThreadMapForUser(u, map);
                }

                for (var j = 0; j < all.length; j++) {
                    if (!all[j] || String(all[j].id) !== String(item.localId)) continue;
                    if (serverMessageId) {
                        all[j].id = serverMessageId;
                    }
                    if (serverThreadId) {
                        all[j].threadId = serverThreadId;
                    }
                    if (serverSentAt) {
                        all[j].createdAt = serverSentAt;
                    }
                    all[j].meta = Object.assign({}, all[j].meta, { synced: true, queued: false });
                    break;
                }
            }

            saveAll(all);
            saveOutboxForUser(u, remaining);
        } catch (e) {
        }

        flushingOutbox = false;
    }

    function sendMessage(payload) {
        if (!payload) return null;
        var all = loadAll();
        var from = payload.from ? normaliseEndpoint(payload.from) : getCurrentUserFromAuth();
        var to = normaliseEndpoint(payload.to);
        var body = payload.body != null ? String(payload.body).trim() : '';
        var context = payload.context || {};
        if (!from || !to || !body) return null;
        var threadId = payload.threadId || buildThreadId(from, to, context);
        var now = new Date();
        var msg = {
            id: 'MSG-' + now.getTime().toString(36) + '-' + Math.random().toString(36).slice(2, 6),
            threadId: threadId,
            from: from,
            to: to,
            body: body,
            createdAt: now.toISOString(),
            context: context || {},
            meta: {
                portal: (payload.portal || (window.shikolaAuth && window.shikolaAuth.getCurrentPortal && window.shikolaAuth.getCurrentPortal()) || null)
            }
        };
        all.push(msg);
        saveAll(all);
        try {
            window.dispatchEvent(new CustomEvent('shikola:message-sent', { detail: msg }));
        } catch (e) {
        }
        return msg;
    }

    function listThreadsForUser(user) {
        var u = user ? normaliseUser(user) : getCurrentUserFromAuth();
        if (!u) return [];
        var all = loadAll();
        var map = {};
        for (var i = 0; i < all.length; i++) {
            var msg = all[i];
            if (!isParticipant(msg, u)) continue;
            var id = msg.threadId || '';
            if (!id) continue;
            if (!map[id]) {
                var peer = getPeer(msg, u) || { id: '', name: 'Conversation', role: 'unknown' };
                map[id] = {
                    id: id,
                    peerId: peer.id,
                    peerName: peer.name,
                    peerRole: peer.role,
                    lastMessage: msg.body,
                    lastFromRole: msg.from && msg.from.role,
                    lastAt: msg.createdAt,
                    context: msg.context || {}
                };
            } else {
                var existing = map[id];
                if (!existing.lastAt || (msg.createdAt && msg.createdAt > existing.lastAt)) {
                    existing.lastMessage = msg.body;
                    existing.lastFromRole = msg.from && msg.from.role;
                    existing.lastAt = msg.createdAt;
                }
            }
        }
        var threads = [];
        for (var key in map) {
            if (Object.prototype.hasOwnProperty.call(map, key)) {
                threads.push(map[key]);
            }
        }
        threads.sort(function (a, b) {
            var av = a.lastAt || '';
            var bv = b.lastAt || '';
            if (av === bv) return 0;
            return av > bv ? -1 : 1;
        });
        return threads;
    }

    function getMessagesForThread(threadId) {
        if (!threadId) return [];
        var all = loadAll();
        var list = [];
        for (var i = 0; i < all.length; i++) {
            var msg = all[i];
            if (!msg || msg.threadId !== threadId) continue;
            list.push(msg);
        }
        list.sort(function (a, b) {
            var av = a.createdAt || '';
            var bv = b.createdAt || '';
            if (av === bv) return 0;
            return av < bv ? -1 : 1;
        });
        return list;
    }

    // Enhanced async send that tries API first
    async function sendMessageAsync(payload) {
        if (!payload) return null;

        var from = payload.from ? normaliseEndpoint(payload.from) : getCurrentUserFromAuth();
        var to = normaliseEndpoint(payload.to);
        var body = payload.body != null ? String(payload.body).trim() : '';
        var context = payload.context || {};
        if (!from || !to || !body) return null;

        var threadId = payload.threadId || buildThreadId(from, to, context);
        var mappedThreadId = mapThreadIdForUser(from, threadId);
        var now = new Date();

        var toRaw = payload.to || {};
        var toEmail = (toRaw.email != null) ? String(toRaw.email) : '';

        var apiAttemptPayload = Object.assign({}, payload, {
            threadId: mappedThreadId,
            from: payload.from || from,
            to: Object.assign({}, toRaw, { id: to.id, name: to.name, role: to.role, email: toEmail }),
            body: body
        });

        var apiResult = await sendMessageViaAPI(apiAttemptPayload);
        if (apiResult) {
            var serverThreadId = String(apiResult.threadId || mappedThreadId || threadId || '').trim();
            var serverMessageId = String(apiResult.id || apiResult.messageId || '').trim();

            var fileList = [];
            try {
                if (payload.attachments && payload.attachments.length) {
                    fileList = payload.attachments;
                } else if (payload.files && payload.files.length) {
                    fileList = payload.files;
                } else if (payload.fileList && payload.fileList.length) {
                    fileList = payload.fileList;
                }
            } catch (e) {
                fileList = [];
            }

            var uploaded = [];
            if (serverMessageId && fileList && fileList.length) {
                uploaded = await uploadAttachmentsForMessage(serverMessageId, fileList);
            }

            var attachments = [];
            if (uploaded && uploaded.length) {
                for (var uix = 0; uix < uploaded.length; uix++) {
                    var na = normaliseAttachment(uploaded[uix]);
                    if (na) {
                        attachments.push(na);
                        try {
                            if (fileList && fileList[uix]) {
                                cacheFileForAttachment(from, na, fileList[uix]);
                            }
                        } catch (e) {
                        }
                    }
                }
            }

            if (threadId && serverThreadId && String(threadId) !== String(serverThreadId) && looksLikeUuid(serverThreadId)) {
                var map = loadThreadMapForUser(from);
                map[String(threadId)] = String(serverThreadId);
                saveThreadMapForUser(from, map);
            }

            var syncedMsg = {
                id: serverMessageId || ('MSG-' + now.getTime().toString(36) + '-' + Math.random().toString(36).slice(2, 6)),
                threadId: serverThreadId || threadId,
                from: from,
                to: to,
                body: body,
                createdAt: apiResult.sentAt || apiResult.createdAt || now.toISOString(),
                context: context || {},
                attachments: attachments,
                meta: { portal: payload.portal, synced: true, queued: false }
            };

            upsertMessages([syncedMsg]);
            try {
                window.dispatchEvent(new CustomEvent('shikola:message-sent', { detail: syncedMsg }));
            } catch (e) {}
            return syncedMsg;
        }

        var localId = 'MSG-' + now.getTime().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
        var localMsg = {
            id: localId,
            threadId: threadId,
            from: from,
            to: to,
            body: body,
            createdAt: now.toISOString(),
            context: context || {},
            meta: { portal: payload.portal, synced: false, queued: true }
        };
        upsertMessages([localMsg]);

        var outbox = loadOutboxForUser(from);
        outbox.push({
            localId: localId,
            threadId: threadId,
            payload: {
                threadId: mappedThreadId || threadId,
                to: Object.assign({}, toRaw, { id: to.id, name: to.name, role: to.role, email: toEmail }),
                body: body,
                portal: payload.portal,
                context: context || {}
            },
            queuedAt: now.toISOString()
        });
        saveOutboxForUser(from, outbox);

        try {
            window.dispatchEvent(new CustomEvent('shikola:message-sent', { detail: localMsg }));
        } catch (e) {}

        return localMsg;
    }

    // Enhanced async thread listing
    async function listThreadsForUserAsync(user) {
        var u = user ? normaliseUser(user) : getCurrentUserFromAuth();
        if (!u) return [];

        var apiThreads = await loadThreadsFromAPI();
        if (apiThreads && Array.isArray(apiThreads)) {
            var mapped = apiThreads.map(function (t) {
                return {
                    id: t.id,
                    peerId: t.peerId,
                    peerName: t.peerName,
                    peerRole: t.peerRole,
                    lastMessage: t.lastMessage,
                    lastAt: t.lastMessageAt,
                    unreadCount: t.unreadCount || 0,
                    context: {}
                };
            });
            saveCachedThreadsForUser(u, mapped);
            return mapped;
        }

        var cached = loadCachedThreadsForUser(u);
        if (cached && Array.isArray(cached) && cached.length) {
            return cached;
        }

        return listThreadsForUser(u);
    }

    // Enhanced async message loading
    async function getMessagesForThreadAsync(threadId) {
        // Try API first
        var apiMessages = await loadMessagesFromAPI(threadId);
        if (apiMessages && Array.isArray(apiMessages)) {
            var mapped = apiMessages.map(function(m) {
                var atts = [];
                try {
                    var rawAtts = m.attachments || [];
                    for (var ai = 0; ai < rawAtts.length; ai++) {
                        var na = normaliseAttachment(rawAtts[ai]);
                        if (na) atts.push(na);
                    }
                } catch (e) {
                    atts = [];
                }
                return {
                    id: m.id,
                    threadId: m.threadId,
                    from: { id: m.senderId, role: m.senderRole, name: m.senderEmail },
                    to: { id: m.recipientId, role: m.recipientRole },
                    body: m.message,
                    createdAt: m.sentAt,
                    isRead: m.isRead,
                    attachments: atts
                };
            });
            upsertMessages(mapped);
            return mapped;
        }
        
        // Fall back to localStorage
        return getMessagesForThread(threadId);
    }

    var api = {
        PREFIX: PREFIX,
        STORAGE_KEY: STORAGE_KEY,
        loadAll: loadAll,
        saveAll: saveAll,
        upsertMessages: upsertMessages,
        sendMessage: sendMessage,
        listThreadsForUser: listThreadsForUser,
        getMessagesForThread: getMessagesForThread,
        normaliseUser: normaliseUser,
        normaliseEndpoint: normaliseEndpoint,
        buildThreadId: buildThreadId,
        loadCachedThreadsForUser: loadCachedThreadsForUser,
        saveCachedThreadsForUser: saveCachedThreadsForUser,
        flushOutbox: flushOutbox,
        
        // Async API methods
        sendMessageAsync: sendMessageAsync,
        listThreadsForUserAsync: listThreadsForUserAsync,
        getMessagesForThreadAsync: getMessagesForThreadAsync,
        loadContactsFromAPI: loadContactsFromAPI,
        loadContactsCached: loadContactsCached,
        searchRecipients: searchRecipients,
        checkAPIAvailable: checkAPIAvailable,
        fetchAndCacheAttachment: fetchAndCacheAttachment,
        loadAttachmentsCacheForUser: loadAttachmentsCacheForUser
    };

    try {
        window.addEventListener('online', function () {
            flushOutbox();
        });
    } catch (e) {
    }

    try {
        setTimeout(function () {
            flushOutbox();
        }, 0);
    } catch (e) {
    }

    window.ShikolaMessagesStore = api;
})();
