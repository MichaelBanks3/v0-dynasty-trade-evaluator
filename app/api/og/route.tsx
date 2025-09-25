import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const title = searchParams.get('title') || 'Dynasty Trade Evaluator'
    const description = searchParams.get('description') || 'Evaluate fantasy football dynasty trades'

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0f172a',
            backgroundImage: 'linear-gradient(45deg, #1e293b 0%, #334155 100%)',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '20px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              maxWidth: '800px',
              margin: '0 40px',
            }}
          >
            <div
              style={{
                fontSize: '48px',
                fontWeight: 'bold',
                color: '#1e293b',
                textAlign: 'center',
                marginBottom: '20px',
                lineHeight: '1.2',
              }}
            >
              {title}
            </div>
            <div
              style={{
                fontSize: '24px',
                color: '#64748b',
                textAlign: 'center',
                lineHeight: '1.4',
                marginBottom: '30px',
              }}
            >
              {description}
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '20px',
                color: '#3b82f6',
                fontWeight: '600',
              }}
            >
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  backgroundColor: '#3b82f6',
                  borderRadius: '50%',
                }}
              />
              Dynasty Trade Evaluator
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  } catch (error) {
    console.error('Error generating OG image:', error)
    return new Response('Failed to generate image', { status: 500 })
  }
}
