import { getLatestPlayedTrack } from '@/services/spotify';
import { Time } from './time';
import { Play } from './play';
import { ExternalLink } from '../external-link';

export const SpotifyWidget = async () => {
  const { track, played_at } = await getLatestPlayedTrack();
  const { artists, name } = track;
  const artistNames = artists.map(artist => artist.name).join(', ');

  return (
    <section className='text-start'>
      <div className='flex items-center gap-2'>
        <Play audioUrl={track.preview_url} />
        <h3 className='font-black text-xl text-primary'>last played song</h3>
        <Time dateTime={played_at} />
      </div>
      <ExternalLink href={track.external_urls.spotify}>{name}</ExternalLink>
      <p className='text-secondary text-sm'>{artistNames}</p>
    </section>
  );
};
