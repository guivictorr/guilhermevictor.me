'use client';
import * as Slider from '@radix-ui/react-slider';
import { usePlayer } from './root';
import { useState } from 'react';
import {
  IoIosVolumeHigh,
  IoIosVolumeLow,
  IoIosVolumeMute,
} from 'react-icons/io';

export const MAX_VOLUME = 0.3;

export const Volume = () => {
  const [volume, setVolume] = useState(MAX_VOLUME);
  const { handleVolumeChange } = usePlayer();

  return (
    <div className='sm:flex items-center group hidden'>
      <button
        type='button'
        aria-label='Mute volume'
        onClick={() => {
          const newVolume = volume === 0 ? MAX_VOLUME : 0;
          handleVolumeChange(newVolume);
          setVolume(newVolume);
        }}
        className='[&>svg]:w-6 [&>svg]:h-6 group-hover:text-primary'
      >
        {volume === 0 ? (
          <IoIosVolumeMute />
        ) : volume > MAX_VOLUME / 2 ? (
          <IoIosVolumeHigh />
        ) : (
          <IoIosVolumeLow />
        )}
      </button>
      <Slider.Root
        min={0}
        max={MAX_VOLUME}
        step={0.01}
        value={[volume]}
        defaultValue={[volume]}
        onValueChange={value => {
          handleVolumeChange(value[0]);
          setVolume(value[0]);
        }}
        className='relative flex p-2 items-center select-none touch-none w-[100px] h-5 transition'
      >
        <Slider.Track className='bg-lowContrast relative grow rounded-full h-[4px]'>
          <Slider.Range className='group-hover:bg-primary bg-secondary absolute rounded-full h-full' />
        </Slider.Track>
        <Slider.Thumb className='block w-3 h-3 bg-primary rounded-full cursor-pointer hover:brightness-90 group-active:bg-primary scale-0 group-hover:scale-100 group-active:scale-125 transition focus-visible:ring-0 focus-visible:rounded-full focus-visible:ring-offset-0' />
      </Slider.Root>
    </div>
  );
};
