/*
Quick Data Loader for Shikola Academy
Immediately loads mock data into frontend pages
*/

(function() {
    'use strict';

    // Zambian Pupils Data
    const pupilsData = [
        {
            id: 'REG-001',
            admissionNo: 'REG-001',
            firstName: 'Chipo',
            lastName: 'Bwalya',
            fullName: 'Chipo Bwalya',
            gender: 'Female',
            dateOfBirth: '2015-03-12',
            nationality: 'Zambian',
            address: '123 Kabulonga Road, Lusaka',
            classGrade: 'Grade 1A',
            admissionYear: '2023',
            admissionDate: '2023-01-15',
            guardianName: 'Esther Bwalya',
            guardianPhone: '+260977123456',
            email: 'chipo.bwalya@shikola.edu.zm',
            status: 'Active'
        },
        {
            id: 'REG-002',
            admissionNo: 'REG-002',
            firstName: 'John',
            lastName: 'Mulenga',
            fullName: 'John Mulenga',
            gender: 'Male',
            dateOfBirth: '2015-07-08',
            nationality: 'Zambian',
            address: '456 Rhodes Park, Lusaka',
            classGrade: 'Grade 1A',
            admissionYear: '2023',
            admissionDate: '2023-01-15',
            guardianName: 'James Mulenga',
            guardianPhone: '+260977234567',
            email: 'john.mulenga@shikola.edu.zm',
            status: 'Active'
        },
        {
            id: 'REG-003',
            admissionNo: 'REG-003',
            firstName: 'Mary',
            lastName: 'Phiri',
            fullName: 'Mary Phiri',
            gender: 'Female',
            dateOfBirth: '2015-11-22',
            nationality: 'Zambian',
            address: '789 Chelston, Lusaka',
            classGrade: 'Grade 1B',
            admissionYear: '2023',
            admissionDate: '2023-01-16',
            guardianName: 'David Phiri',
            guardianPhone: '+260977345678',
            email: 'mary.phiri@shikola.edu.zm',
            status: 'Active'
        },
        {
            id: 'REG-004',
            admissionNo: 'REG-004',
            firstName: 'Brian',
            lastName: 'Chanda',
            fullName: 'Brian Chanda',
            gender: 'Male',
            dateOfBirth: '2014-05-18',
            nationality: 'Zambian',
            address: '321 Kansenshi, Kitwe',
            classGrade: 'Grade 2A',
            admissionYear: '2022',
            admissionDate: '2022-01-10',
            guardianName: 'Grace Chanda',
            guardianPhone: '+260977456789',
            email: 'brian.chanda@shikola.edu.zm',
            status: 'Active'
        },
        {
            id: 'REG-005',
            admissionNo: 'REG-005',
            firstName: 'Patricia',
            lastName: 'Nkhata',
            fullName: 'Patricia Nkhata',
            gender: 'Female',
            dateOfBirth: '2014-09-30',
            nationality: 'Zambian',
            address: '654 Mufulira, Mufulira',
            classGrade: 'Grade 2A',
            admissionYear: '2022',
            admissionDate: '2022-01-10',
            guardianName: 'Michael Nkhata',
            guardianPhone: '+260977567890',
            email: 'patricia.nkhata@shikola.edu.zm',
            status: 'Active'
        }
    ];

    // Zambian Teachers Data
    const teachersData = [
        {
            id: 'STF-001',
            employeeNumber: 'STF-001',
            firstName: 'Chanda',
            lastName: 'Mwansa',
            fullName: 'Chanda Mwansa',
            email: 'chanda.mwansa@shikola.edu.zm',
            phone: '+260977123456',
            department: 'Teaching',
            position: 'Mathematics Teacher',
            role: 'teacher',
            subjects: 'Mathematics',
            classes: 'Grade 8A, Grade 9A, Grade 10A, Grade 11A, Grade 12A',
            status: 'Active'
        },
        {
            id: 'STF-002',
            employeeNumber: 'STF-002',
            firstName: 'Banda',
            lastName: 'Phiri',
            fullName: 'Banda Phiri',
            email: 'banda.phiri@shikola.edu.zm',
            phone: '+260977234567',
            department: 'Teaching',
            position: 'English Teacher',
            role: 'teacher',
            subjects: 'English',
            classes: 'Grade 8B, Grade 9B, Grade 10B, Grade 11B, Grade 12B',
            status: 'Active'
        },
        {
            id: 'STF-003',
            employeeNumber: 'STF-003',
            firstName: 'Tembo',
            lastName: 'Sikazwe',
            fullName: 'Tembo Sikazwe',
            email: 'tembo.sikazwe@shikola.edu.zm',
            phone: '+260977345678',
            department: 'Teaching',
            position: 'Science Teacher',
            role: 'senior_teacher',
            subjects: 'Physics, Chemistry',
            classes: 'Grade 7A, Grade 7B, Grade 9A, Grade 11A',
            status: 'Active'
        },
        {
            id: 'STF-004',
            employeeNumber: 'STF-004',
            firstName: 'Kalaba',
            lastName: 'Nkhata',
            fullName: 'Kalaba Nkhata',
            email: 'kalaba.nkhata@shikola.edu.zm',
            phone: '+260977456789',
            department: 'Administration',
            position: 'Principal',
            role: 'principal',
            status: 'Active'
        }
    ];

    // Classes Data
    const classesData = [
        { id: 1, name: 'Grade 1A', gradeLevel: 'Early Childhood', maxCapacity: 25, room: 'Room 101' },
        { id: 2, name: 'Grade 1B', gradeLevel: 'Early Childhood', maxCapacity: 25, room: 'Room 102' },
        { id: 3, name: 'Grade 2A', gradeLevel: 'Primary', maxCapacity: 30, room: 'Room 103' },
        { id: 4, name: 'Grade 2B', gradeLevel: 'Primary', maxCapacity: 30, room: 'Room 104' },
        { id: 5, name: 'Grade 3A', gradeLevel: 'Primary', maxCapacity: 35, room: 'Room 105' },
        { id: 6, name: 'Grade 3B', gradeLevel: 'Primary', maxCapacity: 35, room: 'Room 106' },
        { id: 7, name: 'Grade 4A', gradeLevel: 'Primary', maxCapacity: 35, room: 'Room 107' },
        { id: 8, name: 'Grade 4B', gradeLevel: 'Primary', maxCapacity: 35, room: 'Room 108' },
        { id: 9, name: 'Grade 5A', gradeLevel: 'Primary', maxCapacity: 40, room: 'Room 109' },
        { id: 10, name: 'Grade 5B', gradeLevel: 'Primary', maxCapacity: 40, room: 'Room 110' }
    ];

    // School Configuration
    const schoolConfig = {
        name: 'Shikola Academy',
        tagline: 'Excellence in Zambian Education',
        address: '123 Education Street, Lusaka, Zambia',
        phone: '+260 123 456 789',
        email: 'info@shikola.edu.zm',
        website: 'www.shikola.edu.zm',
        logo: '/frontend/assets/images/logo.png'
    };

    // Load data into localStorage
    function loadMockData() {
        console.log('Loading Shikola Academy mock data...');
        
        // Load pupils
        localStorage.setItem('shikola_pupils', JSON.stringify(pupilsData));
        console.log(`Loaded ${pupilsData.length} pupils`);
        
        // Load teachers/employees
        localStorage.setItem('shikola_employees', JSON.stringify(teachersData));
        console.log(`Loaded ${teachersData.length} teachers`);
        
        // Load classes
        localStorage.setItem('shikola_classes', JSON.stringify(classesData));
        console.log(`Loaded ${classesData.length} classes`);
        
        // Load school config
        localStorage.setItem('shikola_school_config', JSON.stringify(schoolConfig));
        console.log('Loaded school configuration');
        
        console.log('Mock data loading complete!');
        
        // Trigger update events
        window.dispatchEvent(new CustomEvent('shikola:data-loaded', {
            detail: { pupils: pupilsData, teachers: teachersData, classes: classesData }
        }));
    }

    // Make available globally
    window.loadShikolaMockData = loadMockData;

    // Auto-load when script runs
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadMockData);
    } else {
        loadMockData();
    }

})();
