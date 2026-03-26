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
 * Shared Chart Interactions
 * Handles common chart interactions and utilities
 */

class ShikolaChartInteractions {
    constructor() {
        this.initialized = false;
        this.charts = new Map();
    }

    init() {
        if (this.initialized) return;
        this.initialized = true;
        console.log('[Shikola] Chart interactions module initialized');
    }

    // Register a chart
    registerChart(id, chartInstance) {
        this.charts.set(id, chartInstance);
    }

    // Get a chart by ID
    getChart(id) {
        return this.charts.get(id);
    }

    // Export chart as image
    exportChartAsImage(chartId, filename) {
        try {
            const chart = this.getChart(chartId);
            if (!chart) {
                throw new Error('Chart not found');
            }

            // For Chart.js charts
            if (chart.toBase64Image) {
                const imageData = chart.toBase64Image();
                const link = document.createElement('a');
                link.download = filename || 'chart.png';
                link.href = imageData;
                link.click();
                return { success: true };
            }

            // Fallback for other chart libraries
            return { success: false, error: 'Chart type not supported for export' };
        } catch (error) {
            console.error('Chart export failed:', error);
            return { success: false, error: error.message };
        }
    }

    // Toggle chart animation
    toggleAnimation(chartId) {
        try {
            const chart = this.getChart(chartId);
            if (!chart) {
                throw new Error('Chart not found');
            }

            if (chart.options && chart.options.animation !== undefined) {
                chart.options.animation = !chart.options.animation;
                chart.update();
                return { success: true, animation: chart.options.animation };
            }

            return { success: false, error: 'Animation not supported' };
        } catch (error) {
            console.error('Toggle animation failed:', error);
            return { success: false, error: error.message };
        }
    }

    // Reset chart zoom
    resetZoom(chartId) {
        try {
            const chart = this.getChart(chartId);
            if (!chart) {
                throw new Error('Chart not found');
            }

            if (chart.resetZoom) {
                chart.resetZoom();
                return { success: true };
            }

            return { success: false, error: 'Zoom not supported' };
        } catch (error) {
            console.error('Reset zoom failed:', error);
            return { success: false, error: error.message };
        }
    }

    // Update chart data
    updateChartData(chartId, newData, label) {
        try {
            const chart = this.getChart(chartId);
            if (!chart) {
                throw new Error('Chart not found');
            }

            if (chart.data && chart.data.datasets) {
                if (label !== undefined) {
                    // Update specific dataset
                    const dataset = chart.data.datasets.find(ds => ds.label === label);
                    if (dataset) {
                        dataset.data = newData;
                    }
                } else {
                    // Update first dataset
                    chart.data.datasets[0].data = newData;
                }
                chart.update();
                return { success: true };
            }

            return { success: false, error: 'Chart data update not supported' };
        } catch (error) {
            console.error('Update chart data failed:', error);
            return { success: false, error: error.message };
        }
    }

    // Add tooltip to chart
    addCustomTooltip(chartId, tooltipCallback) {
        try {
            const chart = this.getChart(chartId);
            if (!chart) {
                throw new Error('Chart not found');
            }

            if (chart.options && chart.options.tooltips) {
                chart.options.tooltips.callbacks = tooltipCallback;
                chart.update();
                return { success: true };
            }

            return { success: false, error: 'Custom tooltips not supported' };
        } catch (error) {
            console.error('Add custom tooltip failed:', error);
            return { success: false, error: error.message };
        }
    }

    // Destroy chart
    destroyChart(chartId) {
        try {
            const chart = this.getChart(chartId);
            if (!chart) {
                throw new Error('Chart not found');
            }

            if (chart.destroy) {
                chart.destroy();
                this.charts.delete(chartId);
                return { success: true };
            }

            return { success: false, error: 'Chart destruction not supported' };
        } catch (error) {
            console.error('Destroy chart failed:', error);
            return { success: false, error: error.message };
        }
    }

    // Get chart statistics
    getChartStats(chartId) {
        try {
            const chart = this.getChart(chartId);
            if (!chart) {
                throw new Error('Chart not found');
            }

            const stats = {
                type: chart.config ? chart.config.type : 'unknown',
                datasets: chart.data ? chart.data.datasets.length : 0,
                datapoints: 0
            };

            if (chart.data && chart.data.datasets) {
                chart.data.datasets.forEach(dataset => {
                    if (dataset.data && Array.isArray(dataset.data)) {
                        stats.datapoints += dataset.data.length;
                    }
                });
            }

            return { success: true, stats };
        } catch (error) {
            console.error('Get chart stats failed:', error);
            return { success: false, error: error.message };
        }
    }
}

// Initialize and make globally available
window.shikolaChartInteractions = new ShikolaChartInteractions();
window.shikolaChartInteractions.init();
