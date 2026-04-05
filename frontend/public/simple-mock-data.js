/*
Simple Mock Data for Shikola Academy
Easy to read and debug version
*/

window.ShikolaSimpleData = {
    schoolName: 'Shikola Academy',
    location: 'Lusaka, Zambia',
    academicYear: '2026',
    currentTerm: 'Term 1',
    
    // Sample pupils data (first 5 for testing)
    pupils: [
        {
            pupil_id: "REG-001",
            first_name: "Chipo",
            last_name: "Bwalya",
            gender: "Female",
            class_name: "Grade 10A",
            email: "chipo.bwalya@shikola.edu.zm",
            parent_name: "Esther Bwalya",
            parent_phone: "+260977123456",
            status: "Active"
        },
        {
            pupil_id: "REG-002", 
            first_name: "John",
            last_name: "Mulenga",
            gender: "Male",
            class_name: "Grade 10A",
            email: "john.mulenga@shikola.edu.zm",
            parent_name: "James Mulenga",
            parent_phone: "+260977234567",
            status: "Active"
        },
        {
            pupil_id: "REG-003",
            first_name: "Mary", 
            last_name: "Phiri",
            gender: "Female",
            class_name: "Grade 10B",
            email: "mary.phiri@shikola.edu.zm",
            parent_name: "David Phiri",
            parent_phone: "+260977345678",
            status: "Active"
        },
        {
            pupil_id: "REG-004",
            first_name: "Brian",
            last_name: "Chanda", 
            gender: "Male",
            class_name: "Grade 11A",
            email: "brian.chanda@shikola.edu.zm",
            parent_name: "Grace Chanda",
            parent_phone: "+260977456789",
            status: "Active"
        },
        {
            pupil_id: "REG-005",
            first_name: "Patricia",
            last_name: "Nkhata",
            gender: "Female", 
            class_name: "Grade 11B",
            email: "patricia.nkhata@shikola.edu.zm",
            parent_name: "Michael Nkhata",
            parent_phone: "+260977567890",
            status: "Active"
        }
    ],
    
    // Sample classes data
    classes: [
        {
            ClassName: "Grade 10A",
            GradeLevel: "Secondary", 
            MaxCapacity: 50,
            Room: "Room 205",
            Teacher: "Mr. Bwalya"
        },
        {
            ClassName: "Grade 10B", 
            GradeLevel: "Secondary",
            MaxCapacity: 50,
            Room: "Room 206", 
            Teacher: "Ms. Mulenga"
        },
        {
            ClassName: "Grade 11A",
            GradeLevel: "Advanced Secondary",
            MaxCapacity: 50,
            Room: "Room 207",
            Teacher: "Mr. Phiri"
        },
        {
            ClassName: "Grade 11B",
            GradeLevel: "Advanced Secondary", 
            MaxCapacity: 50,
            Room: "Room 208",
            Teacher: "Ms. Chanda"
        }
    ],
    
    // Sample assignments data
    assignments: [
        {
            id: "ASSIGN-001",
            title: "Mathematics Assignment: Algebra",
            subject: "Mathematics",
            teacherName: "Mr. Bwalya",
            assignedOn: "2026-03-15",
            dueOn: "2026-03-22", 
            status: "pending",
            priority: "high",
            maxScore: 100
        },
        {
            id: "ASSIGN-002",
            title: "English Essay: Creative Writing",
            subject: "English Language",
            teacherName: "Ms. Mulenga", 
            assignedOn: "2026-03-16",
            dueOn: "2026-03-23",
            status: "submitted",
            priority: "medium",
            maxScore: 50,
            score: 45
        },
        {
            id: "ASSIGN-003", 
            title: "Science Project: Chemistry",
            subject: "Chemistry",
            teacherName: "Mr. Phiri",
            assignedOn: "2026-03-14",
            dueOn: "2026-03-21",
            status: "graded",
            priority: "high", 
            maxScore: 100,
            score: 85,
            grade: "A"
        }
    ],
    
    // Sample attendance data
    attendance: [
        {
            pupil_id: "REG-001",
            date: "2026-03-17",
            status: "present",
            recordedBy: "Mr. Bwalya"
        },
        {
            pupil_id: "REG-002", 
            date: "2026-03-17",
            status: "present",
            recordedBy: "Mr. Bwalya"
        },
        {
            pupil_id: "REG-003",
            date: "2026-03-17", 
            status: "absent",
            recordedBy: "Ms. Mulenga",
            notes: "Sick leave"
        }
    ],
    
    // Initialize function
    initializeSimple: function() {
        console.log('Initializing simple mock data for Shikola Academy...');
        
        // Save to localStorage
        localStorage.setItem('shikola_simple_pupils', JSON.stringify(this.pupils));
        localStorage.setItem('shikola_simple_classes', JSON.stringify(this.classes));
        localStorage.setItem('shikola_simple_assignments', JSON.stringify(this.assignments));
        localStorage.setItem('shikola_simple_attendance', JSON.stringify(this.attendance));
        
        // Also try to load the comprehensive data
        if (window.ShikolaMockData && window.ShikolaMockData.initializeAll) {
            window.ShikolaMockData.initializeAll();
        }
        
        console.log('Simple mock data initialization complete!');
        
        // Trigger event
        window.dispatchEvent(new CustomEvent('shikola:simple-mock-data-initialized', {
            detail: { 
                success: true, 
                schoolName: 'Shikola Academy',
                timestamp: new Date() 
            }
        }));
    }
};

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(() => {
            window.ShikolaSimpleData.initializeSimple();
        }, 500);
    });
} else {
    setTimeout(() => {
        window.ShikolaSimpleData.initializeSimple();
    }, 500);
}
