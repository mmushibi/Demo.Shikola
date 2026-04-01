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
// AI Quick Start Assistant for Shikola

class AIQuickStartAssistant {
    constructor() {
        this.conversationState = 'initial';
        this.schoolInfo = {
            name: '',
            type: '',
            size: '',
            location: '',
            grades: [],
            features: [],
            timeline: ''
        };
        this.messageId = 0;
    }

    // Generate contextual AI responses based on conversation state
    generateResponse(userMessage, currentContext) {
        const message = userMessage.toLowerCase().trim();
        
        // Initial greeting and setup
        if (this.conversationState === 'initial') {
            this.conversationState = 'gathering_info';
            return {
                text: "👋 Welcome! I'm your Shikola AI Assistant. I'll help you set up your school perfectly in minutes.\n\nLet's start with the basics: What's your school's name and what type of school are you (primary, secondary, or combined)?",
                suggestions: [
                    { text: "Primary School", action: 'set_type', value: 'primary' },
                    { text: "Secondary School", action: 'set_type', value: 'secondary' },
                    { text: "Combined School", action: 'set_type', value: 'combined' }
                ]
            };
        }

        // Handle school type selection
        if (message.includes('primary') || message.includes('secondary') || message.includes('combined')) {
            if (message.includes('primary')) {
                this.schoolInfo.type = 'primary';
                this.schoolInfo.grades = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7'];
            } else if (message.includes('secondary')) {
                this.schoolInfo.type = 'secondary';
                this.schoolInfo.grades = ['Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
            } else {
                this.schoolInfo.type = 'combined';
                this.schoolInfo.grades = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
            }
            
            this.conversationState = 'size_info';
            return {
                text: `Great! A ${this.schoolInfo.type} school. Now, how many pupils do you expect to have? This helps me recommend the perfect plan for you.`,
                suggestions: [
                    { text: "Under 500 pupils", action: 'set_size', value: 'small' },
                    { text: "500-2000 pupils", action: 'set_size', value: 'medium' },
                    { text: "2000+ pupils", action: 'set_size', value: 'large' }
                ]
            };
        }

        // Handle school size
        if (message.includes('pupil') || message.includes('student') || message.includes('under') || message.includes('500') || message.includes('2000')) {
            if (message.includes('under') || message.includes('small') || message.includes('less than 500')) {
                this.schoolInfo.size = 'small';
                this.recommendPlan = 'Growth';
            } else if (message.includes('500') || message.includes('medium') || message.includes('1000') || message.includes('1500')) {
                this.schoolInfo.size = 'medium';
                this.recommendPlan = 'Pro';
            } else {
                this.schoolInfo.size = 'large';
                this.recommendPlan = 'Ultimate';
            }
            
            this.conversationState = 'location';
            return {
                text: `Perfect! Based on your size, I recommend our **${this.recommendPlan}** plan.\n\nWhere is your school located? This helps us provide region-specific guidance and support.`,
                suggestions: [
                    { text: "Lusaka", action: 'set_location', value: 'Lusaka' },
                    { text: "Copperbelt", action: 'set_location', value: 'Copperbelt' },
                    { text: "Southern Province", action: 'set_location', value: 'Southern' },
                    { text: "Other location", action: 'set_location', value: 'other' }
                ]
            };
        }

        // Handle location
        if (message.includes('lusaka') || message.includes('copperbelt') || message.includes('southern') || message.includes('province') || message.includes('location')) {
            if (message.includes('lusaka')) this.schoolInfo.location = 'Lusaka';
            else if (message.includes('copperbelt')) this.schoolInfo.location = 'Copperbelt';
            else if (message.includes('southern')) this.schoolInfo.location = 'Southern Province';
            else this.schoolInfo.location = message;
            
            this.conversationState = 'features';
            return {
                text: `Excellent! ${this.schoolInfo.location} is a great location for education.\n\nWhat features are most important for your school? Select all that apply:`,
                suggestions: [
                    { text: "Fee Management", action: 'add_feature', value: 'fees' },
                    { text: "Parent Communication", action: 'add_feature', value: 'communication' },
                    { text: "ECZ Grading System", action: 'add_feature', value: 'ecz' },
                    { text: "Timetable Management", action: 'add_feature', value: 'timetable' },
                    { text: "Report Cards", action: 'add_feature', value: 'reports' },
                    { text: "All Features", action: 'add_feature', value: 'all' }
                ]
            };
        }

        // Handle features
        if (message.includes('fee') || message.includes('parent') || message.includes('ecz') || message.includes('timetable') || message.includes('report') || message.includes('all')) {
            if (message.includes('all')) {
                this.schoolInfo.features = ['fees', 'communication', 'ecz', 'timetable', 'reports'];
            } else {
                if (message.includes('fee')) this.schoolInfo.features.push('fees');
                if (message.includes('parent') || message.includes('communication')) this.schoolInfo.features.push('communication');
                if (message.includes('ecz') || message.includes('grading')) this.schoolInfo.features.push('ecz');
                if (message.includes('timetable')) this.schoolInfo.features.push('timetable');
                if (message.includes('report')) this.schoolInfo.features.push('reports');
            }
            
            this.conversationState = 'timeline';
            return {
                text: `Perfect! I've noted your priorities.\n\nWhen would you like to start using Shikola? This helps me prepare your setup timeline.`,
                suggestions: [
                    { text: "Immediately", action: 'set_timeline', value: 'immediate' },
                    { text: "This week", action: 'set_timeline', value: 'week' },
                    { text: "Next month", action: 'set_timeline', value: 'month' },
                    { text: "Just exploring", action: 'set_timeline', value: 'exploring' }
                ]
            };
        }

        // Handle timeline and provide summary
        if (message.includes('immediately') || message.includes('week') || message.includes('month') || message.includes('exploring')) {
            if (message.includes('immediately')) this.schoolInfo.timeline = 'immediate';
            else if (message.includes('week')) this.schoolInfo.timeline = 'week';
            else if (message.includes('month')) this.schoolInfo.timeline = 'month';
            else this.schoolInfo.timeline = 'exploring';
            
            this.conversationState = 'complete';
            return this.generateSetupSummary();
        }

        // Handle specific questions
        if (message.includes('pricing') || message.includes('cost') || message.includes('price')) {
            return {
                text: "We have flexible pricing plans:\n\n**Growth Plan** - Perfect for small schools (up to 1,000 pupils)\n**Pro Plan** - Great for growing schools (up to 3,000 pupils)\n**Ultimate Plan** - Complete solution for large schools (up to 10,000 pupils)\n\nWould you like me to recommend the best plan based on your school size?",
                suggestions: [
                    { text: "Recommend a plan", action: 'recommend_plan' },
                    { text: "Tell me more about features", action: 'features_info' }
                ]
            };
        }

        if (message.includes('ecz') || message.includes('grading') || message.includes('examination')) {
            return {
                text: "Shikola includes the ECZ (Examinations Council of Zambia) grading system by default! This means:\n\n✅ Standard ECZ 1-9 point scale\n✅ Automatic division calculations\n✅ Pass/fail criteria compliance\n✅ Report card integration\n✅ Customizable grading scales\n\nIt's perfect for Zambian schools and ensures compliance with national standards.",
                suggestions: [
                    { text: "Continue setup", action: 'continue_setup' },
                    { text: "Learn about features", action: 'features_info' }
                ]
            };
        }

        if (message.includes('setup') || message.includes('start') || message.includes('begin')) {
            return {
                text: "Great! Let's get you started. I'll guide you through a quick setup process to configure Shikola perfectly for your school.\n\nFirst, tell me about your school - what's your school's name?",
                suggestions: [
                    { text: "My school is...", action: 'provide_name' },
                    { text: "I need help choosing", action: 'help_choose' }
                ]
            };
        }

        // Default response
        return {
            text: "I'm here to help you set up your school with Shikola! I can assist with:\n\n🎯 School configuration\n💰 Plan recommendations\n📚 Feature explanations\n🚀 Getting started guide\n\nWhat would you like to know more about?",
            suggestions: [
                { text: "Pricing plans", action: 'pricing_info' },
                { text: "Key features", action: 'features_info' },
                { text: "Start setup", action: 'start_setup' },
                { text: "ECZ grading", action: 'ecz_info' }
            ]
        };
    }

    generateSetupSummary() {
        const features = this.schoolInfo.features.length > 0 ? 
            this.schoolInfo.features.map(f => {
                const featureNames = {
                    'fees': '💰 Fee Management',
                    'communication': '📱 Parent Communication',
                    'ecz': '📊 ECZ Grading',
                    'timetable': '📅 Timetable Management',
                    'reports': '📋 Report Cards'
                };
                return featureNames[f] || f;
            }).join('\n') : 'All features';

        return {
            text: `🎉 **Perfect! Here's your personalized Shikola setup:**\n\n**School Type:** ${this.schoolInfo.type}\n**Size:** ${this.schoolInfo.size}\n**Location:** ${this.schoolInfo.location}\n**Recommended Plan:** ${this.recommendPlan}\n**Key Features:**\n${features}\n\n**Next Steps:**\n1️⃣ Sign up for your account\n2️⃣ Choose the ${this.recommendPlan} plan\n3️⃣ I'll help you configure everything\n\nReady to get started? Click the "Get Started" button and I'll guide you through each step!`,
            suggestions: [
                { text: "Sign up now", action: 'signup' },
                { text: "Ask more questions", action: 'more_questions' }
            ]
        };
    }
}

// Alpine.js component for AI Quick Start
function aiQuickStart() {
    const assistant = new AIQuickStartAssistant();
    
    return {
        messages: [],
        userInput: '',
        isTyping: false,
        quickActions: [
            { text: "How do I start?", action: 'start_setup' },
            { text: "What are the plans?", action: 'pricing_info' },
            { text: "ECZ grading info", action: 'ecz_info' },
            { text: "Key features", action: 'features_info' }
        ],

        init() {
            // Add welcome message
            this.addMessage(assistant.generateResponse('', 'initial').text, 'ai');
            
            // Scroll to bottom after initial message
            this.$nextTick(() => {
                this.scrollToBottom();
            });
        },

        sendMessage() {
            if (!this.userInput.trim() || this.isTyping) return;
            
            const userMessage = this.userInput.trim();
            this.addMessage(userMessage, 'user');
            this.userInput = '';
            
            // Show typing indicator
            this.isTyping = true;
            
            // Simulate AI response delay
            setTimeout(() => {
                this.isTyping = false;
                const response = assistant.generateResponse(userMessage, this.messages);
                this.addMessage(response.text, 'ai');
                
                // Update quick actions if provided
                if (response.suggestions) {
                    this.quickActions = response.suggestions.slice(0, 4);
                }
                
                // Scroll to bottom after message is added
                this.$nextTick(() => {
                    this.scrollToBottom();
                });
            }, 800 + Math.random() * 800);
        },

        selectQuickAction(action) {
            this.userInput = action.text;
            this.sendMessage();
        },

        addMessage(text, sender) {
            this.messages.push({
                id: assistant.messageId++,
                text: text,
                sender: sender
            });
            
            // Scroll to bottom after message is added
            this.$nextTick(() => {
                this.scrollToBottom();
            });
        },

        scrollToBottom() {
            const container = this.$refs.chatContainer;
            if (container) {
                container.scrollTop = container.scrollHeight;
            }
        }
    };
}

// Make the component available globally
window.aiQuickStart = aiQuickStart;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('AI Quick Start Assistant loaded');
});
