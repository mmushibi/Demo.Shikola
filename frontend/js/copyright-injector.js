// Copyright Injector Script
// Automatically adds Sepio Corp copyright to all files

const fs = require('fs');
const path = require('path');

// Copyright templates
const htmlCopyright = `<!--
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
-->`;

const jsCopyright = `/*
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
*/`;

const cssCopyright = `/*
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
*/`;

function injectCopyright(directory) {
    const files = fs.readdirSync(directory, { withFileTypes: true });
    
    files.forEach(file => {
        const fullPath = path.join(directory, file.name);
        
        if (file.isDirectory()) {
            injectCopyright(fullPath);
        } else {
            const ext = path.extname(file.name).toLowerCase();
            let content = fs.readFileSync(fullPath, 'utf8');
            let copyright = '';
            let alreadyHasCopyright = false;
            
            // Check if copyright already exists
            if (content.includes('Copyright (c) 2026 Sepio Corp')) {
                alreadyHasCopyright = true;
            }
            
            // Determine copyright format based on file extension
            if (ext === '.html' || ext === '.htm') {
                copyright = htmlCopyright + '\n';
            } else if (ext === '.js' || ext === '.mjs') {
                copyright = jsCopyright + '\n';
            } else if (ext === '.css') {
                copyright = cssCopyright + '\n';
            } else if (ext === '.json' || ext === '.csv' || ext === '.txt' || ext === '.md') {
                // Skip these files or add JSON comment format
                return;
            } else {
                // Skip other file types
                return;
            }
            
            if (!alreadyHasCopyright) {
                // Find the best place to insert copyright
                let insertPosition = 0;
                
                if (ext === '.html' || ext === '.htm') {
                    // For HTML files, insert after DOCTYPE or at the very beginning
                    const doctypeMatch = content.match(/^<!DOCTYPE[^>]*>/i);
                    if (doctypeMatch) {
                        insertPosition = doctypeMatch.index + doctypeMatch[0].length + 1;
                    }
                } else if (ext === '.js' || ext === '.mjs') {
                    // For JS files, insert at the beginning, but after any shebang
                    const shebangMatch = content.match(/^#!/);
                    if (shebangMatch) {
                        insertPosition = shebangMatch.index + shebangMatch[0].length + 1;
                    }
                } else if (ext === '.css') {
                    // For CSS files, insert at the beginning
                    insertPosition = 0;
                }
                
                // Insert copyright
                content = content.slice(0, insertPosition) + 
                         copyright + 
                         content.slice(insertPosition);
                
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Copyright added to: ${fullPath}`);
            } else {
                console.log(`Copyright already exists in: ${fullPath}`);
            }
        }
    });
}

// Run the injection
const projectDir = 'c:/Users/sepio/OneDrive/Desktop/Shikola Demo App';
console.log('Starting copyright injection...');
injectCopyright(projectDir);
console.log('Copyright injection completed!');
