'use client';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion } from 'framer-motion';

import { SpotifySong } from '@/services/spotify';
import { Play } from './play';
import { useElementOnScreen } from '@/seo/hooks/useElementOnScreen';
import { Lights } from './lights';

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
            className='flex justify-end fixed h-28 bottom-6 md:left-6 md:translate-x-0 md:w-auto w-[90%] left-1/2 -translate-x-1/2 z-20 bg-transparent overflow-hidden'
          >
            <div className='flex items-center h-fit w-full mt-auto gap-4 p-3 border-lowContrast/10 border bg-background rounded-xl z-30'>
              {hasPreviewUrl && <Play />}
              <Lights />
              <div className='ml-4 sm:ml-0 text-ellipsis overflow-hidden max-w-xs '>
                <LastUpdate playedAt={playedAt} />
                <p
                  aria-description={`Last played song ${track.name} from ${artists}`}
                  className='truncate text-sm'
                >
                  {artists} - {track.name}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
