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
    if (window.ShikolaPupilPortal) return;

    var STORAGE_KEYS = {
        id: 'shikola_last_exam_pupil_id',
        name: 'shikola_last_exam_pupil_name',
        classLabel: 'shikola_last_exam_pupil_class'
    };

    var DEFAULT_PROFILE = Object.freeze({
        id: null,
        name: 'Pupil',
        fullName: 'Pupil',
        classLabel: 'Class'
    });

    function cloneProfile(profile) {
        var source = profile || DEFAULT_PROFILE;
        return {
            id: source.id || null,
            name: source.name || source.fullName || 'Pupil',
            fullName: source.fullName || source.name || 'Pupil',
            classLabel: source.classLabel || source.className || source.class || 'Class'
        };
    }

    function readFromAuth() {
        try {
            if (!window.shikolaAuth || typeof window.shikolaAuth.getCurrentUser !== 'function') {
                return null;
            }
            var user = window.shikolaAuth.getCurrentUser();
            if (!user || user.role !== 'pupil') return null;
            return cloneProfile({
                id: user.id != null ? String(user.id) : null,
                name: user.name || user.fullName,
                fullName: user.fullName || user.name,
                classLabel: user.className || user.classLabel || user.class
            });
        } catch (error) {
            return null;
        }
    }

    function readFromStorage() {
        try {
            var id = window.localStorage.getItem(STORAGE_KEYS.id);
            var name = window.localStorage.getItem(STORAGE_KEYS.name);
            var classLabel = window.localStorage.getItem(STORAGE_KEYS.classLabel);
            if (!id && !name && !classLabel) return null;
            return cloneProfile({
                id: id,
                name: name,
                fullName: name,
                classLabel: classLabel
            });
        } catch (error) {
            return null;
        }
    }

    function persistProfile(profile) {
        var current = cloneProfile(profile);
        try {
            window.localStorage.setItem(STORAGE_KEYS.id, current.id || '');
            window.localStorage.setItem(STORAGE_KEYS.name, current.fullName || current.name || '');
            window.localStorage.setItem(STORAGE_KEYS.classLabel, current.classLabel || '');
        } catch (error) {
            // Ignore storage issues silently to avoid blocking the UI.
        }
        return current;
    }

    function resolveProfile() {
        var profile = readFromAuth() || readFromStorage();
        if (!profile) {
            return cloneProfile(DEFAULT_PROFILE);
        }
        return persistProfile(profile);
    }

    window.ShikolaPupilPortal = {
        init: function () {},
        getDefaultProfile: function () {
            return cloneProfile(DEFAULT_PROFILE);
        },
        getActivePupilProfile: function () {
            return resolveProfile();
        },
        rememberProfile: function (profile) {
            return persistProfile(profile);
        }
    };

    try {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function () {
                window.ShikolaPupilPortal.init();
            });
        } else {
            window.ShikolaPupilPortal.init();
        }
    } catch (e) {}
})(window);
