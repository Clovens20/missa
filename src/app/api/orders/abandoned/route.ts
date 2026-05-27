import { NextResponse } from 'next/server'
import { resend, FROM } from '@/lib/email'

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || 'Missa Shop'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://www.missashopp.com'

// ─────────────────────────────────────────────
// EMAIL 1 — Après 1h : Rappel simple
// ─────────────────────────────────────────────
async function sendAbandonedEmail1(cart: any) {
  const firstName = cart.first_name || cart.customer_name?.split(' ')[0] || 'là'
  const cartUrl = cart.cart_url || `${SITE_URL}/checkout`

  return resend.emails.send({
    from: FROM,
    to: cart.customer_email || cart.email,
    subject: `🛒 Votre panier vous attend — ${SITE_NAME}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #F97316;">Vous avez oublié quelque chose!</h2>
        <p>Bonjour ${firstName},</p>
        <p>Vous avez laissé des articles dans votre panier. Ils sont toujours disponibles, mais les stocks sont limités!</p>

        ${cart.items?.length ? `
        <div style="background: #f9f9f9; padding: 20px; border-radius: 12px; margin: 20px 0;">
          <p style="font-weight: bold; margin: 0 0 12px 0;">Vos articles :</p>
          ${cart.items.map((item: any) => `
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee;">
              <span>${item.name}${item.variant?.size ? ` — ${item.variant.size}` : ''} x${item.quantity}</span>
              <span style="font-weight: bold;">$${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          `).join('')}
          <p style="margin: 12px 0 0 0; font-size: 1.1rem; font-weight: bold; color: #F97316;">
            Total: $${Number(cart.total).toFixed(2)}
          </p>
        </div>
        ` : ''}

        <a href="${cartUrl}"
           style="display: inline-block; background: #F97316; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 1rem; margin: 10px 0;">
          Compléter ma commande →
        </a>

        <p style="margin-top: 30px; font-size: 0.8rem; color: #999;">
          Si vous avez des questions, répondez simplement à cet email.<br/>
          ${SITE_NAME} · <a href="${SITE_URL}" style="color: #999;">${SITE_URL}</a>
        </p>
      </div>
    `,
  })
}

// ─────────────────────────────────────────────
// EMAIL 2 — Après 24h : Code promo -10%
// ─────────────────────────────────────────────
async function sendAbandonedEmail2(cart: any) {
  const firstName = cart.first_name || cart.customer_name?.split(' ')[0] || 'là'
  const cartUrl = cart.cart_url || `${SITE_URL}/checkout`
  const discountCode = cart.discount_code || 'RETOUR10'

  return resend.emails.send({
    from: FROM,
    to: cart.customer_email || cart.email,
    subject: `🎁 -10% pour finir votre commande — ${SITE_NAME}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #F97316;">Un petit coup de pouce 🎁</h2>
        <p>Bonjour ${firstName},</p>
        <p>On a remarqué que vous n'avez pas finalisé votre commande. Voici un code exclusif pour vous aider :</p>

        <div style="background: #FFF7ED; border: 2px dashed #F97316; padding: 24px; border-radius: 12px; text-align: center; margin: 24px 0;">
          <p style="margin: 0; font-size: 0.9rem; color: #666;">Votre code promo exclusif</p>
          <p style="font-size: 2rem; font-weight: 900; color: #F97316; letter-spacing: 4px; margin: 8px 0;">${discountCode}</p>
          <p style="margin: 0; font-size: 0.85rem; color: #666;">-10% sur votre commande</p>
        </div>

        ${cart.items?.length ? `
        <div style="background: #f9f9f9; padding: 16px; border-radius: 12px; margin: 20px 0;">
          ${cart.items.map((item: any) => `
            <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #eee; font-size: 0.9rem;">
              <span>${item.name} x${item.quantity}</span>
              <span style="font-weight: bold;">$${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          `).join('')}
        </div>
        ` : ''}

        <a href="${cartUrl}"
           style="display: inline-block; background: #F97316; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 1rem; margin: 10px 0;">
          Utiliser mon code →
        </a>

        <p style="margin-top: 30px; font-size: 0.8rem; color: #999;">
          Code valide 48h uniquement.<br/>
          ${SITE_NAME} · <a href="${SITE_URL}" style="color: #999;">${SITE_URL}</a>
        </p>
      </div>
    `,
  })
}

// ─────────────────────────────────────────────
// EMAIL 3 — Après 72h : Dernière chance
// ─────────────────────────────────────────────
async function sendAbandonedEmail3(cart: any) {
  const firstName = cart.first_name || cart.customer_name?.split(' ')[0] || 'là'
  const cartUrl = cart.cart_url || `${SITE_URL}/checkout`
  const discountCode = cart.discount_code || 'RETOUR10'

  return resend.emails.send({
    from: FROM,
    to: cart.customer_email || cart.email,
    subject: `⚠️ Dernière chance — votre panier expire bientôt`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #EF4444;">Dernière chance! ⚠️</h2>
        <p>Bonjour ${firstName},</p>
        <p>Votre panier va bientôt expirer et les articles pourraient ne plus être disponibles.</p>

        <div style="background: #FEF2F2; border-left: 4px solid #EF4444; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; font-weight: bold; color: #EF4444;">⏰ Stock limité — commandez maintenant</p>
          <p style="margin: 8px 0 0 0; font-size: 0.9rem; color: #666;">
            Votre code promo <strong>${discountCode}</strong> (-10%) est toujours actif.
          </p>
        </div>

        <a href="${cartUrl}"
           style="display: inline-block; background: #EF4444; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 1rem; margin: 10px 0;">
          Finaliser ma commande maintenant →
        </a>

        <p style="margin-top: 30px; font-size: 0.8rem; color: #999;">
          C'est notre dernier rappel. Après cela, votre panier sera supprimé.<br/>
          ${SITE_NAME} · <a href="${SITE_URL}" style="color: #999;">${SITE_URL}</a>
        </p>
      </div>
    `,
  })
}

// ─────────────────────────────────────────────
// ENDPOINT — POST /api/orders/abandoned
// ─────────────────────────────────────────────
export async function POST(req: Request) {
  const body = await req.json()
  const { cart, emailNumber } = body

  if (!cart) {
    return NextResponse.json({ error: 'Cart data missing' }, { status: 400 })
  }

  const email = cart.customer_email || cart.email
  if (!email) {
    return NextResponse.json({ error: 'Customer email missing' }, { status: 400 })
  }

  try {
    switch (emailNumber) {
      case 1:
        await sendAbandonedEmail1(cart)
        break
      case 2:
        await sendAbandonedEmail2(cart)
        break
      case 3:
        await sendAbandonedEmail3(cart)
        break
      default:
        return NextResponse.json({ error: 'Invalid emailNumber (1, 2, or 3)' }, { status: 400 })
    }

    return NextResponse.json({ success: true, emailNumber, to: email })
  } catch (error: any) {
    console.error('Abandoned cart email error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
