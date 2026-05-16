import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const { data } = await supabase
    .from('tracking_pixels')
    .select('*')
    .eq('id', '00000000-0000-0000-0000-000000000001')
    .single()

  return NextResponse.json({
    facebook: data?.facebook_enabled ? {
      tag: data.facebook_domain_tag,
      script: data.facebook_pixel_script,
    } : null,
    tiktok: data?.tiktok_enabled ? {
      tag: data.tiktok_domain_tag,
      script: data.tiktok_pixel_script,
    } : null,
    google: data?.google_enabled ? {
      tag: data.google_domain_tag,
      script: data.google_pixel_script,
    } : null,
    snapchat: data?.snapchat_enabled ? {
      tag: data.snapchat_domain_tag,
      script: data.snapchat_pixel_script,
    } : null,
    pinterest: data?.pinterest_enabled ? {
      tag: data.pinterest_domain_tag,
      script: data.pinterest_pixel_script,
    } : null,
    twitter: data?.twitter_enabled ? {
      tag: data.twitter_domain_tag,
      script: data.twitter_pixel_script,
    } : null,
    customHead: data?.custom_enabled ? data.custom_head_scripts : null,
    customBody: data?.custom_enabled ? data.custom_body_scripts : null,
  })
}
