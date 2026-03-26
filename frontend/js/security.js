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
// Security Protection Script
// Prevents keyboard shortcuts, saving, and unauthorized access

(function() {
    'use strict';
    
    // Check if page is being accessed from local file system
    function isLocalFile() {
        return window.location.protocol === 'file:';
    }
    
    // Authentication check for saved pages
    function checkAuthentication() {
        if (isLocalFile()) {
            // Clear the page and show authentication message
            document.body.innerHTML = `
                <div style="display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: Arial, sans-serif; background: #001057;">
                    <div style="text-align: center; background: white; padding: 3rem; border-radius: 1rem; box-shadow: 0 20px 40px rgba(0,0,0,0.1); max-width: 500px;">
                        <div style="width: 80px; height: 80px; background: #fee2e2; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem;">
                            <svg style="width: 40px; height: 40px; color: #dc2626;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                            </svg>
                        </div>
                        <h1 style="color: #1f2937; margin-bottom: 1rem; font-size: 1.5rem; font-weight: 600;">Authentication Required</h1>
                        <p style="color: #6b7280; margin-bottom: 1.5rem; line-height: 1.6;">
                            This page is protected and requires authentication. Please sign in to the original Shikola application to access this content.
                        </p>
                        <div style="background: #f3f4f6; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1.5rem;">
                            <p style="color: #4b5563; font-size: 0.875rem; margin: 0;">
                                <strong>Note:</strong> This content is secured to prevent unauthorized access and protect intellectual property.
                            </p>
                        </div>
                        <button onclick="window.location.href='https://shikola.com/login'" style="background: #001057; color: white; padding: 0.75rem 2rem; border: none; border-radius: 0.5rem; font-weight: 500; cursor: pointer; transition: background 0.2s;">
                            Go to Login
                        </button>
                    </div>
                </div>
            `;
            
            // Disable right-click and other interactions
            document.addEventListener('contextmenu', e => e.preventDefault());
            document.addEventListener('selectstart', e => e.preventDefault());
            document.addEventListener('dragstart', e => e.preventDefault());
            
            return false;
        }
        return true;
    }
    
    // Prevent keyboard shortcuts
    function preventKeyboardShortcuts(e) {
        // List of prevented key combinations
        const preventedKeys = [
            // Save shortcuts
            { ctrl: true, key: 's' },
            { ctrl: true, key: 'S' },
            { meta: true, key: 's' },
            { meta: true, key: 'S' },
            
            // Print shortcuts
            { ctrl: true, key: 'p' },
            { ctrl: true, key: 'P' },
            { meta: true, key: 'p' },
            { meta: true, key: 'P' },
            
            // View source shortcuts
            { ctrl: true, key: 'u' },
            { ctrl: true, key: 'U' },
            { meta: true, alt: true, key: 'u' },
            { meta: true, alt: true, key: 'U' },
            
            // Developer tools
            { ctrl: true, shift: true, key: 'i' },
            { ctrl: true, shift: true, key: 'I' },
            { meta: true, alt: true, key: 'i' },
            { meta: true, alt: true, key: 'I' },
            { key: 'F12' },
            
            // Select all
            { ctrl: true, key: 'a' },
            { ctrl: true, key: 'A' },
            { meta: true, key: 'a' },
            { meta: true, key: 'A' },
            
            // Copy
            { ctrl: true, key: 'c' },
            { ctrl: true, key: 'C' },
            { meta: true, key: 'c' },
            { meta: true, key: 'C' }
        ];
        
        // Check if current key combination matches any prevented keys
        for (const prevented of preventedKeys) {
            let match = true;
            
            if (prevented.ctrl && (!e.ctrlKey && !e.metaKey)) match = false;
            if (prevented.meta && !e.metaKey) match = false;
            if (prevented.alt && !e.altKey) match = false;
            if (prevented.shift && !e.shiftKey) match = false;
            if (e.key !== prevented.key) match = false;
            
            if (match) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
        }
    }
    
    // Prevent right-click context menu
    function preventContextMenu(e) {
        e.preventDefault();
        return false;
    }
    
    // Prevent text selection
    function preventSelection(e) {
        e.preventDefault();
        return false;
    }
    
    // Prevent drag and drop
    function preventDrag(e) {
        e.preventDefault();
        return false;
    }
    
    // Prevent printing
    function preventPrint(e) {
        e.preventDefault();
        return false;
    }
    
    // Clear browser data periodically
    function clearBrowserData() {
        try {
            // Clear localStorage
            if (typeof(Storage) !== "undefined" && localStorage) {
                localStorage.clear();
            }
            
            // Clear sessionStorage
            if (typeof(Storage) !== "undefined" && sessionStorage) {
                sessionStorage.clear();
            }
            
            // Clear IndexedDB
            if (window.indexedDB) {
                const databases = indexedDB.databases();
                databases.then(function(dbs) {
                    dbs.forEach(function(db) {
                        indexedDB.deleteDatabase(db.name);
                    });
                });
            }
            
            // Clear cookies (same-site only)
            document.cookie.split(";").forEach(function(c) {
                const eqPos = c.indexOf("=");
                const name = eqPos > -1 ? c.substr(0, eqPos) : c;
                document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
                document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=" + window.location.hostname;
            });
            
            // Clear service workers
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(function(registrations) {
                    registrations.forEach(function(registration) {
                        registration.unregister();
                    });
                });
            }
            
            // Clear cache API
            if ('caches' in window) {
                caches.keys().then(function(names) {
                    names.forEach(function(name) {
                        caches.delete(name);
                    });
                });
            }
            
            console.log('%c🧹 Browser data cleared for privacy', 'color: green; font-size: 14px;');
        } catch (error) {
            console.log('Data cleanup error:', error);
        }
    }
    
    // Clear console periodically
    function clearConsole() {
        console.clear();
        console.log('%c🚫 Unauthorized Access Detected!', 'color: red; font-size: 20px; font-weight: bold;');
        console.log('%cThis application is protected. Attempting to access or copy source code is prohibited.', 'color: orange; font-size: 14px;');
    }
    
    // Initialize security measures
    function initSecurity() {
        // Check authentication first
        if (!checkAuthentication()) {
            return;
        }
        
        // Add event listeners
        document.addEventListener('keydown', preventKeyboardShortcuts);
        document.addEventListener('contextmenu', preventContextMenu);
        document.addEventListener('selectstart', preventSelection);
        document.addEventListener('dragstart', preventDrag);
        document.addEventListener('beforeprint', preventPrint);
        
        // Prevent copy/paste
        document.addEventListener('copy', preventSelection);
        document.addEventListener('cut', preventSelection);
        document.addEventListener('paste', preventSelection);
        
        // Clear console every 5 seconds
        setInterval(clearConsole, 5000);
        
        // Clear browser data every 5 minutes
        setInterval(clearBrowserData, 300000);
        
        // Clear browser data when browser closes
        window.addEventListener('beforeunload', function() {
            clearBrowserData();
        });
        
        // Clear browser data when page is hidden
        document.addEventListener('visibilitychange', function() {
            if (document.hidden) {
                clearBrowserData();
            }
        });
        
        // Initial data clear
        clearBrowserData();
        
        // Initial console clear
        clearConsole();
        
        // Add security meta tags
        const metaTags = [
            { name: 'robots', content: 'noindex, nofollow' },
            { name: 'referrer', content: 'no-referrer' },
            { httpEquiv: 'X-Frame-Options', content: 'DENY' },
            { httpEquiv: 'Content-Security-Policy', content: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:;" }
        ];
        
        metaTags.forEach(tag => {
            const meta = document.createElement('meta');
            if (tag.name) meta.name = tag.name;
            if (tag.httpEquiv) meta.httpEquiv = tag.httpEquiv;
            meta.content = tag.content;
            document.head.appendChild(meta);
        });
        
        // Disable developer tools detection
        let devtools = { open: false, orientation: null };
        setInterval(() => {
            if (window.outerHeight - window.innerHeight > 200 || window.outerWidth - window.innerWidth > 200) {
                if (!devtools.open) {
                    devtools.open = true;
                    console.clear();
                    document.body.innerHTML = `
                        <div style="display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: Arial, sans-serif; background: #1a1a1a;">
                            <div style="text-align: center; color: white;">
                                <h1 style="font-size: 2rem; margin-bottom: 1rem;">🚫 Developer Tools Detected</h1>
                                <p>Please close developer tools to continue using this application.</p>
                            </div>
                        </div>
                    `;
                }
            } else {
                devtools.open = false;
            }
        }, 500);
    }
    
    // Run security measures when DOM is loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSecurity);
    } else {
        initSecurity();
    }
    
})();
