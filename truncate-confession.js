const fs = require('fs');

// Read the file
const content = fs.readFileSync('./client/src/components/ConfessionPage.tsx', 'utf8');

// Split into lines
const lines = content.split('\n');

// Find the correct closing brace (should be around line 1696)
let correctEndLine = -1;
for (let i = 1690; i < 1700; i++) {
  if (lines[i] && lines[i].trim() === '}' && lines[i-1] && lines[i-1].includes(');')) {
    correctEndLine = i;
    break;
  }
}

if (correctEndLine !== -1) {
  // Keep only lines up to the correct end
  const cleanedContent = lines.slice(0, correctEndLine + 1).join('\n');
  
  // Write back the cleaned content
  fs.writeFileSync('./client/src/components/ConfessionPage.tsx', cleanedContent, 'utf8');
  console.log(`Truncated file at line ${correctEndLine + 1}`);
} else {
  console.log('Could not find correct end line');
}
