import { NextResponse } from 'next/server'
import { fal } from '@fal-ai/client'
import { createClient } from 
  '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

fal.config({
  credentials: process.env.FAL_KEY!,
})

// ── Upload image to fal storage ──────
async function uploadImageToFal(
  imageData: string
): Promise<string> {
  try {
    if (imageData.startsWith('http')) {
      return imageData
    }

    if (imageData.startsWith('data:')) {
      const [header, base64] = imageData.split(',')
      const mimeType = header.split(':')[1].split(';')[0]
      const binaryStr = atob(base64)
      const bytes = new Uint8Array(binaryStr.length)
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i)
      }
      const blob = new Blob([bytes], { type: mimeType })
      const file = new File([blob], 'reference.jpg', { type: mimeType })
      const url = await fal.storage.upload(file)
      return url
    }

    return imageData
  } catch (err: any) {
    console.error('fal upload error:', err)
    throw new Error('Failed to upload image: ' + err.message)
  }
}

// ── Build prompt ─────────────────────
function buildPrompt(
  productName: string,
  color: string,
  background: string,
  angle: string,
  style: string,
  mode: string
): string {

  const bgMap: Record<string, string> = {
    white: 'pure white background',
    gradient: 'soft gradient background',
    lifestyle: 'lifestyle natural background',
    transparent: 'transparent background',
  }

  const angleMap: Record<string, string> = {
    front: 'front view',
    side: 'side profile view',
    angle: '3/4 angle view',
    detail: 'close-up detail',
    flat: 'flat lay overhead view',
  }

  // For recolor mode: very direct color instruction
  if (mode === 'recolor') {
    return [
      `IMPORTANT: Change ALL colors to ${color}.`,
      `The entire garment/product must be ${color} colored.`,
      `Same ${productName} product.`,
      `Same shape and style.`,
      `${bgMap[background] || 'white background'}.`,
      `${angleMap[angle] || 'front view'}.`,
      `Professional product photography.`,
      `High quality ecommerce photo.`,
      `${color} color version only.`,
    ].join(' ')
  }

  // For variation mode
  if (mode === 'variation') {
    return [
      `${productName} in ${color} color.`,
      `${bgMap[background] || 'white background'}.`,
      `${angleMap[angle] || 'front view'}.`,
      `Professional product photography.`,
      `High quality, sharp, commercial.`,
      style || '',
    ].filter(Boolean).join(' ')
  }

  // For generate mode (text-to-image)
  return [
    `Professional product photography`,
    `of ${productName}`,
    `in ${color} color`,
    `${angleMap[angle] || 'front view'}`,
    `${bgMap[background] || 'pure white background'}`,
    `high quality commercial photo`,
    `ecommerce style`,
    `8k sharp detailed`,
    style || '',
  ].filter(Boolean).join(', ')
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      referenceImageUrl,
      productName = 'product',
      colors = [],
      background = 'white',
      angle = 'front',
      style = '',
      mode = 'generate',
    } = body

    if (colors.length === 0) {
      return NextResponse.json(
        { error: 'No colors specified' },
        { status: 400 }
      )
    }

    const results: any[] = []
    const errors: string[] = []

    // Upload reference image to fal if provided
    let falImageUrl: string | null = null
    if (referenceImageUrl && mode !== 'generate') {
      try {
        falImageUrl = await uploadImageToFal(referenceImageUrl)
      } catch (err: any) {
        console.error('Reference upload failed:', err)
      }
    }

    // Process each color group
    for (const colorGroup of colors) {
      const { color, count = 1 } = colorGroup

      for (let i = 0; i < count; i++) {
        try {
          let imageUrl: string | null = null

          // ── Try image-to-image first (Publicly accessible model) ──
          if (falImageUrl && mode !== 'generate') {
            try {
              const result = await fal.subscribe(
                'fal-ai/flux/dev/image-to-image',
                {
                  input: {
                    prompt: buildPrompt(
                      productName,
                      color,
                      background,
                      angle,
                      style,
                      mode,
                    ),
                    image_url: falImageUrl,
                    strength: mode === 'recolor' ? 0.90 : 0.65,
                    num_inference_steps: 35,
                    guidance_scale: 7.5,
                    num_images: 1,
                    negative_prompt: 'same color as original, no color change, blurry, low quality, watermark, text',
                    seed: Math.floor(Math.random() * 999999),
                  } as any,
                }
              ) as any

              imageUrl = result?.data?.images?.[0]?.url || result?.images?.[0]?.url || null
            } catch (imgErr: any) {
              console.log('img2img failed, falling back to txt2img:', imgErr.message)
            }
          }

          // ── Fallback: text-to-image (Higher quality flux/dev) ──
          if (!imageUrl) {
            try {
              const result = await fal.subscribe(
                'fal-ai/flux/dev',
                {
                  input: {
                    prompt: buildPrompt(
                      productName,
                      color,
                      background,
                      angle,
                      style,
                      'generate',
                    ),
                    num_images: 1,
                    image_size: 'square_hd',
                    num_inference_steps: 28,
                    guidance_scale: 3.5,
                    seed: Math.floor(Math.random() * 999999),
                  },
                }
              ) as any

              imageUrl = result?.data?.images?.[0]?.url || result?.images?.[0]?.url || null
            } catch {
              // Final fallback to schnell
              const result = await fal.subscribe(
                'fal-ai/flux/schnell',
                {
                  input: {
                    prompt: buildPrompt(
                      productName,
                      color,
                      background,
                      angle,
                      style,
                      'generate',
                    ),
                    num_images: 1,
                    image_size: 'square_hd',
                    num_inference_steps: 8,
                  },
                }
              ) as any

              imageUrl = result?.data?.images?.[0]?.url || result?.images?.[0]?.url || null
            }
          }

          // ── Save result ──
          if (imageUrl) {
            try {
              const imgRes = await fetch(imageUrl)
              const blob = await imgRes.blob()
              const filename = `ai-generated/${Date.now()}-${color.toLowerCase().replace(/\s+/g, '-')}-${i}.jpg`

              const { error: upErr } = await supabase.storage
                .from('product-images')
                .upload(filename, blob, {
                  contentType: 'image/jpeg',
                })

              if (!upErr) {
                const { data: { publicUrl } } = supabase.storage
                  .from('product-images')
                  .getPublicUrl(filename)
                imageUrl = publicUrl
              }
            } catch {
              // Keep fal.ai URL if Supabase fails
            }

            results.push({
              url: imageUrl,
              color,
              index: i,
              alt: `${productName} - ${color}`,
            })
          } else {
            errors.push(`${color} #${i+1}: No image returned`)
          }

          await new Promise(r => setTimeout(r, 1000))

        } catch (err: any) {
          console.error(`❌ Error ${color}:`, err.message)
          errors.push(`${color} #${i+1}: ${err.message}`)
        }
      }
    }

    return NextResponse.json({
      success: true,
      images: results,
      errors,
      totalGenerated: results.length,
      totalRequested: colors.reduce((sum: number, c: any) => sum + (c.count || 1), 0),
    })

  } catch (error: any) {
    console.error('AI generation error:', error)
    return NextResponse.json(
      { error: error.message, images: [], totalGenerated: 0 },
      { status: 500 }
    )
  }
}
