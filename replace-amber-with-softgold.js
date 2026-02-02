const fs = require('fs');
const path = require('path');

// Mapping of amber colors to softgold equivalents
const colorMappings = {
  'amber-50': 'softgold-50',
  'amber-100': 'softgold-100', 
  'amber-200': 'softgold-200',
  'amber-300': 'softgold-300',
  'amber-400': 'softgold-500', // Main amber color maps to softgold-500
  'amber-500': 'softgold-600',
  'amber-600': 'softgold-700',
  'amber-700': 'softgold-800',
  'amber-800': 'softgold-900',
  'amber-900': 'softgold-900'
};

function replaceInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    
    // Replace each amber color with its softgold equivalent
    Object.entries(colorMappings).forEach(([amber, softgold]) => {
      const regex = new RegExp(amber.replace('-', '\\-'), 'g');
      if (content.includes(amber)) {
        content = content.replace(regex, softgold);
        changed = true;
      }
    });
    
    if (changed) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

function processDirectory(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    
    if (entry.isDirectory() && !entry.name.includes('node_modules') && !entry.name.includes('dist')) {
      processDirectory(fullPath);
    } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts') || entry.name.endsWith('.css'))) {
      replaceInFile(fullPath);
    }
  }
}

// Start processing from client/src directory
console.log('Starting amber to softgold replacement...');
processDirectory('./client/src');
console.log('Replacement complete!');
