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
/**
 * School UI Customization Module
 * Handles tenant-level UI customization including themes, branding, and layout
 */
(function (window) {
    'use strict';

    // ─────────────────────────────────────────────────────────────────────────────
    // State
    // ─────────────────────────────────────────────────────────────────────────────
    var CUSTOMIZATION_STORAGE_KEY = 'shikola_school_ui_customization';
    var state = {
        loading: false,
        customization: null,
        isEditing: false,
        originalCustomization: null
    };

    // ─────────────────────────────────────────────────────────────────────────────
    // Default Settings
    // ─────────────────────────────────────────────────────────────────────────────
    function getDefaultCustomization() {
        return {
            brandColors: {
                primary: '#1e40af',
                secondary: '#64748b',
                accent: '#f59e0b',
                background: '#ffffff',
                text: '#1f2937',
                border: '#e2e8f0',
                success: '#10b981',
                warning: '#f59e0b',
                error: '#ef4444'
            },
            customTheme: {
                borderRadius: '0.375rem',
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: '14px',
                headerHeight: '64px',
                sidebarWidth: '256px'
            },
            customCSS: '',
            layoutConfig: {
                headerStyle: 'default', // default, compact, expanded
                sidebarStyle: 'default', // default, icons-only, hidden
                footerEnabled: true,
                breadcrumbsEnabled: true
            }
        };
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Customization Management
    // ─────────────────────────────────────────────────────────────────────────────
    async function loadCustomization() {
        state.loading = true;

        try {
            // Try to load from API first
            if (window.ShikolaAPI && typeof window.ShikolaAPI.get === 'function') {
                var resp = await window.ShikolaAPI.get('/api/school/ui-customization');
                var body = resp && resp.data ? resp.data : null;
                if (resp && resp.success && body && body.success && body.data) {
                    state.customization = mergeWithDefaults(body.data);
                    cacheCustomization(state.customization);
                    applyCustomization(state.customization);
                    return state.customization;
                }
            }
        } catch (err) {
            console.warn('[school-ui-customization.js] Failed to load customization from API:', err);
        }

        // Fallback to cached customization
        var cachedCustomization = readCachedCustomization();
        if (cachedCustomization) {
            state.customization = cachedCustomization;
            applyCustomization(state.customization);
            return state.customization;
        }

        // Fallback to default customization
        state.customization = getDefaultCustomization();
        cacheCustomization(state.customization);
        applyCustomization(state.customization);
        return state.customization;
    }

    async function saveCustomization(customization) {
        if (!customization || typeof customization !== 'object') {
            throw new Error('Invalid customization object');
        }

        state.customization = mergeWithDefaults(customization);
        cacheCustomization(state.customization);
        applyCustomization(state.customization);

        // Try to save to API
        if (window.ShikolaAPI && typeof window.ShikolaAPI.patch === 'function') {
            try {
                var resp = await window.ShikolaAPI.patch('/api/school/ui-customization', {
                    customTheme: state.customization.customTheme,
                    customCSS: state.customization.customCSS,
                    layoutConfig: state.customization.layoutConfig,
                    brandColors: state.customization.brandColors
                });

                var body = resp && resp.data ? resp.data : null;
                if (!(resp && resp.success && body && body.success)) {
                    throw new Error(body && body.error ? body.error : 'Failed to save customization');
                }

                return body.data;
            } catch (err) {
                console.warn('[school-ui-customization.js] Failed to save customization to API:', err);
                // Customization is still cached locally
            }
        }

        return state.customization;
    }

    function mergeWithDefaults(customization) {
        var defaults = getDefaultCustomization();
        return {
            brandColors: Object.assign({}, defaults.brandColors, customization.brandColors || {}),
            customTheme: Object.assign({}, defaults.customTheme, customization.customTheme || {}),
            customCSS: customization.customCSS || defaults.customCSS,
            layoutConfig: Object.assign({}, defaults.layoutConfig, customization.layoutConfig || {})
        };
    }

    function cacheCustomization(customization) {
        try {
            localStorage.setItem(CUSTOMIZATION_STORAGE_KEY, JSON.stringify(customization));
        } catch (e) {
            console.warn('[school-ui-customization.js] Failed to cache customization:', e);
        }
    }

    function readCachedCustomization() {
        try {
            var raw = localStorage.getItem(CUSTOMIZATION_STORAGE_KEY);
            if (!raw) return null;
            var parsed = JSON.parse(raw);
            return typeof parsed === 'object' ? parsed : null;
        } catch (e) {
            return null;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Application Functions
    // ─────────────────────────────────────────────────────────────────────────────
    function applyCustomization(customization) {
        if (!customization) return;

        applyBrandColors(customization.brandColors);
        applyCustomTheme(customization.customTheme);
        applyLayoutConfig(customization.layoutConfig);
        applyCustomCSS(customization.customCSS);

        // Dispatch event for other modules to react
        window.dispatchEvent(new CustomEvent('shikola:school-ui-updated', {
            detail: customization
        }));
    }

    function applyBrandColors(colors) {
        var root = document.documentElement;
        if (!root) return;

        // Apply CSS custom properties
        root.style.setProperty('--shk-primary', colors.primary || '#1e40af');
        root.style.setProperty('--shk-secondary', colors.secondary || '#64748b');
        root.style.setProperty('--shk-accent', colors.accent || '#f59e0b');
        root.style.setProperty('--shk-background', colors.background || '#ffffff');
        root.style.setProperty('--shk-text', colors.text || '#1f2937');
        root.style.setProperty('--shk-border', colors.border || '#e2e8f0');
        root.style.setProperty('--shk-success', colors.success || '#10b981');
        root.style.setProperty('--shk-warning', colors.warning || '#f59e0b');
        root.style.setProperty('--shk-error', colors.error || '#ef4444');

        // Update existing elements with data attributes
        updateElementsWithDataAttributes('[data-school-color]', colors);
    }

    function applyCustomTheme(theme) {
        var root = document.documentElement;
        if (!root) return;

        // Apply theme CSS custom properties
        root.style.setProperty('--shk-border-radius', theme.borderRadius || '0.375rem');
        root.style.setProperty('--shk-font-family', theme.fontFamily || 'Inter, system-ui, sans-serif');
        root.style.setProperty('--shk-font-size', theme.fontSize || '14px');
        root.style.setProperty('--shk-header-height', theme.headerHeight || '64px');
        root.style.setProperty('--shk-sidebar-width', theme.sidebarWidth || '256px');

        // Apply font family to body
        if (theme.fontFamily) {
            document.body.style.fontFamily = theme.fontFamily;
        }
    }

    function applyLayoutConfig(config) {
        // Update layout classes and attributes
        var container = document.querySelector('[data-layout-container]');
        if (!container) return;

        // Header style
        container.setAttribute('data-header-style', config.headerStyle || 'default');
        
        // Sidebar style
        container.setAttribute('data-sidebar-style', config.sidebarStyle || 'default');
        
        // Footer visibility
        var footer = document.querySelector('[data-layout-footer]');
        if (footer) {
            footer.style.display = config.footerEnabled !== false ? 'block' : 'none';
        }
        
        // Breadcrumbs visibility
        var breadcrumbs = document.querySelector('[data-layout-breadcrumbs]');
        if (breadcrumbs) {
            breadcrumbs.style.display = config.breadcrumbsEnabled !== false ? 'block' : 'none';
        }
    }

    function applyCustomCSS(css) {
        // Remove existing custom CSS
        var existingStyle = document.getElementById('shikola-custom-css');
        if (existingStyle) {
            existingStyle.remove();
        }

        // Add new custom CSS if provided
        if (css && css.trim()) {
            var style = document.createElement('style');
            style.id = 'shikola-custom-css';
            style.textContent = css;
            document.head.appendChild(style);
        }
    }

    function updateElementsWithDataAttributes(selector, data) {
        var elements = document.querySelectorAll(selector);
        elements.forEach(function (element) {
            var dataAttr = element.getAttribute('data-school-color');
            if (dataAttr && data[dataAttr]) {
                if (element.tagName === 'IMG' && dataAttr === 'logo') {
                    // Handle logo updates
                    element.src = data[dataAttr];
                } else if (element.tagName === 'A' && dataAttr === 'website') {
                    // Handle website links
                    element.href = data[dataAttr];
                } else {
                    // Handle text content
                    element.textContent = data[dataAttr];
                }
            }
        });
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // UI Management
    // ─────────────────────────────────────────────────────────────────────────────
    function renderCustomizationForm() {
        var form = document.querySelector('[data-ui-customization-form]');
        if (!form) return;

        if (!state.customization) return;

        // Brand colors
        renderColorInputs(form, 'brandColors', state.customization.brandColors);
        
        // Custom theme
        renderThemeInputs(form, 'customTheme', state.customization.customTheme);
        
        // Layout config
        renderLayoutInputs(form, 'layoutConfig', state.customization.layoutConfig);
        
        // Custom CSS
        renderCSSInput(form, 'customCSS', state.customization.customCSS);
    }

    function renderColorInputs(form, prefix, colors) {
        Object.keys(colors).forEach(function (key) {
            var input = form.querySelector('[name="' + prefix + '.' + key + '"]');
            if (input && input.type === 'color') {
                input.value = colors[key];
            }
        });
    }

    function renderThemeInputs(form, prefix, theme) {
        Object.keys(theme).forEach(function (key) {
            var input = form.querySelector('[name="' + prefix + '.' + key + '"]');
            if (input) {
                if (input.type === 'text' || input.type === 'number') {
                    input.value = theme[key];
                } else if (input.type === 'select-one') {
                    input.value = theme[key];
                }
            }
        });
    }

    function renderLayoutInputs(form, prefix, config) {
        Object.keys(config).forEach(function (key) {
            var input = form.querySelector('[name="' + prefix + '.' + key + '"]');
            if (input) {
                if (input.type === 'checkbox') {
                    input.checked = config[key];
                } else if (input.type === 'select-one') {
                    input.value = config[key];
                }
            }
        });
    }

    function renderCSSInput(form, prefix, css) {
        var textarea = form.querySelector('[name="' + prefix + '"]');
        if (textarea && textarea.tagName === 'TEXTAREA') {
            textarea.value = css || '';
        }
    }

    function collectFormData(form) {
        var formData = {};
        var inputs = form.querySelectorAll('input, select, textarea');

        inputs.forEach(function (input) {
            var name = input.name;
            if (!name) return;

            var value = input.type === 'checkbox' ? input.checked : input.value;
            
            // Handle nested properties (e.g., "brandColors.primary")
            var parts = name.split('.');
            var current = formData;
            
            for (var i = 0; i < parts.length - 1; i++) {
                if (!current[parts[i]]) {
                    current[parts[i]] = {};
                }
                current = current[parts[i]];
            }
            
            current[parts[parts.length - 1]] = value;
        });

        return formData;
    }

    function enableEditMode() {
        state.isEditing = true;
        state.originalCustomization = JSON.parse(JSON.stringify(state.customization));
        
        var editBtn = document.querySelector('[data-action="edit-ui-customization"]');
        if (editBtn) {
            editBtn.textContent = 'Cancel';
            editBtn.setAttribute('data-action', 'cancel-ui-customization');
        }

        var saveBtn = document.querySelector('[data-action="save-ui-customization"]');
        if (saveBtn) {
            saveBtn.classList.remove('hidden');
        }

        var form = document.querySelector('[data-ui-customization-form]');
        if (form) {
            form.classList.remove('hidden');
        }

        renderCustomizationForm();
    }

    function disableEditMode() {
        state.isEditing = false;
        
        var editBtn = document.querySelector('[data-action="cancel-ui-customization"]');
        if (editBtn) {
            editBtn.textContent = 'Customize Appearance';
            editBtn.setAttribute('data-action', 'edit-ui-customization');
        }

        var saveBtn = document.querySelector('[data-action="save-ui-customization"]');
        if (saveBtn) {
            saveBtn.classList.add('hidden');
        }

        var form = document.querySelector('[data-ui-customization-form]');
        if (form) {
            form.classList.add('hidden');
        }
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Event Handlers
    // ─────────────────────────────────────────────────────────────────────────────
    function setupEventListeners() {
        var editBtn = document.querySelector('[data-action="edit-ui-customization"]');
        var cancelBtn = document.querySelector('[data-action="cancel-ui-customization"]');
        var saveBtn = document.querySelector('[data-action="save-ui-customization"]');
        var resetBtn = document.querySelector('[data-action="reset-ui-customization"]');

        if (editBtn) {
            editBtn.addEventListener('click', enableEditMode);
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', function () {
                state.customization = JSON.parse(JSON.stringify(state.originalCustomization));
                applyCustomization(state.customization);
                disableEditMode();
            });
        }

        if (saveBtn) {
            saveBtn.addEventListener('click', async function () {
                var form = document.querySelector('[data-ui-customization-form]');
                if (!form) return;

                var formData = collectFormData(form);
                
                try {
                    await saveCustomization(formData);
                    disableEditMode();
                    showStatus('Customization saved successfully', false);
                } catch (err) {
                    console.error('[school-ui-customization.js] Save error:', err);
                    showStatus('Error: ' + (err.message || 'Failed to save'), true);
                }
            });
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', async function () {
                try {
                    await saveCustomization(getDefaultCustomization());
                    showStatus('Customization reset to default', false);
                } catch (err) {
                    console.error('[school-ui-customization.js] Reset error:', err);
                    showStatus('Error: ' + (err.message || 'Failed to reset'), true);
                }
            });
        }
    }

    function showStatus(message, isError) {
        var statusEl = document.querySelector('[data-ui-customization-status]');
        if (!statusEl) {
            console.warn('[school-ui-customization.js] Status element not found');
            return;
        }

        // Clear any existing timeout
        if (statusEl._hideTimeout) {
            clearTimeout(statusEl._hideTimeout);
        }

        statusEl.textContent = message || '';
        statusEl.classList.remove('hidden', 'text-red-600', 'text-emerald-600');
        statusEl.classList.add(isError ? 'text-red-600' : 'text-emerald-600');

        // Auto-hide after 3 seconds
        statusEl._hideTimeout = setTimeout(function () {
            statusEl.classList.add('hidden');
            statusEl._hideTimeout = null;
        }, 3000);
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Initialize
    // ─────────────────────────────────────────────────────────────────────────────
    async function init() {
        await loadCustomization();
        setupEventListeners();
    }

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Export for debugging and external use
    window.ShikolaSchoolUICustomization = {
        state: state,
        loadCustomization: loadCustomization,
        saveCustomization: saveCustomization,
        applyCustomization: applyCustomization,
        enableEditMode: enableEditMode,
        disableEditMode: disableEditMode,
        getDefaultCustomization: getDefaultCustomization
    };

})(window);
