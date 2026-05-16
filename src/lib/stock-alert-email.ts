export function getLowStockEmail(
  alerts: {
    productName: string
    productId: string
    currentStock: number
    threshold: number
    image?: string
    type: 'low_stock' | 'out_of_stock'
  }[]
): { subject: string; html: string } {

  const outOfStock = alerts.filter(
    a => a.type === 'out_of_stock'
  )
  const lowStock = alerts.filter(
    a => a.type === 'low_stock'
  )

  const subject = outOfStock.length > 0
    ? `🚨 ${outOfStock.length} produit(s) EN RUPTURE — Missa Shop`
    : `⚠️ ${lowStock.length} produit(s) en stock bas — Missa Shop`

  const productRows = alerts.map(a => `
    <tr>
      <td style="padding:12px 16px;
        border-bottom:1px solid #1f2937">
        <div style="display:flex;
          align-items:center;gap:12px">
          ${a.image ? `
            <img src="${a.image}"
              width="48" height="48"
              style="border-radius:10px;
                object-fit:cover;
                flex-shrink:0"
            />
          ` : `
            <div style="width:48px;
              height:48px;
              background:#374151;
              border-radius:10px;
              flex-shrink:0">
            </div>
          `}
          <div>
            <p style="margin:0;
              color:#ffffff;
              font-weight:700;
              font-size:14px">
              ${a.productName}
            </p>
            <p style="margin:4px 0 0;
              color:#9ca3af;
              font-size:12px">
              Seuil d'alerte: ${a.threshold}
            </p>
          </div>
        </div>
      </td>
      <td style="padding:12px 16px;
        border-bottom:1px solid #1f2937;
        text-align:center">
        <span style="
          display:inline-block;
          padding:4px 12px;
          border-radius:999px;
          font-weight:900;
          font-size:13px;
          ${a.type === 'out_of_stock'
            ? 'background:#7f1d1d;color:#fca5a5'
            : 'background:#78350f;color:#fcd34d'
          }">
          ${a.type === 'out_of_stock'
            ? '❌ RUPTURE'
            : `⚠️ ${a.currentStock} restants`
          }
        </span>
      </td>
      <td style="padding:12px 16px;
        border-bottom:1px solid #1f2937;
        text-align:right">
        <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://missashop.com'}/admin/products/${a.productId}/edit"
          style="display:inline-block;
            background:#FF6B35;
            color:#ffffff;
            font-weight:700;
            font-size:12px;
            text-decoration:none;
            padding:8px 16px;
            border-radius:8px">
          Gérer →
        </a>
      </td>
    </tr>
  `).join('')

  return {
    subject,
    html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;
  background:#111827;
  font-family:'Helvetica Neue',
    Arial,sans-serif">
  <table width="100%" cellpadding="0"
    cellspacing="0"
    style="padding:32px 16px">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0"
          cellspacing="0"
          style="background:#1f2937;
            border-radius:20px;
            overflow:hidden">

          <!-- Header -->
          <tr>
            <td style="background:
              ${outOfStock.length > 0
                ? 'linear-gradient(135deg,#991b1b,#dc2626)'
                : 'linear-gradient(135deg,#92400e,#d97706)'
              };
              padding:32px 40px;
              text-align:center">
              <p style="font-size:40px;
                margin:0 0 12px">
                ${outOfStock.length > 0 
                  ? '🚨' : '⚠️'}
              </p>
              <h1 style="margin:0;
                color:#ffffff;
                font-size:22px;
                font-weight:900">
                ${outOfStock.length > 0
                  ? 'ALERTE RUPTURE DE STOCK'
                  : 'ALERTE STOCK BAS'
                }
              </h1>
              <p style="margin:8px 0 0;
                color:rgba(255,255,255,0.8);
                font-size:14px">
                ${alerts.length} produit(s) 
                nécessitent votre attention
              </p>
            </td>
          </tr>

          <!-- Summary badges -->
          <tr>
            <td style="padding:24px 40px;
              background:#111827">
              <table width="100%">
                <tr>
                  ${outOfStock.length > 0 ? `
                    <td style="text-align:center;
                      padding:16px;
                      background:#1f2937;
                      border-radius:12px">
                      <p style="margin:0;
                        font-size:32px;
                        font-weight:900;
                        color:#fca5a5">
                        ${outOfStock.length}
                      </p>
                      <p style="margin:4px 0 0;
                        color:#9ca3af;
                        font-size:12px">
                        En rupture
                      </p>
                    </td>
                  ` : ''}
                  ${lowStock.length > 0 ? `
                    <td style="text-align:center;
                      padding:16px;
                      background:#1f2937;
                      border-radius:12px;
                      ${outOfStock.length > 0 
                        ? 'padding-left:8px' 
                        : ''}">
                      <p style="margin:0;
                        font-size:32px;
                        font-weight:900;
                        color:#fcd34d">
                        ${lowStock.length}
                      </p>
                      <p style="margin:4px 0 0;
                        color:#9ca3af;
                        font-size:12px">
                        Stock bas
                      </p>
                    </td>
                  ` : ''}
                </tr>
              </table>
            </td>
          </tr>

          <!-- Products table -->
          <tr>
            <td style="padding:0 24px 24px">
              <table width="100%"
                style="background:#111827;
                  border-radius:12px;
                  overflow:hidden">
                <thead>
                  <tr style="background:#374151">
                    <th style="padding:12px 16px;
                      text-align:left;
                      color:#9ca3af;
                      font-size:11px;
                      font-weight:700;
                      text-transform:uppercase;
                      letter-spacing:0.05em">
                      Produit
                    </th>
                    <th style="padding:12px 16px;
                      text-align:center;
                      color:#9ca3af;
                      font-size:11px;
                      font-weight:700;
                      text-transform:uppercase;
                      letter-spacing:0.05em">
                      Statut
                    </th>
                    <th style="padding:12px 16px;
                      text-align:right;
                      color:#9ca3af;
                      font-size:11px;
                      font-weight:700;
                      text-transform:uppercase;
                      letter-spacing:0.05em">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  ${productRows}
                </tbody>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:0 40px 40px;
              text-align:center">
              <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://missashop.com'}/admin/inventaire"
                style="display:inline-block;
                  background:#FF6B35;
                  color:#ffffff;
                  font-weight:900;
                  font-size:15px;
                  text-decoration:none;
                  padding:16px 40px;
                  border-radius:14px;
                  box-shadow:0 8px 24px 
                    rgba(255,107,53,0.4)">
                📦 Voir l'inventaire complet →
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#111827;
              padding:20px 40px;
              text-align:center;
              border-top:1px solid #374151">
              <p style="margin:0;
                color:#6b7280;
                font-size:12px">
                © 2025 Missa Shop Admin · 
                Alerte automatique
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
