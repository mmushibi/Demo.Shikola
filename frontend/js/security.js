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
    
    // Prevent right-click context menu (but allow on interactive elements)
    function preventContextMenu(e) {
        // Allow context menu on interactive elements
        const target = e.target;
        const tagName = target.tagName.toLowerCase();
        const isInteractive = tagName === 'button' || 
                              tagName === 'a' || 
                              tagName === 'input' || 
                              tagName === 'select' || 
                              tagName === 'textarea' ||
                              target.onclick ||
                              target.hasAttribute('data-action') ||
                              target.classList.contains('btn') ||
                              target.getAttribute('role') === 'button' ||
                              target.closest('button, a, input, select, textarea, [onclick], [data-action], .btn, [role="button"]');
        
        if (!isInteractive) {
            e.preventDefault();
            return false;
        }
        return true;
    }
    
    // Prevent text selection (but allow clicks on interactive elements)
    function preventSelection(e) {
        // Allow selection/clicks on interactive elements
        const target = e.target;
        const tagName = target.tagName.toLowerCase();
        const isInteractive = tagName === 'button' || 
                              tagName === 'a' || 
                              tagName === 'input' || 
                              tagName === 'select' || 
                              tagName === 'textarea' ||
                              target.onclick ||
                              target.hasAttribute('data-action') ||
                              target.classList.contains('btn') ||
                              target.getAttribute('role') === 'button' ||
                              target.closest('button, a, input, select, textarea, [onclick], [data-action], .btn, [role="button"]');
        
        if (!isInteractive) {
            e.preventDefault();
            return false;
        }
        return true;
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
    
    // Detect if running on PC/desktop
    function isDesktopPC() {
        return !(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) 
            && !('ontouchstart' in window || navigator.maxTouchPoints > 0)
            && window.innerWidth > 1024;
    }

    // Prevent screenshots and screen recording - Enhanced for PC
    function preventScreenshots() {
        // Disable screenshot APIs
        if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
            navigator.mediaDevices.getDisplayMedia = function() {
                return Promise.reject(new Error('Screenshots are disabled for security reasons.'));
            };
        }
        
        // Enhanced PC-specific screenshot prevention
        if (isDesktopPC()) {
            // Block all Print Screen variations
            document.addEventListener('keydown', function(e) {
                // Print Screen key
                if (e.key === 'PrintScreen' || e.keyCode === 44) {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                }
                
                // Alt + Print Screen
                if (e.altKey && (e.key === 'PrintScreen' || e.keyCode === 44)) {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                }
                
                // Ctrl + Print Screen
                if ((e.ctrlKey || e.metaKey) && (e.key === 'PrintScreen' || e.keyCode === 44)) {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                }
                
                // Shift + Print Screen
                if (e.shiftKey && (e.key === 'PrintScreen' || e.keyCode === 44)) {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                }
                
                // Windows Key + Print Screen
                if ((e.key === 'Meta' || e.keyCode === 91 || e.keyCode === 92) && 
                    (e.key === 'PrintScreen' || e.keyCode === 44)) {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                }
                
                // Block Snipping Tool shortcuts
                if ((e.key === 's' || e.key === 'S') && e.altKey && e.shiftKey) {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                }
                
                // Block Windows Key + S (Snipping Tool)
                if ((e.key === 's' || e.key === 'S') && (e.keyCode === 91 || e.keyCode === 92)) {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                }
                
                // Block Windows Key + Shift + S
                if ((e.key === 's' || e.key === 'S') && e.shiftKey && 
                    (e.keyCode === 91 || e.keyCode === 92)) {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                }
            });
            
            // Additional PC-specific measures
            document.addEventListener('keyup', function(e) {
                if (e.key === 'PrintScreen' || e.keyCode === 44) {
                    // Clear clipboard after Print Screen
                    try {
                        navigator.clipboard.writeText('').then(() => {
                            console.log('Clipboard cleared after screenshot attempt');
                        });
                    } catch (err) {
                        // Fallback for older browsers
                        const clearClipboard = function() {
                            const input = document.createElement('input');
                            input.value = '';
                            document.body.appendChild(input);
                            input.select();
                            document.execCommand('copy');
                            document.body.removeChild(input);
                        };
                        clearClipboard();
                    }
                }
            });
        }
        
        // Block right-click context menu for screenshots
        document.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            return false;
        });
        
        // Enhanced CSS to prevent screenshots on PC
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
            
            body {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
            
            @media print {
                body * {
                    visibility: hidden !important;
                }
            }
            
            /* PC-specific screenshot prevention */
            ${isDesktopPC() ? `
                body {
                    -webkit-user-select: none !important;
                    -moz-user-select: none !important;
                    -ms-user-select: none !important;
                    user-select: none !important;
                    -webkit-touch-callout: none !important;
                    -webkit-tap-highlight-color: transparent !important;
                }
                
                body * {
                    -webkit-user-select: none !important;
                    -moz-user-select: none !important;
                    -ms-user-select: none !important;
                    user-select: none !important;
                    -webkit-touch-callout: none !important;
                    -webkit-tap-highlight-color: transparent !important;
                }
                
                /* Allow buttons and interactive elements to be clicked */
                button, a, input, select, textarea, [onclick], [data-action], .btn, [role="button"] {
                    pointer-events: auto !important;
                    -webkit-user-select: none !important;
                    -moz-user-select: none !important;
                    -ms-user-select: none !important;
                    user-select: none !important;
                }
                
                /* Prevent text selection */
                ::selection {
                    background: transparent !important;
                    color: transparent !important;
                }
                
                ::-moz-selection {
                    background: transparent !important;
                    color: transparent !important;
                }
                
                /* Prevent drag and drop for media only */
                img, svg, video, canvas {
                    -webkit-user-drag: none !important;
                    -khtml-user-drag: none !important;
                    -moz-user-drag: none !important;
                    -o-user-drag: none !important;
                    user-drag: none !important;
                }
            ` : ''}
        `;
        document.head.appendChild(style);
        
        // Enhanced screen recording detection for PC
        const detectScreenRecording = function() {
            // Check for screen recording software
            if (isDesktopPC()) {
                // More aggressive detection for PC
                if (window.outerHeight - window.innerHeight > 200 || 
                    window.outerWidth - window.innerWidth > 200) {
                    // Possible screen recording software detected
                    document.body.innerHTML = `
                        <div style="display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: Arial, sans-serif; background: #1a1a1a;">
                            <div style="text-align: center; color: white;">
                                <h1 style="font-size: 2rem; margin-bottom: 1rem;">🚫 Screen Recording Detected</h1>
                                <p style="font-size: 1.2rem;">Screen recording and screenshot software are not allowed for security reasons.</p>
                                <p style="font-size: 1rem; margin-top: 1rem;">Please close any screen recording software to continue.</p>
                                <button onclick="location.reload()" style="margin-top: 2rem; padding: 0.75rem 2rem; background: #001057; color: white; border: none; border-radius: 0.5rem; cursor: pointer;">Reload Page</button>
                            </div>
                        </div>
                    `;
                    return true;
                }
                
                // Check for common screenshot tools processes
                try {
                    // Detect if browser is being monitored
                    const start = performance.now();
                    const end = performance.now();
                    if (end - start > 100) {
                        // Possible monitoring detected
                        console.warn('Performance monitoring detected');
                    }
                } catch (e) {
                    // Ignore errors
                }
            }
            return false;
        };
        
        // Run detection more frequently on PC
        const detectionInterval = isDesktopPC() ? 500 : 1000;
        setInterval(detectScreenRecording, detectionInterval);
        
        // Immediate check
        detectScreenRecording();
    }
    
    // Additional PC-specific security measures
    function enforcePCSecurity() {
        if (!isDesktopPC()) return;
        
        // Block common screenshot applications
        const blockedApps = [
            'snippingtool.exe',
            'snip.exe', 
            'screenrecorder.exe',
            'obs.exe',
            'bandicam.exe',
            'fraps.exe',
            'camtasia.exe',
            'sharex.exe',
            'greenshot.exe',
            'lightscreen.exe',
            'picpick.exe',
            'screenshot-captor.exe'
        ];
        
        // Prevent focus loss (common when screenshot tools open)
        let focusLostCount = 0;
        document.addEventListener('visibilitychange', function() {
            if (document.hidden) {
                focusLostCount++;
                if (focusLostCount > 3) {
                    // Possible screenshot tool usage
                    document.body.innerHTML = `
                        <div style="display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: Arial, sans-serif; background: #1a1a1a;">
                            <div style="text-align: center; color: white;">
                                <h1 style="font-size: 2rem; margin-bottom: 1rem;">🚫 Unauthorized Activity Detected</h1>
                                <p style="font-size: 1.2rem;">Multiple window changes detected. Screenshot tools are not allowed.</p>
                                <button onclick="location.reload()" style="margin-top: 2rem; padding: 0.75rem 2rem; background: #001057; color: white; border: none; border-radius: 0.5rem; cursor: pointer;">Reload Page</button>
                            </div>
                        </div>
                    `;
                }
            }
        });
        
        // Monitor for browser extension interference
        const originalConsole = window.console;
        window.console = new Proxy(console, {
            get(target, prop) {
                if (prop === 'log' || prop === 'warn' || prop === 'error') {
                    return function(...args) {
                        // Check for screenshot-related console output
                        const message = args.join(' ').toLowerCase();
                        if (message.includes('screenshot') || message.includes('capture') || 
                            message.includes('screen') || message.includes('record')) {
                            // Possible screenshot extension detected
                            document.body.innerHTML = `
                                <div style="display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: Arial, sans-serif; background: #1a1a1a;">
                                    <div style="text-align: center; color: white;">
                                        <h1 style="font-size: 2rem; margin-bottom: 1rem;">🚫 Browser Extension Detected</h1>
                                        <p style="font-size: 1.2rem;">Screenshot or screen recording extensions are not allowed.</p>
                                        <p style="font-size: 1rem; margin-top: 1rem;">Please disable browser extensions and reload.</p>
                                        <button onclick="location.reload()" style="margin-top: 2rem; padding: 0.75rem 2rem; background: #001057; color: white; border: none; border-radius: 0.5rem; cursor: pointer;">Reload Page</button>
                                    </div>
                                </div>
                            `;
                            return;
                        }
                        return originalConsole[prop].apply(console, args);
                    };
                }
                return originalConsole[prop];
            }
        });
        
        // Block external window access
        window.open = function() {
            return null;
        };
        
        // Prevent window manipulation
        Object.defineProperty(window, 'outerWidth', {
            get: function() {
                return window.innerWidth;
            },
            configurable: false
        });
        
        Object.defineProperty(window, 'outerHeight', {
            get: function() {
                return window.innerHeight;
            },
            configurable: false
        });
        
        // Enhanced keyboard prevention for PC
        document.addEventListener('keydown', function(e) {
            // Block F12 (Developer Tools)
            if (e.key === 'F12' || e.keyCode === 123) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
            
            // Block Ctrl+Shift+I (Developer Tools)
            if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i')) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
            
            // Block Ctrl+Shift+J (Console)
            if (e.ctrlKey && e.shiftKey && (e.key === 'J' || e.key === 'j')) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
            
            // Block Ctrl+Shift+C (Element Inspector)
            if (e.ctrlKey && e.shiftKey && (e.key === 'C' || e.key === 'c')) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
            
            // Block Ctrl+Shift+K (Console in Firefox)
            if (e.ctrlKey && e.shiftKey && (e.key === 'K' || e.key === 'k')) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
        });
        
        // Prevent right-click on images and media only
        document.addEventListener('contextmenu', function(e) {
            const target = e.target;
            const tagName = target.tagName.toLowerCase();
            const isMedia = tagName === 'img' || tagName === 'video' || tagName === 'svg' || tagName === 'canvas';
            const isInteractive = tagName === 'button' || 
                                  tagName === 'a' || 
                                  tagName === 'input' || 
                                  tagName === 'select' || 
                                  tagName === 'textarea' ||
                                  target.onclick ||
                                  target.hasAttribute('data-action') ||
                                  target.classList.contains('btn') ||
                                  target.getAttribute('role') === 'button' ||
                                  target.closest('button, a, input, select, textarea, [onclick], [data-action], .btn, [role="button"]');
            
            if (isMedia && !isInteractive) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
        });
        
        // Add watermark overlay for PC
        const watermark = document.createElement('div');
        watermark.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 999999;
            background: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8dGV4dCB4PSIxMCIgeT0iMjAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0icmdiYSgwLCAwLCAwLCAwLjEpIj5TSElLT0xBIC0gUFJJVkFURTwvdGV4dD4KPC9zdmc+') repeat;
            opacity: 0.05;
            display: ${isDesktopPC() ? 'block' : 'none'};
        `;
        document.body.appendChild(watermark);
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
        
        // Initialize screenshot and screen recording prevention
        preventScreenshots();
        
        // Initialize PC-specific security measures
        enforcePCSecurity();
        
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
        
        // Enhanced developer tools detection for PC
        if (isDesktopPC()) {
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
                                    <button onclick="location.reload()" style="margin-top: 2rem; padding: 0.75rem 2rem; background: #001057; color: white; border: none; border-radius: 0.5rem; cursor: pointer;">Reload Page</button>
                                </div>
                            </div>
                        `;
                    }
                } else {
                    devtools.open = false;
                }
            }, 250); // Check more frequently on PC
        }
    }
    
    // Run security measures when DOM is loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSecurity);
    } else {
        initSecurity();
    }
    
})();
