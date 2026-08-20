import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

// Master SVG Design for PTIT EduSync
export const masterSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#090D16"/>
      <stop offset="50%" stop-color="#0F172A"/>
      <stop offset="100%" stop-color="#1E1B4B"/>
    </linearGradient>

    <!-- Outer Glow / Rim Gradient -->
    <linearGradient id="rimGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#E11D48" stop-opacity="0.9"/>
      <stop offset="50%" stop-color="#6366F1" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="#06B6D4" stop-opacity="0.9"/>
    </linearGradient>

    <!-- PTIT Crimson to Coral Gradient -->
    <linearGradient id="ptitCrimson" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FF2E56"/>
      <stop offset="45%" stop-color="#E11D48"/>
      <stop offset="100%" stop-color="#BE123C"/>
    </linearGradient>

    <!-- EduSync Electric Cyan / Sapphire Gradient -->
    <linearGradient id="syncCyan" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0284C7"/>
      <stop offset="50%" stop-color="#06B6D4"/>
      <stop offset="100%" stop-color="#38BDF8"/>
    </linearGradient>

    <!-- Golden Academic Gradient -->
    <linearGradient id="goldCap" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FDE047"/>
      <stop offset="50%" stop-color="#F59E0B"/>
      <stop offset="100%" stop-color="#D97706"/>
    </linearGradient>

    <!-- Vertical Stem Gradient -->
    <linearGradient id="stemGradient" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FB7185"/>
      <stop offset="40%" stop-color="#E11D48"/>
      <stop offset="100%" stop-color="#4F46E5"/>
    </linearGradient>

    <!-- Glowing Node Gradient -->
    <radialGradient id="cyanNode" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="40%" stop-color="#38BDF8"/>
      <stop offset="100%" stop-color="#0284C7"/>
    </radialGradient>

    <!-- Glow Filter -->
    <filter id="subtleGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="6" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>

    <filter id="strongGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="12" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>

    <!-- Drop Shadow -->
    <filter id="dropShadow" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="10" stdDeviation="14" flood-color="#000000" flood-opacity="0.6"/>
    </filter>
  </defs>

  <!-- Base Badge / Container (Squircle) -->
  <rect x="24" y="24" width="464" height="464" rx="112" fill="url(#bgGradient)" />
  
  <!-- Ambient Backlight Glows -->
  <circle cx="160" cy="150" r="160" fill="#E11D48" opacity="0.18" filter="url(#strongGlow)" />
  <circle cx="360" cy="350" r="160" fill="#0284C7" opacity="0.2" filter="url(#strongGlow)" />

  <!-- Outer Border Stroke with gradient -->
  <rect x="24" y="24" width="464" height="464" rx="112" fill="none" stroke="url(#rimGradient)" stroke-width="6" stroke-opacity="0.8" />

  <!-- ================= LOGO SYMBOL ================= -->
  <g filter="url(#dropShadow)">
    
    <!-- 1. BACK SYNC ORBITAL ARC (Sync Cycle Loop Behind) -->
    <path d="M 325 155 A 135 135 0 1 1 175 390" 
          fill="none" 
          stroke="url(#syncCyan)" 
          stroke-width="14" 
          stroke-linecap="round" 
          stroke-dasharray="14 10"
          opacity="0.4" />

    <!-- 2. TELECOM / DATA SIGNALS (3 Curved Waves top-right) -->
    <g opacity="0.95">
      <path d="M 370 150 A 45 45 0 0 1 405 195" fill="none" stroke="#38BDF8" stroke-width="8" stroke-linecap="round" />
      <path d="M 390 128 A 78 78 0 0 1 445 198" fill="none" stroke="#60A5FA" stroke-width="8" stroke-linecap="round" opacity="0.8" />
      <path d="M 410 106 A 110 110 0 0 1 482 202" fill="none" stroke="#818CF8" stroke-width="8" stroke-linecap="round" opacity="0.55" />
    </g>

    <!-- 3. THE "P" STEM (Futuristic Pillar) -->
    <path d="M 145 142 
             C 145 125 158 112 175 112 
             L 200 112 
             C 216 112 229 125 229 142 
             L 229 368 
             C 229 385 216 398 200 398 
             L 175 398 
             C 158 398 145 385 145 368 
             Z" 
          fill="url(#stemGradient)" />

    <!-- Vertical Light Reflection Stripe on Pillar -->
    <rect x="160" y="145" width="8" height="210" rx="4" fill="#FFFFFF" opacity="0.28" />

    <!-- Tech Circuit Track & Pulse Dot at Stem Base -->
    <circle cx="187" cy="355" r="10" fill="url(#cyanNode)" filter="url(#subtleGlow)" />

    <!-- 4. THE "P" UPPER LOOP (Academic & Dynamic Shield Head) -->
    <path d="M 218 112 
             L 295 112 
             C 368 112 414 154 414 220 
             C 414 286 368 328 295 328 
             L 218 328 
             L 218 260 
             L 288 260 
             C 324 260 348 244 348 220 
             C 348 196 324 180 288 180 
             L 218 180 
             Z" 
          fill="url(#ptitCrimson)" />

    <!-- Highlight Specular on Upper Curve of P -->
    <path d="M 228 128 
             L 292 128 
             C 350 128 388 158 396 208 
             C 386 156 342 140 288 140 
             L 228 140 
             Z" 
          fill="#FFFFFF" 
          opacity="0.35" />

    <!-- 5. DYNAMIC FOREGROUND SYNC FLOW (Looping Swoosh with Arrow) -->
    <path d="M 125 285 
             C 125 385 235 435 340 395 
             C 390 375 425 330 435 285" 
          fill="none" 
          stroke="url(#syncCyan)" 
          stroke-width="16" 
          stroke-linecap="round" />

    <!-- Sync Arrow Head on Swoosh -->
    <polygon points="112,265 142,290 108,305" fill="#38BDF8" />

    <!-- Sync Pulse Node -->
    <circle cx="340" cy="395" r="12" fill="url(#cyanNode)" filter="url(#subtleGlow)" />

    <!-- 6. ACADEMIC MORTARBOARD (Graduation Cap) BADGE ACCENT ON TOP -->
    <!-- Cap Diamond -->
    <polygon points="184,80 256,48 328,80 256,112" fill="url(#goldCap)" filter="url(#subtleGlow)" />
    <!-- 3D Shading on Cap -->
    <polygon points="184,80 256,48 256,112" fill="#FBBF24" opacity="0.9" />
    
    <!-- Cap Under Skullcap Arc -->
    <path d="M 220 96 Q 256 114 292 96 L 292 108 Q 256 126 220 108 Z" fill="#D97706" />

    <!-- Cap Tassel -->
    <path d="M 256,80 Q 300,94 310,130" fill="none" stroke="#FDE047" stroke-width="4.5" stroke-linecap="round" />
    <circle cx="310" cy="132" r="5.5" fill="#F59E0B" />

  </g>

  <!-- BOTTOM ACCENT BRAND TEXT "PTIT" -->
  <text x="256" y="456" 
        text-anchor="middle" 
        font-family="system-ui, -apple-system, sans-serif" 
        font-weight="900" 
        font-size="34" 
        letter-spacing="9" 
        fill="#94A3B8" 
        opacity="0.9">PTIT</text>
</svg>`;

async function main() {
  const publicDir = path.resolve(process.cwd(), 'public');
  const appDir = path.resolve(process.cwd(), 'src/app');

  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

  // 1. Write SVG files
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), masterSvg);
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), masterSvg);
  fs.writeFileSync(path.join(appDir, 'icon.svg'), masterSvg);
  console.log('Saved SVG icons to public/ & src/app/');

  // 2. Generate multi-resolution PNGs with sharp
  const sizes = [
    { name: 'favicon-16x16.png', size: 16, targetDir: publicDir },
    { name: 'favicon-32x32.png', size: 32, targetDir: publicDir },
    { name: 'apple-touch-icon.png', size: 180, targetDir: publicDir },
    { name: 'icon-192.png', size: 192, targetDir: publicDir },
    { name: 'icon-512.png', size: 512, targetDir: publicDir },
  ];

  const svgBuffer = Buffer.from(masterSvg);

  for (const item of sizes) {
    await sharp(svgBuffer)
      .resize(item.size, item.size)
      .png()
      .toFile(path.join(item.targetDir, item.name));
    console.log(`Generated ${item.name} (${item.size}x${item.size})`);
  }

  // Generate public/favicon.ico
  await sharp(svgBuffer)
    .resize(32, 32)
    .toFormat('png')
    .toFile(path.join(publicDir, 'favicon.ico'));

  // Also write to src/app/favicon.ico
  await sharp(svgBuffer)
    .resize(32, 32)
    .toFormat('png')
    .toFile(path.join(appDir, 'favicon.ico'));

  console.log('Successfully generated all icon assets!');
}

main().catch((err) => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
