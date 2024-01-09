import { NextRequest } from 'next/server';
import { ImageResponse } from 'next/og';

export const runtime = 'edge';

const colors = {
  primary: '#FDDCBD',
  secondary: '#FDDCBDAA',
  background: '#180F0A',
};

export async function GET({ nextUrl }: NextRequest) {
  const { searchParams } = nextUrl;

  const title = searchParams.get('title');
  const description = searchParams.get('description');

  const geistFont = await fetch(
    new URL('GeistRegular.otf', import.meta.url),
  ).then(res => res.arrayBuffer());
  const playfairDisplayFont = await fetch(
    new URL('PlayfairDisplay.ttf', import.meta.url),
  ).then(res => res.arrayBuffer());

  return new ImageResponse(
    (
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
            lineHeight: '80%',
            fontFamily: '"Playfair"',
            fontWeight: 500,
          }}
        >
          {title}
        </p>
        <p
          style={{
            fontSize: 42,
            color: colors.secondary,
            lineHeight: '100%',
            fontFamily: '"Geist"',
            fontWeight: 400,
          }}
        >
          {description}
        </p>
      </div>
    ),
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
          name: 'Playfair',
          data: playfairDisplayFont,
          style: 'normal',
          weight: 500,
        },
      ],
    },
  );
}
