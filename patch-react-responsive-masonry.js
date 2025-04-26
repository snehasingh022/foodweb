/**
 * This script fixes an issue with react-responsive-masonry where
 * it tries to set a property that has only a getter
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'node_modules', 'react-responsive-masonry', 'lib', 'index.js');

try {
  // Read the file
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace the problematic line
  content = content.replace(
    /exports\.ResponsiveMasonry = _ResponsiveMasonry\["default"\];/,
    '// exports.ResponsiveMasonry = _ResponsiveMasonry["default"]; // This line was causing build errors'
  );
  
  // Write the fixed content back
  fs.writeFileSync(filePath, content, 'utf8');
  
  console.log('Successfully patched react-responsive-masonry library');
} catch (error) {
  console.error('Error patching react-responsive-masonry:', error);
} 