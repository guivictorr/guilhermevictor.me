'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { usePlayer } from './root';
const lights = [
  {
    color: 'violet',
    degree: -35,
    delay: 0.6,
  },
  {
    color: 'blue',
    degree: 35,
    delay: 0,
  },
  {
    color: 'green',
    degree: -15,
    delay: 0.9,
  },
  {
    color: 'yellow',
    degree: 15,
    delay: 0.8,
  },
  {
    color: 'orange',
    degree: -25,
    delay: 0,
  },
  {
    color: 'red',
    degree: 25,
    delay: 0.2,
  },
];

export const Lights = () => {
  const { isPlaying } = usePlayer();
  return (
    <AnimatePresence mode='wait'>
      {isPlaying && (
        <>
          {lights.map((light, index) => (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2 }}
              key={window.crypto.randomUUID()}
              className='absolute -bottom-10 z-50 pointer-events-none'
              style={{
                left: 25 + (index + 1) * 10,
                mixBlendMode: 'lighten',
              }}
            >
              <motion.svg
                width='138'
                height='173'
                viewBox='0 0 138 173'
                fill='none'
                xmlns='http://www.w3.org/2000/svg'
                className='animate-light origin-bottom brightness-150'
                initial={{ rotate: light.degree }}
                animate={{ rotate: -light.degree }}
                transition={{
                  duration: 2,
                  delay: light.delay,
                  repeat: Infinity,
                  repeatType: 'mirror',
                  ease: 'easeInOut',
                }}
              >
                <g filter='url(#filter0_f_53_17)'>
                  <mask
                    id='mask0_53_17'
                    style={{ maskType: 'alpha' }}
                    maskUnits='userSpaceOnUse'
                    x='35'
                    y='16'
                    width='73'
                    height='140'
                  >
                    <path
                      d='M35.3354 30.2163L64.0408 155.329L73.0293 155.785L107.743 33.8852C103.51 28.4974 90.2453 17.5788 71.0497 17.0067C51.854 16.4346 39.242 25.5747 35.3354 30.2163Z'
                      fill='url(#paint0_linear_53_17)'
                    />
                  </mask>
                  <g mask='url(#mask0_53_17)'>
                    <mask
                      id='mask1_53_17'
                      style={{ maskType: 'alpha' }}
                      maskUnits='userSpaceOnUse'
                      x='33'
                      y='-47'
                      width='73'
                      height='203'
                    >
                      <path
                        d='M33.1924 -24.561L70.4046 155.53L79.4039 155.42L105.687 -25.4505C101.095 -32.9474 87.1121 -47.7362 67.9207 -46.916C48.7293 -46.0957 36.7721 -31.6709 33.1924 -24.561Z'
                        fill='url(#paint1_diamond_53_17)'
                      />
                    </mask>
                    <g mask='url(#mask1_53_17)'>
                      <path
                        d='M33.8914 32.469L70.4039 155.53L79.4033 155.42L106.386 31.5796C101.823 26.4685 87.8984 16.4052 68.7048 17.0407C49.5111 17.6763 37.4985 27.5911 33.8914 32.469Z'
                        fill={light.color}
                        fillOpacity='0.3'
                      />
                    </g>
                  </g>
                </g>
                <defs>
                  <filter
                    id='filter0_f_53_17'
                    x='27.3354'
                    y='9.01202'
                    width='86.3514'
                    height='154.518'
                    filterUnits='userSpaceOnUse'
                    colorInterpolationFilters='sRGB'
                  >
                    <feFlood floodOpacity='0' result='BackgroundImageFix' />
                    <feBlend
                      mode='normal'
                      in='SourceGraphic'
                      in2='BackgroundImageFix'
                      result='shape'
                    />
                    <feGaussianBlur
                      stdDeviation='6'
                      result='effect1_foregroundBlur_53_17'
                    />
                  </filter>
                  <linearGradient
                    id='paint0_linear_53_17'
                    x1='74.965'
                    y1='-100.18'
                    x2='65.2892'
                    y2='155.393'
                    gradientUnits='userSpaceOnUse'
                  >
                    <stop
                      offset='0.469999'
                      stopColor={light.color}
                      stopOpacity='0'
                    />
                    <stop
                      offset='0.676759'
                      stopColor={light.color}
                      stopOpacity='0.5'
                    />
                    <stop offset='0.855' stopColor={light.color} />
                  </linearGradient>
                  <radialGradient
                    id='paint1_diamond_53_17'
                    cx='0'
                    cy='0'
                    r='1'
                    gradientUnits='userSpaceOnUse'
                    gradientTransform='translate(71.7499 -96.3269) rotate(90.0217) scale(251.842 41.1757)'
                  >
                    <stop offset='0.905' stopColor={light.color} />
                    <stop
                      offset='1'
                      stopColor={light.color}
                      stopOpacity='0.05'
                    />
                    <stop offset='1' stopColor={light.color} stopOpacity='0' />
                    <stop offset='1' stopColor={light.color} stopOpacity='0' />
                  </radialGradient>
                </defs>
              </motion.svg>
            </motion.div>
          ))}
        </>
      )}
    </AnimatePresence>
  );
};
