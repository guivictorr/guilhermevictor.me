export function Noise() {
  return (
    <svg
      width='100%'
      height='100%'
      className='pointer-events-none fixed inset-0 opacity-5'
    >
      <filter id='noise'>
        <feTurbulence
          type='fractalNoise'
          result='turbulence'
          baseFrequency='0.8'
          numOctaves='4'
          seed='10'
          stitchTiles='stitch'
        />
        {/* <feDisplacementMap */}
        {/*   in2='turbulence' */}
        {/*   in='SourceGraphic' */}
        {/*   scale='50' */}
        {/*   xChannelSelector='R' */}
        {/*   yChannelSelector='G' */}
        {/* /> */}
      </filter>

      <rect width='100%' height='100%' filter='url(#noise)' />
    </svg>
  );
}
