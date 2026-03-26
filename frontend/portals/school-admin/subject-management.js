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
// Subject Management JavaScript for Classes Page
function subjectManagement() {
    return {
        subjectTab: 'subjects',
        selectedClass: '',
        selectedEnrollmentClass: '',
        subjects: [],
        classes: [],
        teachers: [],
        classPupils: [],
        classPupilsWithEnrollments: [],
        classSubjectConfigs: [],
        teacherAssignments: [],
        pupilEnrollments: [],
        availableOptionalSubjects: [],
        classOptionalSubjects: [],
        subjectConfigs: {},
        bulkEnrollmentChanges: {},
        newSubject: {
            name: '',
            code: '',
            subject_type: 'compulsory',
            subject_category: 'academic'
        },
        assignmentForm: {
            class_id: '',
            subject_id: '',
            teacher_id: '',
            assignment_type: 'primary'
        },
        enrollmentForm: {
            class_id: '',
            pupil_id: '',
            subject_id: ''
        },
        individualEnrollment: {
            pupil_id: '',
            subject_id: ''
        },

        get classHasOptionalSubjects() {
            return this.classOptionalSubjects && this.classOptionalSubjects.length > 0;
        },

        async init() {
            await this.loadSubjects();
            await this.loadClasses();
            await this.loadTeachers();
            await this.loadClassSubjectConfigs();
            await this.loadTeacherAssignments();
            await this.loadPupilEnrollments();
        },

        async loadSubjects() {
            try {
                const response = await fetch('/api/admin/subjects');
                const data = await response.json();
                this.subjects = data.data || [];
            } catch (error) {
                console.error('Error loading subjects:', error);
                this.subjects = [];
            }
        },

        async loadClasses() {
            try {
                const response = await fetch('/api/admin/classes');
                const data = await response.json();
                this.classes = data.data || [];
            } catch (error) {
                console.error('Error loading classes:', error);
                this.classes = [];
            }
        },

        async loadTeachers() {
            try {
                const response = await fetch('/api/admin/teachers');
                const data = await response.json();
                this.teachers = data.data || [];
            } catch (error) {
                console.error('Error loading teachers:', error);
                this.teachers = [];
            }
        },

        async loadClassSubjectConfigs() {
            try {
                const response = await fetch('/api/admin/class-subject-configurations');
                const data = await response.json();
                this.classSubjectConfigs = data.data || [];
            } catch (error) {
                console.error('Error loading class subject configurations:', error);
                this.classSubjectConfigs = [];
            }
        },

        async loadTeacherAssignments() {
            try {
                const response = await fetch('/api/admin/subject-teacher-assignments');
                const data = await response.json();
                this.teacherAssignments = data.data || [];
            } catch (error) {
                console.error('Error loading teacher assignments:', error);
                this.teacherAssignments = [];
            }
        },

        async loadPupilEnrollments() {
            try {
                const response = await fetch('/api/admin/pupil-subject-enrollments');
                const data = await response.json();
                this.pupilEnrollments = data.data || [];
            } catch (error) {
                console.error('Error loading pupil enrollments:', error);
                this.pupilEnrollments = [];
            }
        },

        async loadClassPupils() {
            if (!this.enrollmentForm.class_id) {
                this.classPupils = [];
                return;
            }

            try {
                const response = await fetch(`/api/admin/classes/${this.enrollmentForm.class_id}/pupils`);
                const data = await response.json();
                this.classPupils = data.data || [];
                this.loadAvailableOptionalSubjects();
            } catch (error) {
                console.error('Error loading class pupils:', error);
                this.classPupils = [];
            }
        },

        async loadClassSubjectEnrollments() {
            if (!this.selectedEnrollmentClass) {
                this.classPupils = [];
                this.classOptionalSubjects = [];
                this.classPupilsWithEnrollments = [];
                return;
            }

            try {
                // Load class pupils
                const pupilsResponse = await fetch(`/api/admin/classes/${this.selectedEnrollmentClass}/pupils`);
                const pupilsData = await pupilsResponse.json();
                this.classPupils = pupilsData.data || [];

                // Load optional subjects for this class
                const subjectsResponse = await fetch(`/api/admin/classes/${this.selectedEnrollmentClass}/available-optional-subjects`);
                const subjectsData = await subjectsResponse.json();
                this.classOptionalSubjects = subjectsData.data || [];

                // Load current enrollments for this class
                const enrollmentsResponse = await fetch(`/api/admin/classes/${this.selectedEnrollmentClass}/enrollments`);
                const enrollmentsData = await enrollmentsResponse.json();
                const classEnrollments = enrollmentsData.data || [];

                // Combine pupils with their enrollments
                this.classPupilsWithEnrollments = this.classPupils.map(pupil => {
                    const pupilEnrollments = classEnrollments.filter(enrollment => enrollment.pupil_id === pupil.id);
                    return {
                        ...pupil,
                        enrollments: pupilEnrollments
                    };
                });

                // Initialize bulk enrollment tracking
                this.bulkEnrollmentChanges = {};
            } catch (error) {
                console.error('Error loading class subject enrollments:', error);
                this.classPupils = [];
                this.classOptionalSubjects = [];
                this.classPupilsWithEnrollments = [];
            }
        },

        async loadAvailableOptionalSubjects() {
            if (!this.enrollmentForm.class_id) {
                this.availableOptionalSubjects = [];
                return;
            }

            try {
                const response = await fetch(`/api/admin/classes/${this.enrollmentForm.class_id}/available-optional-subjects`);
                const data = await response.json();
                this.availableOptionalSubjects = data.data || [];
            } catch (error) {
                console.error('Error loading available optional subjects:', error);
                this.availableOptionalSubjects = [];
            }
        },

        get availableSubjects() {
            return this.subjects.filter(subject => subject.is_active);
        },

        isSubjectConfigured(classId, subjectId) {
            return this.classSubjectConfigs.some(config => 
                config.class_id === classId && config.subject_id === subjectId && config.is_active
            );
        },

        toggleSubjectConfig(classId, subjectId, event) {
            const key = classId + '_' + subjectId;
            if (event.target.checked) {
                this.subjectConfigs[key] = this.subjectConfigs[key] || 'compulsory';
            } else {
                delete this.subjectConfigs[key];
            }
        },

        // Bulk enrollment functions
        selectAllPupilsForSubject(subjectId) {
            this.classPupils.forEach(pupil => {
                const key = `${pupil.id}_${subjectId}`;
                this.bulkEnrollmentChanges[key] = true;
            });
        },

        deselectAllPupilsForSubject(subjectId) {
            this.classPupils.forEach(pupil => {
                const key = `${pupil.id}_${subjectId}`;
                this.bulkEnrollmentChanges[key] = false;
            });
        },

        isPupilEnrolledInSubject(pupilId, subjectId) {
            const key = `${pupilId}_${subjectId}`;
            
            // Check bulk changes first
            if (this.bulkEnrollmentChanges.hasOwnProperty(key)) {
                return this.bulkEnrollmentChanges[key];
            }
            
            // Check current enrollments
            return this.classPupilsWithEnrollments.some(pupil => 
                pupil.id === pupilId && 
                pupil.enrollments.some(enrollment => enrollment.subject_id === subjectId)
            );
        },

        togglePupilSubjectEnrollment(pupilId, subjectId, event) {
            const key = `${pupilId}_${subjectId}`;
            this.bulkEnrollmentChanges[key] = event.target.checked;
        },

        previewBulkEnrollments() {
            const changes = [];
            
            for (const [key, shouldEnroll] of Object.entries(this.bulkEnrollmentChanges)) {
                const [pupilId, subjectId] = key.split('_');
                const pupil = this.classPupils.find(p => p.id === pupilId);
                const subject = this.classOptionalSubjects.find(s => s.id === subjectId);
                
                if (pupil && subject) {
                    const currentlyEnrolled = this.isPupilEnrolledInSubject(pupilId, subjectId);
                    if (currentlyEnrolled !== shouldEnroll) {
                        changes.push({
                            pupil: pupil.name,
                            subject: subject.name,
                            action: shouldEnroll ? 'enroll' : 'unenroll'
                        });
                    }
                }
            }
            
            if (changes.length === 0) {
                alert('No changes to save');
            } else {
                const message = changes.map(c => `${c.pupil}: ${c.action} in ${c.subject}`).join('\n');
                confirm(`Preview of changes:\n\n${message}\n\nProceed with saving?`);
            }
        },

        async saveBulkEnrollments() {
            const enrollments = [];
            const unenrollments = [];
            
            for (const [key, shouldEnroll] of Object.entries(this.bulkEnrollmentChanges)) {
                const [pupilId, subjectId] = key.split('_');
                
                if (shouldEnroll) {
                    enrollments.push({
                        pupil_id: pupilId,
                        class_id: this.selectedEnrollmentClass,
                        subject_id: subjectId
                    });
                } else {
                    // Find existing enrollment to unenroll
                    const existingEnrollment = this.pupilEnrollments.find(e => 
                        e.pupil_id === pupilId && 
                        e.subject_id === subjectId && 
                        e.class_id === this.selectedEnrollmentClass &&
                        e.enrollment_status === 'active'
                    );
                    
                    if (existingEnrollment) {
                        unenrollments.push(existingEnrollment.id);
                    }
                }
            }
            
            if (enrollments.length === 0 && unenrollments.length === 0) {
                alert('No changes to save');
                return;
            }
            
            try {
                // Process enrollments
                for (const enrollment of enrollments) {
                    await fetch('/api/admin/pupil-subject-enrollments', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${this.getToken()}`
                        },
                        body: JSON.stringify(enrollment)
                    });
                }
                
                // Process unenrollments
                for (const enrollmentId of unenrollments) {
                    await fetch(`/api/admin/pupil-subject-enrollments/${enrollmentId}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${this.getToken()}`
                        }
                    });
                }
                
                // Reload data
                await this.loadClassSubjectEnrollments();
                await this.loadPupilEnrollments();
                
                // Clear changes
                this.bulkEnrollmentChanges = {};
                
                alert(`Successfully processed ${enrollments.length} enrollments and ${unenrollments.length} unenrollments`);
            } catch (error) {
                console.error('Error saving bulk enrollments:', error);
                alert('Error saving enrollments');
            }
        },

        async enrollIndividualPupil() {
            if (!this.individualEnrollment.pupil_id || !this.individualEnrollment.subject_id) {
                alert('Please select both pupil and subject');
                return;
            }
            
            try {
                const response = await fetch('/api/admin/pupil-subject-enrollments', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.getToken()}`
                    },
                    body: JSON.stringify({
                        pupil_id: this.individualEnrollment.pupil_id,
                        class_id: this.selectedEnrollmentClass,
                        subject_id: this.individualEnrollment.subject_id
                    })
                });
                
                if (response.ok) {
                    await this.loadClassSubjectEnrollments();
                    await this.loadPupilEnrollments();
                    
                    this.individualEnrollment = {
                        pupil_id: '',
                        subject_id: ''
                    };
                    
                    alert('Pupil enrolled successfully');
                } else {
                    const error = await response.json();
                    alert('Error enrolling pupil: ' + error.message);
                }
            } catch (error) {
                console.error('Error enrolling pupil:', error);
                alert('Error enrolling pupil');
            }
        },

        async addSubject() {
            if (!this.newSubject.name || !this.newSubject.code) {
                alert('Please fill in subject name and code');
                return;
            }

            try {
                const response = await fetch('/api/admin/subjects', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.getToken()}`
                    },
                    body: JSON.stringify(this.newSubject)
                });

                if (response.ok) {
                    await this.loadSubjects();
                    this.newSubject = {
                        name: '',
                        code: '',
                        subject_type: 'compulsory',
                        subject_category: 'academic'
                    };
                    alert('Subject added successfully');
                } else {
                    const error = await response.json();
                    alert('Error adding subject: ' + error.message);
                }
            } catch (error) {
                console.error('Error adding subject:', error);
                alert('Error adding subject');
            }
        },

        async deleteSubject(subjectId) {
            if (!confirm('Are you sure you want to delete this subject?')) {
                return;
            }

            try {
                const response = await fetch(`/api/admin/subjects/${subjectId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${this.getToken()}`
                    }
                });

                if (response.ok) {
                    await this.loadSubjects();
                    alert('Subject deleted successfully');
                } else {
                    const error = await response.json();
                    alert('Error deleting subject: ' + error.message);
                }
            } catch (error) {
                console.error('Error deleting subject:', error);
                alert('Error deleting subject');
            }
        },

        async saveClassConfiguration() {
            if (!this.selectedClass) {
                alert('Please select a class');
                return;
            }

            const configs = [];
            for (const [key, subjectType] of Object.entries(this.subjectConfigs)) {
                const [classId, subjectId] = key.split('_');
                if (classId === this.selectedClass) {
                    configs.push({
                        class_id: classId,
                        subject_id: subjectId,
                        subject_type: subjectType,
                        is_active: true
                    });
                }
            }

            if (configs.length === 0) {
                alert('Please select at least one subject');
                return;
            }

            try {
                const response = await fetch('/api/admin/class-subject-configurations/batch', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.getToken()}`
                    },
                    body: JSON.stringify({ configurations: configs })
                });

                if (response.ok) {
                    await this.loadClassSubjectConfigs();
                    this.subjectConfigs = {};
                    alert('Class configuration saved successfully');
                } else {
                    const error = await response.json();
                    alert('Error saving configuration: ' + error.message);
                }
            } catch (error) {
                console.error('Error saving configuration:', error);
                alert('Error saving configuration');
            }
        },

        async createTeacherAssignment() {
            if (!this.assignmentForm.class_id || !this.assignmentForm.subject_id || !this.assignmentForm.teacher_id) {
                alert('Please fill in all fields');
                return;
            }

            try {
                const response = await fetch('/api/admin/subject-teacher-assignments', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.getToken()}`
                    },
                    body: JSON.stringify(this.assignmentForm)
                });

                if (response.ok) {
                    await this.loadTeacherAssignments();
                    this.assignmentForm = {
                        class_id: '',
                        subject_id: '',
                        teacher_id: '',
                        assignment_type: 'primary'
                    };
                    alert('Teacher assigned successfully');
                } else {
                    const error = await response.json();
                    alert('Error assigning teacher: ' + error.message);
                }
            } catch (error) {
                console.error('Error assigning teacher:', error);
                alert('Error assigning teacher');
            }
        },

        async enrollPupilInSubject() {
            if (!this.enrollmentForm.class_id || !this.enrollmentForm.pupil_id || !this.enrollmentForm.subject_id) {
                alert('Please fill in all fields');
                return;
            }

            try {
                const response = await fetch('/api/admin/pupil-subject-enrollments', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.getToken()}`
                    },
                    body: JSON.stringify(this.enrollmentForm)
                });

                if (response.ok) {
                    await this.loadPupilEnrollments();
                    await this.loadAvailableOptionalSubjects();
                    this.enrollmentForm = {
                        class_id: this.enrollmentForm.class_id,
                        pupil_id: '',
                        subject_id: ''
                    };
                    alert('Pupil enrolled successfully');
                } else {
                    const error = await response.json();
                    alert('Error enrolling pupil: ' + error.message);
                }
            } catch (error) {
                console.error('Error enrolling pupil:', error);
                alert('Error enrolling pupil');
            }
        },

        async unenrollPupil(enrollmentId) {
            if (!confirm('Are you sure you want to unenroll this pupil?')) {
                return;
            }

            try {
                const response = await fetch(`/api/admin/pupil-subject-enrollments/${enrollmentId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${this.getToken()}`
                    }
                });

                if (response.ok) {
                    await this.loadPupilEnrollments();
                    await this.loadAvailableOptionalSubjects();
                    alert('Pupil unenrolled successfully');
                } else {
                    const error = await response.json();
                    alert('Error unenrolling pupil: ' + error.message);
                }
            } catch (error) {
                console.error('Error unenrolling pupil:', error);
                alert('Error unenrolling pupil');
            }
        },

        getToken() {
            try {
                return localStorage.getItem('shikola_token') || localStorage.getItem('authToken');
            } catch (e) {
                return null;
            }
        }
    };
}
