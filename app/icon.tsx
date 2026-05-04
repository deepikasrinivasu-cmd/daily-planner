import { ImageResponse } from 'next/og'

export const size = { width: 512, height: 512 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: 512,
        height: 512,
        background: '#1E1B4B',
        borderRadius: 115,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
      }}
    >
      {/* House emoji */}
      <div style={{ fontSize: 240, lineHeight: 1, display: 'flex' }}>🏠</div>

      {/* Colourful dot row — app theme colours */}
      <div style={{ display: 'flex', gap: 14 }}>
        {['#FFD60A', '#FF6B6B', '#4ECDC4', '#FF9F1C', '#A855F7'].map((c) => (
          <div
            key={c}
            style={{ width: 20, height: 20, borderRadius: 10, background: c }}
          />
        ))}
      </div>
    </div>,
    { ...size }
  )
}
