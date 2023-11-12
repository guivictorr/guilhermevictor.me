import formatRelative from 'date-fns/formatRelative';
import { getLatestPlayedTrack } from '@/api/spotify';

export const SpotifyWidget = async () => {
  const { name, artist, playedAt } = await getLatestPlayedTrack();
  const formattedDate = formatRelative(
    new Date(playedAt),
    Date.now(),
  ).toLowerCase();

  return (
    <section className='text-start'>
      <div className='flex items-center gap-2'>
        <h3 className='font-black text-xl'>last played song</h3>
        <time dateTime={playedAt}>{formattedDate}</time>
      </div>
      <div className='mt-1'>
        <p>{name}</p>
        <p className='text-secondary text-sm'>{artist}</p>
      </div>
    </section>
  );
};
