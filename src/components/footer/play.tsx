'use client';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { IoMdPause, IoMdPlay } from 'react-icons/io';
import * as Slider from '@radix-ui/react-slider';
import { Lights } from './lights';

type PlayProps = {
  audioUrl: string;
};

export const Play = ({ audioUrl }: PlayProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
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
  };

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = 0.5;

    isPlaying ? audioRef.current.play() : audioRef.current.pause();
  }, [isPlaying]);

  if (audioUrl === null) return null;

  return (
    <>
      {/* <AnimatePresence mode='wait'>{isPlaying && <Lights />}</AnimatePresence> */}
      <audio ref={audioRef} src={audioUrl} onEnded={handleOnEndAudio} />

      <button
        aria-label={ariaLabel}
        className='w-2 sm:w-4'
        type='button'
        onClick={toggleAudio}
      >
        {isPlaying ? <IoMdPause /> : <IoMdPlay />}
      </button>

      {isPlaying && (
        <Slider.Root
          min={0}
          max={0.5}
          step={0.01}
          defaultValue={audioRef.current ? [audioRef.current.volume] : [0.5]}
          onValueChange={value => handleVolumeChange(value[0])}
          className='relative flex items-center select-none touch-none w-[100px] h-5 transition group'
        >
          <Slider.Track className='bg-lowContrast relative grow rounded-full h-[3px]'>
            <Slider.Range className='bg-secondary absolute rounded-full h-full' />
          </Slider.Track>
          <Slider.Thumb className='block w-3 h-3 bg-secondary rounded-full cursor-pointer hover:brightness-90 active:bg-primary active:scale-125 transition focus-visible:ring-0 focus-visible:rounded-full focus-visible:ring-offset-0' />
        </Slider.Root>
      )}
    </>
  );
};
