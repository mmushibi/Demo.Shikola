/*
Pupil Timetable Data Loader
Auto-generated mock data loader for Shikola Academy
Generated on 2026-04-05 17:33:00
*/

// Initialize timetable data when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadTimetableData();
});

function loadTimetableData() {
    // Wait for mock data to be available
    if (typeof window.ShikolaPupilMockData === 'undefined') {
        setTimeout(loadTimetableData, 100);
        return;
    }

    const mockData = window.ShikolaPupilMockData;
    
    // Set up Alpine.js data for timetable page
    if (typeof window.Alpine !== 'undefined') {
        window.Alpine.data('pupilTimetablePage', () => ({
            activeView: 'today',
            selectedClass: mockData.currentPupil.class_name,
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
            sidebarOpen: false,
            
            // Calendar properties
            currentDate: new Date(),
            currentMonth: new Date().getMonth(),
            currentYear: new Date().getFullYear(),
            
            // Filter options
            classOptions: [mockData.currentPupil.class_name],
            academicYearOptions: ['2026', '2025', '2024'],
            subjectOptions: [
                { id: 'math', name: 'Mathematics' },
                { id: 'english', name: 'English' },
                { id: 'science', name: 'Science' },
                { id: 'biology', name: 'Biology' },
                { id: 'geography', name: 'Geography' },
                { id: 'history', name: 'History' },
                { id: 'social', name: 'Social Studies' },
                { id: 'civic', name: 'Civic Education' },
                { id: 'business', name: 'Business Studies' },
                { id: 'computer', name: 'Computer Studies' }
            ],
            teacherOptions: [
                { id: 'daniel', name: 'Daniel Chileshe' },
                { id: 'elizabeth', name: 'Elizabeth Kalaba' },
                { id: 'rachel', name: 'Rachel Mulenga' },
                { id: 'linda', name: 'Linda Bwalya' },
                { id: 'ruth', name: 'Ruth Simukonda' },
                { id: 'patricia', name: 'Patricia Chanda' },
                { id: 'nancy', name: 'Nancy Chanda' },
                { id: 'william', name: 'William Tembo' },
                { id: 'xavier', name: 'Xavier Bwalya' },
                { id: 'emmanuel', name: 'Emmanuel Mulenga' }
            ],
            roomOptions: [
                { id: 'room201', name: 'Room 201' },
                { id: 'lab1', name: 'Lab 1' },
                { id: 'computer', name: 'Computer Lab' },
                { id: 'library', name: 'Library' },
                { id: 'sports', name: 'Sports Field' }
            ],
            
            // Week days
            weekdays: [
                { key: 'monday', label: 'Mon' },
                { key: 'tuesday', label: 'Tue' },
                { key: 'wednesday', label: 'Wed' },
                { key: 'thursday', label: 'Thu' },
                { key: 'friday', label: 'Fri' }
            ],
            
            init() {
                this.loadTimetableData();
                this.initCalendar();
            },
            
            get todayLabel() {
                const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
                return new Date().toLocaleDateString('en-ZM', options);
            },
            
            get monthLabel() {
                const options = { month: 'long', year: 'numeric' };
                return new Date(this.currentYear, this.currentMonth).toLocaleDateString('en-ZM', options);
            },
            
            get todaySlots() {
                if (!this.selectedClass || !mockData.timetableData[this.selectedClass]) return [];
                
                const today = new Date().getDay();
                const dayMap = { 1: 'monday', 2: 'tuesday', 3: 'wednesday', 4: 'thursday', 5: 'friday' };
                const todayKey = dayMap[today];
                
                if (!todayKey || !mockData.timetableData[this.selectedClass]['Term 1'][todayKey]) return [];
                
                return mockData.timetableData[this.selectedClass]['Term 1'][todayKey].map((slot, index) => ({
                    id: index,
                    startTime: slot.time.split('-')[0],
                    endTime: slot.time.split('-')[1],
                    startLabel: this.formatTime(slot.time.split('-')[0]),
                    periodTime: slot.time,
                    subjectName: slot.subject,
                    subjectCode: this.getSubjectCode(slot.subject),
                    teacherName: slot.teacher,
                    roomName: slot.room,
                    type: slot.type
                }));
            },
            
            get weekGrid() {
                if (!this.selectedClass || !mockData.timetableData[this.selectedClass]) return [];
                
                const timetable = mockData.timetableData[this.selectedClass]['Term 1'];
                const periods = this.getUniquePeriods(timetable);
                
                return periods.map(period => ({
                    periodId: period.id,
                    label: period.label,
                    cells: this.weekdays.map(day => ({
                        dayKey: day.key,
                        slot: timetable[day.key]?.find(slot => slot.time === period.time) || null
                    }))
                }));
            },
            
            getUniquePeriods(timetable) {
                const periods = new Set();
                Object.values(timetable).forEach(daySlots => {
                    daySlots.forEach(slot => periods.add(slot.time));
                });
                
                return Array.from(periods).map((time, index) => ({
                    id: index,
                    time: time,
                    label: this.formatTime(time.split('-')[0])
                })).sort((a, b) => a.time.localeCompare(b.time));
            },
            
            getSubjectCode(subject) {
                const codes = {
                    'Mathematics': 'MATH',
                    'English': 'ENG',
                    'Science': 'SCI',
                    'Biology': 'BIO',
                    'Geography': 'GEO',
                    'History': 'HIST',
                    'Social Studies': 'SS',
                    'Civic Education': 'CE',
                    'Business Studies': 'BS',
                    'Computer Studies': 'CS',
                    'Physical Education': 'PE',
                    'Library/Study': 'LIB',
                    'Club Activities': 'CLUB'
                };
                return codes[subject] || subject.substring(0, 3).toUpperCase();
            },
            
            formatTime(time) {
                const [hours, minutes] = time.split(':');
                const hour = parseInt(hours);
                const ampm = hour >= 12 ? 'PM' : 'AM';
                const displayHour = hour > 12 ? hour - 12 : hour;
                return `${displayHour}:${minutes} ${ampm}`;
            },
            
            getTimeUntilClass(startTime) {
                const now = new Date();
                const [hours, minutes] = startTime.split(':');
                const classTime = new Date();
                classTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                
                const diff = classTime - now;
                if (diff < 0) return 'Ended';
                
                const hoursLeft = Math.floor(diff / (1000 * 60 * 60));
                const minutesLeft = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                
                if (hoursLeft > 0) return `In ${hoursLeft}h ${minutesLeft}m`;
                if (minutesLeft > 0) return `In ${minutesLeft}m`;
                return 'Now';
            },
            
            getClassStatus(slot) {
                if (!slot) return '';
                
                const now = new Date();
                const [startHours, startMinutes] = slot.startTime.split(':');
                const [endHours, endMinutes] = slot.endTime.split(':');
                
                const startTime = new Date();
                startTime.setHours(parseInt(startHours), parseInt(startMinutes), 0, 0);
                
                const endTime = new Date();
                endTime.setHours(parseInt(endHours), parseInt(endMinutes), 0, 0);
                
                if (now >= startTime && now <= endTime) return 'in-progress';
                if (now < startTime) return 'upcoming';
                return 'completed';
            },
            
            loadTimetableData() {
                this.loading = true;
                
                setTimeout(() => {
                    this.hasTimetable = true;
                    this.loading = false;
                }, 500);
            },
            
            onFiltersChange() {
                this.loadTimetableData();
            },
            
            toggleAdvancedFilters() {
                this.showAdvancedFilters = !this.showAdvancedFilters;
            },
            
            getActiveFiltersCount() {
                let count = 0;
                if (this.selectedSubjects.length > 0) count++;
                if (this.selectedTeachers.length > 0) count++;
                if (this.selectedRooms.length > 0) count++;
                if (this.includeBreaks) count++;
                if (this.includeOptional) count++;
                return count;
            },
            
            clearAllFilters() {
                this.selectedSubjects = [];
                this.selectedTeachers = [];
                this.selectedRooms = [];
                this.includeBreaks = true;
                this.includeOptional = false;
                this.sortBy = 'time';
                this.onFiltersChange();
            },
            
            // Calendar methods
            initCalendar() {
                this.updateCalendar();
            },
            
            prevMonth() {
                this.currentMonth--;
                if (this.currentMonth < 0) {
                    this.currentMonth = 11;
                    this.currentYear--;
                }
                this.updateCalendar();
            },
            
            nextMonth() {
                this.currentMonth++;
                if (this.currentMonth > 11) {
                    this.currentMonth = 0;
                    this.currentYear++;
                }
                this.updateCalendar();
            },
            
            updateCalendar() {
                // This would update the calendar view
                // Implementation depends on the calendar HTML structure
            },
            
            get calendarDays() {
                const firstDay = new Date(this.currentYear, this.currentMonth, 1);
                const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
                const prevLastDay = new Date(this.currentYear, this.currentMonth, 0);
                
                const firstDayOfWeek = firstDay.getDay();
                const lastDateOfMonth = lastDay.getDate();
                const prevLastDate = prevLastDay.getDate();
                
                const days = [];
                
                // Previous month days
                for (let i = firstDayOfWeek - 1; i >= 0; i--) {
                    days.push({
                        date: prevLastDate - i,
                        isCurrentMonth: false,
                        isToday: false,
                        hasEvents: false
                    });
                }
                
                // Current month days
                for (let i = 1; i <= lastDateOfMonth; i++) {
                    const isToday = this.isToday(this.currentYear, this.currentMonth, i);
                    const hasEvents = this.hasEventsOnDate(this.currentYear, this.currentMonth, i);
                    
                    days.push({
                        date: i,
                        isCurrentMonth: true,
                        isToday: isToday,
                        hasEvents: hasEvents
                    });
                }
                
                // Next month days
                const remainingDays = 42 - days.length;
                for (let i = 1; i <= remainingDays; i++) {
                    days.push({
                        date: i,
                        isCurrentMonth: false,
                        isToday: false,
                        hasEvents: false
                    });
                }
                
                return days;
            },
            
            isToday(year, month, day) {
                const today = new Date();
                return year === today.getFullYear() && 
                       month === today.getMonth() && 
                       day === today.getDate();
            },
            
            hasEventsOnDate(year, month, day) {
                // Check if there are activities on this date
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                return mockData.activities.some(activity => activity.date === dateStr);
            },
            
            get activitiesForCurrentMonth() {
                return mockData.activities.filter(activity => {
                    const activityDate = new Date(activity.date);
                    return activityDate.getMonth() === this.currentMonth && 
                           activityDate.getFullYear() === this.currentYear;
                });
            },
            
            get studySchedule() {
                if (!this.selectedClass || !mockData.studyTimetable[this.selectedClass]) return [];
                return mockData.studyTimetable[this.selectedClass].daily;
            }
        }));
    }
}
