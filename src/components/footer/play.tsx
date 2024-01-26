'use client';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import * as Popover from '@radix-ui/react-popover';
import {
  IoIosPause,
  IoIosPlay,
  IoIosVolumeHigh,
  IoIosVolumeOff,
} from 'react-icons/io';
import * as Slider from '@radix-ui/react-slider';

type PlayProps = {
  audioUrl: string;
};

export const Play = ({ audioUrl }: PlayProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const ariaLabel = isPlaying
    ? 'Pause currently playing song'
    : 'Listen the latest played song';

  const toggleAudio = () => {
    setIsPlaying(prevState => !prevState);
  };

  const handleOnEndAudio = () => {
    setIsPlaying(false);
  };

  const handleVolumeChange = (volume: number) => {
    if (!audioRef.current) return;
    audioRef.current.volume = volume;
    setVolume(volume);
  };

  useEffect(() => {
    if (!audioRef.current) return;

    audioRef.current.volume = volume;
    isPlaying ? audioRef.current.play() : audioRef.current.pause();
  }, [isPlaying, volume]);

  if (audioUrl === null) return null;

  return (
    <>
      {/* <AnimatePresence mode='wait'>{isPlaying && <Lights />}</AnimatePresence> */}
      <audio ref={audioRef} src={audioUrl} onEnded={handleOnEndAudio} />

      <button
        aria-label={ariaLabel}
        className='w-2 sm:w-4 [&>svg]:scale-150'
        type='button'
        onClick={toggleAudio}
      >
        {isPlaying ? <IoIosPause /> : <IoIosPlay />}
      </button>
      <Popover.Root open={isTooltipOpen}>
        <Popover.Trigger
          aria-label='Volume Slider'
          className='w-2 sm:w-4 [&>svg]:scale-150'
          type='button'
          onClick={() => {
            handleVolumeChange(volume === 0 ? 0.2 : 0);
          }}
          onMouseOver={() => setIsTooltipOpen(true)}
          onMouseOut={() => setIsTooltipOpen(false)}
        >
          {volume === 0 ? <IoIosVolumeOff /> : <IoIosVolumeHigh />}
        </Popover.Trigger>
        <AnimatePresence>
          {isTooltipOpen && (
            <Popover.Content
              forceMount
              onMouseOver={() => setIsTooltipOpen(true)}
              onMouseOut={() => setIsTooltipOpen(false)}
              onEscapeKeyDown={() => setIsTooltipOpen(false)}
              className='px-6 py-2'
              asChild
            >
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
                  onValueChange={value => handleVolumeChange(value[0])}
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
    </>
  );
};
