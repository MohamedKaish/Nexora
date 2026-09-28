const fs = require('fs');
const path = require('path');

// On Vercel, CI, or non-Windows, bypass NTFS junction resolution entirely
if (process.env.VERCEL || process.env.CI || process.platform !== 'win32') {
  require(path.join(__dirname, '..', 'node_modules', 'next', 'dist', 'bin', 'next'));
  return;
}

// Resolve the canonical physical path of the project (resolving any NTFS junctions on Windows)
const projectRoot = fs.realpathSync(path.resolve(__dirname, '..'));

// Ensure process.cwd is canonical BEFORE Next.js CLI or server initializes
process.chdir(projectRoot);

// Forward execution to Next.js CLI with all passed CLI arguments
require(path.join(projectRoot, 'node_modules', 'next', 'dist', 'bin', 'next'));
