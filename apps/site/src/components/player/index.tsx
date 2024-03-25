import dynamic from 'next/dynamic';
import { getLatestPlayedTrack } from '@/services/spotify';
import { PlayerRoot } from './root';
import { Lights } from './lights';
import { Play } from './play';
import { Volume } from './volume';
import { FloatingPlayer } from './floating-player';

const LastUpdate = dynamic(() => import('./last-update'), {
  ssr: false,
  loading: () => <p className='text-xs text-secondary/40'>Loading...</p>,
});

export const Player = async () => {
  const result = await getLatestPlayedTrack();

  if (result === null) {
    return null;
  }
  const { track, played_at } = result;

  const artists = track.artists.map(artist => artist.name).join(',');
  const hasPreviewUrl = track.preview_url !== null;

  return (
    <div className='flex items-center gap-4 w-full'>
      <PlayerRoot audioUrl={track.preview_url}>
        {hasPreviewUrl && <Play />}
        <Lights />

        <FloatingPlayer
          hasPreviewUrl={hasPreviewUrl}
          playedAt={played_at}
          track={track}
          artists={artists}
        />

        <div className='ml-4 sm:ml-0'>
          <LastUpdate playedAt={played_at} />
          <p
            aria-description={`Last played song ${track.name} from ${artists}`}
            className='line-clamp-1'
          >
            {artists} - {track.name}
          </p>
        </div>

        {hasPreviewUrl && (
          <div className='ml-auto'>
            <Volume />
          </div>
        )}
      </PlayerRoot>
    </div>
  );
};
