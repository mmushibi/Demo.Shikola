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
    const THEME_KEY = 'shikolaTheme';
    const root = document.documentElement;

    function decodeJwtPayload(token) {
        if (!token) return null;
        try {
            const parts = String(token).split('.');
            if (parts.length < 2) return null;
            let payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
            while (payload.length % 4) payload += '=';
            const decoded = atob(payload);
            return JSON.parse(decoded);
        } catch (_err) {
            return null;
        }
    }

    function getAccountIdentifier() {
        try {
            const sessionRaw = localStorage.getItem('shikola_session');
            if (sessionRaw) {
                const session = JSON.parse(sessionRaw);
                const user = session && session.user ? session.user : null;
                if (user) {
                    return user.id || user.email || null;
                }
            }
        } catch (_err) {}

        try {
            const rawUser = localStorage.getItem('shikola_user');
            if (rawUser) {
                const user = JSON.parse(rawUser);
                if (user && typeof user === 'object') {
                    return user.id || user.email || null;
                }
            }
        } catch (_err) {}

        try {
            const token = localStorage.getItem('authToken');
            const payload = decodeJwtPayload(token);
            if (payload && typeof payload === 'object') {
                return payload.id || payload.sub || payload.email || null;
            }
        } catch (_err) {}

        return null;
    }

    function getUserScopedThemeKey() {
        const account = getAccountIdentifier();
        if (!account) return THEME_KEY;
        return `${THEME_KEY}:${account}`;
    }

    function getPreferredTheme() {
        let saved = null;
        const userKey = getUserScopedThemeKey();
        try {
            saved = localStorage.getItem(userKey);
        } catch (_err) {
            saved = null;
        }

        if (saved === null && userKey !== THEME_KEY) {
            // Legacy migration: previously theme was stored device-wide under THEME_KEY.
            // When we have an account identifier, migrate once into the user-scoped key
            // and remove the global key to avoid cross-account leakage.
            let legacy = null;
            try {
                legacy = localStorage.getItem(THEME_KEY);
            } catch (_err) {
                legacy = null;
            }

            if (legacy === 'light' || legacy === 'dark' || legacy === 'system') {
                saved = legacy;
                try {
                    localStorage.setItem(userKey, legacy);
                } catch (_err) {}
                try {
                    localStorage.removeItem(THEME_KEY);
                } catch (_err) {}
            }
        }

        if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
        return 'light';
    }

    function getEffectiveTheme(mode) {
        if (mode === 'system') {
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                return 'dark';
            }
            return 'light';
        }
        return mode;
    }

    function applyTheme(mode) {
        const effective = getEffectiveTheme(mode);
        root.dataset.theme = effective;

        if (effective === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    }

    const current = getPreferredTheme();
    applyTheme(current);

    if (window.matchMedia) {
        const mql = window.matchMedia('(prefers-color-scheme: dark)');
        if (mql.addEventListener) {
            mql.addEventListener('change', function () {
                if (getPreferredTheme() === 'system') {
                    applyTheme('system');
                }
            });
        }
    }

    window.ShikolaTheme = {
        getPreferredTheme,
        applyTheme,
        setTheme: function (mode) {
            if (mode !== 'light' && mode !== 'dark' && mode !== 'system') {
                mode = 'system';
            }
            const userKey = getUserScopedThemeKey();
            try {
                localStorage.setItem(userKey, mode);
            } catch (_err) {}
            if (userKey !== THEME_KEY) {
                try {
                    localStorage.removeItem(THEME_KEY);
                } catch (_err) {}
            }
            applyTheme(mode);
        }
    };
})();
