import { NextResponse } from 'next/server'
import { createClient } from 
  '@supabase/supabase-js'
import { Resend } from 'resend'
import { getLowStockEmail } 
  from '@/lib/stock-alert-email'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const resend = new Resend(
  process.env.RESEND_API_KEY
)

const ADMIN_EMAIL = 
  process.env.ADMIN_EMAIL || 
  'admin@missashop.com'

export async function GET(req: Request) {
  // Verify cron secret
  const auth = req.headers
    .get('authorization')
  if (auth !== 
    `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const alerts: any[] = []

    // ── Check out of stock ────────────
    const { data: outOfStock } = 
      await supabase
        .from('products')
        .select(`
          id, name, 
          stock_quantity,
          low_stock_threshold,
          out_of_stock_alert_sent,
          images
        `)
        .eq('is_active', true)
        .lte('stock_quantity', 0)
        .eq('out_of_stock_alert_sent', false)

    for (const p of outOfStock || []) {
      alerts.push({
        productName: p.name,
        productId: p.id,
        currentStock: p.stock_quantity,
        threshold: p.low_stock_threshold || 5,
        image: p.images?.[0]?.url,
        type: 'out_of_stock',
      })

      // Log alert
      await supabase
        .from('stock_alerts')
        .insert({
          product_id: p.id,
          product_name: p.name,
          alert_type: 'out_of_stock',
          current_stock: p.stock_quantity,
          threshold: p.low_stock_threshold,
        })

      // Mark as sent
      await supabase
        .from('products')
        .update({ 
          out_of_stock_alert_sent: true 
        })
        .eq('id', p.id)
    }

    // ── Check low stock ───────────────
    const { data: lowStock } = 
      await supabase
        .from('products')
        .select(`
          id, name,
          stock_quantity,
          low_stock_threshold,
          low_stock_alert_sent,
          images
        `)
        .eq('is_active', true)
        .gt('stock_quantity', 0)
        .eq('low_stock_alert_sent', false)

    for (const p of lowStock || []) {
      const threshold = 
        p.low_stock_threshold || 5
      
      if (p.stock_quantity <= threshold) {
        alerts.push({
          productName: p.name,
          productId: p.id,
          currentStock: p.stock_quantity,
          threshold,
          image: p.images?.[0]?.url,
          type: 'low_stock',
        })

        // Log alert
        await supabase
          .from('stock_alerts')
          .insert({
            product_id: p.id,
            product_name: p.name,
            alert_type: 'low_stock',
            current_stock: p.stock_quantity,
            threshold,
          })

        // Mark as sent
        await supabase
          .from('products')
          .update({ 
            low_stock_alert_sent: true 
          })
          .eq('id', p.id)
      }
    }

    // ── Reset alerts for restocked ────
    const { data: restocked } = 
      await supabase
        .from('products')
        .select('id, name, stock_quantity, low_stock_threshold')
        .eq('is_active', true)
        .or(
          'low_stock_alert_sent.eq.true,' +
          'out_of_stock_alert_sent.eq.true'
        )

    for (const p of restocked || []) {
      const threshold = 
        p.low_stock_threshold || 5
      
      // If stock is now above threshold,
      // reset alert flags
      if (p.stock_quantity > threshold) {
        await supabase
          .from('products')
          .update({
            low_stock_alert_sent: false,
            out_of_stock_alert_sent: false,
          })
          .eq('id', p.id)

        // Log restock
        await supabase
          .from('stock_alerts')
          .insert({
            product_id: p.id,
            product_name: p.name,
            alert_type: 'restocked',
            current_stock: p.stock_quantity,
            threshold,
            resolved: true,
            resolved_at: new Date()
              .toISOString(),
          })
      }
    }

    // ── Send email if alerts ──────────
    if (alerts.length > 0) {
      const { subject, html } = 
        getLowStockEmail(alerts)

      await resend.emails.send({
        from: 'Missa Shop <alerts@missashop.com>',
        to: ADMIN_EMAIL,
        subject,
        html,
      })
    }

    return NextResponse.json({
      success: true,
      alertsSent: alerts.length,
      outOfStock: alerts.filter(
        a => a.type === 'out_of_stock'
      ).length,
      lowStock: alerts.filter(
        a => a.type === 'low_stock'
      ).length,
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
