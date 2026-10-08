import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// Generates and streams direct download files without leaving the site
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const target = searchParams.get('platform') || 'android' // 'android' | 'pc' | 'zip'

  if (target === 'android') {
    const filePath = path.join(process.cwd(), 'public', 'download', 'Nexora.apk')
    if (fs.existsSync(filePath)) {
      const fileBuffer = fs.readFileSync(filePath)
      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.android.package-archive',
          'Content-Disposition': 'attachment; filename="Nexora.apk"',
          'Content-Length': fileBuffer.length.toString(),
        },
      })
    }
  }

  if (target === 'pc') {
    const filePath = path.join(process.cwd(), 'public', 'download', 'Nexora-Setup.exe')
    if (fs.existsSync(filePath)) {
      const fileBuffer = fs.readFileSync(filePath)
      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.microsoft.portable-executable',
          'Content-Disposition': 'attachment; filename="Nexora-Setup.exe"',
          'Content-Length': fileBuffer.length.toString(),
        },
      })
    }
  }

  // Fallback direct JSON bundle / Web package
  const manifestPath = path.join(process.cwd(), 'public', 'manifest.webmanifest')
  const manifest = fs.existsSync(manifestPath) ? fs.readFileSync(manifestPath, 'utf8') : '{}'

  return new NextResponse(manifest, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="nexora-app-package.json"',
    },
  })
}
