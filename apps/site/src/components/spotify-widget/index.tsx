import { getLatestPlayedTrack } from '@/services/spotify';
import { Time } from './time';

export const SpotifyWidget = async () => {
  const { name, artist, playedAt } = await getLatestPlayedTrack();

  return (
    <section className='text-start'>
      <div className='flex items-center gap-2'>
        <h3 className='font-black text-xl'>last played song</h3>
        <Time dateTime={playedAt} />
      </div>
      <p>{name}</p>
      <p className='text-secondary text-sm'>{artist}</p>
    </section>
  );
};
