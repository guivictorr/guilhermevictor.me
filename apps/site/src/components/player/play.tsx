'use client';
import { IoIosPause, IoIosPlay } from 'react-icons/io';
import { usePlayer } from './player-provider';

export const Play = () => {
  const { togglePlayAndPause, isPlaying } = usePlayer();

  const ariaLabel = isPlaying
    ? 'Press to pause currently playing song'
    : 'Press to listen the latest played song';

  return (
    <button
      aria-label={ariaLabel}
      className='w-2 sm:w-4 [&>svg]:w-5 [&>svg]:h-5'
      type='button'
      onClick={togglePlayAndPause}
    >
      {isPlaying ? <IoIosPause /> : <IoIosPlay />}
    </button>
  );
};
