
/**
 * Zero-dependency script to generate PWA icons.
 * Usage: node scripts/generate-icons.js
 */

const fs = require('fs');
const path = require('path');

// Ensure public/icons directory exists
const iconDir = path.join(__dirname, '../public/icons');
if (!fs.existsSync(iconDir)) {
  fs.mkdirSync(iconDir, { recursive: true });
}

// SVG Template for the Icon (Star with IH monogram)
const generateSvg = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#1e3a8a;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#020617;stop-opacity:1" />
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <!-- Background -->
  <rect width="${size}" height="${size}" fill="url(#bg)" />
  
  <!-- Star Shape -->
  <g transform="translate(${size/2}, ${size/2}) scale(${size/200})">
    <path d="M0 -70 L20 -25 L70 -25 L30 10 L45 60 L0 35 L-45 60 L-30 10 L-70 -25 L-20 -25 Z" 
          fill="#fbbf24" stroke="black" stroke-width="5" filter="url(#glow)" />
    
    <!-- Text -->
    <text x="0" y="15" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="40" fill="#1e3a8a">IH</text>
  </g>
</svg>`;

// Generate 192x192
fs.writeFileSync(
  path.join(iconDir, 'icon-192.svg'),
  generateSvg(192)
);

// Generate 512x512
fs.writeFileSync(
  path.join(iconDir, 'icon-512.svg'),
  generateSvg(512)
);

console.log('✅ Generated PWA icons in public/icons/');
