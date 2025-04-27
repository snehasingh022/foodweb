/**
 * This script adds the Protected HOC to all admin pages
 * This is a script that can be run manually to update all admin pages to use the Protected component
 * Usage: node src/scripts/add-protection.js
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);
const readdirAsync = promisify(fs.readdir);
const statAsync = promisify(fs.stat);

// Admin pages directory
const adminPagesDir = path.join(__dirname, '..', 'pages', 'admin');

// Function to recursively find all index.tsx files in admin directory
async function findAllIndexFiles(directory) {
  const result = [];
  const entries = await readdirAsync(directory);

  for (const entry of entries) {
    const entryPath = path.join(directory, entry);
    const stats = await statAsync(entryPath);

    if (stats.isDirectory()) {
      const nestedFiles = await findAllIndexFiles(entryPath);
      result.push(...nestedFiles);
    } else if (entry === 'index.tsx') {
      result.push(entryPath);
    }
  }

  return result;
}

// Function to add Protected HOC to a file
async function addProtection(filePath) {
  try {
    let content = await readFileAsync(filePath, 'utf8');
    
    // Skip if already protected
    if (content.includes('import Protected from') || content.includes('export default Protected(')) {
      console.log(`File already protected: ${filePath}`);
      return;
    }

    // Add import statement if not already present
    if (!content.includes('import Protected from')) {
      const importPath = filePath.includes('pages/admin') 
        ? '@/components/Protected/Protected'
        : '../../../components/Protected/Protected';
        
      // Find the line with the last import statement
      const lines = content.split('\n');
      let lastImportIndex = -1;
      
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith('import ')) {
          lastImportIndex = i;
        }
      }
      
      if (lastImportIndex !== -1) {
        // Insert the Protected import after the last import
        lines.splice(lastImportIndex + 1, 0, `import Protected from '${importPath}';`);
        content = lines.join('\n');
      } else {
        // If no imports found, add it at the beginning
        content = `import Protected from '${importPath}';\n${content}`;
      }
    }

    // Find the export statement and replace it with Protected HOC
    const exportRegex = /export\s+default\s+([A-Za-z0-9_]+);?/;
    const match = content.match(exportRegex);
    
    if (match) {
      const componentName = match[1];
      content = content.replace(
        exportRegex,
        `export default Protected(${componentName}, ["admin"]);`
      );
      
      await writeFileAsync(filePath, content, 'utf8');
      console.log(`Added protection to: ${filePath}`);
    } else {
      console.error(`Could not find export statement in: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
  }
}

// Main function
async function main() {
  try {
    const indexFiles = await findAllIndexFiles(adminPagesDir);
    console.log(`Found ${indexFiles.length} admin pages to protect`);
    
    for (const file of indexFiles) {
      await addProtection(file);
    }
    
    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
  }
}

main(); 