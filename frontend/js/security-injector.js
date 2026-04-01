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
// Security Injector Script
// Automatically injects security script into all HTML files

const fs = require('fs');
const path = require('path');

function injectSecurityScript(directory) {
    const files = fs.readdirSync(directory, { withFileTypes: true });
    
    files.forEach(file => {
        const fullPath = path.join(directory, file.name);
        
        if (file.isDirectory()) {
            injectSecurityScript(fullPath);
        } else if (file.name.endsWith('.html')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            
            // Check if security script is already included
            if (!content.includes('security.js')) {
                // Find the position to insert the security script
                // Look for the last </script> tag or </head> tag
                const scriptTagMatch = content.match(/<\/script>/g);
                const headTagMatch = content.match(/<\/head>/);
                
                let insertPosition = -1;
                let insertBefore = '';
                
                if (scriptTagMatch && scriptTagMatch.length > 0) {
                    // Insert after the last script tag
                    const lastScriptIndex = content.lastIndexOf('</script>');
                    insertPosition = lastScriptIndex + '</script>'.length;
                    insertBefore = '\n    <script src="../js/security.js"></script>\n';
                } else if (headTagMatch) {
                    // Insert before closing head tag
                    const headIndex = content.indexOf('</head>');
                    insertPosition = headIndex;
                    insertBefore = '    <script src="../js/security.js"></script>\n';
                }
                
                if (insertPosition > -1) {
                    // Calculate relative path to security.js
                    const relativePath = getRelativePath(fullPath, 'c:/Users/sepio/OneDrive/Desktop/Shikola Demo App/frontend/js/security.js');
                    const securityScriptTag = `    <script src="${relativePath}"></script>\n`;
                    
                    content = content.slice(0, insertPosition) + securityScriptTag + content.slice(insertPosition);
                    
                    fs.writeFileSync(fullPath, content, 'utf8');
                    console.log(`Security script injected into: ${fullPath}`);
                }
            }
        }
    });
}

function getRelativePath(from, to) {
    const fromParts = path.normalize(from).split(path.sep);
    const toParts = path.normalize(to).split(path.sep);
    
    // Find common path
    let commonLength = 0;
    for (let i = 0; i < Math.min(fromParts.length, toParts.length); i++) {
        if (fromParts[i] === toParts[i]) {
            commonLength++;
        } else {
            break;
        }
    }
    
    // Calculate relative path
    const upLevels = fromParts.length - commonLength - 1;
    const relativeParts = [];
    
    for (let i = 0; i < upLevels; i++) {
        relativeParts.push('..');
    }
    
    relativeParts.push(...toParts.slice(commonLength));
    
    return relativeParts.join('/');
}

// Run the injection
const frontendDir = 'c:/Users/sepio/OneDrive/Desktop/Shikola Demo App/frontend';
injectSecurityScript(frontendDir);

console.log('Security script injection completed!');
