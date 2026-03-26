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
 * Shared Export and Print Functionality
 * Handles exporting data to various formats and printing
 */

class ShikolaExportPrint {
    constructor() {
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        this.initialized = true;
        console.log('[Shikola] Export/Print module initialized');
    }

    // Export to CSV
    exportToCSV(data, filename, headers = []) {
        try {
            let csvContent = '';
            
            // Add headers if provided
            if (headers.length > 0) {
                csvContent += headers.join(',') + '\n';
            }
            
            // Add data rows
            data.forEach(row => {
                if (typeof row === 'object') {
                    csvContent += Object.values(row).join(',') + '\n';
                } else {
                    csvContent += row + '\n';
                }
            });
            
            // Create download link
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename || 'export.csv';
            link.click();
            
            // Cleanup
            window.URL.revokeObjectURL(url);
            
            return { success: true };
        } catch (error) {
            console.error('Export to CSV failed:', error);
            return { success: false, error: error.message };
        }
    }

    // Export to PDF (simplified version)
    exportToPDF(element, filename) {
        try {
            if (!element) {
                throw new Error('Element not provided for PDF export');
            }
            
            // Use browser's print functionality as fallback
            window.print();
            
            return { success: true };
        } catch (error) {
            console.error('Export to PDF failed:', error);
            return { success: false, error: error.message };
        }
    }

    // Print functionality
    printElement(elementId) {
        try {
            const element = document.getElementById(elementId);
            if (!element) {
                throw new Error('Element not found');
            }
            
            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Print</title>
                        <style>
                            body { font-family: Arial, sans-serif; margin: 20px; }
                            @media print { body { margin: 0; } }
                        </style>
                    </head>
                    <body>
                        ${element.innerHTML}
                    </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.print();
            printWindow.close();
            
            return { success: true };
        } catch (error) {
            console.error('Print failed:', error);
            return { success: false, error: error.message };
        }
    }
}

// Initialize and make globally available
window.shikolaExportPrint = new ShikolaExportPrint();
window.shikolaExportPrint.init();
