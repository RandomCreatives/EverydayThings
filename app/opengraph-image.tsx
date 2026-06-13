import { ImageResponse } from 'next/og';

export const size = {
  width: 1200,
  height: 630
};

export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#ffffff',
          color: '#050505',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 54,
          fontFamily: 'monospace',
          border: '24px solid #050505'
        }}
      >
        <div style={{ display: 'flex', fontSize: 26, letterSpacing: 8 }}>ARCHIVE • PROJECTS • ABOUT & CONTACT</div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 92, letterSpacing: 12, lineHeight: 1 }}>MINIMAL PHOTO ARCHIVE</div>
          <div style={{ display: 'flex', marginTop: 28, fontSize: 26, letterSpacing: 6, color: '#555555' }}>
            MONOCHROME FIELD PHOTOGRAPHS / PRINT SHOP
          </div>
        </div>
        <div style={{ display: 'flex', fontSize: 24, letterSpacing: 7, color: '#555555' }}>[ ORDER PRINT BY IMAGE CODE ]</div>
      </div>
    ),
    size
  );
}
