/*
Pupil Report Card Data Loader
Auto-generated mock data loader for Shikola Academy
Generated on 2026-04-05 17:33:00
*/

// Initialize report card data when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadReportCardData();
});

function loadReportCardData() {
    // Wait for mock data to be available
    if (typeof window.ShikolaPupilMockData === 'undefined') {
        setTimeout(loadReportCardData, 100);
        return;
    }

    const mockData = window.ShikolaPupilMockData;
    const reportCardData = mockData.reportCardData;
    
    // Set up Alpine.js data for report card page
    if (typeof window.Alpine !== 'undefined') {
        window.Alpine.data('pupilReportCardPage', () => ({
            activeCardType: 'result',
            activeTerm: 'term1',
            loading: false,
            isPublished: true,
            syncStatus: 'connected',
            sidebarOpen: false,
            
            init() {
                this.loadCardData();
                this.startRealtimeSync();
            },
            
            setActiveCardType(type) {
                this.activeCardType = type;
                this.loadCardData();
            },
            
            setActiveTerm(term) {
                this.activeTerm = term;
                this.loadCardData();
            },
            
            loadCardData() {
                this.loading = true;
                
                // Simulate loading delay
                setTimeout(() => {
                    const termData = reportCardData[this.activeTerm];
                    if (termData && termData[this.activeCardType]) {
                        this.renderCard(termData[this.activeCardType]);
                        this.isPublished = true;
                    } else {
                        this.isPublished = false;
                    }
                    this.loading = false;
                }, 500);
            },
            
            renderCard(data) {
                const container = document.getElementById('cardContent');
                if (!container) return;
                
                if (this.activeCardType === 'result') {
                    container.innerHTML = this.renderResultCard(data);
                } else {
                    container.innerHTML = this.renderReportCard(data);
                }
            },
            
            renderResultCard(data) {
                return `
                    <div class="space-y-6">
                        <!-- Student Information -->
                        <div class="bg-gradient-to-r from-orange-50 to-orange-100 rounded-2xl p-6 border border-orange-200">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <h3 class="text-lg font-semibold text-slate-800 mb-3">Student Information</h3>
                                    <div class="space-y-2 text-sm">
                                        <div class="flex justify-between">
                                            <span class="text-slate-600">Name:</span>
                                            <span class="font-medium text-slate-800">${mockData.currentPupil.first_name} ${mockData.currentPupil.last_name}</span>
                                        </div>
                                        <div class="flex justify-between">
                                            <span class="text-slate-600">Class:</span>
                                            <span class="font-medium text-slate-800">${mockData.currentPupil.class_name}</span>
                                        </div>
                                        <div class="flex justify-between">
                                            <span class="text-slate-600">Pupil ID:</span>
                                            <span class="font-medium text-slate-800">${mockData.currentPupil.pupil_id}</span>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h3 class="text-lg font-semibold text-slate-800 mb-3">Academic Summary</h3>
                                    <div class="space-y-2 text-sm">
                                        <div class="flex justify-between">
                                            <span class="text-slate-600">Total Score:</span>
                                            <span class="font-medium text-slate-800">${data.totalScore}/${data.maxTotalScore}</span>
                                        </div>
                                        <div class="flex justify-between">
                                            <span class="text-slate-600">Average:</span>
                                            <span class="font-medium text-slate-800">${data.average}%</span>
                                        </div>
                                        <div class="flex justify-between">
                                            <span class="text-slate-600">Grade:</span>
                                            <span class="font-bold text-orange-600 text-lg">${data.grade}</span>
                                        </div>
                                        <div class="flex justify-between">
                                            <span class="text-slate-600">Position:</span>
                                            <span class="font-medium text-slate-800">${data.position}/${data.totalPupils}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Subjects Table -->
                        <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                            <div class="bg-slate-50 px-6 py-4 border-b border-slate-200">
                                <h3 class="text-lg font-semibold text-slate-800">Subject Results</h3>
                            </div>
                            <div class="overflow-x-auto">
                                <table class="w-full">
                                    <thead class="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Subject</th>
                                            <th class="px-6 py-3 text-center text-xs font-medium text-slate-600 uppercase tracking-wider">Score</th>
                                            <th class="px-6 py-3 text-center text-xs font-medium text-slate-600 uppercase tracking-wider">Grade</th>
                                            <th class="px-6 py-3 text-center text-xs font-medium text-slate-600 uppercase tracking-wider">Position</th>
                                            <th class="px-6 py-3 text-center text-xs font-medium text-slate-600 uppercase tracking-wider">Class Avg</th>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Remarks</th>
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-slate-200">
                                        ${data.subjects.map(subject => `
                                            <tr class="hover:bg-slate-50 transition-colors">
                                                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">${subject.subject}</td>
                                                <td class="px-6 py-4 whitespace-nowrap text-sm text-center">
                                                    <span class="font-semibold text-slate-800">${subject.score}</span>
                                                    <span class="text-slate-500">/${subject.maxScore}</span>
                                                </td>
                                                <td class="px-6 py-4 whitespace-nowrap text-sm text-center">
                                                    <span class="px-2 py-1 text-xs font-medium rounded-full ${this.getGradeColor(subject.grade)}">
                                                        ${subject.grade}
                                                    </span>
                                                </td>
                                                <td class="px-6 py-4 whitespace-nowrap text-sm text-center text-slate-600">${subject.position}</td>
                                                <td class="px-6 py-4 whitespace-nowrap text-sm text-center text-slate-600">${subject.classAverage}</td>
                                                <td class="px-6 py-4 text-sm text-slate-600">${subject.remarks}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        
                        <!-- Attendance and Conduct -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div class="bg-white rounded-2xl border border-slate-200 p-6">
                                <h3 class="text-lg font-semibold text-slate-800 mb-4">Attendance</h3>
                                <div class="space-y-3">
                                    <div class="flex justify-between items-center">
                                        <span class="text-sm text-slate-600">Total School Days</span>
                                        <span class="font-medium text-slate-800">${data.attendance.totalDays}</span>
                                    </div>
                                    <div class="flex justify-between items-center">
                                        <span class="text-sm text-slate-600">Days Present</span>
                                        <span class="font-medium text-green-600">${data.attendance.presentDays}</span>
                                    </div>
                                    <div class="flex justify-between items-center">
                                        <span class="text-sm text-slate-600">Days Absent</span>
                                        <span class="font-medium text-red-600">${data.attendance.absentDays}</span>
                                    </div>
                                    <div class="pt-3 border-t border-slate-200">
                                        <div class="flex justify-between items-center">
                                            <span class="text-sm font-medium text-slate-700">Attendance Rate</span>
                                            <span class="text-lg font-bold text-green-600">${data.attendance.percentage}%</span>
                                        </div>
                                        <div class="mt-2 bg-slate-200 rounded-full h-2">
                                            <div class="bg-green-500 h-2 rounded-full" style="width: ${data.attendance.percentage}%"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="bg-white rounded-2xl border border-slate-200 p-6">
                                <h3 class="text-lg font-semibold text-slate-800 mb-4">Conduct & Remarks</h3>
                                <div class="space-y-4">
                                    <div>
                                        <span class="text-sm font-medium text-slate-700">Conduct:</span>
                                        <span class="ml-2 px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">${data.conduct}</span>
                                    </div>
                                    <div>
                                        <h4 class="text-sm font-medium text-slate-700 mb-2">Class Teacher's Remarks:</h4>
                                        <p class="text-sm text-slate-600 italic">"${data.teacherRemarks}"</p>
                                    </div>
                                    <div>
                                        <h4 class="text-sm font-medium text-slate-700 mb-2">Principal's Remarks:</h4>
                                        <p class="text-sm text-slate-600 italic">"${data.principalRemarks}"</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            },
            
            renderReportCard(data) {
                return `
                    <div class="space-y-6">
                        <!-- Student Information -->
                        <div class="bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <h3 class="text-lg font-semibold text-slate-800 mb-3">Student Information</h3>
                                    <div class="space-y-2 text-sm">
                                        <div class="flex justify-between">
                                            <span class="text-slate-600">Name:</span>
                                            <span class="font-medium text-slate-800">${mockData.currentPupil.first_name} ${mockData.currentPupil.last_name}</span>
                                        </div>
                                        <div class="flex justify-between">
                                            <span class="text-slate-600">Class:</span>
                                            <span class="font-medium text-slate-800">${mockData.currentPupil.class_name}</span>
                                        </div>
                                        <div class="flex justify-between">
                                            <span class="text-slate-600">Pupil ID:</span>
                                            <span class="font-medium text-slate-800">${mockData.currentPupil.pupil_id}</span>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h3 class="text-lg font-semibold text-slate-800 mb-3">Academic Summary</h3>
                                    <div class="space-y-2 text-sm">
                                        <div class="flex justify-between">
                                            <span class="text-slate-600">Total Score:</span>
                                            <span class="font-medium text-slate-800">${data.totalScore}/${data.maxTotalScore}</span>
                                        </div>
                                        <div class="flex justify-between">
                                            <span class="text-slate-600">Average:</span>
                                            <span class="font-medium text-slate-800">${data.average}%</span>
                                        </div>
                                        <div class="flex justify-between">
                                            <span class="text-slate-600">Grade:</span>
                                            <span class="font-bold text-blue-600 text-lg">${data.grade}</span>
                                        </div>
                                        <div class="flex justify-between">
                                            <span class="text-slate-600">Position:</span>
                                            <span class="font-medium text-slate-800">${data.position}/${data.totalPupils}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Detailed Subjects Table -->
                        <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                            <div class="bg-slate-50 px-6 py-4 border-b border-slate-200">
                                <h3 class="text-lg font-semibold text-slate-800">Detailed Subject Performance</h3>
                            </div>
                            <div class="overflow-x-auto">
                                <table class="w-full">
                                    <thead class="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Subject</th>
                                            <th class="px-6 py-3 text-center text-xs font-medium text-slate-600 uppercase tracking-wider">CA 1</th>
                                            <th class="px-6 py-3 text-center text-xs font-medium text-slate-600 uppercase tracking-wider">CA 2</th>
                                            <th class="px-6 py-3 text-center text-xs font-medium text-slate-600 uppercase tracking-wider">Exam</th>
                                            <th class="px-6 py-3 text-center text-xs font-medium text-slate-600 uppercase tracking-wider">Total</th>
                                            <th class="px-6 py-3 text-center text-xs font-medium text-slate-600 uppercase tracking-wider">Grade</th>
                                            <th class="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Remarks</th>
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-slate-200">
                                        ${data.subjects.map(subject => `
                                            <tr class="hover:bg-slate-50 transition-colors">
                                                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">${subject.subject}</td>
                                                <td class="px-6 py-4 whitespace-nowrap text-sm text-center text-slate-600">${subject.ca1}</td>
                                                <td class="px-6 py-4 whitespace-nowrap text-sm text-center text-slate-600">${subject.ca2}</td>
                                                <td class="px-6 py-4 whitespace-nowrap text-sm text-center">
                                                    <span class="font-semibold text-slate-800">${subject.exam}</span>
                                                </td>
                                                <td class="px-6 py-4 whitespace-nowrap text-sm text-center">
                                                    <span class="font-bold text-slate-800">${subject.total}</span>
                                                    <span class="text-slate-500">/${subject.maxTotal}</span>
                                                </td>
                                                <td class="px-6 py-4 whitespace-nowrap text-sm text-center">
                                                    <span class="px-2 py-1 text-xs font-medium rounded-full ${this.getGradeColor(subject.grade)}">
                                                        ${subject.grade}
                                                    </span>
                                                </td>
                                                <td class="px-6 py-4 text-sm text-slate-600">${subject.remarks}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        
                        <!-- Attendance and Conduct -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div class="bg-white rounded-2xl border border-slate-200 p-6">
                                <h3 class="text-lg font-semibold text-slate-800 mb-4">Attendance</h3>
                                <div class="space-y-3">
                                    <div class="flex justify-between items-center">
                                        <span class="text-sm text-slate-600">Total School Days</span>
                                        <span class="font-medium text-slate-800">${data.attendance.totalDays}</span>
                                    </div>
                                    <div class="flex justify-between items-center">
                                        <span class="text-sm text-slate-600">Days Present</span>
                                        <span class="font-medium text-green-600">${data.attendance.presentDays}</span>
                                    </div>
                                    <div class="flex justify-between items-center">
                                        <span class="text-sm text-slate-600">Days Absent</span>
                                        <span class="font-medium text-red-600">${data.attendance.absentDays}</span>
                                    </div>
                                    <div class="pt-3 border-t border-slate-200">
                                        <div class="flex justify-between items-center">
                                            <span class="text-sm font-medium text-slate-700">Attendance Rate</span>
                                            <span class="text-lg font-bold text-green-600">${data.attendance.percentage}%</span>
                                        </div>
                                        <div class="mt-2 bg-slate-200 rounded-full h-2">
                                            <div class="bg-green-500 h-2 rounded-full" style="width: ${data.attendance.percentage}%"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="bg-white rounded-2xl border border-slate-200 p-6">
                                <h3 class="text-lg font-semibold text-slate-800 mb-4">Conduct & Remarks</h3>
                                <div class="space-y-4">
                                    <div>
                                        <span class="text-sm font-medium text-slate-700">Conduct:</span>
                                        <span class="ml-2 px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">${data.conduct}</span>
                                    </div>
                                    <div>
                                        <h4 class="text-sm font-medium text-slate-700 mb-2">Class Teacher's Remarks:</h4>
                                        <p class="text-sm text-slate-600 italic">"${data.teacherRemarks}"</p>
                                    </div>
                                    <div>
                                        <h4 class="text-sm font-medium text-slate-700 mb-2">Principal's Remarks:</h4>
                                        <p class="text-sm text-slate-600 italic">"${data.principalRemarks}"</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            },
            
            getGradeColor(grade) {
                const colors = {
                    'A+': 'bg-green-100 text-green-700',
                    'A': 'bg-green-100 text-green-600',
                    'B+': 'bg-blue-100 text-blue-600',
                    'B': 'bg-blue-100 text-blue-500',
                    'C+': 'bg-yellow-100 text-yellow-600',
                    'C': 'bg-yellow-100 text-yellow-500',
                    'D': 'bg-orange-100 text-orange-600',
                    'F': 'bg-red-100 text-red-600'
                };
                return colors[grade] || 'bg-slate-100 text-slate-600';
            },
            
            startRealtimeSync() {
                // Simulate real-time sync status updates
                setInterval(() => {
                    const statuses = ['connected', 'syncing'];
                    this.syncStatus = statuses[Math.floor(Math.random() * statuses.length)];
                    
                    if (this.syncStatus === 'syncing') {
                        setTimeout(() => {
                            this.syncStatus = 'connected';
                        }, 2000);
                    }
                }, 30000);
            },
            
            manualRefresh() {
                this.syncStatus = 'syncing';
                this.loadCardData();
                setTimeout(() => {
                    this.syncStatus = 'connected';
                }, 1000);
            },
            
            getSyncStatusDisplay() {
                const statusMap = {
                    'connected': { text: 'Connected', color: 'text-green-500' },
                    'syncing': { text: 'Syncing...', color: 'text-blue-500' },
                    'offline': { text: 'Offline', color: 'text-orange-500' },
                    'error': { text: 'Error', color: 'text-red-500' }
                };
                return statusMap[this.syncStatus] || { text: 'Unknown', color: 'text-slate-500' };
            },
            
            formatLastSyncTime() {
                return new Date().toLocaleTimeString();
            },
            
            clearCacheAndReload() {
                localStorage.clear();
                location.reload();
            }
        }));
    }
}
