import { NextResponse } from 'next/server'
import { fal } from '@fal-ai/client'

fal.config({
  credentials: process.env.FAL_KEY!,
})

export async function GET() {
  const tests: any = {
    falKey: process.env.FAL_KEY 
      ? '✅ FAL_KEY present (' + process.env.FAL_KEY.substring(0,8) + '...)'
      : '❌ FAL_KEY MISSING',
    timestamp: new Date().toISOString(),
  }

  // Test publicly accessible models ONLY
  try {
    // 1. Test Text-to-Image (Flux Schnell)
    const resultTxt = await fal.subscribe(
      'fal-ai/flux/schnell',
      {
        input: {
          prompt: 'red t-shirt product photography white background',
          num_images: 1,
          image_size: 'square_hd',
          num_inference_steps: 4,
        },
      }
    ) as any

    const txtUrl = resultTxt?.data?.images?.[0]?.url || resultTxt?.images?.[0]?.url
    tests.textToImage = txtUrl ? '✅ Works! ' + txtUrl : '❌ Failed'

    // 2. Test Image-to-Image (Flux Dev)
    // Using the generated image as reference for the test
    if (txtUrl) {
      const resultImg = await fal.subscribe(
        'fal-ai/flux/dev/image-to-image',
        {
          input: {
            prompt: 'blue version',
            image_url: txtUrl,
            strength: 0.7,
          },
        }
      ) as any
      const imgUrl = resultImg?.data?.images?.[0]?.url || resultImg?.images?.[0]?.url
      tests.imageToImage = imgUrl ? '✅ Works! ' + imgUrl : '❌ Failed'
    }

  } catch (err: any) {
    tests.error = err.message
    tests.status = err.status
  }

  return NextResponse.json(tests, {
    headers: { 'Cache-Control': 'no-store' }
  })
}
