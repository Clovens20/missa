import { NextResponse } from 'next/server'
import { fal } from '@fal-ai/client'
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 120 // video generation takes up to 2 min

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

fal.config({ credentials: process.env.FAL_KEY! })

// Preset motion prompts for product videos
const MOTION_PRESETS: Record<string, string> = {
  rotate:
    'Product rotating slowly 360 degrees on a clean white studio background, smooth camera movement, professional product showcase, soft studio lighting',
  zoom:
    'Slow dramatic zoom into the product details, sharp focus, studio white background, professional ecommerce video, luxury feel',
  lifestyle:
    'Product being used naturally in an everyday lifestyle setting, natural lighting, realistic motion, showing product in action',
  float:
    'Product floating gently with subtle up-and-down motion, clean white background, soft shadow, premium product video, e-commerce style',
  reveal:
    'Cinematic product reveal with light sweep, product appearing from darkness into bright studio lighting, dramatic and premium feel',
  hands:
    'Hands gently picking up and showcasing the product, close-up detail, natural lighting, lifestyle feel, showing product texture',
}

async function uploadImageToFal(imageUrl: string): Promise<string> {
  if (imageUrl.startsWith('data:')) {
    const [header, base64] = imageUrl.split(',')
    const mimeType = header.split(':')[1].split(';')[0]
    const binaryStr = atob(base64)
    const bytes = new Uint8Array(binaryStr.length)
    for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i)
    const blob = new Blob([bytes], { type: mimeType })
    const file = new File([blob], 'product.jpg', { type: mimeType })
    return await fal.storage.upload(file)
  }
  return imageUrl
}

async function saveVideoToSupabase(videoUrl: string, productName: string): Promise<string> {
  try {
    const res = await fetch(videoUrl)
    const blob = await res.blob()
    const safeName = productName.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 40)
    const filename = `videos/ai-${safeName}-${Date.now()}.mp4`

    const { error } = await supabase.storage
      .from('product-images')
      .upload(filename, blob, { contentType: 'video/mp4', upsert: false })

    if (!error) {
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filename)
      return publicUrl
    }
  } catch (err) {
    console.error('Supabase video save error:', err)
  }
  return videoUrl // Return fal URL as fallback
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      imageUrl,
      productName = 'produit',
      preset = 'rotate',
      customPrompt = '',
      duration = '5',
      aspectRatio = '1:1',
    } = body

    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL requise' }, { status: 400 })
    }

    const prompt = customPrompt || MOTION_PRESETS[preset] || MOTION_PRESETS.rotate

    console.log(`🎬 Generating video for "${productName}" with preset "${preset}"...`)

    // Upload image to fal storage
    const falImageUrl = await uploadImageToFal(imageUrl)

    // Try Kling v1.6 first (best quality for products)
    let videoUrl: string | null = null

    const modelsToTry = [
      'fal-ai/kling-video/v1.6/standard/image-to-video',
      'fal-ai/minimax-video/image-to-video',
      'fal-ai/wan-i2v',
    ]

    for (const modelId of modelsToTry) {
      try {
        console.log(`  Trying model: ${modelId}`)

        const result = await fal.subscribe(modelId, {
          input: {
            image_url: falImageUrl,
            prompt,
            duration,
            aspect_ratio: aspectRatio,
            negative_prompt: 'blurry, low quality, text overlay, watermark, distorted',
          } as any,
          logs: true,
        }) as any

        videoUrl =
          result?.data?.video?.url ||
          result?.video?.url ||
          result?.data?.video_url ||
          result?.video_url ||
          null

        if (videoUrl) {
          console.log(`  ✅ Success with ${modelId}`)
          break
        }
      } catch (err: any) {
        console.warn(`  ❌ ${modelId} failed:`, err.message)
        continue
      }
    }

    if (!videoUrl) {
      return NextResponse.json(
        { error: 'Aucun modèle n\'a pu générer la vidéo. Réessayez.' },
        { status: 500 }
      )
    }

    // Save to Supabase storage for persistence
    const finalUrl = await saveVideoToSupabase(videoUrl, productName)

    return NextResponse.json({
      success: true,
      videoUrl: finalUrl,
      preset,
      productName,
    })
  } catch (error: any) {
    console.error('AI video generation error:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur de génération vidéo IA' },
      { status: 500 }
    )
  }
}
