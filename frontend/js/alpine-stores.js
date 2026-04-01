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
// Alpine.js stores and global functions for Shikola

// Dark mode store
document.addEventListener('alpine:init', () => {
    Alpine.store('darkMode', {
        isDark: false,

        toggle() {
            this.isDark = !this.isDark
            this.update()
        },

        set(value) {
            this.isDark = value
            this.update()
        },

        update() {
            if (this.isDark) {
                document.documentElement.classList.add('dark')
                localStorage.setItem('darkMode', 'true')
            } else {
                document.documentElement.classList.remove('dark')
                localStorage.setItem('darkMode', 'false')
            }
        },

        init() {
            // Force light mode on initialization
            this.isDark = false
            localStorage.setItem('darkMode', 'false')
            this.update()
        }
    })
})

// App state component
function appState() {
    return {
        darkMode: false,
        scrollY: 0,
        cursorEnabled: false,
        cursorVisible: true,
        cursorVariant: 'default',
        cursorX: 0,
        cursorY: 0,
        mobileNav: false,
        searchQuery: '',
        showSuggestions: false,
        hoveringSuggestions: false,
        highlightedSuggestion: -1,
        filteredSuggestions: [],
        suggestions: [
            'School Search',
            'Find Schools',
            'School Directory',
            'Popular Schools',
            'Schools by City',
            'School Administration',
            'Student Management',
            'Fee Tracking',
            'Parent Communication',
            'Teacher Portal',
            'Exam Results',
            'Report Cards',
            'Timetable Management',
            'Attendance Tracking',
            'Financial Reports'
        ],

        init() {
            this.initDarkMode()
            this.initCursor()
            this.initSearch()
        },

        initDarkMode() {
            // Force light mode
            this.darkMode = false
            localStorage.setItem('darkMode', 'false')
        },

        toggleDarkMode() {
            this.darkMode = !this.darkMode
            localStorage.setItem('darkMode', this.darkMode ? 'true' : 'false')
        },

        initCursor() {
            // Only enable custom cursor on desktop
            if (window.matchMedia('(pointer: fine)').matches) {
                this.cursorEnabled = true
                document.body.classList.add('custom-cursor-active')
            }
        },

        handleMouseMove(event) {
            if (!this.cursorEnabled) return
            
            this.cursorX = event.clientX
            this.cursorY = event.clientY
            this.cursorVisible = true

            // Update cursor variant based on element
            const target = event.target
            if (target.tagName === 'A' || target.tagName === 'BUTTON' || target.closest('a, button')) {
                this.cursorVariant = 'interactive'
            } else if (target.tagName.match(/INPUT|TEXTAREA|SELECT/) || target.closest('input, textarea, select')) {
                this.cursorVariant = 'text'
            } else {
                this.cursorVariant = 'default'
            }
        },

        handleMouseLeave() {
            this.cursorVisible = false
        },

        initSearch() {
            this.filteredSuggestions = this.suggestions
        },

        filterSuggestions(show = false) {
            if (show || this.searchQuery.trim()) {
                const query = this.searchQuery.toLowerCase()
                this.filteredSuggestions = this.suggestions.filter(s => 
                    s.toLowerCase().includes(query)
                )
                this.showSuggestions = true
                this.highlightedSuggestion = -1
            } else {
                this.hideSuggestions()
            }
        },

        hideSuggestions() {
            setTimeout(() => {
                if (!this.hoveringSuggestions) {
                    this.showSuggestions = false
                    this.highlightedSuggestion = -1
                }
            }, 150)
        },

        highlightNextSuggestion() {
            if (this.filteredSuggestions.length === 0) return
            this.highlightedSuggestion = Math.min(this.highlightedSuggestion + 1, this.filteredSuggestions.length - 1)
        },

        highlightPrevSuggestion() {
            if (this.filteredSuggestions.length === 0) return
            this.highlightedSuggestion = Math.max(this.highlightedSuggestion - 1, -1)
        },

        useHighlightedSuggestion() {
            if (this.highlightedSuggestion >= 0 && this.highlightedSuggestion < this.filteredSuggestions.length) {
                this.selectSuggestion(this.filteredSuggestions[this.highlightedSuggestion])
            }
        },

        selectSuggestion(suggestion) {
            this.searchQuery = suggestion
            this.showSuggestions = false
            this.highlightedSuggestion = -1
            
            // Handle school search suggestions
            if (suggestion.includes('School') || suggestion.includes('Find') || suggestion.includes('Directory')) {
                this.initSchoolSearch()
            }
            
            console.log('Selected:', suggestion)
        },

        // School search functionality
        schoolSearchResults: [],
        showSchoolResults: false,
        loadingSchools: false,
        schoolSearchError: null,

        async initSchoolSearch() {
            if (!this.searchService) {
                this.searchService = new SchoolSearchService()
            }
            
            this.showSchoolResults = true
            await this.loadPopularSchools()
        },

        async loadPopularSchools() {
            this.loadingSchools = true
            this.schoolSearchError = null
            
            try {
                this.schoolSearchResults = await this.searchService.getPopularSchools(8)
            } catch (error) {
                console.error('Error loading popular schools:', error)
                this.schoolSearchError = 'Failed to load schools'
            } finally {
                this.loadingSchools = false
            }
        },

        async searchSchools(query, limit = 10) {
            this.loadingSchools = true
            this.schoolSearchError = null
            
            try {
                const results = await this.searchService.searchSchools(query, limit)
                this.schoolSearchResults = results
                this.showSchoolResults = true
            } catch (error) {
                console.error('Error searching schools:', error)
                this.schoolSearchError = 'Failed to search schools'
            } finally {
                this.loadingSchools = false
            }
        },

        closeModal() {
            // Close any open modals
            document.querySelectorAll('[x-show]').forEach(el => {
                if (el._x_dataStack && el._x_dataStack[0].showModal === true) {
                    el._x_dataStack[0].showModal = false
                }
            })
        }
    }
}

// Initialize app
function initApp() {
    // Force light mode on initialization
    document.documentElement.classList.remove('dark')
    localStorage.setItem('darkMode', 'false')

    // Initialize other app features
    console.log('Shikola app initialized - Light mode forced')
}

// Global functions
window.handleMouseMove = function(event) {
    if (window.appState && typeof window.appState.handleMouseMove === 'function') {
        window.appState.handleMouseMove(event)
    }
}

window.handleMouseLeave = function() {
    if (window.appState && typeof window.appState.handleMouseLeave === 'function') {
        window.appState.handleMouseLeave()
    }
}

window.closeModal = function() {
    if (window.appState && typeof window.appState.closeModal === 'function') {
        window.appState.closeModal()
    }
}

// Make functions globally available
window.appState = appState
window.initApp = initApp
