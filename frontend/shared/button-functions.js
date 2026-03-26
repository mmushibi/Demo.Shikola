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
// Universal Button Functions for Shikola Portals
// This file provides common functionality for all buttons across the application

class ShikolaButtonFunctions {
    constructor() {
        this.init();
    }

    getEffectiveThemeMode() {
        try {
            const root = document.documentElement;
            const datasetTheme = root && root.dataset ? root.dataset.theme : null;
            if (datasetTheme === 'light' || datasetTheme === 'dark') return datasetTheme;
            return root.classList.contains('dark') ? 'dark' : 'light';
        } catch (_e) {
            return 'light';
        }
    }

    updateThemeToggleButton(btn) {
        if (!btn) return;
        const effective = this.getEffectiveThemeMode();
        if (effective === 'dark') {
            btn.setAttribute('title', 'Switch to light theme');
            btn.setAttribute('aria-label', 'Switch to light theme');
            btn.innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            btn.setAttribute('title', 'Switch to dark theme');
            btn.setAttribute('aria-label', 'Switch to dark theme');
            btn.innerHTML = '<i class="fas fa-moon"></i>';
        }
    }

    ensureGlobalThemeToggleButton() {
        try {
            if (!document.body || !document.body.classList.contains('dashboard-page')) return;
            if (document.getElementById('shikola-global-theme-toggle')) return;

            const btn = document.createElement('button');
            btn.type = 'button';
            btn.id = 'shikola-global-theme-toggle';
            btn.className = 'fixed bottom-6 left-4 sm:left-8 h-11 w-11 rounded-full bg-slate-50 border border-slate-200 text-slate-600 shadow-lg hover:bg-slate-100 flex items-center justify-center z-50';
            btn.addEventListener('click', (event) => this.handleThemeToggle(event));
            document.body.appendChild(btn);

            this.updateThemeToggleButton(btn);

            const root = document.documentElement;
            if (root && window.MutationObserver) {
                const observer = new MutationObserver(() => this.updateThemeToggleButton(btn));
                observer.observe(root, { attributes: true, attributeFilter: ['class', 'data-theme'] });
            }
        } catch (_e) {
        }
    }

    getPortalKeyFromPath(path) {
        if (!path) return null;
        if (path.includes('/frontend/portals/school-admin/')) return 'school-admin';
        if (path.includes('/frontend/portals/teacher-portal/')) return 'teacher-portal';
        if (path.includes('/frontend/portals/pupil-portal/')) return 'pupil-portal';
        if (path.includes('/frontend/portals/accountant-portal/')) return 'accountant-portal';
        if (path.includes('/frontend/portals/super-admin/')) return 'super-admin';
       return null;
    }

    getPortalSidebarNavConfig(portalKey) {
        const adminActive = 'flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 text-white shadow-md';
        const adminInactive = 'flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-50 transition';

        if (portalKey === 'school-admin') {
            return {
                items: this.getAdminSidebarNavItems(),
                activeClass: adminActive,
                inactiveClass: adminInactive,
                activeLabelClass: 'font-medium flex-1',
                inactiveLabelClass: 'flex-1',
                aliases: {
                    'pupil-details.html': 'pupils.html'
                }
            };
        }

        if (portalKey === 'teacher-portal') {
            return {
                items: [
                    { href: 'dashboard.html', label: 'Dashboard', icon: 'fas fa-chart-pie' },
                    { href: 'attendance.html', label: 'Attendance', icon: 'fas fa-user-check' },
                    { href: 'my-timetable.html', label: 'My Timetable', icon: 'fas fa-calendar-alt' },
                    { href: 'classes.html', label: 'Classes', icon: 'fas fa-chalkboard' },
                    { href: 'exams.html', label: 'Exams', icon: 'fas fa-file-alt' },
                    { href: 'class-tests.html', label: 'Class Tests', icon: 'fas fa-clipboard-check' },
                    { href: 'reports.html', label: 'Reports', icon: 'fas fa-chart-line' },
                    { href: 'messaging.html', label: 'Messaging', icon: 'fas fa-comments' },
                    { href: 'profile.html', label: 'Profile', icon: 'fas fa-id-badge' }
                ],
                activeClass: adminActive,
                inactiveClass: adminInactive,
                activeLabelClass: 'font-medium flex-1',
                inactiveLabelClass: 'flex-1'
            };
        }

        if (portalKey === 'pupil-portal') {
            return {
                items: [
                    { href: 'dashboard.html', label: 'Dashboard', icon: 'fas fa-chart-pie' },
                    { href: 'admission-letter.html', label: 'Admission Letter', icon: 'fas fa-envelope-open-text' },
                    { href: 'paid-fee-receipt.html', label: 'Paid Fee Receipt', icon: 'fas fa-receipt' },
                    { href: 'my-timetable.html', label: 'My Timetable', icon: 'fas fa-calendar-alt' },
                    { href: 'my-report-card.html', label: 'My Report Card', icon: 'fas fa-file-alt' },
                    { href: 'test-results.html', label: 'Test Results', icon: 'fas fa-clipboard-check' },
                    { href: 'exam-result.html', label: 'Exam Result', icon: 'fas fa-file-invoice' },
                    { href: 'home-assignments.html', label: 'Home Assignments', icon: 'fas fa-book' },
                    { href: 'messaging.html', label: 'Messaging', icon: 'fas fa-comments' },
                    { href: 'live-class.html', label: 'Live Class', icon: 'fas fa-video' },
                    { href: 'profile.html', label: 'Profile', icon: 'fas fa-user-circle' }
                ],
                activeClass: adminActive,
                inactiveClass: adminInactive,
                activeLabelClass: 'font-medium flex-1',
                inactiveLabelClass: 'flex-1'
            };
        }

       
        if (portalKey === 'accountant-portal') {
            return {
                items: [
                    { href: 'dashboard.html', label: 'Dashboard', icon: 'fas fa-chart-line' },
                    { href: 'chart-of-accounts.html', label: 'Chart of Accounts', icon: 'fas fa-sitemap' },
                    { href: 'income-management.html', label: 'Income Management', icon: 'fas fa-arrow-down' },
                    { href: 'expense-management.html', label: 'Expense Management', icon: 'fas fa-arrow-up' },
                    { href: 'fees-management.html', label: 'Fees Management', icon: 'fas fa-graduation-cap' },
                    { href: 'salary-management.html', label: 'Salary Management', icon: 'fas fa-sack-dollar' },
                    { href: 'bank-reconciliation.html', label: 'Bank Reconciliation', icon: 'fas fa-university' },
                    { href: 'financial-reports.html', label: 'Financial Reports', icon: 'fas fa-file-invoice' },
                    { href: 'budget-management.html', label: 'Budget Management', icon: 'fas fa-calculator' },
                    { href: 'audit-trail.html', label: 'Audit Trail', icon: 'fas fa-history' }
                ],
                activeClass: 'flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 text-white shadow-md',
                inactiveClass: adminInactive,
                activeLabelClass: 'font-medium flex-1',
                inactiveLabelClass: 'flex-1'
            };
        }

        if (portalKey === 'super-admin') {
            return {
                items: [
                    { href: 'dashboard.html', label: 'Console', icon: 'fas fa-chart-pie' },
                    { href: 'schools.html', label: 'Schools', icon: 'fas fa-school' },
                    { href: 'users-and-roles.html', label: 'Users & Roles', icon: 'fas fa-users' },
                    { href: 'create-user.html', label: 'Create Users', icon: 'fas fa-user-plus' },
                    { href: 'global-user-search.html', label: 'Global Search', icon: 'fas fa-magnifying-glass' },
                    { href: 'payments-coupons.html', label: 'Payments & Coupons', icon: 'fas fa-ticket' },
                    { href: 'subscriptions.html', label: 'Subscriptions', icon: 'fas fa-layer-group' },
                    { href: 'plans.html', label: 'Plans & Events', icon: 'fas fa-calendar-alt' },
                    { href: 'activity-log.html', label: 'Activity Log', icon: 'fas fa-clipboard-list' },
                    { href: 'system-health.html', label: 'System Health', icon: 'fas fa-heart-pulse' },
                    { href: 'settings.html', label: 'Settings', icon: 'fas fa-gear' }
                ],
                activeClass: 'flex items-center gap-3 px-4 py-3 rounded-xl bg-orange-50 text-orange-600 transition',
                inactiveClass: adminInactive,
                activeLabelClass: 'font-medium flex-1',
                inactiveLabelClass: 'flex-1',
                aliases: {
                    'provision-school.html': 'schools.html',
                    'school-details.html': 'schools.html'
                }
            };
        }

        return null;
    }

    resolvePortalNavActivePage(currentPage, config) {
        const page = String(currentPage || '').toLowerCase();
        const aliases = config && config.aliases ? config.aliases : null;
        if (aliases && Object.prototype.hasOwnProperty.call(aliases, page)) {
            return String(aliases[page] || page).toLowerCase();
        }
        return page;
    }

    async secureLogoutFallback() {
        try {
            localStorage.clear();
        } catch (_e) {
        }

        try {
            sessionStorage.clear();
        } catch (_e) {
        }

        try {
            const raw = String(document.cookie || '');
            const cookies = raw.split(';').map(c => c.trim()).filter(Boolean);
            const host = String(window.location.hostname || '').trim();
            const parts = host ? host.split('.').filter(Boolean) : [];
            const domains = [''];
            if (host) domains.push(host);
            if (parts.length >= 2) {
                for (let i = 0; i < parts.length - 1; i++) {
                    domains.push('.' + parts.slice(i).join('.'));
                }
            }

            const path = String(window.location.pathname || '/');
            const pathParts = path.split('/').filter(Boolean);
            const paths = ['/'];
            let acc = '';
            for (const seg of pathParts) {
                acc += '/' + seg;
                paths.push(acc);
            }

            const expires = 'Thu, 01 Jan 1970 00:00:00 GMT';
            for (const entry of cookies) {
                const name = entry.split('=')[0].trim();
                if (!name) continue;
                for (const p of paths) {
                    document.cookie = `${name}=; expires=${expires}; Max-Age=0; path=${p}`;
                    for (const d of domains) {
                        if (!d) continue;
                        document.cookie = `${name}=; expires=${expires}; Max-Age=0; path=${p}; domain=${d}`;
                    }
                }
            }
        } catch (_e) {
        }

        try {
            if ('caches' in window && window.caches) {
                const keys = await window.caches.keys();
                await Promise.all(keys.map(k => window.caches.delete(k)));
            }
        } catch (_e) {
        }

        try {
            if ('indexedDB' in window && window.indexedDB && typeof window.indexedDB.databases === 'function') {
                const dbs = await window.indexedDB.databases();
                if (Array.isArray(dbs)) {
                    await Promise.all(dbs.map(db => {
                        if (!db || !db.name) return Promise.resolve();
                        return new Promise((resolve) => {
                            try {
                                const req = window.indexedDB.deleteDatabase(db.name);
                                req.onsuccess = () => resolve();
                                req.onerror = () => resolve();
                                req.onblocked = () => resolve();
                            } catch (_err) {
                                resolve();
                            }
                        });
                    }));
                }
            }
        } catch (_e) {
        }

        try {
            if ('serviceWorker' in navigator && navigator.serviceWorker) {
                const regs = await navigator.serviceWorker.getRegistrations();
                if (Array.isArray(regs)) {
                    await Promise.all(regs.map(r => {
                        try {
                            return r.unregister();
                        } catch (_e) {
                            return Promise.resolve(false);
                        }
                    }));
                }
            }
        } catch (_e) {
        }
    }

    init() {
        // Initialize all button event listeners when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupButtons());
        } else {
            this.setupButtons();
        }
    }

    setupButtons() {
        this.normalizePortalSidebarNavigation();
        this.setupNavigationButtons();
        this.setupMessagingTypeahead();
        this.setupActionButtons();
        this.setupFormButtons();
        this.setupModalButtons();
        this.setupUtilityButtons();
        this.ensureGlobalThemeToggleButton();
        this.setupPayslipButtons();
        this.startServerNotificationSync();
    }

    normalizePortalSidebarNavigation() {
        try {
            const rawPath = String(window.location.pathname || '');
            const path = rawPath.replace(/\\/g, '/').toLowerCase();
            const portalKey = this.getPortalKeyFromPath(path);
            if (!portalKey) return;

            const config = this.getPortalSidebarNavConfig(portalKey);
            if (!config || !Array.isArray(config.items) || !config.items.length) return;

            const currentPageRaw = (path.split('/').pop() || '').split('?')[0].split('#')[0];
            const currentPage = this.resolvePortalNavActivePage(currentPageRaw, config);
            const navHtml = this.renderSidebarNavHtml(config.items, currentPage, config);

            const navs = document.querySelectorAll('aside nav.space-y-1.text-sm');
            navs.forEach(nav => {
                try {
                    nav.innerHTML = navHtml;
                } catch (_e) {
                }
            });
        } catch (_e) {
        }
    }

    getAdminSidebarNavItems() {
        return [
            { href: 'dashboard.html', label: 'Dashboard', icon: 'fas fa-chart-pie' },
            { href: 'general-settings.html', label: 'General Settings', icon: 'fas fa-cog' },
            { href: 'classes.html', label: 'Classes', icon: 'fas fa-chalkboard' },
            { href: 'pupils.html', label: 'Pupils', icon: 'fas fa-user-graduate' },
            { href: 'employees.html', label: 'Employees', icon: 'fas fa-users' },
            { href: 'accounts.html', label: 'Accounts', icon: 'fas fa-file-invoice-dollar' },
            { href: 'timetables.html', label: 'Timetables', icon: 'fas fa-calendar-alt' },
            { href: 'attendance.html', label: 'Attendance', icon: 'fas fa-user-check' },
            { href: 'sms-gateway.html', label: 'SMS Gateway', icon: 'fas fa-sms' },
            { href: 'messaging.html', label: 'Messaging', icon: 'fas fa-comments' },
            { href: 'exams.html', label: 'Exams', icon: 'fas fa-file-alt' },
            { href: 'class-tests.html', label: 'Class Tests', icon: 'fas fa-clipboard-check' },
            { href: 'reports.html', label: 'Reports', icon: 'fas fa-chart-line' }
        ];
    }

    renderSidebarNavHtml(items, currentPage, config) {
        const activeClass = (config && config.activeClass) ? config.activeClass : 'flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 text-white shadow-md';
        const inactiveClass = (config && config.inactiveClass) ? config.inactiveClass : 'flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-50 transition';
        const activeLabelClass = (config && config.activeLabelClass) ? config.activeLabelClass : 'font-medium flex-1';
        const inactiveLabelClass = (config && config.inactiveLabelClass) ? config.inactiveLabelClass : 'flex-1';

        return items.map(item => {
            const href = String(item && item.href ? item.href : '');
            const label = String(item && item.label ? item.label : '');
            const icon = String(item && item.icon ? item.icon : '');
            const isActive = href && currentPage && href.toLowerCase() === currentPage;
            const cls = isActive ? activeClass : inactiveClass;
            const labelClass = isActive ? activeLabelClass : inactiveLabelClass;

            return (
                '<a href="' + href + '" class="' + cls + '">' +
                '<span class="w-6 flex justify-center">' +
                '<i class="' + icon + '"></i>' +
                '</span>' +
                '<span class="' + labelClass + '">' + label + '</span>' +
                '</a>'
            );
        }).join('');
    }

    // Navigation button functions
    setupNavigationButtons() {
        // Mobile menu toggle
        const mobileMenuButtons = document.querySelectorAll('[data-action="toggle-menu"]');
        mobileMenuButtons.forEach(button => {
            button.addEventListener('click', (event) => this.toggleMobileMenu(event));
        });

        // Logout buttons
        const logoutButtons = document.querySelectorAll('[data-action="logout"]');
        logoutButtons.forEach(button => {
            button.addEventListener('click', (event) => this.handleLogout(event));
        });

        // Backwards compatibility: treat plain links to the public index as logout links
        const legacyLogoutLinks = document.querySelectorAll('a[href="../frontend/public/index.html"]:not([data-action="logout"])');
        legacyLogoutLinks.forEach(link => {
            link.dataset.action = 'logout';
            link.addEventListener('click', (event) => this.handleLogout(event));
        });

        // Portal navigation
        const portalLinks = document.querySelectorAll('[data-portal]');
        portalLinks.forEach(link => {
            link.addEventListener('click', (event) => this.handlePortalNavigation(event));
        });
    }

    setupMessagingTypeahead() {
        try {
            const rawPath = String(window.location.pathname || '');
            const path = rawPath.replace(/\\/g, '/').toLowerCase();
            if (path.indexOf('messaging.html') === -1) return;

            const convoInputs = document.querySelectorAll('input[x-model="filters.query"]');
            convoInputs.forEach(input => {
                try {
                    this.attachMessagingConversationTypeahead(input);
                } catch (_e) {
                }
            });

            const recipientInputs = document.querySelectorAll('input[x-model="composer.target"]');
            recipientInputs.forEach(input => {
                try {
                    this.attachMessagingRecipientTypeahead(input);
                } catch (_e) {
                }
            });
        } catch (_e) {
        }
    }

    attachMessagingConversationTypeahead(input) {
        if (!input || input.__shikolaTypeaheadConversationAttached) return;
        input.__shikolaTypeaheadConversationAttached = true;

        const getRoot = () => {
            try {
                return input.closest('[x-data]');
            } catch (_e) {
                return null;
            }
        };

        const getAlpineData = () => {
            try {
                const root = getRoot();
                return root && root.__x && root.__x.$data ? root.__x.$data : null;
            } catch (_e) {
                return null;
            }
        };

        const getCurrentUser = () => {
            try {
                if (window.shikolaAuth && typeof window.shikolaAuth.getCurrentUser === 'function') {
                    return window.shikolaAuth.getCurrentUser() || {};
                }
            } catch (_e) {
            }
            return {};
        };

        let dropdown = null;
        let items = [];
        let activeIndex = -1;
        let debounceTimer = null;
        let lastLoadAt = 0;
        let cachedThreads = [];

        const ensureDropdown = () => {
            if (dropdown && dropdown.parentNode) return dropdown;
            dropdown = document.createElement('div');
            dropdown.className = 'shikola-typeahead fixed z-[9999] bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden';
            dropdown.style.zIndex = '9999';
            dropdown.style.display = 'none';
            dropdown.style.minWidth = '200px';
            document.body.appendChild(dropdown);
            return dropdown;
        };

        const positionDropdown = () => {
            if (!dropdown) return;
            const rect = input.getBoundingClientRect();
            dropdown.style.left = Math.round(rect.left) + 'px';
            dropdown.style.top = Math.round(rect.bottom + 6) + 'px';
            dropdown.style.width = Math.round(rect.width) + 'px';
        };

        const hide = () => {
            if (!dropdown) return;
            dropdown.style.display = 'none';
            dropdown.innerHTML = '';
            activeIndex = -1;
            items = [];
        };

        const show = () => {
            ensureDropdown();
            positionDropdown();
            dropdown.style.display = 'block';
        };

        const render = () => {
            ensureDropdown();
            dropdown.innerHTML = '';
            if (!items.length) {
                hide();
                return;
            }

            const wrapper = document.createElement('div');
            wrapper.className = 'max-h-60 overflow-y-auto';

            items.forEach((it, idx) => {
                const row = document.createElement('button');
                row.type = 'button';
                row.className = 'w-full text-left px-3 py-2 text-xs flex flex-col gap-0.5';
                row.className += (idx === activeIndex) ? ' bg-slate-50' : ' hover:bg-slate-50';
                row.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                });
                row.addEventListener('click', () => selectIndex(idx));

                const title = document.createElement('div');
                title.className = 'font-medium text-slate-700 truncate';
                title.textContent = String(it.peerName || 'Conversation');

                const meta = document.createElement('div');
                meta.className = 'text-[11px] text-slate-400 truncate';
                meta.textContent = String(it.lastMessage || '');

                row.appendChild(title);
                row.appendChild(meta);
                wrapper.appendChild(row);
            });

            dropdown.appendChild(wrapper);
            show();
        };

        const loadThreadsIfNeeded = async () => {
            const now = Date.now();
            if (cachedThreads.length && (now - lastLoadAt) < 60 * 1000) {
                return cachedThreads;
            }

            if (!window.ShikolaMessagesStore) {
                cachedThreads = [];
                lastLoadAt = now;
                return [];
            }

            try {
                const user = getCurrentUser();
                if (window.ShikolaMessagesStore.listThreadsForUserAsync) {
                    const list = await window.ShikolaMessagesStore.listThreadsForUserAsync(user || {});
                    cachedThreads = Array.isArray(list) ? list : [];
                } else if (window.ShikolaMessagesStore.listThreadsForUser) {
                    const list2 = window.ShikolaMessagesStore.listThreadsForUser(user || {});
                    cachedThreads = Array.isArray(list2) ? list2 : [];
                } else {
                    cachedThreads = [];
                }
            } catch (_e) {
                cachedThreads = [];
            }

            lastLoadAt = Date.now();
            return cachedThreads;
        };

        const computeItems = async () => {
            const q = String(input.value || '').trim().toLowerCase();
            const threads = await loadThreadsIfNeeded();
            const out = [];
            for (let i = 0; i < threads.length; i++) {
                const t = threads[i];
                if (!t) continue;
                const text = (String(t.peerName || '') + ' ' + String(t.lastMessage || '')).toLowerCase();
                if (q && text.indexOf(q) === -1) continue;
                out.push({
                    id: t.id,
                    peerName: t.peerName,
                    lastMessage: t.lastMessage,
                    peerRole: t.peerRole,
                    peerId: t.peerId
                });
                if (out.length >= 8) break;
            }
            items = out;
            activeIndex = out.length ? 0 : -1;
            render();
        };

        const selectIndex = (idx) => {
            if (!items.length || idx < 0 || idx >= items.length) return;
            const it = items[idx];
            const alpine = getAlpineData();
            try {
                if (alpine && typeof alpine.openThread === 'function' && it && it.id) {
                    alpine.openThread(it.id);
                    hide();
                    return;
                }
            } catch (_e) {
            }

            try {
                input.value = String(it.peerName || '');
                input.dispatchEvent(new Event('input', { bubbles: true }));
            } catch (_e2) {
            }
            hide();
        };

        const schedule = () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                computeItems();
            }, 180);
        };

        input.addEventListener('input', schedule);
        input.addEventListener('focus', schedule);
        input.addEventListener('keydown', (e) => {
            if (!dropdown || dropdown.style.display === 'none') return;
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (!items.length) return;
                activeIndex = Math.min(items.length - 1, activeIndex + 1);
                render();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (!items.length) return;
                activeIndex = Math.max(0, activeIndex - 1);
                render();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                selectIndex(activeIndex);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                hide();
            }
        });

        const onDocClick = (e) => {
            try {
                if (e && e.target === input) return;
                if (dropdown && dropdown.contains(e.target)) return;
                hide();
            } catch (_e) {
            }
        };

        document.addEventListener('click', onDocClick);
        window.addEventListener('resize', () => {
            try {
                if (dropdown && dropdown.style.display !== 'none') positionDropdown();
            } catch (_e) {
            }
        });
        window.addEventListener('scroll', () => {
            try {
                if (dropdown && dropdown.style.display !== 'none') positionDropdown();
            } catch (_e) {
            }
        }, true);
    }

    attachMessagingRecipientTypeahead(input) {
        if (!input || input.__shikolaTypeaheadRecipientAttached) return;
        input.__shikolaTypeaheadRecipientAttached = true;

        let dropdown = null;
        let items = [];
        let activeIndex = -1;
        let debounceTimer = null;
        let lastQuery = '';

        const ensureDropdown = () => {
            if (dropdown && dropdown.parentNode) return dropdown;
            dropdown = document.createElement('div');
            dropdown.className = 'shikola-typeahead fixed z-[9999] bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden';
            dropdown.style.zIndex = '9999';
            dropdown.style.display = 'none';
            dropdown.style.minWidth = '200px';
            document.body.appendChild(dropdown);
            return dropdown;
        };

        const positionDropdown = () => {
            if (!dropdown) return;
            const rect = input.getBoundingClientRect();
            dropdown.style.left = Math.round(rect.left) + 'px';
            dropdown.style.top = Math.round(rect.bottom + 6) + 'px';
            dropdown.style.width = Math.round(rect.width) + 'px';
        };

        const hide = () => {
            if (!dropdown) return;
            dropdown.style.display = 'none';
            dropdown.innerHTML = '';
            activeIndex = -1;
            items = [];
        };

        const show = () => {
            ensureDropdown();
            positionDropdown();
            dropdown.style.display = 'block';
        };

        const getRoleHint = () => {
            try {
                const root = input.closest('[x-data]');
                const data = root && root.__x && root.__x.$data ? root.__x.$data : null;
                if (data && data.composer && data.composer.role) {
                    return String(data.composer.role).toLowerCase();
                }
            } catch (_e) {
            }

            try {
                const sel = document.querySelector('select[x-model="composer.role"]');
                if (sel && sel.value) return String(sel.value).toLowerCase();
            } catch (_e2) {
            }
            return '';
        };

        const setRoleIfPossible = (role) => {
            if (!role) return;
            try {
                const root = input.closest('[x-data]');
                const data = root && root.__x && root.__x.$data ? root.__x.$data : null;
                if (data && data.composer && typeof data.composer === 'object') {
                    data.composer.role = role;
                }
            } catch (_e) {
            }

            try {
                const sel = document.querySelector('select[x-model="composer.role"]');
                if (!sel) return;
                const opt = Array.from(sel.options || []).find(o => String(o.value).toLowerCase() === String(role).toLowerCase());
                if (!opt) return;
                sel.value = opt.value;
                sel.dispatchEvent(new Event('change', { bubbles: true }));
                sel.dispatchEvent(new Event('input', { bubbles: true }));
            } catch (_e2) {
            }
        };

        const render = () => {
            ensureDropdown();
            dropdown.innerHTML = '';
            if (!items.length) {
                hide();
                return;
            }

            const wrapper = document.createElement('div');
            wrapper.className = 'max-h-60 overflow-y-auto';

            items.forEach((it, idx) => {
                const row = document.createElement('button');
                row.type = 'button';
                row.className = 'w-full text-left px-3 py-2 text-xs flex flex-col gap-0.5';
                row.className += (idx === activeIndex) ? ' bg-slate-50' : ' hover:bg-slate-50';
                row.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                });
                row.addEventListener('click', () => selectIndex(idx));

                const title = document.createElement('div');
                title.className = 'font-medium text-slate-700 truncate';
                title.textContent = String(it.name || it.email || it.id || '');

                const meta = document.createElement('div');
                meta.className = 'text-[11px] text-slate-400 truncate';
                const role = String(it.role || 'contact');
                const extra = it.email ? String(it.email) : String(it.id || '');
                meta.textContent = role + (extra ? ' - ' + extra : '');

                row.appendChild(title);
                row.appendChild(meta);
                wrapper.appendChild(row);
            });

            dropdown.appendChild(wrapper);
            show();
        };

        const computeItems = async () => {
            const q = String(input.value || '').trim();
            lastQuery = q;
            if (!q || q.length < 2) {
                hide();
                return;
            }

            if (!window.ShikolaMessagesStore || typeof window.ShikolaMessagesStore.searchRecipients !== 'function') {
                hide();
                return;
            }

            const roleHint = getRoleHint();
            let list = [];
            try {
                list = await window.ShikolaMessagesStore.searchRecipients(q, { role: roleHint, limit: 12 });
            } catch (_e) {
                list = [];
            }

            if (String(input.value || '').trim() !== lastQuery) {
                return;
            }

            items = Array.isArray(list) ? list : [];
            activeIndex = items.length ? 0 : -1;
            render();
        };

        const selectIndex = (idx) => {
            if (!items.length || idx < 0 || idx >= items.length) return;
            const it = items[idx] || {};
            const target = (it.email && String(it.email).indexOf('@') !== -1) ? String(it.email) : String(it.id || '');
            if (!target) return;

            try {
                input.value = target;
                input.dispatchEvent(new Event('input', { bubbles: true }));
            } catch (_e) {
            }

            try {
                if (it.role) {
                    const r = String(it.role).toLowerCase();
                    setRoleIfPossible(r);
                }
            } catch (_e2) {
            }

            hide();
        };

        const schedule = () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                computeItems();
            }, 220);
        };

        input.addEventListener('input', schedule);
        input.addEventListener('focus', schedule);
        input.addEventListener('keydown', (e) => {
            if (!dropdown || dropdown.style.display === 'none') return;
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (!items.length) return;
                activeIndex = Math.min(items.length - 1, activeIndex + 1);
                render();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (!items.length) return;
                activeIndex = Math.max(0, activeIndex - 1);
                render();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                selectIndex(activeIndex);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                hide();
            }
        });

        const onDocClick = (e) => {
            try {
                if (e && e.target === input) return;
                if (dropdown && dropdown.contains(e.target)) return;
                hide();
            } catch (_e) {
            }
        };

        document.addEventListener('click', onDocClick);
        window.addEventListener('resize', () => {
            try {
                if (dropdown && dropdown.style.display !== 'none') positionDropdown();
            } catch (_e) {
            }
        });
        window.addEventListener('scroll', () => {
            try {
                if (dropdown && dropdown.style.display !== 'none') positionDropdown();
            } catch (_e) {
            }
        }, true);
    }

    // Action button functions
    setupActionButtons() {
        // Search functionality
        const searchButtons = document.querySelectorAll('[data-action="search"]');
        searchButtons.forEach(button => {
            button.addEventListener('click', (event) => this.handleSearch(event));
        });

        // Notification buttons
        const notificationButtons = document.querySelectorAll('[data-action="notifications"]');
        notificationButtons.forEach(button => {
            button.addEventListener('click', (event) => this.handleNotifications(event));
        });

        // Profile menu buttons
        const profileButtons = document.querySelectorAll('[data-action="profile-menu"]');
        profileButtons.forEach(button => {
            button.addEventListener('click', (event) => this.toggleProfileMenu(event));
        });

        // Download buttons
        const downloadButtons = document.querySelectorAll('[data-action="download"]');
        downloadButtons.forEach(button => {
            button.addEventListener('click', (event) => this.handleDownload(event));
        });

        // Print buttons
        const printButtons = document.querySelectorAll('[data-action="print"]');
        printButtons.forEach(button => {
            button.addEventListener('click', (event) => this.handlePrint(event));
        });

        // Export buttons
        const exportButtons = document.querySelectorAll('[data-action="export"]');
        exportButtons.forEach(button => {
            button.addEventListener('click', (event) => this.handleExport(event));
        });
    }

    // Form button functions
    setupFormButtons() {
        // Submit buttons
        const submitButtons = document.querySelectorAll('[data-action="submit"]');
        submitButtons.forEach(button => {
            button.addEventListener('click', (event) => this.handleFormSubmit(event));
        });

        // Reset buttons
        const resetButtons = document.querySelectorAll('[data-action="reset"]');
        resetButtons.forEach(button => {
            button.addEventListener('click', (event) => this.handleFormReset(event));
        });

        // Cancel buttons
        const cancelButtons = document.querySelectorAll('[data-action="cancel"]');
        cancelButtons.forEach(button => {
            button.addEventListener('click', (event) => this.handleCancel(event));
        });
    }

    // Modal button functions
    setupModalButtons() {
        // Open modal buttons
        const openModalButtons = document.querySelectorAll('[data-action="open-modal"]');
        openModalButtons.forEach(button => {
            button.addEventListener('click', (event) => this.handleOpenModal(event));
        });

        // Close modal buttons
        const closeModalButtons = document.querySelectorAll('[data-action="close-modal"]');
        closeModalButtons.forEach(button => {
            button.addEventListener('click', (event) => this.handleCloseModal(event));
        });

        // Confirm action buttons
        const confirmButtons = document.querySelectorAll('[data-action="confirm"]');
        confirmButtons.forEach(button => {
            button.addEventListener('click', (event) => this.handleConfirm(event));
        });
    }

    // Utility button functions
    setupUtilityButtons() {
        // Theme toggle buttons
        const themeButtons = document.querySelectorAll('[data-action="theme-toggle"]');
        themeButtons.forEach(button => {
            button.addEventListener('click', (event) => this.handleThemeToggle(event));
        });

        // Fullscreen buttons
        const fullscreenButtons = document.querySelectorAll('[data-action="fullscreen"]');
        fullscreenButtons.forEach(button => {
            button.addEventListener('click', (event) => this.handleFullscreen(event));
        });

        // Refresh buttons
        const refreshButtons = document.querySelectorAll('[data-action="refresh"]');
        refreshButtons.forEach(button => {
            button.addEventListener('click', (event) => this.handleRefresh(event));
        });
    }

    // Payslip button functions
    setupPayslipButtons() {
        // Generate payslip buttons
        const generatePayslipButtons = document.querySelectorAll('[data-action="generate-payslip"]');
        generatePayslipButtons.forEach(button => {
            button.addEventListener('click', (event) => this.generatePayslip(event));
        });

        // Print payslip buttons
        const printPayslipButtons = document.querySelectorAll('[data-action="print-payslip"]');
        printPayslipButtons.forEach(button => {
            button.addEventListener('click', (event) => this.printPayslip(event));
        });

        // Download payslip buttons
        const downloadPayslipButtons = document.querySelectorAll('[data-action="download-payslip"]');
        downloadPayslipButtons.forEach(button => {
            button.addEventListener('click', (event) => this.downloadPayslip(event));
        });
    }

    // Button action implementations
    toggleMobileMenu(event) {
        event.preventDefault();
        const sidebar = document.querySelector('[data-sidebar]');
        if (sidebar) {
            sidebar.classList.toggle('open');
        }
        
        // Fallback for Alpine.js menus
        const alpineMenu = document.querySelector('[x-data*="sidebarOpen"]');
        if (alpineMenu && alpineMenu._x_dataStack) {
            const data = alpineMenu._x_dataStack[0];
            if (data.sidebarOpen !== undefined) {
                data.sidebarOpen = !data.sidebarOpen;
            }
        }
    }

    async handleLogout(event) {
        event.preventDefault();
        
        // Use shared auth system if available
        if (window.shikolaAuth) {
            window.shikolaAuth.logout();
        } else {
            // Fallback logout
            if (confirm('Are you sure you want to logout?')) {
                await this.secureLogoutFallback();
                // Skip redirect for super-admin console
                if (!window.location.pathname.includes('super-admin')) {
                    window.location.href = '../frontend/public/index.html';
                }
            }
        }
    }

    handlePortalNavigation(event) {
        event.preventDefault();
        const portal = event.currentTarget.dataset.portal;
        
        if (window.shikolaAuth) {
            window.shikolaAuth.switchPortal(portal);
        } else {
            // Fallback navigation
            window.location.href = `../${portal}/dashboard.html`;
        }
    }

    handleSearch(event) {
        event.preventDefault();
        const searchInput = document.querySelector('#search-input, [data-search-input]');
        if (searchInput) {
            searchInput.focus();
            searchInput.select();
        } else {
            this.showNotification('Search functionality not available', 'info');
        }
    }

    handleNotifications(event) {
        event.preventDefault();
        this.showNotification('You have 3 new notifications', 'info');
        
        // Toggle notifications panel if exists
        const notificationsPanel = document.querySelector('[data-notifications-panel]');
        if (notificationsPanel) {
            notificationsPanel.classList.toggle('hidden');
        }
    }

    toggleProfileMenu(event) {
        event.preventDefault();
        const profileMenu = document.querySelector('[data-profile-menu]');
        if (profileMenu) {
            profileMenu.classList.toggle('hidden');
        }
    }

    handleDownload(event) {
        event.preventDefault();
        const target = event.currentTarget.dataset.target;
        if (target) {
            // Simulate download
            this.showNotification(`Downloading ${target}...`, 'success');
            setTimeout(() => {
                this.showNotification(`${target} downloaded successfully!`, 'success');
            }, 2000);
        } else {
            this.showNotification('Download started', 'success');
        }
    }

    handlePrint(event) {
        event.preventDefault();
        window.print();
    }

    handleExport(event) {
        event.preventDefault();
        const defaultFormat = event.currentTarget.dataset.format || 'csv';
        let format = defaultFormat;
        const choice = window.prompt('Export format (csv or pdf):', defaultFormat);
        if (choice && typeof choice === 'string') {
            const lower = choice.toLowerCase();
            if (lower === 'csv' || lower === 'pdf') {
                format = lower;
            }
        }
        if (window.shikolaButtons) {
            window.shikolaButtons.showNotification(`Exporting as ${format.toUpperCase()}...`, 'info');
        }
        setTimeout(() => {
            if (window.shikolaButtons) {
                window.shikolaButtons.showNotification('Export completed successfully!', 'success');
            }
        }, 2000);
    }

    handleFormSubmit(event) {
        event.preventDefault();
        const form = event.currentTarget.closest('form');
        if (form) {
            // Basic form validation
            const requiredFields = form.querySelectorAll('[required]');
            let isValid = true;
            
            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    field.classList.add('border-red-500');
                    isValid = false;
                } else {
                    field.classList.remove('border-red-500');
                }
            });
            
            if (isValid) {
                this.showNotification('Form submitted successfully!', 'success');
                form.reset();
            } else {
                this.showNotification('Please fill in all required fields', 'error');
            }
        }
    }

    handleFormReset(event) {
        event.preventDefault();
        const form = event.currentTarget.closest('form');
        if (form) {
            form.reset();
            // Clear validation styles
            form.querySelectorAll('.border-red-500').forEach(field => {
                field.classList.remove('border-red-500');
            });
            this.showNotification('Form reset', 'info');
        }
    }

    handleCancel(event) {
        event.preventDefault();
        const modal = event.currentTarget.closest('[data-modal]');
        if (modal) {
            modal.classList.add('hidden');
        } else {
            // Go back if no modal
            window.history.back();
        }
    }

    handleOpenModal(event) {
        event.preventDefault();
        const modalId = event.currentTarget.dataset.modal;
        const modal = document.querySelector(`[data-modal-id="${modalId}"]`);
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }
    }

    handleCloseModal(event) {
        event.preventDefault();
        const modal = event.currentTarget.closest('[data-modal]');
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
    }

    handleConfirm(event) {
        event.preventDefault();
        const action = event.currentTarget.dataset.confirmAction;
        const message = event.currentTarget.dataset.confirmMessage || 'Are you sure?';
        
        if (confirm(message)) {
            this.showNotification('Action confirmed', 'success');
            // Execute the confirmed action
            if (action && typeof this[action] === 'function') {
                this[action]();
            }
        }
    }

    handleThemeToggle(event) {
        event.preventDefault();
        if (window.ShikolaTheme) {
            const effective = this.getEffectiveThemeMode();
            const newTheme = effective === 'dark' ? 'light' : 'dark';
            window.ShikolaTheme.setTheme(newTheme);
            this.showNotification(`Theme changed to ${newTheme}`, 'info');
        }
    }

    handleFullscreen(event) {
        event.preventDefault();
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            this.showNotification('Entered fullscreen mode', 'info');
        } else {
            document.exitFullscreen();
            this.showNotification('Exited fullscreen mode', 'info');
        }
    }

    handleRefresh(event) {
        event.preventDefault();
        this.showNotification('Refreshing page...', 'info');
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    }

    generatePayslip(event) {
        event.preventDefault();
        const staffSelect = document.querySelector('#payslip-staff');
        const monthSelect = document.querySelector('#payslip-month');
        const yearSelect = document.querySelector('#payslip-year');
        
        // Validate inputs
        if (staffSelect.value === 'Select staff member' || 
            monthSelect.value === 'Month' || 
            yearSelect.value === 'Year') {
            alert('Please select all required fields');
            return;
        }
        
        // Get staff data from backend API (requires database connection)
        // This functionality requires real staff data from the database
        alert('Staff payslip generation requires backend database connection. Please ensure the API is properly configured.');
        return;
    }

    printPayslip(event) {
        event.preventDefault();
        const payslip = document.querySelector('#payslip-template');
        const win = window.open('', '', 'width=800,height=900');
        win.document.write('<html><head><title>Payslip</title>');
        win.document.write('<link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">');
        win.document.write('<style>body { font-family: Arial, sans-serif; margin: 20px; }</style>');
        win.document.write('</head><body>');
        win.document.write(payslip.innerHTML);
        win.document.write('</body></html>');
        win.document.close();
        win.focus();
        setTimeout(() => win.print(), 500);
    }

    downloadPayslip(event) {
        event.preventDefault();
        alert('PDF generation would be implemented with a library like jsPDF or PDFKit');
        // In production: Implement actual PDF generation here
    }

    // Utility functions
    showNotification(message, type = 'info', notificationEntry = null) {
        // Log notification globally so other pages/components (like the reports bell)
        // can surface a recent activity feed.
        try {
            const entry = notificationEntry || {
                id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
                message,
                type: type || 'info',
                time: new Date().toLocaleTimeString()
            };

            if (!Array.isArray(window.shikolaNotificationLog)) {
                window.shikolaNotificationLog = [];
                try {
                    const stored = localStorage.getItem('shikolaNotificationLog');
                    if (stored) {
                        const parsed = JSON.parse(stored);
                        if (Array.isArray(parsed)) {
                            window.shikolaNotificationLog = parsed;
                        }
                    }
                } catch (e) {
                    // Ignore storage errors
                }
            }

            window.shikolaNotificationLog.unshift(entry);
            window.shikolaNotificationLog = window.shikolaNotificationLog.slice(0, 20);

            try {
                localStorage.setItem('shikolaNotificationLog', JSON.stringify(window.shikolaNotificationLog));
            } catch (e) {
                // Ignore storage errors
            }

            // Prevent infinite recursion - don't dispatch if this was called from ../shared-assets/js/shared-notifications
            if (!entry._fromSharedNotifications) {
                window.dispatchEvent(new CustomEvent('shikola:notification', { detail: entry }));
            }
        } catch (e) {
            // Swallow logging errors so toasts still show
        }

        // Create notification element if it doesn't exist
        let notificationContainer = document.querySelector('[data-notifications-container]');
        
        if (!notificationContainer) {
            notificationContainer = document.createElement('div');
            notificationContainer.setAttribute('data-notifications-container', '');
            notificationContainer.className = 'fixed top-4 right-4 z-50 space-y-2';
            document.body.appendChild(notificationContainer);
        }
        
        const notification = document.createElement('div');
        notification.className = `p-4 rounded-lg shadow-lg transform transition-all duration-300 translate-x-full`;
        
        // Style based on type
        const styles = {
            success: 'bg-green-500 text-white',
            error: 'bg-red-500 text-white',
            warning: 'bg-yellow-500 text-white',
            info: 'bg-blue-500 text-white'
        };
        
        notification.className += ` ${styles[type] || styles.info}`;
        notification.textContent = message;
        
        notificationContainer.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
            notification.classList.add('translate-x-0');
        }, 100);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }

    // Specialized functions for specific portals
    handleAttendance(action) {
        this.showNotification(`Attendance ${action} completed`, 'success');
    }

    handleGradeSubmission() {
        this.showNotification('Grades submitted successfully', 'success');
    }

    handleAssignmentSubmission() {
        this.showNotification('Assignment submitted successfully', 'success');
    }

    handleMessageSend() {
        this.showNotification('Message sent successfully', 'success');
    }

    handleFeePayment() {
        this.showNotification('Payment processed successfully', 'success');
    }

    getAuthToken() {
        try {
            return localStorage.getItem('authToken') || localStorage.getItem('shikola_token') || null;
        } catch (e) {
            return null;
        }
    }

    apiBase() {
        return window.SHIKOLA_API_BASE || '/api';
    }

    startServerNotificationSync() {
        if (this._serverNotificationSyncStarted) return;
        this._serverNotificationSyncStarted = true;

        try {
            if (String(window.location.pathname || '').indexOf('/frontend/public/') !== -1) return;
        } catch (e) {}

        const poll = async () => {
            const token = this.getAuthToken();
            if (!token) return;

            let seen = {};
            try {
                const raw = localStorage.getItem('shikola_seen_server_notifications_v1');
                if (raw) {
                    const parsed = JSON.parse(raw);
                    if (parsed && typeof parsed === 'object') seen = parsed;
                }
            } catch (e) {
                seen = {};
            }

            try {
                // Check if user is super admin and use appropriate endpoint
                const userRole = sessionStorage.getItem('userRole') || '';
                const isSuperAdmin = userRole === 'super_admin';
                const notificationsEndpoint = isSuperAdmin ? '/api/notifications' : '/api/admin/notifications';
                
                const res = await fetch(this.apiBase() + notificationsEndpoint + '?unreadOnly=true&limit=20&offset=0', {
                    headers: {
                        'Authorization': 'Bearer ' + token,
                        'Accept': 'application/json'
                    }
                });

                if (res.status === 401 || res.status === 403) {
                    return;
                }

                if (!res.ok) {
                    return;
                }

                const payload = await res.json();
                const list = payload && Array.isArray(payload.data) ? payload.data : [];

                for (const item of list) {
                    if (!item || !item.id) continue;
                    if (seen[item.id]) continue;

                    const title = item.title || 'Notification';
                    const message = item.message || '';
                    const type = item.type || 'info';
                    this.showNotification(title + (message ? ': ' + message : ''), type);

                    try {
                        // Use appropriate endpoint for marking notifications as read
                        const markReadEndpoint = isSuperAdmin ? '/api/notifications/' + encodeURIComponent(item.id) + '/read' : '/api/admin/notifications/' + encodeURIComponent(item.id) + '/read';
                        
                        await fetch(this.apiBase() + markReadEndpoint, {
                            method: 'POST',
                            headers: {
                                'Authorization': 'Bearer ' + token,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({})
                        });
                    } catch (e) {}

                    seen[item.id] = Date.now();
                }

                try {
                    localStorage.setItem('shikola_seen_server_notifications_v1', JSON.stringify(seen));
                } catch (e) {}
            } catch (e) {
            }
        };

        poll();
        this._serverNotificationSyncInterval = setInterval(poll, 20000);
    }

    handleClassCreation() {
        this.showNotification('Class created successfully', 'success');
    }

    handleUserCreation() {
        this.showNotification('User created successfully', 'success');
    }

    handleReportGeneration() {
        this.showNotification('Report generated successfully', 'success');
    }
}

// Initialize button functions
window.shikolaButtons = new ShikolaButtonFunctions();

// Make functions globally available for inline event handlers
window.showNotification = (message, type) => window.shikolaButtons.showNotification(message, type);
window.handleLogout = () => window.shikolaButtons.handleLogout(new Event('click'));
window.handleDownload = (target) => window.shikolaButtons.handleDownload(new Event('click'), target);
window.handlePrint = () => window.shikolaButtons.handlePrint(new Event('click'));
