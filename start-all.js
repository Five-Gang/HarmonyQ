/**
 * start-all.js — Start all microservices and the frontend concurrently
 * 
 * This spawns each service as a child process and pipes all output
 * to the main console with color-coded prefixes.
 */
const { spawn } = require('child_process');
const path = require('path');

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

const services = [
  { name: '🎵 Song-Catalog  ', cwd: 'services/song-catalog',    color: '\x1b[36m' },  // cyan
  { name: '👤 User-Profile  ', cwd: 'services/user-profile',    color: '\x1b[33m' },  // yellow
  { name: '🎶 Playlist      ', cwd: 'services/playlist',        color: '\x1b[35m' },  // magenta
  { name: '✨ Recommendation', cwd: 'services/recommendation',  color: '\x1b[32m' },  // green
  { name: '🖥️  Frontend      ', cwd: 'frontend',                 color: '\x1b[34m' },  // blue
];

const reset = '\x1b[0m';
const children = [];

console.log('\n\x1b[1m🚀 Starting MelodAI — All Services\x1b[0m\n');
console.log('  Port 3001 → Song Catalog');
console.log('  Port 3002 → User Profile');
console.log('  Port 3003 → Playlist');
console.log('  Port 3004 → Recommendation');
console.log('  Port 5173 → Frontend (Vite)');
console.log('\n  Press Ctrl+C to stop all services.\n');
console.log('─'.repeat(60) + '\n');

services.forEach(({ name, cwd, color }) => {
  const fullCwd = path.join(__dirname, cwd);
  const child = spawn(npmCmd, ['run', 'dev'], {
    cwd: fullCwd,
    shell: isWindows,
    env: { ...process.env, FORCE_COLOR: '1' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  const prefix = `${color}[${name}]${reset} `;

  child.stdout.on('data', (data) => {
    data.toString().split('\n').filter(Boolean).forEach((line) => {
      console.log(`${prefix}${line}`);
    });
  });

  child.stderr.on('data', (data) => {
    data.toString().split('\n').filter(Boolean).forEach((line) => {
      console.log(`${prefix}\x1b[31m${line}${reset}`);
    });
  });

  child.on('error', (err) => {
    console.error(`${prefix}\x1b[31mFailed to start: ${err.message}${reset}`);
  });

  child.on('exit', (code, signal) => {
    if (code !== null && code !== 0) {
      console.log(`${prefix}\x1b[31mExited with code ${code}${reset}`);
    } else if (signal) {
      console.log(`${prefix}Stopped (${signal})`);
    }
  });

  children.push(child);
});

// Graceful shutdown
const shutdown = () => {
  console.log('\n\x1b[1m🛑 Shutting down all services...\x1b[0m\n');
  children.forEach((child) => {
    if (isWindows) {
      spawn('taskkill', ['/pid', child.pid, '/f', '/t'], { shell: true });
    } else {
      child.kill('SIGTERM');
    }
  });
  setTimeout(() => process.exit(0), 2000);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

