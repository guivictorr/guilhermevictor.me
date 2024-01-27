'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { IoIosVolumeHigh, IoIosVolumeOff } from 'react-icons/io';
import * as Popover from '@radix-ui/react-popover';
import * as Slider from '@radix-ui/react-slider';
import { usePlayer } from './root';
import { useState } from 'react';

export const Volume = () => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [volume, setVolume] = useState(0.4);
  const { handleVolumeChange } = usePlayer();

  return (
    <Popover.Root onOpenChange={setIsPopoverOpen} open={isPopoverOpen}>
      <Popover.Trigger
        aria-label='Press enter or space to open the volume control'
        className='w-2 sm:w-4 [&>svg]:scale-150'
        type='button'
      >
        {volume === 0 ? <IoIosVolumeOff /> : <IoIosVolumeHigh />}
      </Popover.Trigger>
      <AnimatePresence>
        {isPopoverOpen && (
          <Popover.Content forceMount className='px-6 py-2' asChild>
            <motion.div
              initial={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              exit={{ opacity: 0, translateY: -10 }}
              transition={{ duration: 0.1 }}
            >
              <Slider.Root
                min={0}
                max={0.4}
                step={0.01}
                orientation='vertical'
                value={[volume]}
                defaultValue={[volume]}
                onValueChange={value => {
                  handleVolumeChange(value[0]);
                  setVolume(value[0]);
                }}
                className='relative flex flex-col items-center select-none touch-none h-[70px] w-5 transition group'
              >
                <Slider.Track className='bg-lowContrast relative grow rounded-full w-[3px]'>
                  <Slider.Range className='bg-secondary absolute rounded-full w-full' />
                </Slider.Track>
                <Slider.Thumb className='block w-3 h-3 bg-secondary rounded-full cursor-pointer hover:brightness-90 group-active:bg-primary group-active:scale-125 transition focus-visible:ring-0 focus-visible:rounded-full focus-visible:ring-offset-0' />
              </Slider.Root>
            </motion.div>
          </Popover.Content>
        )}
      </AnimatePresence>
    </Popover.Root>
  );
};
