'use client';

export function Noise() {
  return (
    <svg
      width='100%'
      height='100%'
      className='pointer-events-none fixed inset-0 z-30 opacity-[var(--noise-opacity)]'
    >
      <filter id='noise'>
        <feTurbulence
          type='fractalNoise'
          result='turbulence'
          baseFrequency='0.5'
          numOctaves='2'
        >
          <animate
            attributeName='seed'
            from='0'
            to='30'
            dur='1s'
            repeatCount='indefinite'
          />
        </feTurbulence>
      </filter>
      <rect width='100%' height='100%' filter='url(#noise)' />
    </svg>
  );
}
