const fs = require('fs');
const glob = require('glob');

// Find all TSX, TS, and JS files in the src directory
const files = glob.sync('src/**/*.{tsx,ts,jsx,js}');

// Regular expression to match '/hexadash-nextjs/'
const pattern = /['"`](\/hexadash-nextjs\/[^'"`]*)['"``]/g;

// Process each file
files.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    const modifiedContent = content.replace(pattern, (match, p1) => {
      // Replace with the path without '/hexadash-nextjs'
      const newPath = p1.replace('/hexadash-nextjs', '');
      return match.charAt(0) + newPath + match.charAt(match.length - 1);
    });

    // Write back to the file if changes were made
    if (content !== modifiedContent) {
      fs.writeFileSync(file, modifiedContent);
      console.log(`Updated paths in: ${file}`);
    }
  } catch (error) {
    console.error(`Error processing file ${file}:`, error);
  }
});

console.log('Path fixing complete!'); 