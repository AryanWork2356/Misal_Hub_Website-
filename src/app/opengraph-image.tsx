import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const alt = 'Misal Hub – authentic Misal Pav, Mira Road East';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/** Link-preview card (WhatsApp, Facebook, X, LinkedIn, Google Discover). */
export default async function OpengraphImage() {
  const logo = `data:image/png;base64,${(await readFile(join(process.cwd(), 'public/images/logo-round.png'))).toString('base64')}`;
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', padding: '0 80px', background: 'linear-gradient(135deg,#1b0d05 0%,#3a1c0b 60%,#5a2c0f 100%)', color: '#FFB067', fontFamily: 'sans-serif' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo} width={330} height={330} alt="" style={{ borderRadius: 40, border: '4px solid #FF8A1F' }} />
        <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 64 }}>
          <div style={{ fontSize: 86, fontWeight: 800, color: '#FF8A1F', lineHeight: 1.05 }}>Misal Hub</div>
          <div style={{ fontSize: 40, marginTop: 18, color: '#FFE0B8' }}>Authentic Misal Pav</div>
          <div style={{ fontSize: 30, marginTop: 8, color: '#FFB067' }}>Mira Road East · Since 2015</div>
          <div style={{ display: 'flex', marginTop: 40 }}>
            <div style={{ background: '#FF8A1F', color: '#2A1206', fontSize: 28, fontWeight: 700, padding: '14px 30px', borderRadius: 50 }}>Order online</div>
            <div style={{ border: '3px solid #FF8A1F', color: '#FFB067', fontSize: 28, fontWeight: 700, padding: '11px 30px', borderRadius: 50, marginLeft: 20 }}>Franchise</div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
