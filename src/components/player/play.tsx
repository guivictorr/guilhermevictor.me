'use client';
import { FaCirclePause, FaCirclePlay } from 'react-icons/fa6';
import { usePlayer } from './player-provider';
import { PropsWithChildren } from 'react';

export const Play = ({
  children,
  hasPreviewUrl,
}: PropsWithChildren & { hasPreviewUrl: boolean }) => {
  const { togglePlayAndPause, isPlaying } = usePlayer();

  const ariaLabel = isPlaying
    ? 'Press to pause currently playing song'
    : 'Press to listen the latest played song';

  if (!hasPreviewUrl) {
    return children;
  }

  return (
    <button
      aria-label={ariaLabel}
      className='flex items-center gap-2 p-1 [&>svg]:w-3 text-lowContrast'
      type='button'
      onClick={togglePlayAndPause}
    >
      {isPlaying ? <FaCirclePause /> : <FaCirclePlay />}
      {children}
    </button>
  );
};
