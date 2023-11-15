'use client';
import { useEffect, useRef, useState } from 'react';

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
    audioRef.current.volume = 0.03;

    isPlaying ? audioRef.current.play() : audioRef.current.pause();
  }, [isPlaying]);

  if (audioUrl === null) return null;

  return (
    <>
      <audio ref={audioRef} src={audioUrl} onEnded={handleOnEndAudio} />

      <button
        aria-label={ariaLabel}
        className='w-4'
        type='button'
        onClick={toggleAudio}
      >
        {isPlaying ? <span>&#x23F9;</span> : <span>&#x23F5;</span>}
      </button>
    </>
  );
};
