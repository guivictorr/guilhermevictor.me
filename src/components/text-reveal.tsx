'use client';

import * as Slider from '@radix-ui/react-slider';
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useTransform,
} from 'motion/react';

export function TextReveal() {
  const sliderMotionValue = useMotionValue(0);
  const radialGradientValue = useTransform(
    sliderMotionValue,
    [0, 100],
    ['-70vh', '10vh'],
  );
  const radialGradient = useMotionTemplate`radial-gradient(circle at 50% ${radialGradientValue}, rgba(var(--color-primary)) 40%, rgba(0,0,0,0) 80%)`;

  return (
    <motion.div
      className='flex flex-col items-center justify-center'
      style={{
        backgroundImage: radialGradient,
        backgroundClip: 'text',
      }}
    >
      <p className='text-6xl' style={{ WebkitTextFillColor: 'transparent' }}>
        Text Reveal
      </p>

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
    </motion.div>
  );
}
