/**
 * Assignment Offline Support
 * Handles offline functionality for assignments
 */

(function() {
    'use strict';

    window.ShikolaAssignmentOffline = {
        shouldQueueSubmission: function() {
            return !navigator.onLine;
        }
    };

    window.queueAssignmentOffline = async function(data) {
        console.log('Queuing assignment for offline submission:', data);
        return 'queue-' + Date.now();
    };

})();
