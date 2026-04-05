/*
Pupil Timetable Integration
Provides Alpine.js components and data binding for timetable page
*/

function pupilTimetablePage() {
    return {
        activeView: 'today',
        selectedClass: 'Grade 9A',
        selectedAcademicYear: '2026',
        selectedTerm: 'Term 1',
        selectedSubjects: [],
        selectedTeachers: [],
        selectedRooms: [],
        includeBreaks: true,
        includeOptional: false,
        sortBy: 'time',
        showAdvancedFilters: false,
        loading: false,
        hasTimetable: true,
        lockClassSelection: false,
        todayLabel: '',
        academicTerm: 'Term 1',
        academicYear: '2026',
        timetableData: null,
        todaySlots: [],
        weekGrid: [],
        weekdays: [
            { key: 'mon', label: 'Mon' },
            { key: 'tue', label: 'Tue' },
            { key: 'wed', label: 'Wed' },
            { key: 'thu', label: 'Thu' },
            { key: 'fri', label: 'Fri' }
        ],
        monthLabel: '',
        currentMonth: new Date(),
        
        // Options for filters
        classOptions: ['Grade 7A', 'Grade 7B', 'Grade 8A', 'Grade 8B', 'Grade 9A', 'Grade 9B', 'Grade 10A', 'Grade 10B'],
        academicYearOptions: ['2024', '2025', '2026'],
        subjectOptions: [
            { id: 'math', name: 'Mathematics' },
            { id: 'eng', name: 'English' },
            { id: 'sci', name: 'Science' },
            { id: 'hist', name: 'History' },
            { id: 'geog', name: 'Geography' },
            { id: 'civic', name: 'Civic Education' },
            { id: 'art', name: 'Art' },
            { id: 'pe', name: 'Physical Education' }
        ],
        teacherOptions: [
            { id: 't1', name: 'Mr. Mulenga' },
            { id: 't2', name: 'Ms. Phiri' },
            { id: 't3', name: 'Mr. Chanda' },
            { id: 't4', name: 'Ms. Tembo' },
            { id: 't5', name: 'Mr. Nkhata' }
        ],
        roomOptions: [
            { id: 'r101', name: 'Room 101' },
            { id: 'r102', name: 'Room 102' },
            { id: 'r103', name: 'Room 103' },
            { id: 'r104', name: 'Room 104' },
            { id: 'r105', name: 'Room 105' },
            { id: 'lab201', name: 'Lab 201' }
        ],
        
        init() {
            this.loadTimetableData();
            this.setTodayLabel();
            this.setMonthLabel();
            
            // Listen for mock data initialization
            window.addEventListener('pupil:mock-data-initialized', () => {
                this.loadTimetableData();
            });
            
            // Update today's label every minute
            setInterval(() => {
                this.setTodayLabel();
            }, 60000);
        },
        
        loadTimetableData() {
            this.loading = true;
            
            try {
                const data = JSON.parse(localStorage.getItem('pupil_timetable_data') || '{}');
                if (data.today && data.week) {
                    this.timetableData = data;
                } else {
                    // Use mock data if not available
                    this.timetableData = window.PupilMockData?.timetable || {
                        today: [],
                        week: []
                    };
                }
                
                this.processTimetableData();
            } catch (error) {
                console.error('Error loading timetable data:', error);
                this.hasTimetable = false;
            } finally {
                this.loading = false;
            }
        },
        
        processTimetableData() {
            // Process today's schedule
            this.todaySlots = this.timetableData.today || [];
            
            // Process week grid
            this.weekGrid = this.timetableData.week || [];
            
            // Add time status information
            this.todaySlots = this.todaySlots.map(slot => ({
                ...slot,
                status: this.getClassStatus(slot)
            }));
        },
        
        setTodayLabel() {
            const today = new Date();
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            this.todayLabel = today.toLocaleDateString('en-US', options);
        },
        
        setMonthLabel() {
            const options = { month: 'long', year: 'numeric' };
            this.monthLabel = this.currentMonth.toLocaleDateString('en-US', options);
        },
        
        getClassStatus(slot) {
            const now = new Date();
            const startTime = new Date();
            const [startHour, startMin] = slot.startTime.split(':');
            startTime.setHours(parseInt(startHour), parseInt(startMin), 0, 0);
            
            const endTime = new Date();
            const [endHour, endMin] = slot.endTime.split(':');
            endTime.setHours(parseInt(endHour), parseInt(endMin), 0, 0);
            
            if (now >= startTime && now <= endTime) {
                return 'in-progress';
            } else if (now < startTime) {
                return 'upcoming';
            } else {
                return 'completed';
            }
        },
        
        getTimeUntilClass(startTime) {
            const now = new Date();
            const classTime = new Date();
            const [hour, min] = startTime.split(':');
            classTime.setHours(parseInt(hour), parseInt(min), 0, 0);
            
            const diffMs = classTime.getTime() - now.getTime();
            const diffMins = Math.floor(diffMs / 60000);
            
            if (diffMins < 0) return 'Ended';
            if (diffMins === 0) return 'Now';
            if (diffMins < 60) return `In ${diffMins} min`;
            
            const hours = Math.floor(diffMins / 60);
            const mins = diffMins % 60;
            return `In ${hours}h ${mins}min`;
        },
        
        onFiltersChange() {
            this.processTimetableData();
        },
        
        toggleAdvancedFilters() {
            this.showAdvancedFilters = !this.showAdvancedFilters;
        },
        
        getActiveFiltersCount() {
            let count = 0;
            if (this.selectedSubjects.length > 0) count++;
            if (this.selectedTeachers.length > 0) count++;
            if (this.selectedRooms.length > 0) count++;
            if (!this.includeBreaks) count++;
            if (this.includeOptional) count++;
            if (this.sortBy !== 'time') count++;
            return count;
        },
        
        clearAllFilters() {
            this.selectedSubjects = [];
            this.selectedTeachers = [];
            this.selectedRooms = [];
            this.includeBreaks = true;
            this.includeOptional = false;
            this.sortBy = 'time';
            this.processTimetableData();
        },
        
        prevMonth() {
            this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1);
            this.setMonthLabel();
        },
        
        nextMonth() {
            this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1);
            this.setMonthLabel();
        }
    };
}
