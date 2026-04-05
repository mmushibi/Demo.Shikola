/*
Pupil Assignments Data Loader
Auto-generated mock data loader for Shikola Academy
Generated on 2026-04-05 17:45:00
*/

// Initialize assignments data when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadAssignmentsData();
});

function loadAssignmentsData() {
    // Wait for mock data to be available
    if (typeof window.ShikolaPupilMockData === 'undefined') {
        setTimeout(loadAssignmentsData, 100);
        return;
    }

    const mockData = window.ShikolaPupilMockData;
    
    // Set up Alpine.js data for assignments page
    if (typeof window.Alpine !== 'undefined') {
        window.Alpine.data('assignmentsPage', () => ({
            pageTitle: 'Home Assignments',
            pageSubtitle: 'Track and submit your assignments',
            sidebarOpen: false,
            loading: false,
            error: null,
            activeTab: 'pending',
            searchQuery: '',
            lastSyncTime: new Date(),
            
            // Filters
            filters: {
                pending: { subject: 'all', priority: 'all' },
                submitted: { subject: 'all' },
                graded: { subject: 'all', grade: 'all' }
            },
            
            // Assignment data
            pendingAssignments: [],
            submittedAssignments: [],
            gradedAssignments: [],
            
            init() {
                this.loadAssignments();
                this.startRealtimeSync();
            },
            
            loadAssignments() {
                this.loading = true;
                this.error = null;
                
                // Simulate API call delay
                setTimeout(() => {
                    try {
                        this.pendingAssignments = this.generatePendingAssignments();
                        this.submittedAssignments = this.generateSubmittedAssignments();
                        this.gradedAssignments = this.generateGradedAssignments();
                        this.loading = false;
                        this.lastSyncTime = new Date();
                    } catch (err) {
                        this.error = 'Failed to load assignments. Please try again.';
                        this.loading = false;
                    }
                }, 800);
            },
            
            generatePendingAssignments() {
                return [
                    {
                        id: 'assign-001',
                        title: 'Algebra Problem Set - Quadratic Equations',
                        summary: 'Complete exercises 1-25 on page 156, showing all steps for solving quadratic equations using factoring and quadratic formula.',
                        subject: 'Mathematics',
                        teacher: 'Daniel Chileshe',
                        priority: 'high',
                        assignedOn: '2026-04-01',
                        dueOn: '2026-04-08',
                        assignedLabel: 'Apr 1, 2026',
                        dueLabel: 'Due in 2 days',
                        primaryButtonClass: 'bg-orange-500 hover:bg-orange-600',
                        hasFiles: true,
                        fileCount: 2,
                        instructions: 'Show all work steps. Submit as PDF or clear photos.',
                        maxScore: 50,
                        estimatedTime: '2 hours'
                    },
                    {
                        id: 'assign-002',
                        title: 'Essay Writing - My Hero in Zambian History',
                        summary: 'Write a 500-word essay about a Zambian historical figure who inspired you. Include at least 3 sources.',
                        subject: 'English',
                        teacher: 'Elizabeth Kalaba',
                        priority: 'medium',
                        assignedOn: '2026-04-02',
                        dueOn: '2026-04-09',
                        assignedLabel: 'Apr 2, 2026',
                        dueLabel: 'Due in 3 days',
                        primaryButtonClass: 'bg-blue-500 hover:bg-blue-600',
                        hasFiles: true,
                        fileCount: 1,
                        instructions: 'Follow proper essay structure. Include bibliography.',
                        maxScore: 40,
                        estimatedTime: '3 hours'
                    },
                    {
                        id: 'assign-003',
                        title: 'Biology Lab Report - Cell Structure',
                        summary: 'Complete lab report on onion cell observation from class experiment. Include diagrams and analysis.',
                        subject: 'Biology',
                        teacher: 'Rachel Mulenga',
                        priority: 'high',
                        assignedOn: '2026-03-28',
                        dueOn: '2026-04-07',
                        assignedLabel: 'Mar 28, 2026',
                        dueLabel: 'Due tomorrow!',
                        primaryButtonClass: 'bg-red-500 hover:bg-red-600',
                        hasFiles: true,
                        fileCount: 3,
                        instructions: 'Use proper lab report format. Include materials, method, results, and conclusion.',
                        maxScore: 60,
                        estimatedTime: '2.5 hours'
                    },
                    {
                        id: 'assign-004',
                        title: 'Geography Map Work - African Rivers',
                        summary: 'Draw and label major rivers of Zambia. Include tributaries and geographical features.',
                        subject: 'Geography',
                        teacher: 'Linda Bwalya',
                        priority: 'medium',
                        assignedOn: '2026-04-03',
                        dueOn: '2026-04-10',
                        assignedLabel: 'Apr 3, 2026',
                        dueLabel: 'Due in 4 days',
                        primaryButtonClass: 'bg-green-500 hover:bg-green-600',
                        hasFiles: true,
                        fileCount: 1,
                        instructions: 'Use colored pencils. Include map legend and scale.',
                        maxScore: 35,
                        estimatedTime: '1.5 hours'
                    },
                    {
                        id: 'assign-005',
                        title: 'Computer Programming - Python Functions',
                        summary: 'Write 5 Python functions to solve mathematical problems. Include documentation strings.',
                        subject: 'Computer Studies',
                        teacher: 'Xavier Bwalya',
                        priority: 'high',
                        assignedOn: '2026-04-04',
                        dueOn: '2026-04-12',
                        assignedLabel: 'Apr 4, 2026',
                        dueLabel: 'Due in 6 days',
                        primaryButtonClass: 'bg-purple-500 hover:bg-purple-600',
                        hasFiles: true,
                        fileCount: 2,
                        instructions: 'Submit .py file. Include test cases for each function.',
                        maxScore: 45,
                        estimatedTime: '3 hours'
                    }
                ];
            },
            
            generateSubmittedAssignments() {
                return [
                    {
                        id: 'assign-006',
                        title: 'History Research - Independence Movement',
                        summary: 'Research and present on Zambia\'s independence movement leaders and key events.',
                        subject: 'History',
                        teacher: 'Nancy Chanda',
                        priority: 'medium',
                        submittedOn: '2026-04-05',
                        submittedTime: '2:30 PM',
                        statusLabel: 'Awaiting grading',
                        assignedLabel: 'Mar 25, 2026',
                        submittedLabel: 'Apr 5, 2026',
                        hasFiles: true,
                        fileCount: 3,
                        maxScore: 40
                    },
                    {
                        id: 'assign-007',
                        title: 'Science Experiment - Chemical Reactions',
                        summary: 'Document and analyze 5 different chemical reactions performed in class.',
                        subject: 'Science',
                        teacher: 'Ruth Simukonda',
                        priority: 'low',
                        submittedOn: '2026-04-04',
                        submittedTime: '4:15 PM',
                        statusLabel: 'Awaiting grading',
                        assignedLabel: 'Mar 20, 2026',
                        submittedLabel: 'Apr 4, 2026',
                        hasFiles: true,
                        fileCount: 2,
                        maxScore: 50
                    },
                    {
                        id: 'assign-008',
                        title: 'Civic Education - Community Service',
                        summary: 'Report on community service activity and its impact on local society.',
                        subject: 'Civic Education',
                        teacher: 'Elizabeth Moyo',
                        priority: 'medium',
                        submittedOn: '2026-04-03',
                        submittedTime: '10:00 AM',
                        statusLabel: 'Being graded',
                        assignedLabel: 'Mar 15, 2026',
                        submittedLabel: 'Apr 3, 2026',
                        hasFiles: true,
                        fileCount: 1,
                        maxScore: 30
                    }
                ];
            },
            
            generateGradedAssignments() {
                return [
                    {
                        id: 'assign-009',
                        title: 'Mathematics Test - Linear Equations',
                        summary: 'Chapter test on solving and graphing linear equations.',
                        subject: 'Mathematics',
                        teacher: 'Daniel Chileshe',
                        grade: 'A-',
                        score: '45/50',
                        percentage: 90,
                        gradedOn: '2026-04-02',
                        gradedTime: '3:00 PM',
                        feedback: 'Excellent work! Showed clear understanding of concepts. Minor errors in calculation.',
                        assignedLabel: 'Mar 10, 2026',
                        gradedLabel: 'Apr 2, 2026',
                        hasFiles: true,
                        fileCount: 2,
                        maxScore: 50,
                        gradeColor: 'text-green-600'
                    },
                    {
                        id: 'assign-010',
                        title: 'English Comprehension - African Literature',
                        summary: 'Reading comprehension and analysis of selected African short stories.',
                        subject: 'English',
                        teacher: 'Elizabeth Kalaba',
                        grade: 'B+',
                        score: '36/40',
                        percentage: 90,
                        gradedOn: '2026-04-01',
                        gradedTime: '11:30 AM',
                        feedback: 'Good analysis of themes. Work on sentence structure variety.',
                        assignedLabel: 'Mar 8, 2026',
                        gradedLabel: 'Apr 1, 2026',
                        hasFiles: true,
                        fileCount: 1,
                        maxScore: 40,
                        gradeColor: 'text-blue-600'
                    },
                    {
                        id: 'assign-011',
                        title: 'Business Studies - Market Analysis',
                        summary: 'Analyze a local Zambian business and its market position.',
                        subject: 'Business Studies',
                        teacher: 'Emmanuel Mulenga',
                        grade: 'A',
                        score: '48/50',
                        percentage: 96,
                        gradedOn: '2026-03-30',
                        gradedTime: '2:45 PM',
                        feedback: 'Outstanding analysis! Excellent research and presentation.',
                        assignedLabel: 'Mar 5, 2026',
                        gradedLabel: 'Mar 30, 2026',
                        hasFiles: true,
                        fileCount: 4,
                        maxScore: 50,
                        gradeColor: 'text-green-600'
                    },
                    {
                        id: 'assign-012',
                        title: 'Social Studies - Zambian Provinces',
                        summary: 'Create presentation on Zambia\'s provinces and their unique characteristics.',
                        subject: 'Social Studies',
                        teacher: 'Patricia Chanda',
                        grade: 'B',
                        score: '34/40',
                        percentage: 85,
                        gradedOn: '2026-03-28',
                        gradedTime: '10:15 AM',
                        feedback: 'Good content. Include more economic activities next time.',
                        assignedLabel: 'Mar 1, 2026',
                        gradedLabel: 'Mar 28, 2026',
                        hasFiles: true,
                        fileCount: 3,
                        maxScore: 40,
                        gradeColor: 'text-blue-600'
                    }
                ];
            },
            
            // Filter methods
            filteredPending() {
                let filtered = this.pendingAssignments;
                
                if (this.searchQuery) {
                    filtered = filtered.filter(a => 
                        a.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                        a.subject.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                        a.teacher.toLowerCase().includes(this.searchQuery.toLowerCase())
                    );
                }
                
                if (this.filters.pending.subject !== 'all') {
                    filtered = filtered.filter(a => a.subject === this.filters.pending.subject);
                }
                
                if (this.filters.pending.priority !== 'all') {
                    filtered = filtered.filter(a => a.priority === this.filters.pending.priority);
                }
                
                return filtered.sort((a, b) => {
                    const priorityOrder = { high: 0, medium: 1, low: 2 };
                    return priorityOrder[a.priority] - priorityOrder[b.priority];
                });
            },
            
            filteredSubmitted() {
                let filtered = this.submittedAssignments;
                
                if (this.searchQuery) {
                    filtered = filtered.filter(a => 
                        a.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                        a.subject.toLowerCase().includes(this.searchQuery.toLowerCase())
                    );
                }
                
                if (this.filters.submitted.subject !== 'all') {
                    filtered = filtered.filter(a => a.subject === this.filters.submitted.subject);
                }
                
                return filtered.sort((a, b) => new Date(b.submittedOn) - new Date(a.submittedOn));
            },
            
            filteredGraded() {
                let filtered = this.gradedAssignments;
                
                if (this.searchQuery) {
                    filtered = filtered.filter(a => 
                        a.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                        a.subject.toLowerCase().includes(this.searchQuery.toLowerCase())
                    );
                }
                
                if (this.filters.graded.subject !== 'all') {
                    filtered = filtered.filter(a => a.subject === this.filters.graded.subject);
                }
                
                if (this.filters.graded.grade !== 'all') {
                    filtered = filtered.filter(a => a.grade === this.filters.graded.grade);
                }
                
                return filtered.sort((a, b) => new Date(b.gradedOn) - new Date(a.gradedOn));
            },
            
            // Utility methods
            pendingSubjectOptions() {
                const subjects = [...new Set(this.pendingAssignments.map(a => a.subject))];
                return subjects.sort();
            },
            
            submittedSubjectOptions() {
                const subjects = [...new Set(this.submittedAssignments.map(a => a.subject))];
                return subjects.sort();
            },
            
            gradedSubjectOptions() {
                const subjects = [...new Set(this.gradedAssignments.map(a => a.subject))];
                return subjects.sort();
            },
            
            gradeOptions() {
                const grades = [...new Set(this.gradedAssignments.map(a => a.grade))];
                return grades.sort();
            },
            
            summaryCounts() {
                const now = new Date();
                const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                
                return {
                    totalPending: this.pendingAssignments.length,
                    dueThisWeek: this.pendingAssignments.filter(a => new Date(a.dueOn) <= weekFromNow).length,
                    overdue: this.pendingAssignments.filter(a => new Date(a.dueOn) < now).length,
                    submittedToday: this.submittedAssignments.filter(a => {
                        const submittedDate = new Date(a.submittedOn);
                        return submittedDate.toDateString() === now.toDateString();
                    }).length
                };
            },
            
            upcomingDeadlines() {
                return this.pendingAssignments
                    .filter(a => new Date(a.dueOn) > new Date())
                    .sort((a, b) => new Date(a.dueOn) - new Date(b.dueOn))
                    .slice(0, 5);
            },
            
            // Styling methods
            priorityTone(priority) {
                const tones = {
                    high: 'border-red-200 bg-red-50',
                    medium: 'border-yellow-200 bg-yellow-50',
                    low: 'border-green-200 bg-green-50'
                };
                return tones[priority] || 'border-slate-200 bg-white';
            },
            
            priorityBadge(priority) {
                const badges = {
                    high: 'bg-red-100 text-red-700',
                    medium: 'bg-yellow-100 text-yellow-700',
                    low: 'bg-green-100 text-green-700'
                };
                return badges[priority] || 'bg-slate-100 text-slate-700';
            },
            
            subjectBadge(subject) {
                const colors = {
                    'Mathematics': 'bg-blue-100 text-blue-700',
                    'English': 'bg-purple-100 text-purple-700',
                    'Science': 'bg-green-100 text-green-700',
                    'Biology': 'bg-emerald-100 text-emerald-700',
                    'Geography': 'bg-orange-100 text-orange-700',
                    'History': 'bg-amber-100 text-amber-700',
                    'Social Studies': 'bg-cyan-100 text-cyan-700',
                    'Civic Education': 'bg-indigo-100 text-indigo-700',
                    'Business Studies': 'bg-pink-100 text-pink-700',
                    'Computer Studies': 'bg-violet-100 text-violet-700'
                };
                return colors[subject] || 'bg-slate-100 text-slate-700';
            },
            
            gradeChipClass(grade) {
                if (!grade) return 'bg-slate-100 text-slate-700';
                const gradeLetter = grade.charAt(0);
                const classes = {
                    'A': 'bg-green-100 text-green-700',
                    'B': 'bg-blue-100 text-blue-700',
                    'C': 'bg-yellow-100 text-yellow-700',
                    'D': 'bg-orange-100 text-orange-700',
                    'F': 'bg-red-100 text-red-700'
                };
                return classes[gradeLetter] || 'bg-slate-100 text-slate-700';
            },
            
            // Action handlers
            handleAction(action, assignment) {
                switch(action) {
                    case 'submit':
                        this.submitAssignment(assignment);
                        break;
                    case 'details':
                        this.viewDetails(assignment);
                        break;
                    case 'download':
                        this.downloadFiles(assignment);
                        break;
                    case 'receipt':
                        this.downloadReceipt(assignment);
                        break;
                    case 'certificate':
                        this.downloadCertificate(assignment);
                        break;
                }
            },
            
            submitAssignment(assignment) {
                // Simulate submission
                alert(`Submitting assignment: ${assignment.title}`);
                // In real app, this would open submission modal
            },
            
            viewDetails(assignment) {
                // Simulate viewing details
                alert(`Viewing details for: ${assignment.title}`);
                // In real app, this would open details modal
            },
            
            downloadFiles(assignment) {
                // Simulate file download
                alert(`Downloading files for: ${assignment.title}`);
                // In real app, this would trigger file download
            },
            
            downloadReceipt(assignment) {
                // Simulate receipt download
                alert(`Downloading receipt for: ${assignment.title}`);
                // In real app, this would generate PDF receipt
            },
            
            downloadCertificate(assignment) {
                // Simulate certificate download
                alert(`Downloading certificate for: ${assignment.title}`);
                // In real app, this would generate certificate
            },
            
            // Sync and status methods
            sharingNotice() {
                return 'Your assignments are shared with your teacher in real-time';
            },
            
            lastSyncedLabel() {
                const now = new Date();
                const diff = now - this.lastSyncTime;
                const minutes = Math.floor(diff / 60000);
                
                if (minutes < 1) return 'Just now';
                if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
                
                const hours = Math.floor(minutes / 60);
                return `${hours} hour${hours > 1 ? 's' : ''} ago`;
            },
            
            startRealtimeSync() {
                // Simulate real-time sync updates
                setInterval(() => {
                    this.lastSyncTime = new Date();
                }, 30000);
            }
        }));
    }
}
