import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  const { email, firstName, orderNumber, items, total } = await req.json()

  const itemsHtml = items.map((item: any) => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #f3f4f6">${item.name} x${item.qty}</td>
      <td style="padding:8px 0;text-align:right;font-weight:bold;border-bottom:1px solid #f3f4f6">$${(item.price * item.qty).toFixed(2)}</td>
    </tr>
  `).join('')

  await resend.emails.send({
    from: 'Missa Shop <orders@missashopp.com>',
    to: [email],
    subject: `✅ Commande confirmée — ${orderNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
        <div style="background:white;border-radius:24px;overflow:hidden;border:2px solid #f3f4f6">
          <div style="background:linear-gradient(135deg,#F97316,#22C55E);padding:32px;text-align:center">
            <div style="font-size:48px">✅</div>
            <h1 style="color:white;margin:8px 0;font-size:24px;font-weight:900">Commande Confirmée!</h1>
          </div>
          <div style="padding:32px">
            <p style="font-size:16px;color:#374151">Merci <strong>${firstName}</strong>! Votre commande a été reçue and est en cours de traitement.</p>
            <div style="background:#fff7ed;border-radius:12px;padding:16px;margin:20px 0;text-align:center">
              <p style="font-size:12px;color:#9ca3af;margin:0 0 4px">Numéro de commande</p>
              <p style="font-size:24px;font-weight:900;color:#F97316;margin:0">${orderNumber}</p>
            </div>
            <table style="width:100%;margin:20px 0">${itemsHtml}<tr><td style="padding:12px 0;font-weight:900;font-size:16px">Total</td><td style="text-align:right;font-weight:900;font-size:20px;color:#F97316">$${total.toFixed(2)}</td></tr></table>
            <div style="background:#f0fdf4;border-radius:12px;padding:16px;margin-top:20px">
              <p style="color:#16a34a;font-weight:bold;margin:0 0 8px">📦 Prochaines étapes:</p>
              <p style="color:#374151;font-size:14px;margin:0;line-height:1.6">
                • Votre commande sera traitée sous 24h<br/>
                • Livraison: 5-7 jours ouvrables<br/>
                • Vous recevrez un numéro de suivi par email<br/>
                <br/>
                <a href="https://missashop.com/track" style="display:inline-block;background:#F97316;color:white;padding:10px 20px;border-radius:12px;text-decoration:none;font-weight:bold;margin-top:8px">Suivre votre commande en temps réel →</a>
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
  })

  return NextResponse.json({ success: true })
}
