/**
 * Assignment Notification System
 * Handles notifications for assignments
 */

(function() {
    'use strict';

    window.showAssignmentToast = function(message, type = 'info', duration = 3000) {
        console.log(`[${type.toUpperCase()}] ${message}`);
        
        // Create toast element if it doesn't exist
        let toast = document.getElementById('assignment-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'assignment-toast';
            toast.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                padding: 12px 20px;
                border-radius: 8px;
                color: white;
                font-size: 14px;
                z-index: 9999;
                transition: all 0.3s ease;
            `;
            document.body.appendChild(toast);
        }
        
        // Set background color based on type
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            info: '#3b82f6',
            warning: '#f59e0b'
        };
        
        toast.style.backgroundColor = colors[type] || colors.info;
        toast.textContent = message;
        toast.style.display = 'block';
        
        // Hide after duration
        setTimeout(() => {
            toast.style.display = 'none';
        }, duration);
    };

})();
