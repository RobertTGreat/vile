import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('file0') as File[]
    
    // For now, return mock URLs - in production you'd upload to a service like UploadThing, AWS S3, etc.
    const mockUrls = files.map((_, index) => `https://picsum.photos/400/300?random=${Date.now()}-${index}`)
    
    return NextResponse.json({ urls: mockUrls })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
