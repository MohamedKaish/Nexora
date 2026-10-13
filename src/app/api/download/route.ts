import { NextRequest, NextResponse } from 'next/server'

// Safe redirect to static public download artifacts or download hub
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const target = searchParams.get('platform') || 'android'

  if (target === 'android') {
    return NextResponse.redirect(new URL('/download/Nexora.apk', req.url))
  }

  if (target === 'pc') {
    return NextResponse.redirect(new URL('/download/Nexora-Setup.exe', req.url))
  }

  return NextResponse.redirect(new URL('/download', req.url))
}
