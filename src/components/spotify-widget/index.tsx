import { getLatestPlayedTrack } from '@/services/spotify';
import { Time } from './time';

export const SpotifyWidget = async () => {
  const response = await getLatestPlayedTrack();

  if (!response) return null;

  return (
    <section className='text-start'>
      <div className='flex items-center gap-2'>
        <h3 className='font-black text-xl'>last played song</h3>
        <Time dateTime={response.playedAt} />
      </div>
      <p>{response.name}</p>
      <p className='text-secondary text-sm'>{response.artist}</p>
    </section>
  );
};
