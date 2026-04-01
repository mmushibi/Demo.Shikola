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
// Alpine.js Data Function
function appData() {
    return {
        mobileMenuOpen: false,
        activeModal: null,
        currentYear: new Date().getFullYear(),
        // Sync with <html> class so toggling always flips correctly
        isDark: !document.documentElement.classList.contains('light'),

        // Auth forms (multi-tenant: include school code/id)
        signInForm: {
            schoolCode: '',
            identifier: '', // email or username
            password: '',
            role: 'admin'
        },
        signUpForm: {
            schoolName: '',
            schoolCode: '',
            fullName: '',
            identifier: '', // email or username
            password: '',
            confirmPassword: ''
        },
        forgotForm: {
            schoolCode: '',
            identifier: '' // email or username
        },
        demoForm: {
            firstName: '',
            lastName: '',
            schoolName: '',
            email: '',
            phone: '',
            preferredTime: '',
            studentCount: '',
            message: ''
        },

        // Initialize animations on page load
        init() {
            this.observeElements();
        },

        // Observe elements for scroll animations
        observeElements() {
            const options = {
                threshold: 0.1,
                rootMargin: '0px 0px -100px 0px'
            };

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }
                });
            }, options);

            document.querySelectorAll('.animate-fade-up').forEach(el => {
                observer.observe(el);
            });
        },

        // Smooth scroll to sections
        scrollToSection(sectionId) {
            const element = document.getElementById(sectionId);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
                this.mobileMenuOpen = false;
            }
        },

        // Open a named modal
        openModal(name) {
            this.activeModal = name;
            document.documentElement.classList.add('overflow-hidden');
        },

        // Close any open modal
        closeModal() {
            this.activeModal = null;
            document.documentElement.classList.remove('overflow-hidden');
        },

        // Toggle between dark and light themes
        toggleTheme() {
            this.isDark = !this.isDark;
            const root = document.documentElement;
            if (this.isDark) {
                root.classList.remove('light');
            } else {
                root.classList.add('light');
            }
        },

        // Handle button clicks
        handleGetStarted() {
            this.openModal('signup');
        },

        handleWatchDemo() {
            console.log('Watch Demo clicked');
        },

        handleSignIn() {
            this.openModal('signin');
        },

        // Form submit handlers with shared auth integration
        async submitSignIn() {
            // Validate form before submission
            if (!window.shikolaFormValidator) {
                console.error('Form validator not available');
                return;
            }

            const rules = {
                identifier: ['required', 'email'],
                password: ['required']
            };

            const validation = window.shikolaFormValidator.validateField(this.signInForm.identifier, rules.identifier);
            if (!validation.isValid) {
                if (window.shikolaErrorHandler) {
                    window.shikolaErrorHandler.showError(validation.message, 'error');
                } else {
                    alert(validation.message);
                }
                return;
            }

            const passwordValidation = window.shikolaFormValidator.validateField(this.signInForm.password, rules.password);
            if (!passwordValidation.isValid) {
                if (window.shikolaErrorHandler) {
                    window.shikolaErrorHandler.showError(passwordValidation.message, 'error');
                } else {
                    alert(passwordValidation.message);
                }
                return;
            }

            // Sanitize inputs
            const identifier = window.shikolaFormValidator.sanitize(this.signInForm.identifier);
            const password = this.signInForm.password; // Don't sanitize password

            // Try shared auth system first
            if (window.shikolaAuth && window.shikolaAuth.signIn) {
                try {
                    const result = await window.shikolaAuth.signIn({
                        identifier: identifier,
                        password: password,
                        portal: this.signInForm.role
                    });

                    if (!result.success) {
                        const errorMessage = window.shikolaErrorHandler ? 
                            window.shikolaErrorHandler.sanitizeError(result.error) : 
                            'Login failed. Please try again.';
                        
                        if (window.shikolaErrorHandler) {
                            window.shikolaErrorHandler.showError(errorMessage, 'error');
                        } else {
                            alert(errorMessage);
                        }
                        return;
                    }

                    // Success - auth system handles redirect
                    return;
                } catch (error) {
                    console.error('Auth system error:', error);
                    // Fall through to authentication fallback
                }
            }

            return;

            // Fallback to authentication logic if system not available
            this.fallbackSignIn(this.signInForm.role, identifier, password);
        },

        fallbackSignIn(role, identifier, password) {
            // Demo authentication disabled - requires real database connection
            alert('Authentication requires backend database connection. Please configure proper authentication.');
            return;
        },

        getPortalForRole(role) {
            const portalMap = {
                'admin': 'school-admin',
                'teacher': 'teacher-portal', 
                'pupil': 'pupil-portal',
                'accountant': 'accountant-portal'
            };
            return portalMap[role] || null;
        },

        submitSignUp() {
            // Generate a workspace code (slug) from the school name for backend use
            const rawName = this.signUpForm.schoolName || '';
            let slug = rawName
                .toString()
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '');

            if (!slug) {
                slug = 'workspace';
            }

            this.signUpForm.schoolCode = slug;

            console.log('Sign up form submitted', this.signUpForm);
            this.closeModal();
        },

        submitForgotPassword() {
            console.log('Forgot password form submitted', this.forgotForm);
            this.closeModal();
        },

        submitDemo() {
            console.log('Demo form submitted', this.demoForm);
            // Here you would typically send the data to your backend
            // For now, we'll just show a success message and close the modal
            alert('Thank you for scheduling a demo! We will contact you within 24 hours to confirm your appointment.');
            this.closeModal();
            // Reset form
            this.demoForm = {
                firstName: '',
                lastName: '',
                schoolName: '',
                email: '',
                phone: '',
                preferredTime: '',
                studentCount: '',
                message: ''
            };
        }
    };
}

// Add smooth scroll behavior
document.addEventListener('DOMContentLoaded', () => {
    // Smooth scroll for anchor links (skip plain "#" links used for modals)
    document.querySelectorAll('a[href^="#"]:not([href="#"])').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Add scroll animation for elements
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.animation = 'fade-in-up 0.8s ease-out forwards';
            }
        });
    }, observerOptions);
    
    document.querySelectorAll('.animate-fade-up').forEach(el => {
        el.style.opacity = '0';
        observer.observe(el);
    });
});

// Utility function for animations
const animationUtils = {
    // Add animation class to element
    addAnimation(element, animationName) {
        element.classList.add(animationName);
    },
    
    // Remove animation class from element
    removeAnimation(element, animationName) {
        element.classList.remove(animationName);
    },
    
    // Trigger animation on hover
    onHoverAnimation(selector, animationName) {
        document.querySelectorAll(selector).forEach(el => {
            el.addEventListener('mouseenter', () => {
                this.addAnimation(el, animationName);
            });
            el.addEventListener('mouseleave', () => {
                this.removeAnimation(el, animationName);
            });
        });
    }
};

// Initialize animations on specific elements
document.addEventListener('DOMContentLoaded', () => {
    // Add pulse animation to feature cards on hover
    animationUtils.onHoverAnimation('.card-hover', 'animate-pulse-glow');

    // Custom cursor follower
    const cursor = document.getElementById('custom-cursor');
    if (cursor) {
        document.addEventListener('mousemove', (event) => {
            const x = event.clientX;
            const y = event.clientY;
            cursor.style.transform = `translate3d(${x - 10}px, ${y - 10}px, 0)`;
        });
    }
});
