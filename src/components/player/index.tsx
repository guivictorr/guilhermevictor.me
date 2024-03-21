import { getLatestPlayedTrack } from '@/services/spotify';
import { PlayerRoot } from './root';
import { LastUpdate } from './last-update';
import { Lights } from './lights';
import { Play } from './play';
import { Volume } from './volume';
import { Suspense } from 'react';

export const Player = async () => {
  const { track, played_at } = await getLatestPlayedTrack();
  const artists = track.artists.map(artist => artist.name).join(',');

  return (
    <div className='flex items-center gap-4 w-full'>
      <Suspense fallback='Carregando'>
        <PlayerRoot audioUrl={track.preview_url}>
          <Play />
          <Lights />

          <div className='ml-4 sm:ml-0'>
            <LastUpdate playedAt={played_at} />
            <p
              aria-description={`Last played song ${track.name} from ${artists}`}
              className='line-clamp-1'
            >
              {artists} - {track.name}
            </p>
          </div>

          <div className='ml-auto'>
            <Volume />
          </div>
        </PlayerRoot>
      </Suspense>
    </div>
  );
};
