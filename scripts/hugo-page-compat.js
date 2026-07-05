const fs = require('fs');
const path = require('path');

const publicDir = path.join(process.cwd(), 'public');
const pageDir = path.join(publicDir, 'page');

if (!fs.existsSync(pageDir)) {
  process.exit(0);
}

for (const entry of fs.readdirSync(pageDir, { withFileTypes: true })) {
  if (!entry.isDirectory() || !/^\d+$/.test(entry.name)) {
    continue;
  }

  const targetDir = path.join(publicDir, `page${entry.name}`);
  fs.cpSync(path.join(pageDir, entry.name), targetDir, { recursive: true });
}
