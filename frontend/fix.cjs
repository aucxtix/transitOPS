const fs = require('fs');
const path = require('path');
function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      results.push(file);
    }
  });
  return results;
}
const files = walk('/home/atharv/.gemini/antigravity/scratch/Transops/frontend/src');
files.forEach(f => {
  if(f.endsWith('.jsx') || f.endsWith('.js')) {
    let content = fs.readFileSync(f, 'utf8');
    content = content.replace(/\\\$\\{/g, '${');
    fs.writeFileSync(f, content);
  }
});
console.log('Fixed interpolated vars!');
