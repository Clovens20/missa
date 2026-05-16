export function getNewCollectionEmail(
  subscriber: any,
  products: any[],
  subject: string,
  type: 
    'new_products' | 
    'flash_sale' | 
    'restock' = 'new_products'
): { subject: string; html: string } {
  
  const firstName = 
    subscriber.name?.split(' ')[0] || 
    'vous'

  const unsubUrl = 
    `${process.env.NEXT_PUBLIC_SITE_URL}` +
    `/unsubscribe?token=` +
    `${subscriber.unsubscribe_token}`

  const typeConfig = {
    new_products: {
      emoji: '✨',
      headline: 'Nouvelles Arrivées!',
      cta: 'Découvrir la collection →',
      color: '#FF6B35',
    },
    flash_sale: {
      emoji: '⚡',
      headline: 'Flash Sale — Offres Limitées!',
      cta: 'Profiter des offres →',
      color: '#e74c3c',
    },
    restock: {
      emoji: '🎉',
      headline: 'De retour en stock!',
      cta: 'Commander avant rupture →',
      color: '#27ae60',
    },
  }

  const config = typeConfig[type]

  const productsHtml = products
    .slice(0, 4)
    .map(p => `
      <td width="25%" 
        style="padding:8px;
          vertical-align:top;
          text-align:center">
        <a href="${process.env
          .NEXT_PUBLIC_SITE_URL}
          /product/${p.slug}"
          style="text-decoration:none;
            display:block">
          <div style="border-radius:16px;
            overflow:hidden;
            margin-bottom:8px;
            background:#f5f5f5">
            <img 
              src="${p.images?.[0]?.url || 
                p.image || ''}"
              width="100%"
              style="display:block;
                aspect-ratio:1;
                object-fit:cover"
            />
          </div>
          <p style="margin:0 0 4px;
            font-size:12px;
            font-weight:700;
            color:#111;
            line-height:1.3">
            ${p.name?.substring(0, 30)}
            ${p.name?.length > 30 
              ? '...' : ''}
          </p>
          <p style="margin:0;
            font-size:14px;
            font-weight:900;
            color:${config.color}">
            $${p.price?.toFixed(2) || 
              p.selling_price?.toFixed(2)}
          </p>
        </a>
      </td>
    `).join('')

  return {
    subject: `${config.emoji} ${subject}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" 
    content="width=device-width">
</head>
<body style="margin:0;padding:0;
  background:#f5f5f5;
  font-family:'Helvetica Neue',
    Arial,sans-serif">
  
  <table width="100%" cellpadding="0"
    cellspacing="0"
    style="padding:32px 16px">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0"
          cellspacing="0"
          style="background:#fff;
            border-radius:24px;
            overflow:hidden;
            box-shadow:0 4px 24px 
              rgba(0,0,0,0.08)">

          <!-- Header -->
          <tr>
            <td style="background:
              linear-gradient(135deg,
              ${config.color},
              ${config.color}dd);
              padding:48px 40px;
              text-align:center">
              <p style="font-size:48px;
                margin:0 0 12px">
                ${config.emoji}
              </p>
              <h1 style="margin:0;
                color:#fff;
                font-size:28px;
                font-weight:900">
                Missa Shop
              </h1>
              <h2 style="margin:12px 0 0;
                color:rgba(255,255,255,0.9);
                font-size:18px;
                font-weight:600">
                ${config.headline}
              </h2>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding:32px 40px 
              16px">
              <p style="margin:0;
                font-size:16px;
                color:#333;
                line-height:1.6">
                Bonjour ${firstName}! 👋
                <br><br>
                ${type === 'new_products' 
                  ? 'De nouveaux produits viennent d\'arriver sur Missa Shop, spécialement sélectionnés pour vous!'
                  : type === 'flash_sale'
                    ? 'Des offres exclusives vous attendent pour une durée limitée!'
                    : 'Vos produits favoris sont de retour en stock!'
                }
              </p>
            </td>
          </tr>

          <!-- Products grid -->
          <tr>
            <td style="padding:16px 32px">
              <table width="100%" 
                cellpadding="0"
                cellspacing="0">
                <tr>
                  ${productsHtml}
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:24px 40px 
              40px;text-align:center">
              <a href="${process.env
                .NEXT_PUBLIC_SITE_URL}"
                style="display:inline-block;
                  background:${config.color};
                  color:#fff;
                  font-weight:900;
                  font-size:16px;
                  text-decoration:none;
                  padding:18px 48px;
                  border-radius:50px;
                  box-shadow:0 8px 24px 
                    rgba(0,0,0,0.15)">
                ${config.cta}
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8f8f8;
              padding:24px 40px;
              text-align:center">
              <p style="margin:0;
                color:#aaa;font-size:12px;
                line-height:1.8">
                © 2025 Missa Shop
                <br>
                <a href="${unsubUrl}"
                  style="color:#aaa">
                  Se désabonner
                </a>
                {' · '}
                <a href="${process.env
                  .NEXT_PUBLIC_SITE_URL}"
                  style="color:#aaa">
                  Visiter le shop
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
