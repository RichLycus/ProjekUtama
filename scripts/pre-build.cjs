#!/usr/bin/env node
/**
 * Pre-build script: Prepare all assets for Electron build
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Preparing build assets...\n');

const projectRoot = path.resolve(__dirname, '..');

// 1. Verify icon files exist
console.log('✓ Checking icon files...');
const iconFiles = [
  'build/icon.png',
  'build/icon.ico',
  'build/icon.icns'
];

iconFiles.forEach(file => {
  const filePath = path.join(projectRoot, file);
  if (fs.existsSync(filePath)) {
    console.log(`  ✅ ${file} (${(fs.statSync(filePath).size / 1024).toFixed(1)}KB)`);
  } else {
    console.log(`  ⚠️  ${file} NOT FOUND`);
  }
});

// 2. Verify logo files
console.log('\n✓ Checking logo files...');
const logoFiles = [
  'public/logo-128.png',
  'public/logo.png'
];

logoFiles.forEach(file => {
  const filePath = path.join(projectRoot, file);
  if (fs.existsSync(filePath)) {
    console.log(`  ✅ ${file} (${(fs.statSync(filePath).size / 1024).toFixed(1)}KB)`);
  } else {
    console.log(`  ⚠️  ${file} NOT FOUND`);
  }
});

// 3. Check backend directory
console.log('\n✓ Checking backend files...');
const backendDir = path.join(projectRoot, 'backend');
if (fs.existsSync(backendDir)) {
  const backendFiles = fs.readdirSync(backendDir);
  console.log(`  ✅ backend/ (${backendFiles.length} files)`);
  console.log(`  Key files: server.py, database.py, requirements.txt`);
} else {
  console.log('  ⚠️  backend/ directory NOT FOUND');
}

// 4. Create dist directory if needed
const distDir = path.join(projectRoot, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
  console.log('\n✅ Created dist/ directory');
}

// 5. Copy logo to public if not exists
const logoSrc = path.join(projectRoot, 'LogoChimera.png');
const logoDest = path.join(projectRoot, 'public', 'logo-128.png');
if (fs.existsSync(logoSrc) && !fs.existsSync(logoDest)) {
  fs.copyFileSync(logoSrc, logoDest);
  console.log('\n✅ Copied logo to public/logo-128.png');
}

console.log('\n✅ Build preparation complete!\n');
console.log('You can now run: yarn electron:build\n');
