import { getLatestPlayedTrack } from '@/services/spotify';
import { LastUpdate } from './last-update';
import { Play } from './play';

export const Player = async () => {
  const { track, played_at } = await getLatestPlayedTrack();
  const artists = track.artists.map(artist => artist.name).join(',');

  return (
    <div className='flex items-center gap-4'>
      <Play audioUrl={track.preview_url} />
      <div>
        <LastUpdate playedAt={played_at} />
        <p
          aria-description={`Last played song ${track.name} from ${artists}`}
          className='line-clamp-1'
        >
          {artists} - {track.name}
        </p>
      </div>
    </div>
  );
};
