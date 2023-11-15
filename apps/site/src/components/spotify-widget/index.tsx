import { getLatestPlayedTrack } from '@/services/spotify';
import { Time } from './time';

export const SpotifyWidget = async () => {
  const { track, played_at } = await getLatestPlayedTrack();
  const { artists, name } = track;
  const artistNames = artists.map(artist => artist.name).join(', ');

  return (
    <section className='text-start'>
      <div className='flex items-center gap-2'>
        <h3 className='font-black text-xl'>last played song</h3>
        <Time dateTime={played_at} />
      </div>
      <p>{name}</p>
      <p className='text-secondary text-sm'>{artistNames}</p>
    </section>
  );
};
