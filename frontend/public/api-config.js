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
// Shikola API Configuration
// This file sets up the API base URL for all frontend pages
window.SHIKOLA_API_BASE = 'http://localhost:4567';

// Also set it for any scripts that might check before this loads
if (typeof window !== 'undefined') {
    window.SHIKOLA_API_BASE = 'http://localhost:4567';
}
