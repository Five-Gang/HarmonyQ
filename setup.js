/**
 * setup.js — One-time project setup
 * Copies .env.example → .env for all services and frontend (if not already present)
 */
const fs = require('fs');
const path = require('path');

const DIRS = [
  'frontend',
  'services/song-catalog',
  'services/user-profile',
  'services/playlist',
  'services/recommendation',
];

console.log('\n🔧 MelodAI — Project Setup\n');

let created = 0;
let skipped = 0;

DIRS.forEach((dir) => {
  const examplePath = path.join(__dirname, dir, '.env.example');
  const envPath = path.join(__dirname, dir, '.env');

  if (!fs.existsSync(examplePath)) {
    console.log(`  ⚠️  ${dir}/.env.example not found — skipping`);
    return;
  }

  if (fs.existsSync(envPath)) {
    console.log(`  ✅ ${dir}/.env already exists — skipping`);
    skipped++;
    return;
  }

  fs.copyFileSync(examplePath, envPath);
  console.log(`  📄 Created ${dir}/.env from .env.example`);
  created++;
});

console.log(`\n  Created: ${created} | Skipped: ${skipped}`);
console.log('\n💡 Remember to update the .env files with your actual keys:');
console.log('   • frontend/.env → VITE_CLERK_PUBLISHABLE_KEY');
console.log('   • services/*/.env → CLERK_JWKS_URL');
console.log('   • Ensure MongoDB is running on localhost:27017\n');
