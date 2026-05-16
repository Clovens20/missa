import { NextResponse } from 'next/server'
import { sendCJMessage } from '@/lib/cj-api'
import { createClient } from 
  '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const {
      cjProductId,
      cjOrderId,
      subject,
      message,
      type = 'dropship_instruction',
    } = await req.json()

    if (!subject || !message) {
      return NextResponse.json(
        { error: 'Subject and message required' },
        { status: 400 }
      )
    }

    // Try to send via CJ API
    let cjMessageId = null
    let sentStatus = 'sent'
    
    try {
      const cjResult = await sendCJMessage({
        orderId: cjOrderId,
        productId: cjProductId,
        subject,
        message,
      })
      cjMessageId = cjResult?.messageId || null
    } catch (err) {
      // CJ may not support direct 
      // messaging via API
      // We still save it locally
      sentStatus = 'stored_locally'
    }

    // Save to database
    const { data, error } = await supabase
      .from('supplier_messages')
      .insert({
        cj_product_id: cjProductId || null,
        supplier_name: 'CJDropshipping',
        type,
        subject,
        message,
        cj_message_id: cjMessageId,
        status: sentStatus === 'sent' 
          ? 'sent' 
          : 'draft',
        sent_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      messageId: data.id,
      status: sentStatus,
      note: sentStatus === 'stored_locally'
        ? 'Message saved. Add manually in CJ dashboard if needed.'
        : 'Message sent to supplier!',
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function GET() {
  // Get all sent messages
  const { data } = await supabase
    .from('supplier_messages')
    .select('*')
    .order('created_at', 
      { ascending: false })
  
  return NextResponse.json(data || [])
}
