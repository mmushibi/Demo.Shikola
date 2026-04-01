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
 * Zambian Events API for Real-time Calendar Integration
 * Provides real Zambian holidays, events, and observances
 */

class ZambianEventsAPI {
    constructor() {
        this.events = [];
        this.lastUpdated = null;
        this.cacheTimeout = 24 * 60 * 60 * 1000; // 24 hours
    }

    // Fixed Zambian holidays (same every year)
    getFixedHolidays() {
        return [
            { month: 0, day: 1, label: "New Year's Day", type: 'public_holiday' },
            { month: 2, day: 8, label: "International Women's Day", type: 'observance' },
            { month: 2, day: 12, label: "Youth Day", type: 'public_holiday' },
            { month: 4, day: 1, label: "Labour Day", type: 'public_holiday' },
            { month: 5, day: 25, label: "Africa Day", type: 'observance' },
            { month: 7, day: 7, label: "Heroes' Day", type: 'public_holiday' },
            { month: 7, day: 8, label: "Unity Day", type: 'public_holiday' },
            { month: 9, day: 24, label: "Independence Day", type: 'public_holiday' },
            { month: 10, day: 18, label: "National Prayer Day", type: 'observance' },
            { month: 11, day: 24, label: "Christmas Eve", type: 'observance' },
            { month: 11, day: 25, label: "Christmas Day", type: 'public_holiday' },
            { month: 11, day: 26, label: "Boxing Day", type: 'public_holiday' }
        ];
    }

    // Calculate Easter Sunday and related holidays
    calculateEaster(year) {
        // Anonymous Gregorian algorithm
        const a = year % 19;
        const b = Math.floor(year / 100);
        const c = year % 100;
        const d = Math.floor(b / 4);
        const e = b % 4;
        const f = Math.floor((b + 8) / 25);
        const g = Math.floor((b - f + 1) / 3);
        const h = (19 * a + b - d - g + 15) % 30;
        const i = Math.floor(c / 4);
        const k = c % 4;
        const l = (32 + 2 * e + 2 * i - h - k) % 7;
        const m = Math.floor((a + 11 * h + 22 * l) / 451);
        const month = Math.floor((h + l - 7 * m + 114) / 31);
        const day = ((h + l - 7 * m + 114) % 31) + 1;
        
        const easter = new Date(year, month - 1, day);
        
        return {
            easter: easter,
            goodFriday: new Date(easter.getTime() - (2 * 24 * 60 * 60 * 1000)),
            easterMonday: new Date(easter.getTime() + (24 * 60 * 60 * 1000))
        };
    }

    // Get movable holidays for a specific year
    getMovableHolidays(year) {
        const easter = this.calculateEaster(year);
        
        return [
            { date: easter.goodFriday, label: "Good Friday", type: 'public_holiday' },
            { date: easter.easterMonday, label: "Easter Monday", type: 'public_holiday' }
        ];
    }

    // Get school term dates (approximate, can be customized by school)
    getSchoolTerms(year) {
        return [
            { start: new Date(year, 0, 15), end: new Date(year, 3, 10), label: "Term 1", type: 'school_term' },
            { start: new Date(year, 4, 10), end: new Date(year, 7, 10), label: "Term 2", type: 'school_term' },
            { start: new Date(year, 8, 5), end: new Date(year, 11, 5), label: "Term 3", type: 'school_term' }
        ];
    }

    // Get Zambian cultural events and festivals
    getCulturalEvents(year) {
        return [
            { date: new Date(year, 2, 20), label: "Zambia Day", type: 'cultural' },
            { date: new Date(year, 4, 25), label: "Zambia International Trade Fair", type: 'cultural' },
            { date: new Date(year, 8, 9), label: "Farmers' Day", type: 'observance' },
            { date: new Date(year, 9, 18), label: "National Day of Prayer", type: 'religious' },
            { date: new Date(year, 10, 24), label: "Zambia's Republic Day", type: 'cultural' }
        ];
    }

    // Get exam periods
    getExamPeriods(year) {
        return [
            { start: new Date(year, 3, 15), end: new Date(year, 3, 30), label: "Term 1 Exams", type: 'exam_period' },
            { start: new Date(year, 7, 15), end: new Date(year, 7, 31), label: "Term 2 Exams", type: 'exam_period' },
            { start: new Date(year, 11, 10), end: new Date(year, 11, 25), label: "Term 3 Exams", type: 'exam_period' }
        ];
    }

    // Fetch all events for a given year
    async getEventsForYear(year) {
        // Check cache first
        const cacheKey = `zambian_events_${year}`;
        const cached = localStorage.getItem(cacheKey);
        
        if (cached) {
            const data = JSON.parse(cached);
            if (Date.now() - data.timestamp < this.cacheTimeout) {
                return data.events;
            }
        }

        // Generate events
        const events = [];

        // Add fixed holidays
        this.getFixedHolidays().forEach(holiday => {
            events.push({
                id: `holiday_${holiday.month}_${holiday.day}`,
                date: new Date(year, holiday.month, holiday.day),
                label: holiday.label,
                type: holiday.type,
                allDay: true
            });
        });

        // Add movable holidays
        this.getMovableHolidays(year).forEach(holiday => {
            events.push({
                id: `movable_${holiday.label.toLowerCase().replace(/\s+/g, '_')}`,
                date: holiday.date,
                label: holiday.label,
                type: holiday.type,
                allDay: true
            });
        });

        // Add school terms
        this.getSchoolTerms(year).forEach(term => {
            events.push({
                id: `term_${term.label.toLowerCase().replace(/\s+/g, '_')}`,
                start: term.start,
                end: term.end,
                label: term.label,
                type: term.type,
                allDay: true
            });
        });

        // Add cultural events
        this.getCulturalEvents(year).forEach(event => {
            events.push({
                id: `cultural_${event.label.toLowerCase().replace(/\s+/g, '_')}`,
                date: event.date,
                label: event.label,
                type: event.type,
                allDay: true
            });
        });

        // Add exam periods
        this.getExamPeriods(year).forEach(exam => {
            events.push({
                id: `exam_${exam.label.toLowerCase().replace(/\s+/g, '_')}`,
                start: exam.start,
                end: exam.end,
                label: exam.label,
                type: exam.type,
                allDay: true
            });
        });

        // Cache the results
        localStorage.setItem(cacheKey, JSON.stringify({
            events: events,
            timestamp: Date.now()
        }));

        return events;
    }

    // Get events for a specific month
    async getEventsForMonth(year, month) {
        const yearEvents = await this.getEventsForYear(year);
        return yearEvents.filter(event => {
            if (event.date) {
                return event.date.getFullYear() === year && event.date.getMonth() === month;
            } else if (event.start && event.end) {
                const eventStart = event.start;
                const eventEnd = event.end;
                const monthStart = new Date(year, month, 1);
                const monthEnd = new Date(year, month + 1, 0);
                
                return (eventStart <= monthEnd && eventEnd >= monthStart);
            }
            return false;
        });
    }

    // Get events for a specific date
    async getEventsForDate(date) {
        const yearEvents = await this.getEventsForYear(date.getFullYear());
        return yearEvents.filter(event => {
            if (event.date) {
                return this.isSameDay(event.date, date);
            } else if (event.start && event.end) {
                return date >= event.start && date <= event.end;
            }
            return false;
        });
    }

    // Check if two dates are the same day
    isSameDay(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }

    // Get event type styling
    getEventTypeStyle(type) {
        const styles = {
            'public_holiday': 'bg-red-100 text-red-700 border-red-200',
            'observance': 'bg-blue-100 text-blue-700 border-blue-200',
            'cultural': 'bg-purple-100 text-purple-700 border-purple-200',
            'religious': 'bg-yellow-100 text-yellow-700 border-yellow-200',
            'school_term': 'bg-green-100 text-green-700 border-green-200',
            'exam_period': 'bg-orange-100 text-orange-700 border-orange-200'
        };
        return styles[type] || 'bg-slate-100 text-slate-700 border-slate-200';
    }

    // Get event icon
    getEventIcon(type) {
        const icons = {
            'public_holiday': 'fas fa-flag',
            'observance': 'fas fa-calendar-day',
            'cultural': 'fas fa-music',
            'religious': 'fas fa-pray',
            'school_term': 'fas fa-school',
            'exam_period': 'fas fa-clipboard-list'
        };
        return icons[type] || 'fas fa-calendar';
    }
}

// Export for use in the application
window.ZambianEventsAPI = ZambianEventsAPI;
