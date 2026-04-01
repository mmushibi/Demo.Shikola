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

// Accessibility Fixes for Shikola Application
(function() {
    'use strict';

    // Initialize accessibility improvements
    function initAccessibility() {
        // Add ARIA labels to interactive elements
        addAriaLabels();
        
        // Improve keyboard navigation
        improveKeyboardNavigation();
        
        // Add focus indicators
        addFocusIndicators();
        
        // Fix semantic HTML
        fixSemanticHTML();
        
        // Add screen reader announcements
        setupScreenReaderAnnouncements();
    }

    // Add ARIA labels to interactive elements
    function addAriaLabels() {
        // Add labels to buttons without text
        document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])').forEach(button => {
            if (!button.textContent.trim()) {
                const icon = button.querySelector('i');
                if (icon) {
                    const iconClass = icon.className;
                    if (iconClass.includes('fa-user')) button.setAttribute('aria-label', 'User');
                    else if (iconClass.includes('fa-cog')) button.setAttribute('aria-label', 'Settings');
                    else if (iconClass.includes('fa-home')) button.setAttribute('aria-label', 'Home');
                    else if (iconClass.includes('fa-chart')) button.setAttribute('aria-label', 'Dashboard');
                    else if (iconClass.includes('fa-menu') || iconClass.includes('fa-bars')) button.setAttribute('aria-label', 'Menu');
                    else if (iconClass.includes('fa-times') || iconClass.includes('fa-close')) button.setAttribute('aria-label', 'Close');
                    else if (iconClass.includes('fa-search')) button.setAttribute('aria-label', 'Search');
                    else if (iconClass.includes('fa-bell')) button.setAttribute('aria-label', 'Notifications');
                    else if (iconClass.includes('fa-envelope')) button.setAttribute('aria-label', 'Messages');
                    else if (iconClass.includes('fa-sign-out') || iconClass.includes('fa-logout')) button.setAttribute('aria-label', 'Logout');
                    else button.setAttribute('aria-label', 'Button');
                }
            }
        });

        // Add labels to navigation links
        document.querySelectorAll('nav a:not([aria-label]):not([aria-labelledby])').forEach(link => {
            if (!link.textContent.trim()) {
                const icon = link.querySelector('i');
                if (icon) {
                    const iconClass = icon.className;
                    if (iconClass.includes('fa-user')) link.setAttribute('aria-label', 'User Profile');
                    else if (iconClass.includes('fa-cog')) link.setAttribute('aria-label', 'Settings');
                    else if (iconClass.includes('fa-home')) link.setAttribute('aria-label', 'Home');
                    else if (iconClass.includes('fa-chart')) link.setAttribute('aria-label', 'Dashboard');
                    else link.setAttribute('aria-label', 'Navigation Link');
                }
            }
        });
    }

    // Improve keyboard navigation
    function improveKeyboardNavigation() {
        // Make all interactive elements focusable
        document.querySelectorAll('button, a, input, select, textarea, [tabindex]').forEach(element => {
            if (!element.hasAttribute('tabindex')) {
                element.setAttribute('tabindex', '0');
            }
        });

        // Add keyboard event handlers for dropdown menus
        document.querySelectorAll('.dropdown, [x-data*="dropdown"]').forEach(dropdown => {
            dropdown.addEventListener('keydown', handleDropdownKeyboard);
        });

        // Handle escape key to close modals
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closeAllModals();
                closeAllDropdowns();
            }
        });
    }

    // Handle dropdown keyboard navigation
    function handleDropdownKeyboard(e) {
        const items = e.currentTarget.querySelectorAll('a, button');
        const currentIndex = Array.from(items).findIndex(item => item === document.activeElement);
        
        switch(e.key) {
            case 'ArrowDown':
                e.preventDefault();
                const nextIndex = (currentIndex + 1) % items.length;
                items[nextIndex].focus();
                break;
            case 'ArrowUp':
                e.preventDefault();
                const prevIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
                items[prevIndex].focus();
                break;
            case 'Enter':
            case ' ':
                if (document.activeElement.tagName === 'BUTTON') {
                    e.preventDefault();
                    document.activeElement.click();
                }
                break;
        }
    }

    // Add focus indicators
    function addFocusIndicators() {
        const style = document.createElement('style');
        style.textContent = `
            :focus {
                outline: 2px solid #2563eb !important;
                outline-offset: 2px !important;
            }
            
            button:focus,
            a:focus,
            input:focus,
            select:focus,
            textarea:focus {
                outline: 2px solid #2563eb !important;
                outline-offset: 2px !important;
            }
            
            .sr-only {
                position: absolute;
                width: 1px;
                height: 1px;
                padding: 0;
                margin: -1px;
                overflow: hidden;
                clip: rect(0, 0, 0, 0);
                white-space: nowrap;
                border: 0;
            }
            
            .skip-link {
                position: absolute;
                top: -40px;
                left: 6px;
                background: #2563eb;
                color: white;
                padding: 8px;
                text-decoration: none;
                border-radius: 4px;
                z-index: 10000;
            }
            
            .skip-link:focus {
                top: 6px;
            }
        `;
        document.head.appendChild(style);

        // Add skip links
        const skipLink = document.createElement('a');
        skipLink.href = '#main-content';
        skipLink.className = 'skip-link';
        skipLink.textContent = 'Skip to main content';
        document.body.insertBefore(skipLink, document.body.firstChild);

        // Add main content ID if not present
        const mainContent = document.querySelector('main, .main-content, #main-content');
        if (mainContent && !mainContent.id) {
            mainContent.id = 'main-content';
        }
    }

    // Fix semantic HTML
    function fixSemanticHTML() {
        // Add proper heading structure
        document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((heading, index, headings) => {
            if (!heading.hasAttribute('role')) {
                heading.setAttribute('role', 'heading');
            }
        });

        // Add landmarks
        if (!document.querySelector('main')) {
            const main = document.querySelector('.main-content, .content, #content') || document.body;
            if (main !== document.body) {
                main.setAttribute('role', 'main');
            }
        }

        // Add navigation landmarks
        document.querySelectorAll('nav').forEach(nav => {
            if (!nav.hasAttribute('aria-label') && !nav.hasAttribute('aria-labelledby')) {
                nav.setAttribute('aria-label', 'Main navigation');
            }
        });

        // Add complementary landmarks
        document.querySelectorAll('aside, .sidebar').forEach(aside => {
            if (!aside.hasAttribute('role')) {
                aside.setAttribute('role', 'complementary');
            }
        });
    }

    // Setup screen reader announcements
    function setupScreenReaderAnnouncements() {
        // Create live region for announcements
        const liveRegion = document.createElement('div');
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.className = 'sr-only';
        liveRegion.id = 'shikola-announcements';
        document.body.appendChild(liveRegion);

        // Global announcement function
        window.announceToScreenReader = function(message) {
            const announcements = document.getElementById('shikola-announcements');
            if (announcements) {
                announcements.textContent = message;
                setTimeout(() => {
                    announcements.textContent = '';
                }, 1000);
            }
        };
    }

    // Close all modals
    function closeAllModals() {
        document.querySelectorAll('.modal.show, [x-data*="modal"]').forEach(modal => {
            if (modal.style.display !== 'none') {
                modal.style.display = 'none';
                announceToScreenReader('Modal closed');
            }
        });
    }

    // Close all dropdowns
    function closeAllDropdowns() {
        document.querySelectorAll('.dropdown.show, [x-data*="dropdown"]').forEach(dropdown => {
            if (dropdown.style.display !== 'none') {
                dropdown.style.display = 'none';
                announceToScreenReader('Menu closed');
            }
        });
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAccessibility);
    } else {
        initAccessibility();
    }

    // Re-run accessibility fixes when content changes (for SPA-like behavior)
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                // Re-apply accessibility fixes to new content
                setTimeout(() => {
                    addAriaLabels();
                    improveKeyboardNavigation();
                }, 100);
            }
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

})();
