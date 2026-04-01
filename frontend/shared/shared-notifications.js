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
    // Shared notifications helper for all portals.
    // Button functions already dispatch `shikola:notification` events and log
    // to localStorage under `shikolaNotificationLog`. This module adds a
    // simple, app-wide helper around that behaviour.

    if (window.ShikolaNotifications) return;

    var STORAGE_KEY = 'shikola_notifications_v1';

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
            localStorage.setItem(STORAGE_KEY, JSON.stringify(list || []));
        } catch (e) {}
    }

    function addNotification(payload) {
        if (!payload) return;
        var now = new Date();
        var entry = {
            id: payload.id || (now.getTime().toString(36) + '-' + Math.random().toString(36).slice(2, 6)),
            title: payload.title || 'Notification',
            message: payload.message || '',
            time: payload.time || now.toLocaleTimeString(),
            read: !!payload.read,
            link: payload.link || ''
        };

        var list = loadAll();
        list.unshift(entry);
        if (list.length > 100) list = list.slice(0, 100);
        saveAll(list);

        if (window.shikolaButtons && typeof window.shikolaButtons.showNotification === 'function') {
            // Add flag to prevent infinite recursion
            var notificationEntry = Object.assign({}, entry, { _fromSharedNotifications: true });
            window.shikolaButtons.showNotification(entry.title + (entry.message ? ': ' + entry.message : ''), 'info', notificationEntry);
        }

        return entry;
    }

    window.ShikolaNotifications = {
        add: addNotification,
        all: loadAll
    };

    // Bridge: whenever button-functions broadcasts a notification event,
    // mirror it into this store so dashboards can read a unified feed.
    try {
        window.addEventListener('shikola:notification', function (evt) {
            var detail = evt && evt.detail ? evt.detail : {};
            addNotification({
                title: detail.title || 'Notification',
                message: detail.message || detail.text || '',
                time: detail.time,
                link: detail.link || ''
            });
        });
    } catch (e) {}

})(window);
