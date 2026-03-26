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
 * Dashboard Layout Customization Module
 * Handles user dashboard layout management with drag-and-drop functionality
 */
(function (window) {
    'use strict';

    // ─────────────────────────────────────────────────────────────────────────────
    // State
    // ─────────────────────────────────────────────────────────────────────────────
    var LAYOUT_STORAGE_KEY = 'shikola_dashboard_layout_v1';
    var state = {
        loading: false,
        layout: [],
        isEditing: false,
        originalLayout: []
    };

    // ─────────────────────────────────────────────────────────────────────────────
    // Layout Management
    // ─────────────────────────────────────────────────────────────────────────────
    function getDefaultLayout(role) {
        var layouts = {
            pupil: [
                { id: 'overview', title: 'Overview', position: { x: 0, y: 0, w: 6, h: 3 }, visible: true, minW: 3, minH: 2 },
                { id: 'assignments', title: 'Assignments', position: { x: 6, y: 0, w: 6, h: 3 }, visible: true, minW: 3, minH: 2 },
                { id: 'grades', title: 'Grades', position: { x: 0, y: 3, w: 4, h: 3 }, visible: true, minW: 3, minH: 2 },
                { id: 'attendance', title: 'Attendance', position: { x: 4, y: 3, w: 4, h: 3 }, visible: true, minW: 3, minH: 2 },
                { id: 'timetable', title: 'Timetable', position: { x: 8, y: 3, w: 4, h: 3 }, visible: true, minW: 3, minH: 2 },
                { id: 'announcements', title: 'Announcements', position: { x: 0, y: 6, w: 12, h: 2 }, visible: true, minW: 6, minH: 2 }
            ],
            teacher: [
                { id: 'overview', title: 'Overview', position: { x: 0, y: 0, w: 6, h: 3 }, visible: true, minW: 3, minH: 2 },
                { id: 'classes', title: 'Classes', position: { x: 6, y: 0, w: 6, h: 3 }, visible: true, minW: 3, minH: 2 },
                { id: 'attendance', title: 'Attendance', position: { x: 0, y: 3, w: 4, h: 3 }, visible: true, minW: 3, minH: 2 },
                { id: 'assignments', title: 'Assignments', position: { x: 4, y: 3, w: 4, h: 3 }, visible: true, minW: 3, minH: 2 },
                { id: 'grades', title: 'Grades', position: { x: 8, y: 3, w: 4, h: 3 }, visible: true, minW: 3, minH: 2 },
                { id: 'messages', title: 'Messages', position: { x: 0, y: 6, w: 6, h: 2 }, visible: true, minW: 3, minH: 2 },
                { id: 'schedule', title: 'Schedule', position: { x: 6, y: 6, w: 6, h: 2 }, visible: true, minW: 3, minH: 2 }
            ],
            admin: [
                { id: 'overview', title: 'Overview', position: { x: 0, y: 0, w: 6, h: 3 }, visible: true, minW: 3, minH: 2 },
                { id: 'statistics', title: 'Statistics', position: { x: 6, y: 0, w: 6, h: 3 }, visible: true, minW: 3, minH: 2 },
                { id: 'students', title: 'Students', position: { x: 0, y: 3, w: 4, h: 3 }, visible: true, minW: 3, minH: 2 },
                { id: 'teachers', title: 'Teachers', position: { x: 4, y: 3, w: 4, h: 3 }, visible: true, minW: 3, minH: 2 },
                { id: 'classes', title: 'Classes', position: { x: 8, y: 3, w: 4, h: 3 }, visible: true, minW: 3, minH: 2 },
                { id: 'finance', title: 'Finance', position: { x: 0, y: 6, w: 6, h: 2 }, visible: true, minW: 3, minH: 2 },
                { id: 'reports', title: 'Reports', position: { x: 6, y: 6, w: 6, h: 2 }, visible: true, minW: 3, minH: 2 }
            ]
        };

        return layouts[role] || layouts.pupil;
    }

    async function loadLayout() {
        state.loading = true;

        try {
            // Try to load from API first
            if (window.ShikolaAPI && typeof window.ShikolaAPI.get === 'function') {
                var resp = await window.ShikolaAPI.get('/api/profile/dashboard-layout');
                var body = resp && resp.data ? resp.data : null;
                if (resp && resp.success && body && body.success && body.data) {
                    state.layout = body.data;
                    cacheLayout(state.layout);
                    return state.layout;
                }
            }
        } catch (err) {
            console.warn('[dashboard-layout.js] Failed to load layout from API:', err);
        }

        // Fallback to cached layout
        var cachedLayout = readCachedLayout();
        if (cachedLayout) {
            state.layout = cachedLayout;
            return state.layout;
        }

        // Fallback to default layout
        var user = null;
        try {
            if (window.shikolaAuth && typeof window.shikolaAuth.getCurrentUser === 'function') {
                user = window.shikolaAuth.getCurrentUser();
            }
        } catch (e) {}

        var role = user ? user.role : 'pupil';
        state.layout = getDefaultLayout(role);
        cacheLayout(state.layout);
        return state.layout;
    }

    async function saveLayout(layout) {
        if (!Array.isArray(layout)) {
            throw new Error('Layout must be an array');
        }

        state.layout = layout;
        cacheLayout(layout);

        // Try to save to API
        if (window.ShikolaAPI && typeof window.ShikolaAPI.patch === 'function') {
            try {
                var resp = await window.ShikolaAPI.patch('/api/profile/dashboard-layout', {
                    layout: layout
                });

                var body = resp && resp.data ? resp.data : null;
                if (!(resp && resp.success && body && body.success)) {
                    throw new Error(body && body.error ? body.error : 'Failed to save layout');
                }

                return body.data;
            } catch (err) {
                console.warn('[dashboard-layout.js] Failed to save layout to API:', err);
                // Layout is still cached locally
            }
        }

        return layout;
    }

    function cacheLayout(layout) {
        try {
            localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layout));
        } catch (e) {
            console.warn('[dashboard-layout.js] Failed to cache layout:', e);
        }
    }

    function readCachedLayout() {
        try {
            var raw = localStorage.getItem(LAYOUT_STORAGE_KEY);
            if (!raw) return null;
            var parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : null;
        } catch (e) {
            return null;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // UI Management
    // ─────────────────────────────────────────────────────────────────────────────
    function renderLayout(layout) {
        var container = document.querySelector('[data-dashboard-container]');
        if (!container) return;

        // Clear existing widgets
        var existingWidgets = container.querySelectorAll('[data-dashboard-widget]');
        existingWidgets.forEach(function (widget) {
            widget.remove();
        });

        // Render widgets
        layout.forEach(function (widget) {
            if (!widget.visible) return;

            var widgetEl = createWidgetElement(widget);
            container.appendChild(widgetEl);
        });

        // Initialize drag and drop if in edit mode
        if (state.isEditing) {
            initializeDragAndDrop();
        }
    }

    function createWidgetElement(widget) {
        var div = document.createElement('div');
        div.setAttribute('data-dashboard-widget', widget.id);
        div.className = 'dashboard-widget bg-white rounded-lg shadow-sm border border-slate-200 p-4';
        div.style.cssText = [
            'grid-column: ' + (widget.position.x + 1) + ' / span ' + widget.position.w,
            'grid-row: ' + (widget.position.y + 1) + ' / span ' + widget.position.h,
            'min-height: ' + (widget.position.h * 80) + 'px'
        ].join('; ');

        var header = document.createElement('div');
        header.className = 'flex items-center justify-between mb-3';
        
        var title = document.createElement('h3');
        title.className = 'text-sm font-medium text-slate-700';
        title.textContent = widget.title;
        header.appendChild(title);

        if (state.isEditing) {
            var controls = document.createElement('div');
            controls.className = 'flex gap-2';

            var toggleBtn = document.createElement('button');
            toggleBtn.className = 'text-slate-400 hover:text-slate-600';
            toggleBtn.innerHTML = widget.visible ? 
                '<i class="fas fa-eye text-xs"></i>' : 
                '<i class="fas fa-eye-slash text-xs"></i>';
            toggleBtn.addEventListener('click', function () {
                toggleWidgetVisibility(widget.id);
            });
            controls.appendChild(toggleBtn);

            header.appendChild(controls);
        }

        div.appendChild(header);

        var content = document.createElement('div');
        content.setAttribute('data-widget-content', widget.id);
        content.className = 'widget-content';
        
        // Load widget content based on widget type
        loadWidgetContent(widget.id, content);
        
        div.appendChild(content);

        return div;
    }

    function loadWidgetContent(widgetId, container) {
        // This would be implemented by specific portal modules
        // For now, show placeholder content
        var placeholder = document.createElement('div');
        placeholder.className = 'text-slate-400 text-center py-8';
        placeholder.innerHTML = '<i class="fas fa-spinner fa-spin"></i><p class="mt-2 text-sm">Loading...</p>';
        container.appendChild(placeholder);

        // Dispatch event for widget content loading
        window.dispatchEvent(new CustomEvent('shikola:load-widget', {
            detail: { widgetId: widgetId, container: container }
        }));
    }

    function toggleWidgetVisibility(widgetId) {
        var widget = state.layout.find(function (w) { return w.id === widgetId; });
        if (widget) {
            widget.visible = !widget.visible;
            renderLayout(state.layout);
        }
    }

    function enableEditMode() {
        state.isEditing = true;
        state.originalLayout = JSON.parse(JSON.stringify(state.layout));
        
        var container = document.querySelector('[data-dashboard-container]');
        if (container) {
            container.classList.add('edit-mode');
        }

        var editBtn = document.querySelector('[data-action="edit-layout"]');
        if (editBtn) {
            editBtn.textContent = 'Cancel';
            editBtn.setAttribute('data-action', 'cancel-layout');
        }

        var saveBtn = document.querySelector('[data-action="save-layout"]');
        if (saveBtn) {
            saveBtn.classList.remove('hidden');
        }

        renderLayout(state.layout);
        showEditControls();
    }

    function disableEditMode() {
        state.isEditing = false;
        
        var container = document.querySelector('[data-dashboard-container]');
        if (container) {
            container.classList.remove('edit-mode');
        }

        var editBtn = document.querySelector('[data-action="cancel-layout"]');
        if (editBtn) {
            editBtn.textContent = 'Customize Layout';
            editBtn.setAttribute('data-action', 'edit-layout');
        }

        var saveBtn = document.querySelector('[data-action="save-layout"]');
        if (saveBtn) {
            saveBtn.classList.add('hidden');
        }

        hideEditControls();
        renderLayout(state.layout);
    }

    function showEditControls() {
        var controls = document.querySelector('[data-layout-controls]');
        if (controls) {
            controls.classList.remove('hidden');
        }
    }

    function hideEditControls() {
        var controls = document.querySelector('[data-layout-controls]');
        if (controls) {
            controls.classList.add('hidden');
        }
    }

    function initializeDragAndDrop() {
        // Basic drag and drop implementation
        var widgets = document.querySelectorAll('[data-dashboard-widget]');
        var draggedElement = null;

        widgets.forEach(function (widget) {
            widget.draggable = true;
            widget.addEventListener('dragstart', handleDragStart);
            widget.addEventListener('dragover', handleDragOver);
            widget.addEventListener('drop', handleDrop);
            widget.addEventListener('dragend', handleDragEnd);
        });

        function handleDragStart(e) {
            draggedElement = e.target;
            e.target.style.opacity = '0.5';
        }

        function handleDragOver(e) {
            if (e.preventDefault) {
                e.preventDefault();
            }
            e.dataTransfer.dropEffect = 'move';
            return false;
        }

        function handleDrop(e) {
            if (e.stopPropagation) {
                e.stopPropagation();
            }

            if (draggedElement !== e.target && e.target.hasAttribute('data-dashboard-widget')) {
                // Swap positions in layout
                var draggedId = draggedElement.getAttribute('data-dashboard-widget');
                var targetId = e.target.getAttribute('data-dashboard-widget');

                var draggedWidget = state.layout.find(function (w) { return w.id === draggedId; });
                var targetWidget = state.layout.find(function (w) { return w.id === targetId; });

                if (draggedWidget && targetWidget) {
                    var tempPos = draggedWidget.position;
                    draggedWidget.position = targetWidget.position;
                    targetWidget.position = tempPos;
                }
            }

            return false;
        }

        function handleDragEnd(e) {
            e.target.style.opacity = '';
            renderLayout(state.layout);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Event Handlers
    // ─────────────────────────────────────────────────────────────────────────────
    function setupEventListeners() {
        var editBtn = document.querySelector('[data-action="edit-layout"]');
        var cancelBtn = document.querySelector('[data-action="cancel-layout"]');
        var saveBtn = document.querySelector('[data-action="save-layout"]');
        var resetBtn = document.querySelector('[data-action="reset-layout"]');

        if (editBtn) {
            editBtn.addEventListener('click', enableEditMode);
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', function () {
                state.layout = JSON.parse(JSON.stringify(state.originalLayout));
                disableEditMode();
            });
        }

        if (saveBtn) {
            saveBtn.addEventListener('click', async function () {
                try {
                    await saveLayout(state.layout);
                    disableEditMode();
                    showStatus('Layout saved successfully', false);
                } catch (err) {
                    console.error('[dashboard-layout.js] Save error:', err);
                    showStatus('Error: ' + (err.message || 'Failed to save'), true);
                }
            });
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', async function () {
                var user = null;
                try {
                    if (window.shikolaAuth && typeof window.shikolaAuth.getCurrentUser === 'function') {
                        user = window.shikolaAuth.getCurrentUser();
                    }
                } catch (e) {}

                var role = user ? user.role : 'pupil';
                state.layout = getDefaultLayout(role);
                
                try {
                    await saveLayout(state.layout);
                    renderLayout(state.layout);
                    showStatus('Layout reset to default', false);
                } catch (err) {
                    console.error('[dashboard-layout.js] Reset error:', err);
                    showStatus('Error: ' + (err.message || 'Failed to reset'), true);
                }
            });
        }
    }

    function showStatus(message, isError) {
        var statusEl = document.querySelector('[data-layout-status]');
        if (!statusEl) return;

        statusEl.textContent = message || '';
        statusEl.classList.remove('hidden', 'text-red-600', 'text-emerald-600');
        statusEl.classList.add(isError ? 'text-red-600' : 'text-emerald-600');

        // Auto-hide after 3 seconds
        setTimeout(function () {
            statusEl.classList.add('hidden');
        }, 3000);
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Initialize
    // ─────────────────────────────────────────────────────────────────────────────
    async function init() {
        await loadLayout();
        renderLayout(state.layout);
        setupEventListeners();
    }

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Export for debugging and external use
    window.ShikolaDashboardLayout = {
        state: state,
        loadLayout: loadLayout,
        saveLayout: saveLayout,
        renderLayout: renderLayout,
        enableEditMode: enableEditMode,
        disableEditMode: disableEditMode,
        getDefaultLayout: getDefaultLayout
    };

})(window);
