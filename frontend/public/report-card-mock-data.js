/*
Report Card Mock Data for Pupil Portal
Generates realistic report card data for demo purposes
*/

(function() {
    'use strict';

    // Zambian grade scale and subjects
    const ZAMBIAN_GRADE_SCALE = {
        'A+': { min: 90, max: 100, points: 12, remark: 'Excellent' },
        'A': { min: 80, max: 89, points: 11, remark: 'Very Good' },
        'B': { min: 70, max: 79, points: 10, remark: 'Good' },
        'C': { min: 60, max: 69, points: 9, remark: 'Credit' },
        'D': { min: 50, max: 59, points: 8, remark: 'Pass' },
        'F': { min: 0, max: 49, points: 0, remark: 'Fail' }
    };

    const ZAMBIAN_SUBJECTS = [
        { code: 'ENG', name: 'English Language', type: 'core', credits: 2 },
        { code: 'MAT', name: 'Mathematics', type: 'core', credits: 2 },
        { code: 'SCI', name: 'Integrated Science', type: 'core', credits: 2 },
        { code: 'HIS', name: 'History', type: 'core', credits: 1 },
        { code: 'GEO', name: 'Geography', type: 'core', credits: 1 },
        { code: 'CIV', name: 'Civic Education', type: 'core', credits: 1 },
        { code: 'PHY', name: 'Physics', type: 'elective', credits: 2 },
        { code: 'CHE', name: 'Chemistry', type: 'elective', credits: 2 },
        { code: 'BIO', name: 'Biology', type: 'elective', credits: 2 },
        { code: 'COM', name: 'Computer Studies', type: 'elective', credits: 2 },
        { code: 'AGR', name: 'Agricultural Science', type: 'elective', credits: 2 },
        { code: 'BUS', name: 'Business Studies', type: 'elective', credits: 2 },
        { code: 'ACC', name: 'Principles of Accounting', type: 'elective', credits: 2 },
        { code: 'ECO', name: 'Economics', type: 'elective', credits: 2 },
        { code: 'LIT', name: 'English Literature', type: 'elective', credits: 1 },
        { code: 'ART', name: 'Art and Design', type: 'elective', credits: 1 },
        { code: 'MUS', name: 'Music', type: 'elective', credits: 1 },
        { code: 'PE', name: 'Physical Education', type: 'core', credits: 1 }
    ];

    // Helper functions
    function getRandomItem(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function getRandomFloat(min, max, decimals = 1) {
        return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
    }

    function calculateGrade(score) {
        for (const [grade, info] of Object.entries(ZAMBIAN_GRADE_SCALE)) {
            if (score >= info.min && score <= info.max) {
                return { grade, ...info };
            }
        }
        return { grade: 'F', ...ZAMBIAN_GRADE_SCALE['F'] };
    }

    function generateSubjectGrade(subject, term, academicYear) {
        const score = getRandomFloat(45, 98);
        const gradeInfo = calculateGrade(score);
        
        return {
            subjectCode: subject.code,
            subjectName: subject.name,
            subjectType: subject.type,
            credits: subject.credits,
            term: term,
            academicYear: academicYear,
            score: score,
            grade: gradeInfo.grade,
            points: gradeInfo.points,
            remark: gradeInfo.remark,
            position: getRandomInt(1, 25),
            classAverage: getRandomFloat(55, 75),
            highest: getRandomFloat(85, 98),
            lowest: getRandomFloat(35, 55),
            teacherName: `${getRandomItem(['Mr.', 'Ms.', 'Mrs.'])} ${getRandomItem(['Bwalya', 'Mulenga', 'Phiri', 'Chanda', 'Nkhata'])}`,
            comments: getRandomItem([
                'Excellent performance, keep up the good work!',
                'Good effort, but room for improvement.',
                'Satisfactory progress, continue working hard.',
                'Needs more attention and practice.',
                'Outstanding achievement!'
            ])
        };
    }

    function generateTermReport(pupilId, className, term, academicYear) {
        // Determine subjects based on grade level
        const gradeLevel = parseInt(className.match(/\d+/)[0]);
        let subjects = ZAMBIAN_SUBJECTS.filter(s => s.type === 'core');
        
        // Add electives for higher grades
        if (gradeLevel >= 8) {
            const electives = ZAMBIAN_SUBJECTS.filter(s => s.type === 'elective');
            const numElectives = Math.min(4, electives.length);
            for (let i = 0; i < numElectives; i++) {
                const elective = electives[i];
                if (!subjects.find(s => s.code === elective.code)) {
                    subjects.push(elective);
                }
            }
        }

        const subjectGrades = subjects.map(subject => 
            generateSubjectGrade(subject, term, academicYear)
        );

        // Calculate totals and averages
        const totalPoints = subjectGrades.reduce((sum, sg) => sum + (sg.points * sg.credits), 0);
        const totalCredits = subjectGrades.reduce((sum, sg) => sum + sg.credits, 0);
        const gpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';
        const averageScore = (subjectGrades.reduce((sum, sg) => sum + sg.score, 0) / subjectGrades.length).toFixed(1);

        // Calculate class position
        const classPosition = getRandomInt(1, 30);
        const classSize = getRandomInt(25, 40);

        return {
            pupilId: pupilId,
            className: className,
            term: term,
            academicYear: academicYear,
            reportDate: new Date().toISOString().split('T')[0],
            subjectGrades: subjectGrades,
            summary: {
                totalSubjects: subjectGrades.length,
                totalCredits: totalCredits,
                totalPoints: totalPoints,
                gpa: parseFloat(gpa),
                averageScore: parseFloat(averageScore),
                classPosition: classPosition,
                classSize: classSize,
                grade: calculateGrade(parseFloat(averageScore)).grade,
                attendanceRate: getRandomFloat(75, 98),
                conductGrade: getRandomItem(['A', 'B', 'C']),
                conductComment: getRandomItem([
                    'Excellent behavior and attitude',
                    'Good conduct, respectful to others',
                    'Satisfactory behavior',
                    'Needs improvement in behavior'
                ])
            },
            headTeacherComment: getRandomItem([
                'Excellent academic performance this term. Keep up the outstanding work!',
                'Good progress shown. Continue to work hard and maintain focus.',
                'Satisfactory performance. More effort needed in key areas.',
                'Performance needs significant improvement. Extra support recommended.'
            ]),
            classTeacherComment: getRandomItem([
                'Active participant in class discussions. Shows great potential.',
                'Hardworking and dedicated student. Pleased with progress.',
                'Quiet but capable. Encouraged to participate more actively.',
                'Needs to develop better study habits and time management skills.'
            ]),
            nextTermOpens: getNextTermDate(term, academicYear),
            issuedBy: `Shikola Academy - ${className}`,
            authorizedBy: `${getRandomItem(['Mrs.', 'Mr.'])} ${getRandomItem(['M. Banda', 'J. Mulenga', 'E. Phiri'])}`,
            authorizedTitle: 'Head Teacher'
        };
    }

    function getNextTermDate(currentTerm, academicYear) {
        const termDates = {
            'Term 1': { start: '2026-01-12', end: '2026-04-09' },
            'Term 2': { start: '2026-05-10', end: '2026-08-06' },
            'Term 3': { start: '2026-09-06', end: '2026-12-03' }
        };
        
        if (currentTerm === 'Term 1') return termDates['Term 2'].start;
        if (currentTerm === 'Term 2') return termDates['Term 3'].start;
        return termDates['Term 1'].start; // Next academic year
    }

    function generateCompleteReportCard(pupilId, className) {
        const academicYear = '2026';
        const terms = ['Term 1', 'Term 2', 'Term 3'];
        
        return terms.map(term => generateTermReport(pupilId, className, term, academicYear));
    }

    function generateExamResults(pupilId, className) {
        const examTypes = ['Mid-term Exam', 'Final Exam', 'Mock Exam', 'Practical Exam'];
        const subjects = ZAMBIAN_SUBJECTS.filter(s => s.type === 'core').slice(0, 8);
        
        const results = [];
        examTypes.forEach(examType => {
            subjects.forEach(subject => {
                const score = getRandomFloat(40, 95);
                const gradeInfo = calculateGrade(score);
                
                results.push({
                    id: `EXAM-${pupilId}-${subject.code}-${getRandomInt(1000, 9999)}`,
                    pupilId: pupilId,
                    className: className,
                    examType: examType,
                    examDate: getRandomDate(new Date('2026-01-01'), new Date('2026-12-31')).toISOString().split('T')[0],
                    subjectCode: subject.code,
                    subjectName: subject.name,
                    score: score,
                    grade: gradeInfo.grade,
                    points: gradeInfo.points,
                    maxScore: 100,
                    remarks: gradeInfo.remark,
                    teacher: `${getRandomItem(['Mr.', 'Ms.'])} ${getRandomItem(['Bwalya', 'Mulenga', 'Phiri'])}`,
                    term: getRandomItem(['Term 1', 'Term 2', 'Term 3']),
                    academicYear: '2026'
                });
            });
        });
        
        return results;
    }

    function getRandomDate(start, end) {
        return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    }

    // Mock data service for report cards
    window.ShikolaReportCardMockData = {
        // Generate complete report card for a pupil
        generateReportCard: function(pupilId, className) {
            return generateCompleteReportCard(pupilId, className);
        },

        // Generate term report
        generateTermReport: function(pupilId, className, term) {
            return generateTermReport(pupilId, className, term, '2026');
        },

        // Generate exam results
        generateExamResults: function(pupilId, className) {
            return generateExamResults(pupilId, className);
        },

        // Calculate overall performance
        calculateOverallPerformance: function(pupilId) {
            const reportCards = this.getPupilReportCards(pupilId);
            
            if (reportCards.length === 0) {
                return {
                    gpa: 0,
                    averageScore: 0,
                    trend: 'stable',
                    position: 0,
                    attendance: 0
                };
            }

            const allGPAs = reportCards.map(rc => rc.summary.gpa);
            const allScores = reportCards.map(rc => rc.summary.averageScore);
            const allPositions = reportCards.map(rc => rc.summary.classPosition);
            const allAttendance = reportCards.map(rc => rc.summary.attendanceRate);

            const avgGPA = (allGPAs.reduce((sum, gpa) => sum + gpa, 0) / allGPAs.length).toFixed(2);
            const avgScore = (allScores.reduce((sum, score) => sum + score, 0) / allScores.length).toFixed(1);
            const avgPosition = Math.round(allPositions.reduce((sum, pos) => sum + pos, 0) / allPositions.length);
            const avgAttendance = (allAttendance.reduce((sum, att) => sum + att, 0) / allAttendance.length).toFixed(1);

            // Calculate trend
            let trend = 'stable';
            if (allGPAs.length >= 2) {
                const recent = allGPAs.slice(-2);
                if (recent[1] > recent[0]) trend = 'improving';
                else if (recent[1] < recent[0]) trend = 'declining';
            }

            return {
                gpa: parseFloat(avgGPA),
                averageScore: parseFloat(avgScore),
                trend: trend,
                position: avgPosition,
                attendance: parseFloat(avgAttendance)
            };
        },

        // Get pupil report cards from localStorage or generate new ones
        getPupilReportCards: function(pupilId) {
            try {
                const stored = localStorage.getItem(`shikola_report_card_${pupilId}`);
                if (stored) {
                    return JSON.parse(stored);
                }
            } catch (error) {
                console.error('Error loading report cards from localStorage:', error);
            }
            
            return [];
        },

        // Save report cards to localStorage
        saveReportCards: function(pupilId, reportCards) {
            try {
                localStorage.setItem(`shikola_report_card_${pupilId}`, JSON.stringify(reportCards));
                return true;
            } catch (error) {
                console.error('Error saving report cards to localStorage:', error);
                return false;
            }
        },

        // Initialize report card data for current pupil
        initializeReportCardData: function(pupilId, className) {
            console.log('Initializing report card mock data...');
            
            const reportCards = this.generateReportCard(pupilId, className);
            const examResults = this.generateExamResults(pupilId, className);
            
            const success = this.saveReportCards(pupilId, reportCards);
            
            if (success) {
                // Save exam results separately
                try {
                    localStorage.setItem(`shikola_exam_results_${pupilId}`, JSON.stringify(examResults));
                } catch (error) {
                    console.error('Error saving exam results:', error);
                }
                
                console.log(`Generated ${reportCards.length} term reports and ${examResults.length} exam results`);
                
                // Trigger event for UI updates
                window.dispatchEvent(new CustomEvent('shikola:report-card-data-initialized', {
                    detail: { 
                        success: true, 
                        pupilId: pupilId,
                        reportCards: reportCards.length,
                        examResults: examResults.length,
                        timestamp: new Date() 
                    }
                }));
                
                return true;
            }
            
            return false;
        },

        // Get exam results
        getExamResults: function(pupilId) {
            try {
                const stored = localStorage.getItem(`shikola_exam_results_${pupilId}`);
                if (stored) {
                    return JSON.parse(stored);
                }
            } catch (error) {
                console.error('Error loading exam results from localStorage:', error);
            }
            
            return [];
        },

        // Clear report card data
        clearReportCardData: function(pupilId) {
            try {
                localStorage.removeItem(`shikola_report_card_${pupilId}`);
                localStorage.removeItem(`shikola_exam_results_${pupilId}`);
                console.log('Report card mock data cleared');
                return true;
            } catch (error) {
                console.error('Error clearing report card data:', error);
                return false;
            }
        }
    };

    // Auto-initialize if in demo mode
    if (window.SHIKOLA_CONFIG && window.SHIKOLA_CONFIG.DEMO_MODE) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                setTimeout(() => {
                    // Get current pupil info
                    const pupilData = localStorage.getItem('shikola_current_pupil');
                    if (pupilData) {
                        const pupil = JSON.parse(pupilData);
                        window.ShikolaReportCardMockData.initializeReportCardData(pupil.id, pupil.class);
                    }
                }, 2000);
            });
        } else {
            setTimeout(() => {
                const pupilData = localStorage.getItem('shikola_current_pupil');
                if (pupilData) {
                    const pupil = JSON.parse(pupilData);
                    window.ShikolaReportCardMockData.initializeReportCardData(pupil.id, pupil.class);
                }
            }, 2000);
        }
    }

    // Make available globally
    window.initializeReportCardMockData = function(pupilId, className) {
        return window.ShikolaReportCardMockData.initializeReportCardData(pupilId, className);
    };
    
    window.clearReportCardMockData = function(pupilId) {
        return window.ShikolaReportCardMockData.clearReportCardData(pupilId);
    };

})();
