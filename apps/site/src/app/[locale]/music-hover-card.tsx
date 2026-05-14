'use client';

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/hover-card';
import { type LastFMSong } from '@/services/lastfm';
import { ArrowUpRightIcon } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import Image from 'next/image';

type MusicHoverCardProps = React.PropsWithChildren<{ track: LastFMSong }>;

export function MusicHoverCard({ track, children }: MusicHoverCardProps) {
  const t = useTranslations();
  const format = useFormatter();
  const playedAt = new Date(parseInt(track.date) * 1000);
  const timeAgo = format.relativeTime(playedAt, { now: new Date() });

  return (
    <HoverCard>
      <HoverCardTrigger
        delay={100}
        closeDelay={50}
        aria-label={t('home-page.a11y.music-trigger')}
        className='text-primary cursor-default hover:text-lowcontrast transition-colors'
      >
        {children}
      </HoverCardTrigger>
      <HoverCardContent
        side='top'
        align='center'
        className='w-72 p-0 overflow-hidden'
      >
        <a
          href={track.url}
          target='_blank'
          rel='noopener noreferrer'
          className='no-underline block'
        >
          <div className='flex gap-3 p-3 items-center'>
            <Image
              src={track.image}
              alt={track.song}
              width={56}
              height={56}
              className='size-14 rounded object-cover shrink-0'
            />
            <div className='flex flex-col min-w-0'>
              <p className='font-medium leading-tight flex items-center gap-0.5'>
                <span className='truncate text-sm'>{track.song}</span>
                <ArrowUpRightIcon
                  className='text-secondary shrink-0'
                  size={8}
                />
              </p>
              <p className='text-secondary text-xs mt-0.5 truncate'>
                {track.artist}
              </p>
            </div>
          </div>
          <div className='px-3 py-2 border-t border-secondary/10'>
            <p className='text-secondary/70 text-xs'>
              {t('home-page.last-played-song', { time: timeAgo })}
            </p>
          </div>
        </a>
      </HoverCardContent>
    </HoverCard>
  );
}
