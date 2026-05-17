import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 
            'linear-gradient(135deg,' +
            ' #1a1a2e 0%,' +
            ' #16213e 50%,' +
            ' #0f3460 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background circles */}
        <div style={{
          position: 'absolute',
          top: '-100px',
          right: '-100px',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 
            'rgba(249,115,22,0.15)',
          display: 'flex',
        }}/>
        <div style={{
          position: 'absolute',
          bottom: '-150px',
          left: '-100px',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 
            'rgba(34,197,94,0.1)',
          display: 'flex',
        }}/>

        {/* Logo area */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '24px',
        }}>
          {/* Icon */}
          <div style={{
            width: '80px',
            height: '80px',
            background: '#F97316',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '40px',
          }}>
            🛍️
          </div>
          {/* Name */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
          }}>
            <span style={{
              fontSize: '72px',
              fontWeight: 900,
              color: 'white',
              letterSpacing: '-2px',
              lineHeight: 1,
              display: 'flex',
            }}>
              <span style={{
                color: '#F97316'
              }}>
                Missa
              </span>
              <span style={{
                color: '#22C55E'
              }}>
                Shop
              </span>
            </span>
          </div>
        </div>

        {/* Tagline */}
        <p style={{
          fontSize: '28px',
          color: 'rgba(255,255,255,0.8)',
          margin: '0 0 40px 0',
          letterSpacing: '4px',
          textTransform: 'uppercase',
          display: 'flex',
        }}>
          MODE &amp; LIFESTYLE PREMIUM
        </p>

        {/* Pills */}
        <div style={{
          display: 'flex',
          gap: '16px',
          marginBottom: '40px',
        }}>
          {[
            '🚚 Livraison Canada',
            '🔒 Paiement sécurisé',
            '↩️ Retour 30 jours',
          ].map((text) => (
            <div key={text} style={{
              background: 
                'rgba(255,255,255,0.1)',
              border: 
                '1px solid rgba(255,255,255,0.2)',
              borderRadius: '50px',
              padding: '10px 24px',
              color: 'white',
              fontSize: '18px',
              display: 'flex',
            }}>
              {text}
            </div>
          ))}
        </div>

        {/* URL */}
        <p style={{
          fontSize: '22px',
          color: '#F97316',
          fontWeight: 700,
          display: 'flex',
        }}>
          www.missashopp.com
        </p>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
