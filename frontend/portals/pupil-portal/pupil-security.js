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
 * Pupil Portal Security Features
 * Prevents right-click and other security measures for pupil portal pages
 */

(function() {
    'use strict';

    // Prevent right-click context menu
    function preventContextMenu(e) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    }

    // Prevent text selection
    function preventSelection(e) {
        if (e.ctrlKey && e.shiftKey) {
            e.preventDefault();
            return false;
        }
    }

    // Prevent copy operations
    function preventCopy(e) {
        if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'x')) {
            e.preventDefault();
            return false;
        }
    }

    // Prevent print screen
    function preventPrintScreen(e) {
        if (e.key === 'PrintScreen') {
            e.preventDefault();
            return false;
        }
    }

    // Prevent F12 (developer tools)
    function preventF12(e) {
        if (e.key === 'F12' || e.keyCode === 123) {
            e.preventDefault();
            return false;
        }
    }

    // Prevent Ctrl+Shift+I (developer tools)
    function preventDevTools(e) {
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'I') {
            e.preventDefault();
            return false;
        }
    }

    // Prevent Ctrl+Shift+J (console)
    function preventConsole(e) {
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'J') {
            e.preventDefault();
            return false;
        }
    }

    // Prevent Ctrl+U (view source)
    function preventViewSource(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
            e.preventDefault();
            return false;
        }
    }

    // Prevent drag operations
    function preventDrag(e) {
        e.preventDefault();
        return false;
    }

    // Initialize security measures
    function initSecurity() {
        // Prevent context menu
        document.addEventListener('contextmenu', preventContextMenu, true);
        
        // Prevent text selection shortcuts
        document.addEventListener('keydown', preventSelection, true);
        
        // Prevent copy/cut operations
        document.addEventListener('keydown', preventCopy, true);
        
        // Prevent developer tools shortcuts
        document.addEventListener('keydown', preventF12, true);
        document.addEventListener('keydown', preventDevTools, true);
        document.addEventListener('keydown', preventConsole, true);
        document.addEventListener('keydown', preventViewSource, true);
        
        // Prevent print screen (may not work in all browsers)
        document.addEventListener('keydown', preventPrintScreen, true);
        
        // Prevent drag operations
        document.addEventListener('dragstart', preventDrag, true);
        document.addEventListener('selectstart', preventSelection, true);
        
        // Additional prevention for images
        document.addEventListener('mousedown', function(e) {
            if (e.button === 2) { // Right mouse button
                e.preventDefault();
                return false;
            }
        }, true);
        
        // Prevent selection on double click
        document.addEventListener('mousedown', function(e) {
            if (e.detail > 1) {
                e.preventDefault();
            }
        }, true);
        
        // Add CSS to prevent text selection
        const style = document.createElement('style');
        style.textContent = `
            * {
                -webkit-user-select: none !important;
                -moz-user-select: none !important;
                -ms-user-select: none !important;
                user-select: none !important;
                -webkit-touch-callout: none !important;
                -webkit-tap-highlight-color: transparent !important;
            }
            
            input, textarea, [contenteditable] {
                -webkit-user-select: text !important;
                -moz-user-select: text !important;
                -ms-user-select: text !important;
                user-select: text !important;
            }
            
            img {
                -webkit-user-drag: none !important;
                -khtml-user-drag: none !important;
                -moz-user-drag: none !important;
                -o-user-drag: none !important;
                user-drag: none !important;
                pointer-events: none !important;
            }
        `;
        document.head.appendChild(style);
        
        console.log('Pupil Portal Security: Right-click and developer tools disabled');
    }

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSecurity);
    } else {
        initSecurity();
    }

    // Re-apply security measures if content changes
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                // Re-apply styles to new elements
                const newElements = document.querySelectorAll('*');
                newElements.forEach(function(el) {
                    if (!el.style.webkitUserSelect) {
                        el.style.webkitUserSelect = 'none';
                        el.style.mozUserSelect = 'none';
                        el.style.msUserSelect = 'none';
                        el.style.userSelect = 'none';
                    }
                });
            }
        });
    });

    // Only start observer if document.body is available
    if (document.body) {
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    } else {
        // Wait for DOM to be ready
        document.addEventListener('DOMContentLoaded', function() {
            if (document.body) {
                observer.observe(document.body, {
                    childList: true,
                    subtree: true
                });
            }
        });
    }

    // Global function to check if security is enabled
    window.pupilPortalSecurity = {
        enabled: true,
        version: '1.0.0',
        
        // Method to disable security (for testing purposes)
        disable: function() {
            document.removeEventListener('contextmenu', preventContextMenu, true);
            document.removeEventListener('keydown', preventSelection, true);
            document.removeEventListener('keydown', preventCopy, true);
            document.removeEventListener('keydown', preventF12, true);
            document.removeEventListener('keydown', preventDevTools, true);
            document.removeEventListener('keydown', preventConsole, true);
            document.removeEventListener('keydown', preventViewSource, true);
            document.removeEventListener('dragstart', preventDrag, true);
            document.removeEventListener('selectstart', preventSelection, true);
            this.enabled = false;
            console.log('Pupil Portal Security: Disabled');
        },
        
        // Method to re-enable security
        enable: function() {
            initSecurity();
            this.enabled = true;
            console.log('Pupil Portal Security: Enabled');
        }
    };

})();
