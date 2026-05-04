import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: 180,
        height: 180,
        background: '#1E1B4B',
        borderRadius: 40,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
      }}
    >
      <div style={{ fontSize: 86, lineHeight: 1, display: 'flex' }}>🏠</div>
      <div style={{ display: 'flex', gap: 6 }}>
        {['#FFD60A', '#FF6B6B', '#4ECDC4', '#FF9F1C', '#A855F7'].map((c) => (
          <div
            key={c}
            style={{ width: 8, height: 8, borderRadius: 4, background: c }}
          />
        ))}
      </div>
    </div>,
    { ...size }
  )
}
