'use client';

import * as Slider from '@radix-ui/react-slider';
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useTransform,
} from 'motion/react';
import { useState } from 'react';

export function TextReveal() {
  const [debug, setDebug] = useState(false);
  const sliderMotionValue = useMotionValue(0);
  const radialGradientValue = useTransform(
    sliderMotionValue,
    [0, 100],
    ['-300%', '40%'],
  );
  const radialGradient = useMotionTemplate`radial-gradient(circle at 50% ${radialGradientValue}, rgba(var(--color-primary)) 30%, rgba(0,0,0,0) 80%)`;

  return (
    <motion.div
      className='flex flex-col items-center justify-center'
      style={{
        backgroundImage: radialGradient,
        backgroundClip: debug ? 'initial' : 'text',
      }}
    >
      {/* <pre className='!my-0'> */}
      {/*   <motion.code className='text-primary tabular-nums'> */}
      {/*     {radialGradient} */}
      {/*   </motion.code> */}
      {/* </pre> */}
      <p
        className='text-3xl md:text-6xl font-bold'
        style={{
          WebkitTextFillColor: 'transparent',
          WebkitTextStrokeColor: 'var(--color-primary)',
          WebkitTextStroke: debug ? 1 : 0,
        }}
      >
        Text Reveal
      </p>

      <button
        aria-pressed={debug}
        onClick={() => setDebug(prev => !prev)}
        className='absolute bottom-4 right-4 text-sm aria-pressed:bg-primary aria-pressed:text-background bg-background border rounded-full py-1 px-2 text-primary'
      >
        Modo debug
      </button>
      <Slider.Root
        className='relative flex h-5 w-[200px] touch-none select-none items-center'
        onValueChange={value => sliderMotionValue.set(value[0])}
        defaultValue={[0]}
        max={100}
        step={1}
      >
        <Slider.Track className='relative h-[3px] grow rounded-full bg-lowcontrast/50'>
          <Slider.Range className='absolute h-full rounded-full bg-primary' />
        </Slider.Track>
        <Slider.Thumb className='block size-5 rounded-full bg-primary' />
      </Slider.Root>
      <span className='text-sm text-lowcontrast'>Deslize para animar</span>
    </motion.div>
  );
}
