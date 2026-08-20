const fs = require('fs');
const path = require('path');

function replaceInDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceInDir(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      const regex = /const\s+SERVER_IP\s*=\s*import\.meta\.env\.VITE_SERVER_IP(?:\s*\|\|\s*['"`][^'"`]+['"`])?;/g;
      const replacement = "const SERVER_IP = import.meta.env.VITE_SERVER_IP || (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:5001` : 'http://localhost:5001');";
      let newContent = content.replace(regex, replacement);
      
      const endpointRegex = /backend:\s*{\s*base:\s*import\.meta\.env\.VITE_SERVER_IP[^}]+}/g;
      const endpointReplacement = "backend: { base: import.meta.env.VITE_SERVER_IP || (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:5001` : 'http://localhost:5001') }";
      newContent = newContent.replace(endpointRegex, endpointReplacement);
      
      const noderedRegex = /nodered:\s*{\s*base:\s*import\.meta\.env\.VITE_SERVER_IP[^}]+}/g;
      const noderedReplacement = "nodered: { base: import.meta.env.VITE_SERVER_IP || (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:5001` : 'http://localhost:5001') }";
      newContent = newContent.replace(noderedRegex, noderedReplacement);

      if (content !== newContent) {
        fs.writeFileSync(fullPath, newContent);
        console.log("Updated: " + fullPath);
      }
    }
  }
}
replaceInDir('C:/Users/aparg/Desktop/smartlight/frontend/src');
