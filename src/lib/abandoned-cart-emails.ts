export function getAbandonedCartEmail1(
  cart: any
): { subject: string; html: string } {
  const firstName = 
    cart.customer_name?.split(' ')[0] || 
    'vous'
  
  const itemsHtml = (cart.items || [])
    .slice(0, 3)
    .map((item: any) => `
      <tr>
        <td style="padding:12px 0;
          border-bottom:1px solid #f0f0f0">
          <table cellpadding="0" 
            cellspacing="0" 
            width="100%">
            <tr>
              <td width="70">
                ${item.image ? `
                  <img src="${item.image}"
                    width="60" height="60"
                    style="border-radius:12px;
                      object-fit:cover;
                      border:1px solid #eee"
                  />
                ` : ''}
              </td>
              <td style="padding-left:12px">
                <p style="margin:0;
                  font-weight:700;
                  color:#111;
                  font-size:14px">
                  ${item.name}
                </p>
                ${item.variant ? `
                  <p style="margin:4px 0 0;
                    color:#888;
                    font-size:12px">
                    ${item.variant}
                  </p>
                ` : ''}
                <p style="margin:4px 0 0;
                  color:#FF6B35;
                  font-weight:700;
                  font-size:14px">
                  $${(item.price * 
                    item.quantity)
                    .toFixed(2)}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `).join('')

  const recoveryUrl = 
    `${process.env.NEXT_PUBLIC_SITE_URL}` +
    `/cart/recover?token=` +
    `${cart.recovery_token}`

  return {
    subject: `${firstName}, votre panier vous attend! 🛒`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" 
    content="width=device-width">
</head>
<body style="margin:0;padding:0;
  background:#f8f8f8;
  font-family:'Helvetica Neue',
    Arial,sans-serif">
  
  <table width="100%" cellpadding="0"
    cellspacing="0"
    style="background:#f8f8f8;
      padding:40px 20px">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0"
          cellspacing="0"
          style="background:#ffffff;
            border-radius:24px;
            overflow:hidden;
            box-shadow:0 4px 24px 
              rgba(0,0,0,0.08)">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#FF6B35,#F7C59F);
              padding:40px;text-align:center">
              <h1 style="margin:0;
                color:#ffffff;
                font-size:28px;
                font-weight:900">
                🛒 Missa Shop
              </h1>
              <p style="margin:8px 0 0;
                color:rgba(255,255,255,0.9);
                font-size:16px">
                Vous avez oublié quelque chose!
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px">
              <h2 style="margin:0 0 8px;
                color:#111;font-size:22px;
                font-weight:900">
                Bonjour ${firstName}! 👋
              </h2>
              <p style="margin:0 0 24px;
                color:#666;font-size:15px;
                line-height:1.6">
                Vous avez laissé des articles 
                dans votre panier. 
                Ils vous attendent toujours!
              </p>

              <!-- Items -->
              <table width="100%" 
                cellpadding="0" 
                cellspacing="0"
                style="margin-bottom:24px">
                ${itemsHtml}
              </table>

              <!-- Total -->
              <div style="background:#f8f8f8;
                border-radius:16px;
                padding:16px;
                margin-bottom:32px;
                text-align:right">
                <span style="color:#666;
                  font-size:14px">
                  Total du panier:
                </span>
                <span style="color:#FF6B35;
                  font-weight:900;
                  font-size:20px;
                  margin-left:12px">
                  $${cart.cart_total
                    .toFixed(2)}
                </span>
              </div>

              <!-- CTA -->
              <div style="text-align:center;
                margin-bottom:32px">
                <a href="${recoveryUrl}"
                  style="display:inline-block;
                    background:linear-gradient(135deg,#FF6B35,#F7931E);
                    color:#ffffff;
                    font-weight:900;
                    font-size:16px;
                    text-decoration:none;
                    padding:18px 48px;
                    border-radius:50px;
                    box-shadow:0 8px 24px 
                      rgba(255,107,53,0.4)">
                  ✅ Compléter ma commande →
                </a>
              </div>

              <!-- Trust badges -->
              <div style="display:flex;
                justify-content:center;
                gap:24px;text-align:center;
                flex-wrap:wrap">
                <span style="color:#888;font-size:12px">🔒 Paiement sécurisé</span>
                <span style="color:#888;font-size:12px">🚚 Livraison rapide</span>
                <span style="color:#888;font-size:12px">↩️ Retour 30 jours</span>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8f8f8;
              padding:24px 40px;
              text-align:center">
              <p style="margin:0;
                color:#aaa;font-size:12px">
                © 2025 Missa Shop · 
                <a href="${process.env.NEXT_PUBLIC_SITE_URL}/unsubscribe?email=${cart.customer_email}"
                  style="color:#aaa">
                  Se désabonner
                </a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  }
}

// Email 2 — 24h later with discount
export function getAbandonedCartEmail2(
  cart: any,
  discountCode: string,
  discountPct: number = 10
): { subject: string; html: string } {
  const firstName = 
    cart.customer_name?.split(' ')[0] || 
    'vous'

  const recoveryUrl = 
    `${process.env.NEXT_PUBLIC_SITE_URL}` +
    `/cart/recover?token=` +
    `${cart.recovery_token}` +
    `&code=${discountCode}`

  return {
    subject: `⚡ -${discountPct}% pour vous, ${firstName}! Offre limitée`,
    html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;
  background:#f8f8f8;
  font-family:'Helvetica Neue',
    Arial,sans-serif">
  
  <table width="100%" cellpadding="0"
    cellspacing="0"
    style="background:#f8f8f8;
      padding:40px 20px">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0"
          cellspacing="0"
          style="background:#fff;
            border-radius:24px;
            overflow:hidden">

          <!-- Header -->
          <tr>
            <td style="background:#111;
              padding:40px;
              text-align:center">
              <div style="display:inline-block;
                background:#FF6B35;
                color:#fff;
                font-size:36px;
                font-weight:900;
                padding:12px 24px;
                border-radius:16px;
                margin-bottom:16px">
                -${discountPct}%
              </div>
              <h1 style="margin:0;
                color:#fff;
                font-size:24px;
                font-weight:900">
                Offre exclusive pour vous!
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding:40px">
              <p style="color:#333;
                font-size:16px;
                line-height:1.6;
                margin:0 0 24px">
                Bonjour ${firstName},<br><br>
                Votre panier est toujours là.
                Pour vous remercier de 
                votre intérêt, voici un 
                <strong>code promo exclusif</strong>:
              </p>

              <!-- Discount code -->
              <div style="background:#FFF3EE;
                border:2px dashed #FF6B35;
                border-radius:16px;
                padding:24px;
                text-align:center;
                margin-bottom:32px">
                <p style="margin:0 0 8px;
                  color:#666;font-size:13px;
                  font-weight:600;
                  text-transform:uppercase;
                  letter-spacing:1px">
                  Votre code promo
                </p>
                <p style="margin:0;
                  font-size:32px;
                  font-weight:900;
                  color:#FF6B35;
                  letter-spacing:4px">
                  ${discountCode}
                </p>
                <p style="margin:8px 0 0;
                  color:#888;font-size:12px">
                  -${discountPct}% sur votre commande
                  · Expire dans 48h
                </p>
              </div>

              <!-- CTA -->
              <div style="text-align:center">
                <a href="${recoveryUrl}"
                  style="display:inline-block;
                    background:linear-gradient(135deg,#FF6B35,#F7931E);
                    color:#fff;
                    font-weight:900;
                    font-size:16px;
                    text-decoration:none;
                    padding:18px 48px;
                    border-radius:50px">
                  🎁 Utiliser mon code →
                </a>
              </div>
            </td>
          </tr>

          <tr>
            <td style="background:#f8f8f8;
              padding:20px;
              text-align:center">
              <p style="margin:0;
                color:#aaa;font-size:12px">
                © 2025 Missa Shop ·
                <a href="${process.env.NEXT_PUBLIC_SITE_URL}/unsubscribe?email=${cart.customer_email}"
                  style="color:#aaa">
                  Se désabonner
                </a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  }
}

// Email 3 — 72h — Last chance
export function getAbandonedCartEmail3(
  cart: any,
  discountCode: string
): { subject: string; html: string } {
  const firstName = 
    cart.customer_name?.split(' ')[0] || 
    'vous'

  const recoveryUrl = 
    `${process.env.NEXT_PUBLIC_SITE_URL}` +
    `/cart/recover?token=` +
    `${cart.recovery_token}` +
    `&code=${discountCode}`

  return {
    subject: `⏰ Dernière chance ${firstName}! Votre panier expire bientôt`,
    html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;
  background:#f8f8f8;
  font-family:'Helvetica Neue',
    Arial,sans-serif">

  <table width="100%" cellpadding="0"
    cellspacing="0"
    style="padding:40px 20px;
      background:#f8f8f8">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0"
          cellspacing="0"
          style="background:#fff;
            border-radius:24px;
            overflow:hidden">

          <tr>
            <td style="background:linear-gradient(135deg,#c0392b,#e74c3c);
              padding:40px;
              text-align:center">
              <p style="margin:0 0 8px;
                font-size:48px">⏰</p>
              <h1 style="margin:0;
                color:#fff;font-size:24px;
                font-weight:900">
                Votre panier expire bientôt!
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding:40px">
              <p style="color:#333;
                font-size:16px;
                line-height:1.6;
                margin:0 0 24px">
                Bonjour ${firstName},<br><br>
                C'est votre 
                <strong>dernière chance</strong> 
                de récupérer votre panier 
                avec le code promo 
                <strong>${discountCode}</strong>.
                <br><br>
                Après aujourd'hui, 
                votre panier sera vidé.
              </p>

              <div style="text-align:center;
                margin-bottom:32px">
                <a href="${recoveryUrl}"
                  style="display:inline-block;
                    background:linear-gradient(135deg,#c0392b,#e74c3c);
                    color:#fff;
                    font-weight:900;
                    font-size:16px;
                    text-decoration:none;
                    padding:18px 48px;
                    border-radius:50px">
                  🚨 Sauver mon panier →
                </a>
              </div>

              <p style="color:#aaa;
                font-size:13px;
                text-align:center">
                Si vous ne souhaitez plus 
                recevoir ces emails, 
                <a href="${process.env.NEXT_PUBLIC_SITE_URL}/unsubscribe?email=${cart.customer_email}"
                  style="color:#FF6B35">
                  cliquez ici
                </a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  }
}
