import { NextResponse } from 'next/server'

// Legacy route — SmartImporter now uses /api/import/upload (server-side proxy)
export async function POST() {
  return NextResponse.json(
    { error: 'Use /api/import/upload instead', legacy: true },
    { status: 410 }
  )
}
