'use client';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion } from 'framer-motion';

import { SpotifySong } from '@/services/spotify';
import { Play } from './play';
import { useElementOnScreen } from '@/seo/hooks/useElementOnScreen';

const LastUpdate = dynamic(() => import('./last-update'), {
  ssr: false,
  loading: () => <p className='text-xs text-secondary/40'>Loading...</p>,
});

type FloatingPlayer = {
  track: SpotifySong['track'];
  playedAt: string;
  artists: string;
  hasPreviewUrl: boolean;
};

export const FloatingPlayer = ({
  artists,
  playedAt,
  track,
  hasPreviewUrl,
}: FloatingPlayer) => {
  const [containerRef, isVisible] = useElementOnScreen({
    root: null,
    rootMargin: '0px',
    threshold: 0.1,
  });

  return (
    <>
      <div
        id='player'
        ref={containerRef}
        className='w-5 h-20 absolute bottom-0 z-50 pointer-events-none'
      ></div>
      <AnimatePresence mode='wait'>
        {!isVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className='flex items-center gap-4 fixed w-[90%] sm:w-auto sm:min-w-72 bottom-6 md:left-6 md:translate-x-0 left-1/2 -translate-x-1/2 p-3 border-lowContrast/10 border bg-background rounded-xl z-20'
          >
            {hasPreviewUrl && <Play />}
            <div className='ml-4 sm:ml-0 text-ellipsis overflow-hidden max-w-xs '>
              <LastUpdate playedAt={playedAt} />
              <p
                aria-description={`Last played song ${track.name} from ${artists}`}
                className='truncate text-sm'
              >
                {artists} - {track.name}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
