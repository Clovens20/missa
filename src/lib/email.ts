import { Resend } from 'resend'

export const resend = new Resend(
  process.env.RESEND_API_KEY!
)

export const FROM =
  `${process.env.RESEND_FROM_NAME || 'Missa Shop'} ` +
  `<${process.env.RESEND_FROM_EMAIL || 'contact@www.missashopp.com'}>`

export const ADMIN_EMAIL =
  process.env.ADMIN_EMAIL!

// Send order confirmation to customer
export async function sendOrderConfirmation(
  to: string,
  order: any
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  return resend.emails.send({
    from: FROM,
    to,
    subject: `✅ Commande #${order.id} confirmée — ${process.env.NEXT_PUBLIC_SITE_NAME || 'Missa Shop'}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #F97316;">Merci pour votre commande!</h2>
        <p>Bonjour ${order.customer_name},</p>
        <p>Votre commande <strong>#${order.id}</strong> a été confirmée avec succès.</p>
        <div style="background: #f9f9f9; padding: 20px; border-radius: 12px; margin: 20px 0;">
          <p style="margin: 0;">Total: <strong style="font-size: 1.2rem; color: #F97316;">$${order.total}</strong></p>
          <p style="margin: 5px 0 0 0; color: #666; font-size: 0.9rem;">${order.items_count} article(s)</p>
        </div>
        <p>Vous recevrez un email avec votre numéro de suivi dès que votre colis sera en route.</p>
        <br/>
        <a href="${appUrl}/orders/${order.id}" 
           style="display: inline-block; background: #F97316; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
          Voir ma commande →
        </a>
        <p style="margin-top: 30px; font-size: 0.8rem; color: #999;">
          Si vous avez des questions, répondez simplement à cet email.
        </p>
      </div>
    `,
  })
}

// Send new order alert to admin
export async function sendAdminOrderAlert(
  order: any
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  return resend.emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `🛍️ Nouvelle commande #${order.id} — $${order.total}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2>Nouvelle vente sur Missa Shop! 🚀</h2>
        <div style="background: #f1f5f9; padding: 20px; border-radius: 12px; margin: 20px 0;">
          <p><strong>Client:</strong> ${order.customer_name}</p>
          <p><strong>Email:</strong> ${order.customer_email}</p>
          <p><strong>Total:</strong> $${order.total}</p>
          <p><strong>Articles:</strong> ${order.items_count}</p>
        </div>
        <br/>
        <a href="${appUrl}/admin/orders/${order.id}" 
           style="display: inline-block; background: #334155; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
          Gérer dans l'administration →
        </a>
      </div>
    `,
  })
}
