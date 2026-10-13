const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

async function run() {
  const screenshotsDir = path.join(__dirname, '../public/screenshots')
  const iconsDir = path.join(__dirname, '../public/icons')
  if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true })
  if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true })

  const publicDir = path.join(__dirname, '../public')

  // Copy or generate icons for /icons/ path
  if (fs.existsSync(path.join(publicDir, 'icon-192.png'))) {
    fs.copyFileSync(path.join(publicDir, 'icon-192.png'), path.join(iconsDir, 'icon-192.png'))
  }
  if (fs.existsSync(path.join(publicDir, 'icon-512.png'))) {
    fs.copyFileSync(path.join(publicDir, 'icon-512.png'), path.join(iconsDir, 'icon-512.png'))
    fs.copyFileSync(path.join(publicDir, 'icon-512.png'), path.join(iconsDir, 'maskable-512.png'))
  }

  // 1. Mobile Screenshot (1080 x 1920)
  const mobileSvg = `
  <svg width="1080" height="1920" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#0C0A09"/>
        <stop offset="50%" stop-color="#14110E"/>
        <stop offset="100%" stop-color="#090807"/>
      </linearGradient>
      <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FCD34D"/>
        <stop offset="50%" stop-color="#F59E0B"/>
        <stop offset="100%" stop-color="#D97706"/>
      </linearGradient>
      <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1C1917" stop-opacity="0.9"/>
        <stop offset="100%" stop-color="#12100E" stop-opacity="0.95"/>
      </linearGradient>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="30" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    <rect width="1080" height="1920" fill="url(#bgGrad)"/>
    
    <!-- Top Header Bar -->
    <rect x="0" y="0" width="1080" height="180" fill="#14110E" />
    <line x1="0" y1="180" x2="1080" y2="180" stroke="#292524" stroke-width="2"/>
    <circle cx="120" cy="90" r="45" fill="url(#goldGrad)" />
    <text x="120" y="105" font-family="sans-serif" font-weight="900" font-size="44" fill="#0C0A09" text-anchor="middle">N</text>
    <text x="190" y="105" font-family="sans-serif" font-weight="800" font-size="48" fill="#F5F5F4">NEXORA</text>
    <text x="390" y="105" font-family="sans-serif" font-weight="600" font-size="28" fill="#F59E0B">PROD OS</text>

    <!-- Hero Card: Sanctuary Sanctuary Status -->
    <rect x="60" y="240" width="960" height="420" rx="36" fill="url(#cardGrad)" stroke="#F59E0B" stroke-width="3" stroke-opacity="0.4"/>
    <text x="120" y="320" font-family="sans-serif" font-weight="700" font-size="34" fill="#A8A29E">DAILY PRODUCTIVITY MOMENTUM</text>
    <text x="120" y="410" font-family="sans-serif" font-weight="900" font-size="76" fill="#F5F5F4">Level 14 Explorer</text>
    <text x="120" y="470" font-family="sans-serif" font-weight="500" font-size="32" fill="#F59E0B">Kyro Companion Active • Focus Chamber Ready</text>
    <rect x="120" y="520" width="840" height="28" rx="14" fill="#292524"/>
    <rect x="120" y="520" width="670" height="28" rx="14" fill="url(#goldGrad)"/>
    <text x="120" y="600" font-family="sans-serif" font-weight="600" font-size="28" fill="#78716C">80% of daily quest horizon completed</text>

    <!-- Quest Matrix Card -->
    <rect x="60" y="700" width="960" height="380" rx="36" fill="url(#cardGrad)" stroke="#292524" stroke-width="2"/>
    <text x="120" y="780" font-family="sans-serif" font-weight="700" font-size="38" fill="#F5F5F4">Active Task Quests</text>
    <rect x="120" y="820" width="840" height="90" rx="20" fill="#292524" fill-opacity="0.6"/>
    <circle cx="170" cy="865" r="22" fill="#10B981"/>
    <text x="220" y="875" font-family="sans-serif" font-weight="600" font-size="30" fill="#F5F5F4">Deep Focus Sprint: 45 min</text>

    <rect x="120" y="940" width="840" height="90" rx="20" fill="#292524" fill-opacity="0.6"/>
    <circle cx="170" cy="985" r="22" fill="#F59E0B"/>
    <text x="220" y="995" font-family="sans-serif" font-weight="600" font-size="30" fill="#F5F5F4">Sync Obsidian Horizons</text>

    <!-- Habit Momentum Card -->
    <rect x="60" y="1120" width="960" height="380" rx="36" fill="url(#cardGrad)" stroke="#292524" stroke-width="2"/>
    <text x="120" y="1200" font-family="sans-serif" font-weight="700" font-size="38" fill="#F5F5F4">Habit Momentum Chains</text>
    <rect x="120" y="1240" width="840" height="90" rx="20" fill="#292524" fill-opacity="0.6"/>
    <text x="160" y="1295" font-family="sans-serif" font-weight="600" font-size="30" fill="#F5F5F4">Morning Mind Priming</text>
    <text x="820" y="1295" font-family="sans-serif" font-weight="800" font-size="30" fill="#F59E0B">18d Streak</text>

    <rect x="120" y="1360" width="840" height="90" rx="20" fill="#292524" fill-opacity="0.6"/>
    <text x="160" y="1415" font-family="sans-serif" font-weight="600" font-size="30" fill="#F5F5F4">Deep Work Session</text>
    <text x="820" y="1415" font-family="sans-serif" font-weight="800" font-size="30" fill="#F59E0B">24d Streak</text>

    <!-- Bottom Navigation Bar -->
    <rect x="0" y="1740" width="1080" height="180" fill="#14110E" stroke="#292524" stroke-width="2"/>
    <text x="180" y="1845" font-family="sans-serif" font-weight="700" font-size="32" fill="#F59E0B" text-anchor="middle">Sanctuary</text>
    <text x="420" y="1845" font-family="sans-serif" font-weight="600" font-size="32" fill="#78716C" text-anchor="middle">Quests</text>
    <text x="660" y="1845" font-family="sans-serif" font-weight="600" font-size="32" fill="#78716C" text-anchor="middle">Habits</text>
    <text x="900" y="1845" font-family="sans-serif" font-weight="600" font-size="32" fill="#78716C" text-anchor="middle">Focus</text>
  </svg>
  `

  await sharp(Buffer.from(mobileSvg)).png().toFile(path.join(screenshotsDir, 'mobile-1.png'))
  console.log('✓ Generated mobile-1.png (1080x1920)')

  // 2. Desktop Screenshot (1920 x 1080)
  const desktopSvg = `
  <svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="deskBg" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#0C0A09"/>
        <stop offset="100%" stop-color="#14110E"/>
      </linearGradient>
      <linearGradient id="goldGradD" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FCD34D"/>
        <stop offset="50%" stop-color="#F59E0B"/>
        <stop offset="100%" stop-color="#D97706"/>
      </linearGradient>
      <linearGradient id="deskCard" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1C1917" stop-opacity="0.95"/>
        <stop offset="100%" stop-color="#12100E" stop-opacity="0.98"/>
      </linearGradient>
    </defs>
    <rect width="1920" height="1080" fill="url(#deskBg)"/>

    <!-- Left Sidebar -->
    <rect x="0" y="0" width="300" height="1080" fill="#14110E" stroke="#292524" stroke-width="2"/>
    <circle cx="80" cy="70" r="30" fill="url(#goldGradD)"/>
    <text x="80" y="80" font-family="sans-serif" font-weight="900" font-size="28" fill="#0C0A09" text-anchor="middle">N</text>
    <text x="130" y="80" font-family="sans-serif" font-weight="800" font-size="32" fill="#F5F5F4">NEXORA</text>

    <!-- Nav Items -->
    <rect x="30" y="140" width="240" height="50" rx="14" fill="#F59E0B" fill-opacity="0.15" stroke="#F59E0B" stroke-width="1.5"/>
    <text x="60" y="172" font-family="sans-serif" font-weight="700" font-size="20" fill="#F59E0B">✦ Sanctuary World</text>

    <text x="60" y="240" font-family="sans-serif" font-weight="600" font-size="20" fill="#A8A29E">Tasks &amp; Matrix</text>
    <text x="60" y="300" font-family="sans-serif" font-weight="600" font-size="20" fill="#A8A29E">Habit Momentum</text>
    <text x="60" y="360" font-family="sans-serif" font-weight="600" font-size="20" fill="#A8A29E">Goal Horizons</text>
    <text x="60" y="420" font-family="sans-serif" font-weight="600" font-size="20" fill="#A8A29E">Focus Chamber</text>
    <text x="60" y="480" font-family="sans-serif" font-weight="600" font-size="20" fill="#A8A29E">Timetable</text>
    <text x="60" y="540" font-family="sans-serif" font-weight="600" font-size="20" fill="#A8A29E">Analytics</text>

    <!-- Top Header -->
    <rect x="300" y="0" width="1620" height="90" fill="#14110E" stroke="#292524" stroke-width="2"/>
    <text x="350" y="55" font-family="sans-serif" font-weight="700" font-size="28" fill="#F5F5F4">Living Productivity Habitat</text>
    <rect x="1600" y="24" width="180" height="42" rx="21" fill="url(#goldGradD)"/>
    <text x="1690" y="52" font-family="sans-serif" font-weight="800" font-size="16" fill="#0C0A09" text-anchor="middle">Install App</text>

    <!-- Main Content Area -->
    <!-- Hero Companion Banner -->
    <rect x="350" y="130" width="1510" height="280" rx="24" fill="url(#deskCard)" stroke="#F59E0B" stroke-width="2" stroke-opacity="0.3"/>
    <text x="400" y="190" font-family="sans-serif" font-weight="700" font-size="20" fill="#F59E0B">ACTIVE COMPANION PROTOCOL</text>
    <text x="400" y="250" font-family="sans-serif" font-weight="800" font-size="44" fill="#F5F5F4">Kyro • Neural Guide &amp; Productivity Strategist</text>
    <text x="400" y="295" font-family="sans-serif" font-weight="500" font-size="20" fill="#A8A29E">"Welcome back, Explorer. You are 2 quests away from unlocking Tier 15 Mastery."</text>

    <!-- 3 Dashboard Grid Cards -->
    <rect x="350" y="440" width="480" height="580" rx="24" fill="url(#deskCard)" stroke="#292524" stroke-width="2"/>
    <text x="390" y="495" font-family="sans-serif" font-weight="700" font-size="24" fill="#F5F5F4">Task Matrix</text>

    <rect x="860" y="440" width="480" height="580" rx="24" fill="url(#deskCard)" stroke="#292524" stroke-width="2"/>
    <text x="900" y="495" font-family="sans-serif" font-weight="700" font-size="24" fill="#F5F5F4">Habit Momentum</text>

    <rect x="1370" y="440" width="490" height="580" rx="24" fill="url(#deskCard)" stroke="#292524" stroke-width="2"/>
    <text x="1410" y="495" font-family="sans-serif" font-weight="700" font-size="24" fill="#F5F5F4">Focus Chamber</text>
  </svg>
  `

  await sharp(Buffer.from(desktopSvg)).png().toFile(path.join(screenshotsDir, 'desktop-1.png'))
  console.log('✓ Generated desktop-1.png (1920x1080)')
}

run().catch(console.error)
