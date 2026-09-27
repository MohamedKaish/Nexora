const fs = require('fs');
const path = require('path');

// Resolve the canonical physical path of the project (resolving any NTFS junctions)
const projectRoot = fs.realpathSync(path.resolve(__dirname, '..'));

// Ensure process.cwd is canonical BEFORE Next.js CLI or server initializes
process.chdir(projectRoot);

// Forward execution to Next.js CLI with all passed CLI arguments
require(path.join(projectRoot, 'node_modules', 'next', 'dist', 'bin', 'next'));
