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
// School Search Functionality for Public Index Page

class SchoolSearchService {
    constructor() {
        this.apiBaseUrl = '/api/public';
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes cache
        this.debounceTimeout = 300; // 300ms debounce
        this.debounceTimer = null;
    }

    // Get cache key for search requests
    getCacheKey(query, limit = 10) {
        return `search_${query}_${limit}`;
    }

    // Check if cached data is still valid
    isCacheValid(cacheEntry) {
        return Date.now() - cacheEntry.timestamp < this.cacheTimeout;
    }

    // Search schools with autocomplete
    async searchSchools(query, limit = 10) {
        const cacheKey = this.getCacheKey(query, limit);
        
        // Check cache first
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (this.isCacheValid(cached)) {
                return cached.data;
            }
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/schools/search?query=${encodeURIComponent(query)}&limit=${limit}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Cache the results
            this.cache.set(cacheKey, {
                data: data,
                timestamp: Date.now()
            });
            
            return data;
        } catch (error) {
            console.error('Error searching schools:', error);
            return [];
        }
    }

    // Get school details by ID
    async getSchoolDetails(schoolId) {
        const cacheKey = `details_${schoolId}`;
        
        // Check cache first
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (this.isCacheValid(cached)) {
                return cached.data;
            }
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/schools/${schoolId}`);
            
            if (!response.ok) {
                if (response.status === 404) {
                    return null;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Cache the results
            this.cache.set(cacheKey, {
                data: data,
                timestamp: Date.now()
            });
            
            return data;
        } catch (error) {
            console.error('Error getting school details:', error);
            return null;
        }
    }

    // Get popular schools for homepage
    async getPopularSchools(limit = 8) {
        const cacheKey = `popular_${limit}`;
        
        // Check cache first
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (this.isCacheValid(cached)) {
                return cached.data;
            }
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/schools/popular?limit=${limit}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Cache the results
            this.cache.set(cacheKey, {
                data: data,
                timestamp: Date.now()
            });
            
            return data;
        } catch (error) {
            console.error('Error getting popular schools:', error);
            return [];
        }
    }

    // Get schools by city
    async getSchoolsByCity(city, limit = 20) {
        const cacheKey = `city_${city}_${limit}`;
        
        // Check cache first
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (this.isCacheValid(cached)) {
                return cached.data;
            }
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/schools/by-city?city=${encodeURIComponent(city)}&limit=${limit}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Cache the results
            this.cache.set(cacheKey, {
                data: data,
                timestamp: Date.now()
            });
            
            return data;
        } catch (error) {
            console.error('Error getting schools by city:', error);
            return [];
        }
    }

    // Debounced search function
    debouncedSearch(query, callback, limit = 10) {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(async () => {
            const results = await this.searchSchools(query, limit);
            callback(results);
        }, this.debounceTimeout);
    }

    // Clear cache
    clearCache() {
        this.cache.clear();
    }

    // Format school name for display
    formatSchoolName(school) {
        return school.name || school.Name || 'Unknown School';
    }

    // Format school location
    formatSchoolLocation(school) {
        const city = school.city || school.City;
        const address = school.address || school.Address;
        
        if (city && address) {
            return `${address}, ${city}`;
        } else if (city) {
            return city;
        } else if (address) {
            return address;
        }
        
        return 'Location not available';
    }

    // Get school logo URL
    getSchoolLogo(school) {
        const logo = school.logo || school.Logo;
        if (logo) {
            // If it's a full URL, return as is
            if (logo.startsWith('http')) {
                return logo;
            }
            // Otherwise, assume it's a relative path
            return logo;
        }
        
        // Return default logo
        return '../assets/images/school-default.png';
    }

    // Create school card HTML
    createSchoolCard(school) {
        const logo = this.getSchoolLogo(school);
        const name = this.formatSchoolName(school);
        const location = this.formatSchoolLocation(school);
        const tagline = school.tagline || school.Tagline || '';
        
        return `
            <div class="school-card bg-white rounded-2xl border border-primary-100 p-6 shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer" data-school-id="${school.id || school.Id}">
                <div class="flex items-start gap-4">
                    <div class="flex-shrink-0">
                        <img src="${logo}" alt="${name}" class="w-16 h-16 rounded-xl object-cover border border-primary-100" onerror="this.src='../assets/images/school-default.png'">
                    </div>
                    <div class="flex-1 min-w-0">
                        <h3 class="text-lg font-semibold text-dark truncate">${name}</h3>
                        <p class="text-sm text-slate-500 mt-1">${location}</p>
                        ${tagline ? `<p class="text-xs text-slate-400 mt-2 line-clamp-2">${tagline}</p>` : ''}
                        <div class="flex items-center gap-4 mt-3 text-xs text-slate-400">
                            <span class="flex items-center gap-1">
                                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                                </svg>
                                ${school.code || school.Code || 'N/A'}
                            </span>
                            ${school.city || school.City ? `
                                <span class="flex items-center gap-1">
                                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                    </svg>
                                    ${school.city || school.City}
                                </span>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

// Alpine.js component for school search
function schoolSearchComponent() {
    return {
        searchService: new SchoolSearchService(),
        searchQuery: '',
        showSuggestions: false,
        hoveringSuggestions: false,
        highlightedSuggestion: -1,
        searchResults: [],
        popularSchools: [],
        loading: false,
        error: null,
        selectedSchool: null,
        showSchoolDetails: false,

        init() {
            this.loadPopularSchools();
            this.setupEventListeners();
        },

        async loadPopularSchools() {
            this.loading = true;
            try {
                this.popularSchools = await this.searchService.getPopularSchools(8);
            } catch (error) {
                console.error('Error loading popular schools:', error);
                this.error = 'Failed to load popular schools';
            } finally {
                this.loading = false;
            }
        },

        setupEventListeners() {
            // Handle click outside to close suggestions
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.school-search-container')) {
                    this.hideSuggestions();
                }
            });
        },

        async handleSearchInput() {
            const query = this.searchQuery.trim();
            
            if (query.length < 2) {
                this.hideSuggestions();
                this.searchResults = [];
                return;
            }

            this.loading = true;
            this.error = null;

            // Use debounced search
            this.searchService.debouncedSearch(query, (results) => {
                this.searchResults = results;
                this.showSuggestions = true;
                this.highlightedSuggestion = -1;
                this.loading = false;
            }, 10);
        },

        hideSuggestions() {
            setTimeout(() => {
                if (!this.hoveringSuggestions) {
                    this.showSuggestions = false;
                    this.highlightedSuggestion = -1;
                }
            }, 150);
        },

        selectSchool(school) {
            this.selectedSchool = school;
            this.searchQuery = this.searchService.formatSchoolName(school);
            this.showSuggestions = false;
            this.showSchoolDetails = true;
        },

        highlightNextSuggestion() {
            if (this.searchResults.length === 0) return;
            this.highlightedSuggestion = Math.min(this.highlightedSuggestion + 1, this.searchResults.length - 1);
        },

        highlightPrevSuggestion() {
            if (this.searchResults.length === 0) return;
            this.highlightedSuggestion = Math.max(this.highlightedSuggestion - 1, -1);
        },

        useHighlightedSuggestion() {
            if (this.highlightedSuggestion >= 0 && this.highlightedSuggestion < this.searchResults.length) {
                this.selectSchool(this.searchResults[this.highlightedSuggestion]);
            }
        },

        async viewSchoolDetails(schoolId) {
            const school = await this.searchService.getSchoolDetails(schoolId);
            if (school) {
                this.selectSchool(school);
            } else {
                this.error = 'School not found';
            }
        },

        closeModal() {
            this.showSchoolDetails = false;
            this.selectedSchool = null;
        },

        getSchoolLogo(school) {
            return this.searchService.getSchoolLogo(school);
        },

        formatSchoolLocation(school) {
            return this.searchService.formatSchoolLocation(school);
        },

        createSchoolCard(school) {
            return this.searchService.createSchoolCard(school);
        }
    };
}

// Make the component available globally
window.schoolSearchComponent = schoolSearchComponent;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('School search functionality loaded');
});
