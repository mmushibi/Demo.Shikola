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
(function () {
    const RULES_KEY = 'shikola_rules_regulations_html';
    const LAST_PUPIL_KEY = 'shikola_last_exam_pupil_id';

    document.addEventListener('DOMContentLoaded', function () {
        const letter = document.getElementById('admission-letter-content');
        if (!letter) {
            return;
        }

        const elements = {
            date: letter.querySelector('[data-admission-date]'),
            admissionNo: letter.querySelector('[data-admission-no]'),
            pupilName: letter.querySelector('[data-admission-pupil-name]'),
            dob: letter.querySelector('[data-admission-dob]'),
            classLabel: letter.querySelector('[data-admission-class]'),
            academicYear: letter.querySelector('[data-admission-academic-year]'),
            yearHeading: letter.querySelector('[data-admission-year-heading]'),
            emptyState: letter.querySelector('[data-admission-empty-state]')
        };

        loadRulesSection();
        hydrateAdmissionLetter(elements, letter);
        setupActions(letter);
    });

    function setupActions(letter) {
        const printBtn = document.querySelector('[data-action="print-letter"]');
        const downloadBtn = document.querySelector('[data-action="download-letter"]');
        
        if (printBtn) {
            printBtn.addEventListener('click', function(evt) {
                evt.preventDefault();
                openLetterPrintWindow(letter);
            });
        }
        
        if (downloadBtn) {
            downloadBtn.addEventListener('click', function(evt) {
                evt.preventDefault();
                downloadLetterAsPDF(letter);
            });
        }
    }
    
    function downloadLetterAsPDF(letter) {
        const clone = letter.cloneNode(true);
        stripNonPrintableElements(clone);
        
        // Create print window for download
        const win = window.open('', '', 'width=900,height=650');
        if (!win) {
            alert('Please allow popups to download the admission letter');
            return;
        }
        
        const styles = [
            '@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap");',
            '@page{size:A4;margin:12mm;}',
            "body{font-family:'Inter','Segoe UI',system-ui,-apple-system,BlinkMacSystemFont,sans-serif;margin:0;padding:0;background:#f8fafc;color:#0f172a;}",
            '.print-container{max-width:180mm;margin:0 auto;padding:18px 24px;font-size:13px;line-height:1.35;}',
            '.print-container .letter-logo{height:34px;width:48px;border-radius:12px;margin:0 auto 6px;object-fit:cover;}',
            '.print-container h2{margin:0;font-size:20px;letter-spacing:0.12em;text-transform:uppercase;}',
            '.print-container h3{margin:0;font-size:15px;text-transform:uppercase;letter-spacing:0.08em;}',
            '.print-container h4{margin:18px 0 6px;font-size:11px;text-transform:uppercase;letter-spacing:0.12em;}',
            '.print-container p{margin:0 0 10px;}',
            '.print-container ul{margin:0 0 10px;padding-left:18px;}',
            '.print-container .signature{margin-top:28px;text-align:center;}',
            '@media print{body{background:#ffffff;}.print-container{padding:12px 18px;}}'
        ].join('');
        
        const html =
            '<!DOCTYPE html>' +
            '<html><head><meta charset="utf-8">' +
            '<title>Admission Letter</title>' +
            '<style>' + styles + '</style>' +
            '</head><body>' +
            '<div class="print-container">' + clone.outerHTML + '</div>' +
            '</body></html>';
        
        win.document.open();
        win.document.write(html);
        win.document.close();
        
        win.addEventListener('load', function () {
            try {
                win.focus();
                setTimeout(function () {
                    // Trigger print dialog which allows user to save as PDF
                    win.print();
                    
                    // Auto-close the window after printing
                    setTimeout(function() {
                        win.close();
                    }, 1000);
                }, 300);
            } catch (e) {
                console.error('Error during download:', e);
                win.close();
            }
        });
    }

    function openLetterPrintWindow(letter) {
        const clone = letter.cloneNode(true);
        stripNonPrintableElements(clone);
        const win = window.open('', '', 'width=900,height=650');
        if (!win) {
            return;
        }
        const styles = [
            '@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap");',
            '@page{size:A4;margin:12mm;}',
            "body{font-family:'Inter','Segoe UI',system-ui,-apple-system,BlinkMacSystemFont,sans-serif;margin:0;padding:0;background:#f8fafc;color:#0f172a;}",
            '.print-container{max-width:180mm;margin:0 auto;padding:18px 24px;font-size:13px;line-height:1.35;}',
            '.print-container .letter-logo{height:34px;width:48px;border-radius:12px;margin:0 auto 6px;object-fit:cover;}',
            '.print-container h2{margin:0;font-size:20px;letter-spacing:0.12em;text-transform:uppercase;}',
            '.print-container h3{margin:0;font-size:15px;text-transform:uppercase;letter-spacing:0.08em;}',
            '.print-container h4{margin:18px 0 6px;font-size:11px;text-transform:uppercase;letter-spacing:0.12em;}',
            '.print-container p{margin:0 0 10px;}',
            '.print-container ul{margin:0 0 10px;padding-left:18px;}',
            '.print-container .signature{margin-top:28px;text-align:center;}',
            '@media print{body{background:#ffffff;}.print-container{padding:12px 18px;}}'
        ].join('');
        const html =
            '<!DOCTYPE html>' +
            '<html><head><meta charset="utf-8">' +
            '<title>Admission Letter</title>' +
            '<style>' + styles + '</style>' +
            '</head><body>' +
            '<div class="print-container">' + clone.outerHTML + '</div>' +
            '</body></html>';
        win.document.open();
        win.document.write(html);
        win.document.close();
        win.addEventListener('load', function () {
            try {
                win.focus();
                setTimeout(function () {
                    win.print();
                }, 300);
            } catch (e) {
            }
        });
    }

    function stripNonPrintableElements(root) {
        if (!root || typeof root.querySelectorAll !== 'function') return;
        root.querySelectorAll('[data-action]').forEach(function (el) {
            el.parentNode && el.parentNode.removeChild(el);
        });
        root.querySelectorAll('[data-admission-empty-state]').forEach(function (el) {
            if (el.classList.contains('hidden')) {
                el.parentNode && el.parentNode.removeChild(el);
            }
        });
    }

    function loadRulesSection() {
        try {
            const stored = localStorage.getItem(RULES_KEY);
            if (!stored) return;
            const looksUnsafe = /<script[\s>]/i.test(stored) || /openLetterPrintWindow/.test(stored);
            if (looksUnsafe) {
                localStorage.removeItem(RULES_KEY);
                return;
            }
            const container = document.getElementById('admission-rules-content');
            if (container) {
                container.innerHTML = stored;
            }
        } catch (e) {
        }
    }

    async function hydrateAdmissionLetter(elements, letter) {
        toggleEmptyState(elements.emptyState, true);
        setLoadingState(letter, true);
        
        try {
            // Fetch real admission letter data from API
            const response = await fetch('/api/pupil-portal/admission-letter');
            
            if (!response.ok) {
                if (response.status === 404) {
                    // Pupil not found - show empty state
                    setLoadingState(letter, false);
                    return;
                }
                throw new Error('Failed to fetch admission letter data');
            }
            
            const result = await response.json();
            
            if (!result.success || !result.data) {
                setLoadingState(letter, false);
                return;
            }
            
            // Apply real data to the letter
            applyRealDataToLetter(result.data, elements);
            setLoadingState(letter, false);
            toggleEmptyState(elements.emptyState, false);
            
        } catch (error) {
            console.error('Error loading admission letter:', error);
            // Try to load school profile separately if admission letter fails
            try {
                await loadSchoolProfileAndApply(elements);
                // Fallback to existing logic for pupil data
                const list = await fetchPupilsList();
                if (!Array.isArray(list) || !list.length) {
                    setLoadingState(letter, false);
                    return;
                }
                const pupil = resolveCurrentPupil(list);
                if (!pupil) {
                    setLoadingState(letter, false);
                    return;
                }
                applyPupilToLetter(pupil, elements);
                setLoadingState(letter, false);
                toggleEmptyState(elements.emptyState, false);
            } catch (profileError) {
                console.error('Error loading school profile:', profileError);
                setLoadingState(letter, false);
            }
        }
    }
    
    async function loadSchoolProfileAndApply(elements) {
        try {
            const response = await fetch('/api/school-admin/settings/profile');
            if (response.ok) {
                const result = await response.json();
                if (result.success && result.data) {
                    updateSchoolInfo(result.data);
                }
            }
        } catch (error) {
            console.error('Error fetching school profile:', error);
        }
    }

    function setLoadingState(letter, isLoading) {
        letter.classList.toggle('opacity-50', !!isLoading);
    }

    function toggleEmptyState(el, show) {
        if (!el) return;
        el.classList.toggle('hidden', !show);
    }

    async function fetchPupilsList() {
        try {
            if (window.ShikolaPupilsApi && typeof window.ShikolaPupilsApi.listPupils === 'function') {
                return await window.ShikolaPupilsApi.listPupils();
            }
            if (window.ShikolaPupilsApi && typeof window.ShikolaPupilsApi.getLocalPupils === 'function') {
                return window.ShikolaPupilsApi.getLocalPupils();
            }
            if (window.ShikolaPupilsStore && typeof window.ShikolaPupilsStore.list === 'function') {
                return window.ShikolaPupilsStore.list();
            }
        } catch (e) {
        }
        return [];
    }

    function resolveCurrentPupil(list) {
        const byAuth = matchByAuthUser(list);
        if (byAuth) return byAuth;
        const byLastViewed = matchByLastViewed(list);
        if (byLastViewed) return byLastViewed;
        return list.find(function (p) {
            return p && (p.status === 'Admitted' || p.status === 'Active');
        }) || list[0];
    }

    function matchByAuthUser(list) {
        try {
            if (!window.shikolaAuth || typeof window.shikolaAuth.getCurrentUser !== 'function') {
                return null;
            }
            const user = window.shikolaAuth.getCurrentUser();
            if (!user) return null;
            const email = (user.email || '').toLowerCase();
            const usernamePart = email.split('@')[0] || '';
            return list.find(function (pupil) {
                if (!pupil) return false;
                const login = (pupil.loginUsername || '').toLowerCase();
                const pupilEmail = (pupil.email || '').toLowerCase();
                return (login && (login === email || login === usernamePart)) || (pupilEmail && pupilEmail === email);
            }) || null;
        } catch (e) {
            return null;
        }
    }

    function matchByLastViewed(list) {
        try {
            const id = localStorage.getItem(LAST_PUPIL_KEY);
            if (!id) return null;
            return list.find(function (pupil) {
                const candidate = pupil && (pupil.id || pupil.pupilId || pupil.admissionNo || pupil.registrationNo);
                return candidate && String(candidate) === String(id);
            }) || null;
        } catch (e) {
            return null;
        }
    }

    function applyRealDataToLetter(data, elements) {
        // Format the date
        const formattedDate = data.date ? new Date(data.date).toLocaleDateString() : new Date().toLocaleDateString();
        
        // Format date of birth
        const formattedDob = data.dateOfBirth ? new Date(data.dateOfBirth).toLocaleDateString() : '—';
        
        // Apply all data
        setText(elements.date, formattedDate);
        setText(elements.admissionNo, data.admissionNumber || 'Pending');
        setText(elements.pupilName, data.pupilName || 'Pupil Name');
        setText(elements.dob, formattedDob);
        setText(elements.classLabel, data.classAdmitted || '—');
        setText(elements.academicYear, data.academicYear || '—');
        
        if (elements.yearHeading) {
            const yearLabel = (data.academicYear || '').toString().trim();
            elements.yearHeading.textContent = yearLabel ? `Academic Year ${yearLabel}` : 'Academic Year';
        }
        
        // Update school information
        updateSchoolInfo(data);
        
        // Update rules and regulations
        updateRulesAndRegulations(data.rulesAndRegulations);
    }
    
    function updateSchoolInfo(data) {
        // Update school logo - only use uploaded logo, fall back to default if null/empty
        const logoElements = document.querySelectorAll('[data-school-logo]');
        logoElements.forEach(el => {
            if (el.tagName === 'IMG') {
                // Use uploaded logo if available, otherwise use default
                const logoSrc = data.schoolLogo && data.schoolLogo.trim() !== '' 
                    ? data.schoolLogo 
                    : '/frontend/assets/images/logo.png';
                el.src = logoSrc;
                el.alt = `${data.schoolName || 'School'} logo`;
            }
        });
        
        // Update school name elements
        const schoolNameElements = document.querySelectorAll('[data-school-name]');
        schoolNameElements.forEach(el => {
            const currentText = el.textContent;
            // Replace placeholder if present, otherwise update current content
            if (currentText.includes('[SCHOOL NAME]')) {
                el.textContent = currentText.replace('[SCHOOL NAME]', data.schoolName || 'School Name');
            } else {
                el.textContent = data.schoolName || currentText || 'School Name';
            }
        });
        
        // Update school tagline
        const taglineElement = document.querySelector('[data-school-tagline]');
        if (taglineElement) {
            const currentText = taglineElement.textContent;
            if (currentText.includes('[SCHOOL TAGLINE]')) {
                taglineElement.textContent = currentText.replace('[SCHOOL TAGLINE]', data.schoolTagline || 'Excellence in Education');
            } else {
                taglineElement.textContent = data.schoolTagline || currentText || 'Excellence in Education';
            }
        }
        
        // Update contact information
        updateContactInfo('address', data.schoolAddress || 'School Address');
        updateContactInfo('phone', data.schoolPhone || 'School Phone');
        updateContactInfo('email', data.schoolEmail || 'School Email');
        updateContactInfo('website', data.schoolWebsite || 'School Website');
        
        // Update head teacher signature
        const headteacherElement = document.querySelector('[data-school-headteacher]');
        if (headteacherElement) {
            const currentText = headteacherElement.textContent;
            if (currentText.includes('[HEAD TEACHER NAME]')) {
                headteacherElement.textContent = currentText.replace('[HEAD TEACHER NAME]', data.headTeacherName || 'Head Teacher');
            } else {
                headteacherElement.textContent = data.headTeacherName || currentText || 'Head Teacher';
            }
        }
    }
    
    function updateContactInfo(type, value) {
        const element = document.querySelector(`[data-school-${type}]`);
        if (element) {
            const currentText = element.textContent;
            const placeholder = `[SCHOOL ${type.toUpperCase()}]`;
            if (currentText.includes(placeholder)) {
                element.textContent = currentText.replace(placeholder, value);
            } else {
                element.textContent = value || currentText;
            }
        }
    }
    
    function updateRulesAndRegulations(rulesHtml) {
        const rulesContainer = document.getElementById('admission-rules-content');
        if (rulesContainer && rulesHtml) {
            rulesContainer.innerHTML = rulesHtml;
        }
    }

    function applyPupilToLetter(pupil, elements) {
        const today = new Date();
        setText(elements.date, today.toLocaleDateString());
        setText(elements.admissionNo, pupil.admissionNo || pupil.registrationNo || pupil.id || 'Pending');
        setText(elements.pupilName, getFullName(pupil));
        setText(elements.dob, pupil.dob || '—');
        setText(elements.classLabel, getClassLabel(pupil));
        setText(elements.academicYear, pupil.academicYear || pupil.sessionYear || '—');
        if (elements.yearHeading) {
            var yearLabel = (pupil.academicYear || pupil.sessionYear || '').toString().trim();
            elements.yearHeading.textContent = yearLabel ? ('Academic Year ' + yearLabel) : 'Academic Year';
        }
    }

    function getFullName(pupil) {
        if (!pupil) return '';
        const full = (pupil.fullName || ((pupil.firstName || '') + ' ' + (pupil.lastName || ''))).trim();
        if (full) return full;
        return pupil.admissionNo || pupil.id || 'Pupil';
    }

    function getClassLabel(pupil) {
        if (!pupil) return '';
        return pupil.classGrade || pupil.classLabel || pupil.className || '—';
    }

    function setText(el, value) {
        if (!el) return;
        el.textContent = value || '';
    }
})();
