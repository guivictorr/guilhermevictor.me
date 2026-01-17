import { NextRequest } from 'next/server';
import { ImageResponse } from 'next/og';

export const runtime = 'edge';

const colors = {
  primary: '#FDDCBD',
  secondary: '#D1BAA2',
  background: '#261911',
};

export async function GET({ nextUrl }: NextRequest) {
  const { searchParams } = nextUrl;

  const title = searchParams.get('title');

  const geistFont = await fetch(
    new URL('GeistRegular.otf', import.meta.url),
  ).then(res => res.arrayBuffer());
  const serifFont = await fetch(
    new URL('InstrumentSerif.ttf', import.meta.url),
  ).then(res => res.arrayBuffer());

  return new ImageResponse(
    <div
      style={{
        background: colors.background,
        color: colors.primary,
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        paddingBottom: 112,
        paddingLeft: 42,
      }}
    >
      <p
        style={{
          position: 'absolute',
          fontSize: 24,
          top: 24,
          left: 24,
          fontFamily: '"Geist"',
        }}
      >
        Guilherme Victor
      </p>
      <p
        style={{
          fontSize: 98,
          lineHeight: '90%',
          fontFamily: '"Serif"',
          fontWeight: 500,
        }}
      >
        {title}
      </p>
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: 'Geist',
          data: geistFont,
          style: 'normal',
          weight: 400,
        },
        {
          name: 'Serif',
          data: serifFont,
          style: 'normal',
          weight: 500,
        },
      ],
    },
  );
}
