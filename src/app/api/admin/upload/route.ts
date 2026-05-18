import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type — allow images and videos
    const isImage = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/')

    if (!isImage && !isVideo) {
      return NextResponse.json(
        { error: 'File must be an image or video (mp4, webm, mov…)' },
        { status: 400 }
      )
    }

    // Validate file size: images ≤ 10 MB, videos ≤ 200 MB
    const maxSize = isVideo ? 200 * 1024 * 1024 : 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: isVideo ? 'Vidéo trop lourde (max 200 Mo)' : 'Image trop lourde (max 10 Mo)' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const isVideo = file.type.startsWith('video/')
    const ext = file.name.split('.').pop() || (isVideo ? 'mp4' : 'jpg')
    const folder = isVideo ? 'videos' : 'uploads'
    const filename = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`

    // Convert to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (error) {
      // If bucket doesn't exist or storage fails,
      // return the base64 as fallback
      console.error('Storage error:', error.message)
      
      const base64 = buffer.toString('base64')
      const dataUrl = `data:${file.type};base64,${base64}`
      
      return NextResponse.json({
        url: dataUrl,
        fallback: true,
      })
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(filename)

    return NextResponse.json({
      url: publicUrl,
      filename,
      fallback: false,
      isVideo: file.type.startsWith('video/'),
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
