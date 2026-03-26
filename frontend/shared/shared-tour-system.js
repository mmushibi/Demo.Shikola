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
 * Shikola Interactive Tour System
 * Provides step-by-step guided tours for new users
 */

class ShikolaTour {
  constructor(options = {}) {
    this.currentStep = 0;
    this.isActive = false;
    this.tourSteps = [];
    this.options = {
      overlayColor: 'rgba(0, 0, 0, 0.5)',
      highlightColor: '#f97316',
      highlightWidth: '3px',
      showProgress: true,
      showSkip: true,
      autoAdvance: false,
      advanceDelay: 5000,
      ...options
    };
    
    this.overlay = null;
    this.highlight = null;
    this.tooltip = null;
    this.progressIndicator = null;
    
    this.init();
  }

  init() {
    this.createOverlay();
    this.createTooltip();
    this.bindEvents();
  }

  createOverlay() {
    this.overlay = document.createElement('div');
    this.overlay.id = 'tour-overlay';
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: ${this.options.overlayColor};
      z-index: 9998;
      display: none;
      pointer-events: none;
      transition: opacity 0.3s ease;
    `;
    document.body.appendChild(this.overlay);

    this.highlight = document.createElement('div');
    this.highlight.id = 'tour-highlight';
    this.highlight.style.cssText = `
      position: absolute;
      border: ${this.options.highlightWidth} solid ${this.options.highlightColor};
      border-radius: 8px;
      box-shadow: 0 0 0 9999px ${this.options.overlayColor};
      pointer-events: none;
      z-index: 9999;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      display: none;
    `;
    document.body.appendChild(this.highlight);
  }

  createTooltip() {
    this.tooltip = document.createElement('div');
    this.tooltip.id = 'tour-tooltip';
    this.tooltip.style.cssText = `
      position: absolute;
      background: white;
      border-radius: 12px;
      padding: 20px;
      max-width: 320px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      z-index: 10000;
      display: none;
      opacity: 0;
      transform: scale(0.9) translateY(10px);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    `;

    this.tooltip.innerHTML = `
      <div class="tour-tooltip-content">
        <div class="tour-tooltip-header mb-3">
          <h3 class="tour-title text-lg font-semibold text-gray-800 mb-1"></h3>
          <div class="tour-progress text-sm text-gray-500"></div>
        </div>
        <div class="tour-tooltip-body">
          <p class="tour-description text-gray-600 mb-4"></p>
          <div class="tour-actions flex items-center justify-between">
            <button class="tour-skip text-sm text-gray-500 hover:text-gray-700 transition-colors">
              Skip Tour
            </button>
            <div class="tour-navigation flex gap-2">
              <button class="tour-prev px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                Previous
              </button>
              <button class="tour-next px-3 py-1.5 text-sm bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.tooltip);
  }

  bindEvents() {
    // Navigation buttons
    this.tooltip.querySelector('.tour-next').addEventListener('click', () => this.next());
    this.tooltip.querySelector('.tour-prev').addEventListener('click', () => this.previous());
    this.tooltip.querySelector('.tour-skip').addEventListener('click', () => this.skip());

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (!this.isActive) return;
      
      switch(e.key) {
        case 'ArrowRight':
        case ' ':
          e.preventDefault();
          this.next();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          this.previous();
          break;
        case 'Escape':
          e.preventDefault();
          this.skip();
          break;
      }
    });

    // Window resize
    window.addEventListener('resize', () => {
      if (this.isActive) {
        this.updateHighlight();
      }
    });
  }

  start(tourSteps) {
    this.tourSteps = tourSteps;
    this.currentStep = 0;
    this.isActive = true;
    
    // Show overlay
    this.overlay.style.display = 'block';
    this.overlay.style.opacity = '1';
    
    // Start first step
    setTimeout(() => this.showStep(), 300);
    
    // Mark tour as started
    this.markTourStarted();
  }

  showStep() {
    if (this.currentStep >= this.tourSteps.length) {
      this.complete();
      return;
    }

    const step = this.tourSteps[this.currentStep];
    
    // Update highlight
    this.updateHighlight(step);
    
    // Update tooltip content
    this.updateTooltip(step);
    
    // Show tooltip
    this.showTooltip();
    
    // Auto advance if enabled
    if (this.options.autoAdvance && this.currentStep < this.tourSteps.length - 1) {
      clearTimeout(this.autoAdvanceTimeout);
      this.autoAdvanceTimeout = setTimeout(() => this.next(), this.options.advanceDelay);
    }
  }

  updateHighlight(step) {
    if (!step) {
      this.highlight.style.display = 'none';
      return;
    }

    const element = document.querySelector(step.selector);
    if (!element) {
      console.warn(`Tour element not found: ${step.selector}`);
      this.highlight.style.display = 'none';
      return;
    }

    const rect = element.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

    this.highlight.style.display = 'block';
    this.highlight.style.top = `${rect.top + scrollTop - 5}px`;
    this.highlight.style.left = `${rect.left + scrollLeft - 5}px`;
    this.highlight.style.width = `${rect.width + 10}px`;
    this.highlight.style.height = `${rect.height + 10}px`;

    // Scroll element into view if needed
    if (rect.top < 100 || rect.bottom > window.innerHeight - 100) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  updateTooltip(step) {
    const title = this.tooltip.querySelector('.tour-title');
    const description = this.tooltip.querySelector('.tour-description');
    const progress = this.tooltip.querySelector('.tour-progress');
    const prevBtn = this.tooltip.querySelector('.tour-prev');
    const nextBtn = this.tooltip.querySelector('.tour-next');

    title.textContent = step.title || '';
    description.textContent = step.description || '';
    
    if (this.options.showProgress) {
      progress.textContent = `Step ${this.currentStep + 1} of ${this.tourSteps.length}`;
    } else {
      progress.textContent = '';
    }

    // Update button states
    prevBtn.style.display = this.currentStep === 0 ? 'none' : 'block';
    nextBtn.textContent = this.currentStep === this.tourSteps.length - 1 ? 'Finish' : 'Next';
    
    if (!this.options.showSkip) {
      this.tooltip.querySelector('.tour-skip').style.display = 'none';
    }
  }

  showTooltip() {
    const step = this.tourSteps[this.currentStep];
    const element = document.querySelector(step.selector);
    
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    
    // Calculate tooltip position
    let tooltipTop, tooltipLeft;
    
    if (step.position === 'bottom') {
      tooltipTop = rect.bottom + scrollTop + 15;
      tooltipLeft = rect.left + scrollLeft + (rect.width / 2) - 160; // Center horizontally
    } else if (step.position === 'left') {
      tooltipTop = rect.top + scrollTop + (rect.height / 2) - 60;
      tooltipLeft = rect.left + scrollLeft - 340;
    } else if (step.position === 'right') {
      tooltipTop = rect.top + scrollTop + (rect.height / 2) - 60;
      tooltipLeft = rect.right + scrollLeft + 15;
    } else { // default: top
      tooltipTop = rect.top + scrollTop - 140;
      tooltipLeft = rect.left + scrollLeft + (rect.width / 2) - 160; // Center horizontally
    }

    // Adjust if tooltip goes off screen
    if (tooltipLeft < 10) tooltipLeft = 10;
    if (tooltipLeft + 320 > window.innerWidth - 10) tooltipLeft = window.innerWidth - 330;
    if (tooltipTop < 10) tooltipTop = rect.bottom + scrollTop + 15;
    if (tooltipTop + 200 > window.innerHeight + scrollTop - 10) {
      tooltipTop = rect.top + scrollTop - 140;
    }

    this.tooltip.style.top = `${tooltipTop}px`;
    this.tooltip.style.left = `${tooltipLeft}px`;
    this.tooltip.style.display = 'block';
    
    // Animate in
    setTimeout(() => {
      this.tooltip.style.opacity = '1';
      this.tooltip.style.transform = 'scale(1) translateY(0)';
    }, 50);
  }

  next() {
    clearTimeout(this.autoAdvanceTimeout);
    this.currentStep++;
    this.showStep();
  }

  previous() {
    clearTimeout(this.autoAdvanceTimeout);
    if (this.currentStep > 0) {
      this.currentStep--;
      this.showStep();
    }
  }

  skip() {
    clearTimeout(this.autoAdvanceTimeout);
    this.end();
    this.markTourSkipped();
  }

  complete() {
    clearTimeout(this.autoAdvanceTimeout);
    this.end();
    this.markTourCompleted();
  }

  end() {
    this.isActive = false;
    
    // Hide elements with animation
    this.tooltip.style.opacity = '0';
    this.tooltip.style.transform = 'scale(0.9) translateY(10px)';
    this.overlay.style.opacity = '0';
    
    setTimeout(() => {
      this.overlay.style.display = 'none';
      this.highlight.style.display = 'none';
      this.tooltip.style.display = 'none';
    }, 300);
  }

  markTourStarted() {
    localStorage.setItem('shikola_tour_status', 'started');
    try {
      const token = localStorage.getItem('shikola_token');
      if (token) {
        const base = window.SHIKOLA_API_BASE || '/api';
        fetch(`${base}/api/admin/tour`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ action: 'started' })
        }).catch(() => {});
      }
    } catch (e) {}
  }

  markTourCompleted() {
    localStorage.setItem('shikola_tour_status', 'completed');
    localStorage.setItem('shikola_tour_completed_at', new Date().toISOString());
    try {
      const token = localStorage.getItem('shikola_token');
      if (token) {
        const base = window.SHIKOLA_API_BASE || '/api';
        fetch(`${base}/api/admin/tour`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ action: 'completed' })
        }).catch(() => {});
      }
    } catch (e) {}
  }

  markTourSkipped() {
    localStorage.setItem('shikola_tour_status', 'skipped');
    try {
      const token = localStorage.getItem('shikola_token');
      if (token) {
        const base = window.SHIKOLA_API_BASE || '/api';
        fetch(`${base}/api/admin/tour`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ action: 'skipped' })
        }).catch(() => {});
      }
    } catch (e) {}
  }

  static shouldShowTour() {
    const status = localStorage.getItem('shikola_tour_status');
    const showTour = sessionStorage.getItem('showTour');
    return showTour === 'true' || (!status && showTour !== 'false');
  }

  static hasCompletedTour() {
    return localStorage.getItem('shikola_tour_status') === 'completed';
  }
}

// Predefined tour configurations
const TOURS = {
  schoolAdmin: [
    {
      selector: '.user-profile',
      title: 'Welcome to Your Dashboard!',
      description: 'This is your school admin dashboard. From here, you can manage every aspect of your school.',
      position: 'bottom'
    },
    {
      selector: '.nav-menu',
      title: 'Navigation Menu',
      description: 'Use this menu to access different modules like classes, students, teachers, and reports.',
      position: 'right'
    },
    {
      selector: '.quick-stats',
      title: 'Quick Statistics',
      description: 'Get an instant overview of your school with key metrics like student count, attendance rates, and more.',
      position: 'bottom'
    },
    {
      selector: '.recent-activities',
      title: 'Recent Activities',
      description: 'Stay updated with the latest activities happening in your school.',
      position: 'left'
    },
    {
      selector: '.classes-card',
      title: 'Classes Management',
      description: 'Click here to manage classes, add new classes, and view class details.',
      position: 'bottom'
    },
    {
      selector: '.students-card',
      title: 'Student Management',
      description: 'Manage student records, enrollments, and track academic progress.',
      position: 'bottom'
    },
    {
      selector: '.teachers-card',
      title: 'Teacher Management',
      description: 'Manage teacher profiles, assignments, and schedules.',
      position: 'bottom'
    },
    {
      selector: '.finance-card',
      title: 'Financial Overview',
      description: 'Monitor fees, payments, and generate financial reports.',
      position: 'bottom'
    },
    {
      selector: '.reports-section',
      title: 'Reports & Analytics',
      description: 'Generate comprehensive reports and analyze school performance.',
      position: 'top'
    },
    {
      selector: '.settings-btn',
      title: 'Settings',
      description: 'Configure system settings, user preferences, and school policies.',
      position: 'left'
    }
  ]
};

// Global tour instance
window.shikolaTour = null;

// Helper functions
window.startShikolaTour = function(tourType = 'schoolAdmin') {
  if (window.shikolaTour) {
    window.shikolaTour.end();
  }
  
  const tourSteps = TOURS[tourType] || [];
  if (tourSteps.length === 0) {
    console.warn(`No tour steps found for: ${tourType}`);
    return;
  }
  
  window.shikolaTour = new ShikolaTour();
  window.shikolaTour.start(tourSteps);
};

window.checkAndStartTour = function(tourType = 'schoolAdmin') {
  if (ShikolaTour.shouldShowTour()) {
    setTimeout(() => {
      startShikolaTour(tourType);
    }, 1000);
  }
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ShikolaTour, TOURS };
}
