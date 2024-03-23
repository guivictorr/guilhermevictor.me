'use client';
import {
  PropsWithChildren,
  useEffect,
  useRef,
  useState,
  createContext,
  useContext,
} from 'react';
import { MAX_VOLUME } from './volume';

type PlayerRootProps = {
  audioUrl: string;
} & PropsWithChildren;

type PlayerContextProps = {
  handleVolumeChange: (volume: number) => void;
  togglePlayAndPause: () => void;
  isPlaying: boolean;
};

const PlayerContext = createContext<PlayerContextProps | undefined>(undefined);

export const usePlayer = () => {
  const context = useContext(PlayerContext);

  if (!context) {
    throw new Error('cant use usePlayer outside a PlayerProvider');
  }

  return context;
};

export const PlayerRoot = ({ audioUrl, children }: PlayerRootProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handleOnEndAudio = () => {
    setIsPlaying(false);
  };

  const handleVolumeChange = (volume: number) => {
    if (!audioRef.current) return;
    audioRef.current.volume = volume;
  };

  const togglePlayAndPause = () => {
    setIsPlaying(prevState => !prevState);
  };

  useEffect(() => {
    if (!audioRef.current) return;

    if (audioRef.current.volume === 1) {
      audioRef.current.volume = MAX_VOLUME;
    }

    isPlaying ? audioRef.current.play() : audioRef.current.pause();
  }, [isPlaying]);

  return (
    <PlayerContext.Provider
      value={{ isPlaying, handleVolumeChange, togglePlayAndPause }}
    >
      <audio ref={audioRef} src={audioUrl} onEnded={handleOnEndAudio} />
      {children}
    </PlayerContext.Provider>
  );
};
