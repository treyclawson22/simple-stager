import { NextResponse } from 'next/server'

export async function GET() {
  console.log('🔍 DEBUG: Download status endpoint called')
  
  return NextResponse.json({
    message: 'New download logic is deployed',
    version: '2.0',
    features: ['free re-downloads', 'credit bypass for already downloaded'],
    timestamp: new Date().toISOString()
  })
}