const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'index.css');
let content = fs.readFileSync(filePath, 'utf-8');

// Replacements
const replacements = [
  { search: /#0F131E/g, replace: 'var(--bg-primary)' },
  { search: /#0B0F19/g, replace: 'var(--bg-primary)' },
  { search: /#E0E7FF/g, replace: 'var(--text-primary)' },
  { search: /#10B981/g, replace: 'var(--status-success)' },
  { search: /#F43F5E/g, replace: 'var(--status-danger)' },
  { search: /#F87171/g, replace: 'var(--status-danger)' },
  { search: /#6366F1/g, replace: 'var(--primary-hover)' },
  // Gradients
  { search: /rgba\(129, 140, 248, /g, replace: 'rgba(77, 136, 255, ' }, // old accent to new accent 
  { search: /rgba\(139, 92, 246, /g, replace: 'rgba(0, 74, 173, ' },   // old secondary accent to new primary
];

for (const { search, replace } of replacements) {
  content = content.replace(search, replace);
}

fs.writeFileSync(filePath, content);
console.log('Colors replaced in index.css');
