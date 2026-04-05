/*
Assignments Mock Data for Pupil Portal
Generates realistic assignment data for demo purposes
*/

(function() {
    'use strict';

    // Extended assignment generator with more realistic Zambian educational content
    function generateZambianAssignment() {
        const now = new Date();
        const assignedOn = getRandomDate(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), now);
        const dueOn = getRandomDate(new Date(now.getTime() + 24 * 60 * 60 * 1000), new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000));
        const statuses = ['pending', 'submitted', 'graded'];
        const priorities = ['high', 'medium', 'low'];
        const status = getRandomItem(statuses);
        
        let submittedOn = null;
        let gradedOn = null;
        let grade = null;
        let score = null;
        
        if (status === 'submitted') {
            submittedOn = getRandomDate(assignedOn, dueOn);
        } else if (status === 'graded') {
            submittedOn = getRandomDate(assignedOn, dueOn);
            gradedOn = getRandomDate(submittedOn, new Date());
            grade = getRandomItem(['A+', 'A', 'B', 'C', 'D']);
            score = getRandomInt(40, 100);
        }

        const subjects = [
            'Mathematics', 'English Language', 'Science', 'Physics', 'Chemistry', 
            'Biology', 'History', 'Geography', 'Civic Education', 'Art and Design',
            'Music', 'Physical Education', 'Computer Studies', 'Agricultural Science',
            'Business Studies', 'French', 'Religious Education', 'Economics', 'Accounting', 'English Literature'
        ];

        const assignmentTypes = [
            'Essay', 'Research Project', 'Worksheet', 'Lab Report', 'Presentation',
            'Problem Set', 'Case Study', 'Creative Writing', 'Experiment', 'Debate Preparation'
        ];

        const zambianTopics = {
            'Mathematics': ['Algebraic Expressions', 'Geometric Constructions', 'Statistics and Probability', 'Trigonometry', 'Calculus Basics'],
            'English Language': ['Essay Writing', 'Comprehension Skills', 'Grammar and Punctuation', 'Literature Analysis', 'Creative Writing'],
            'Science': ['Scientific Method', 'Laboratory Safety', 'Chemical Reactions', 'Physics Principles', 'Biology Concepts'],
            'History': ['Zambian Independence', 'African Kingdoms', 'Colonial Era', 'Post-Independence Zambia', 'African Liberation Movements'],
            'Geography': ['Zambian Physical Geography', 'Economic Activities', 'Population Studies', 'Climate and Weather', 'Map Reading'],
            'Civic Education': ['Zambian Constitution', 'Human Rights', 'Democracy and Governance', 'Citizenship', 'National Development']
        };

        const subject = getRandomItem(subjects);
        const assignmentType = getRandomItem(assignmentTypes);
        const topics = zambianTopics[subject] || ['General Topic', 'Advanced Concepts', 'Practical Applications'];
        const topic = getRandomItem(topics);

        return {
            id: 'ASSIGN-' + getRandomInt(1000, 9999),
            title: `${assignmentType}: ${topic}`,
            description: `Complete this ${assignmentType.toLowerCase()} on ${topic} for ${subject} class. Focus on key concepts and provide detailed explanations where required.`,
            subject: subject,
            topic: topic,
            assignmentType: assignmentType,
            teacherName: `${getRandomItem(['Mr.', 'Ms.', 'Mrs.'])} ${getRandomItem(['Bwalya', 'Mulenga', 'Phiri', 'Chanda', 'Nkhata', 'Tembo', 'Siamuleya', 'Kalaba'])}`,
            assignedOn: formatDate(assignedOn),
            dueOn: formatDate(dueOn),
            submittedOn: submittedOn ? formatDate(submittedOn) : null,
            gradedOn: gradedOn ? formatDate(gradedOn) : null,
            status: status,
            priority: getRandomItem(priorities),
            grade: grade,
            maxScore: getRandomInt(50, 100),
            score: score,
            percentage: score ? Math.round((score / getRandomInt(50, 100)) * 100) : null,
            attachments: Math.random() > 0.7 ? [
                {
                    name: `${topic.replace(/\s+/g, '_')}_instructions.pdf`,
                    size: getRandomInt(100, 500) + ' KB',
                    type: 'application/pdf'
                }
            ] : [],
            submissionType: getRandomItem(['online', 'upload', 'in-class']),
            estimatedTime: getRandomInt(30, 180) + ' minutes',
            instructions: [
                'Read all instructions carefully before starting',
                'Use proper formatting and citation methods',
                'Submit your work before the deadline',
                'Contact your teacher if you need clarification'
            ],
            rubric: {
                content: '40%',
                organization: '20%',
                grammar: '20%',
                creativity: '20%'
            },
            comments: gradedOn ? getRandomItem([
                'Excellent work! Keep it up.',
                'Good effort, but needs some improvement.',
                'Well done! Your understanding is clear.',
                'Nice attempt. Review the concepts again.'
            ]) : null
        };
    }

    // Helper functions
    function getRandomItem(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function getRandomDate(start, end) {
        return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    }

    function formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    // Generate assignments for different subjects and difficulty levels
    function generateAssignmentsForSubject(subject, count = 5) {
        const assignments = [];
        const difficulties = ['easy', 'medium', 'hard'];
        
        for (let i = 0; i < count; i++) {
            const assignment = generateZambianAssignment();
            assignment.subject = subject;
            assignment.difficulty = getRandomItem(difficulties);
            assignment.priority = assignment.difficulty === 'hard' ? 'high' : 
                                 assignment.difficulty === 'medium' ? 'medium' : 'low';
            assignments.push(assignment);
        }
        
        return assignments;
    }

    // Mock data service for assignments
    window.ShikolaAssignmentsMockData = {
        // Generate all assignments
        generateAllAssignments: function(totalCount = 25) {
            const subjects = [
                'Mathematics', 'English Language', 'Science', 'History', 'Geography',
                'Civic Education', 'Physics', 'Chemistry', 'Biology', 'Computer Studies'
            ];
            
            const assignments = [];
            const assignmentsPerSubject = Math.ceil(totalCount / subjects.length);
            
            subjects.forEach(subject => {
                const subjectAssignments = generateAssignmentsForSubject(subject, assignmentsPerSubject);
                assignments.push(...subjectAssignments);
            });
            
            // Sort by due date
            assignments.sort((a, b) => new Date(a.dueOn) - new Date(b.dueOn));
            
            return assignments.slice(0, totalCount);
        },

        // Get assignments by status
        getAssignmentsByStatus: function(status) {
            const allAssignments = this.getAllAssignments();
            return allAssignments.filter(a => a.status === status);
        },

        // Get assignments by subject
        getAssignmentsBySubject: function(subject) {
            const allAssignments = this.getAllAssignments();
            return allAssignments.filter(a => a.subject === subject);
        },

        // Get assignments by priority
        getAssignmentsByPriority: function(priority) {
            const allAssignments = this.getAllAssignments();
            return allAssignments.filter(a => a.priority === priority);
        },

        // Get overdue assignments
        getOverdueAssignments: function() {
            const allAssignments = this.getAllAssignments();
            const now = new Date();
            return allAssignments.filter(a => 
                a.status === 'pending' && new Date(a.dueOn) < now
            );
        },

        // Get due soon assignments
        getDueSoonAssignments: function(days = 3) {
            const allAssignments = this.getAllAssignments();
            const now = new Date();
            const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
            
            return allAssignments.filter(a => 
                a.status === 'pending' && 
                new Date(a.dueOn) >= now && 
                new Date(a.dueOn) <= futureDate
            );
        },

        // Get assignment statistics
        getAssignmentStats: function() {
            const allAssignments = this.getAllAssignments();
            
            return {
                total: allAssignments.length,
                pending: allAssignments.filter(a => a.status === 'pending').length,
                submitted: allAssignments.filter(a => a.status === 'submitted').length,
                graded: allAssignments.filter(a => a.status === 'graded').length,
                overdue: this.getOverdueAssignments().length,
                dueSoon: this.getDueSoonAssignments().length,
                averageGrade: this.calculateAverageGrade()
            };
        },

        // Calculate average grade
        calculateAverageGrade: function() {
            const allAssignments = this.getAllAssignments();
            const gradedAssignments = allAssignments.filter(a => a.status === 'graded' && a.percentage);
            
            if (gradedAssignments.length === 0) return 0;
            
            const totalPercentage = gradedAssignments.reduce((sum, a) => sum + a.percentage, 0);
            return Math.round(totalPercentage / gradedAssignments.length);
        },

        // Get all assignments from localStorage or generate new ones
        getAllAssignments: function() {
            try {
                const stored = localStorage.getItem('shikola_mock_assignments');
                if (stored) {
                    return JSON.parse(stored);
                }
            } catch (error) {
                console.error('Error loading assignments from localStorage:', error);
            }
            
            // Generate new assignments if none exist
            const assignments = this.generateAllAssignments(25);
            try {
                localStorage.setItem('shikola_mock_assignments', JSON.stringify(assignments));
            } catch (error) {
                console.error('Error saving assignments to localStorage:', error);
            }
            
            return assignments;
        },

        // Initialize assignments data
        initializeAssignmentsData: function() {
            console.log('Initializing assignments mock data...');
            const assignments = this.generateAllAssignments(25);
            
            try {
                localStorage.setItem('shikola_mock_assignments', JSON.stringify(assignments));
                console.log(`Generated ${assignments.length} assignments`);
                
                // Trigger event for UI updates
                window.dispatchEvent(new CustomEvent('shikola:assignments-data-initialized', {
                    detail: { success: true, count: assignments.length, timestamp: new Date() }
                }));
                
                return true;
            } catch (error) {
                console.error('Error initializing assignments data:', error);
                return false;
            }
        },

        // Clear assignments data
        clearAssignmentsData: function() {
            try {
                localStorage.removeItem('shikola_mock_assignments');
                console.log('Assignments mock data cleared');
                return true;
            } catch (error) {
                console.error('Error clearing assignments data:', error);
                return false;
            }
        }
    };

    // Auto-initialize if in demo mode
    if (window.SHIKOLA_CONFIG && window.SHIKOLA_CONFIG.DEMO_MODE) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                setTimeout(() => {
                    window.ShikolaAssignmentsMockData.initializeAssignmentsData();
                }, 1500);
            });
        } else {
            setTimeout(() => {
                window.ShikolaAssignmentsMockData.initializeAssignmentsData();
            }, 1500);
        }
    }

    // Make available globally
    window.initializeAssignmentsMockData = window.ShikolaAssignmentsMockData.initializeAssignmentsData.bind(window.ShikolaAssignmentsMockData);
    window.clearAssignmentsMockData = window.ShikolaAssignmentsMockData.clearAssignmentsData.bind(window.ShikolaAssignmentsMockData);

})();
