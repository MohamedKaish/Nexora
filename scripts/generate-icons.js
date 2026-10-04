const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

async function generateIcons() {
  const svgPath = path.join(__dirname, '../public/icon.svg')
  const publicDir = path.join(__dirname, '../public')
  const svgBuffer = fs.readFileSync(svgPath)

  console.log('Generating high-res PNG icons from', svgPath)

  // 1. icon-512.png
  await sharp(svgBuffer)
    .resize(512, 512)
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'icon-512.png'))
  console.log('✓ Created icon-512.png')

  // 2. icon-192.png
  await sharp(svgBuffer)
    .resize(192, 192)
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'icon-192.png'))
  console.log('✓ Created icon-192.png')

  // 3. apple-touch-icon.png & apple-icon.png (180x180)
  await sharp(svgBuffer)
    .resize(180, 180)
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'apple-touch-icon.png'))
  await sharp(svgBuffer)
    .resize(180, 180)
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'apple-icon.png'))
  console.log('✓ Created apple-touch-icon.png & apple-icon.png')

  // 4. icon.png (32x32 & 64x64)
  await sharp(svgBuffer)
    .resize(512, 512)
    .png({ quality: 100 })
    .toFile(path.join(publicDir, 'icon.png'))
  console.log('✓ Created icon.png')

  // 5. favicon-32.png and favicon-16.png
  const fav32 = await sharp(svgBuffer).resize(32, 32).png().toBuffer()
  const fav16 = await sharp(svgBuffer).resize(16, 16).png().toBuffer()
  fs.writeFileSync(path.join(publicDir, 'favicon-32.png'), fav32)
  fs.writeFileSync(path.join(publicDir, 'favicon-16.png'), fav16)

  // 6. Convert to favicon.ico via ImageMagick
  const { execSync } = require('child_process')
  execSync(`convert "${path.join(publicDir, 'favicon-16.png')}" "${path.join(publicDir, 'favicon-32.png')}" "${path.join(publicDir, 'favicon.ico')}"`)
  console.log('✓ Generated multi-size favicon.ico with ImageMagick')

  console.log('All icons successfully updated with new Nexora gold emblem!')
}

generateIcons().catch((err) => {
  console.error(err)
  process.exit(1)
})
