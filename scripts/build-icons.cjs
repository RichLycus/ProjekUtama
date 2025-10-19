#!/usr/bin/env node
/**
 * Generate PNG icons from SVG for Electron app
 * This is a placeholder script. You can replace build/icon.svg with your own icon!
 */

const fs = require('fs');
const path = require('path');

console.log('📦 Icon Build Script');
console.log('');
console.log('✅ Icon location: build/icon.svg');
console.log('');
console.log('🎨 To use your own icon:');
console.log('   1. Replace build/icon.svg with your icon (512x512 recommended)');
console.log('   2. Or place icon.png files in build/ directory:');
console.log('      - build/icon.png (512x512)');
console.log('      - build/icon-256.png (256x256)');
console.log('      - build/icon-128.png (128x128)');
console.log('      - build/icon-64.png (64x64)');
console.log('');
console.log('📝 Note: electron-builder will automatically use build/icon.svg');
console.log('   or build/icon.png for creating platform-specific icons.');
console.log('');

// Get project root (parent of scripts directory)
const projectRoot = path.resolve(__dirname, '..');

// Check if icon exists
const iconPath = path.join(projectRoot, 'build', 'icon.svg');
if (fs.existsSync(iconPath)) {
  console.log('✅ Icon file found at build/icon.svg');
} else {
  console.log('⚠️  No icon found at build/icon.svg');
  console.log('   Creating placeholder...');
  
  // Create build directory if not exists
  const buildDir = path.join(projectRoot, 'build');
  if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
  }
  
  // Copy from public if available
  const publicIcon = path.join(projectRoot, 'public', 'icon.svg');
  if (fs.existsSync(publicIcon)) {
    fs.copyFileSync(publicIcon, iconPath);
    console.log('✅ Copied icon from public/icon.svg');
  } else {
    console.log('❌ No icon found in public/icon.svg either');
    console.log('   Please add your icon to build/icon.svg');
  }
}

console.log('');
console.log('🚀 Ready to build!');

