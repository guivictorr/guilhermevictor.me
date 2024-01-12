'use client';
import { useEffect, useRef, useState } from 'react';
import { IoMdPause, IoMdPlay } from 'react-icons/io';
import { Lights } from './lights';
import { AnimatePresence } from 'framer-motion';

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

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = 0.1;

    isPlaying ? audioRef.current.play() : audioRef.current.pause();
  }, [isPlaying]);

  if (audioUrl === null) return null;

  return (
    <>
      <AnimatePresence mode='wait'>{isPlaying && <Lights />}</AnimatePresence>
      <audio ref={audioRef} src={audioUrl} onEnded={handleOnEndAudio} />

      <button
        aria-label={ariaLabel}
        className='w-2 sm:w-4'
        type='button'
        onClick={toggleAudio}
      >
        {isPlaying ? <IoMdPause /> : <IoMdPlay />}
      </button>
    </>
  );
};
