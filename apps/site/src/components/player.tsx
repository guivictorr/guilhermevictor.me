import { getLatestPlayedTrack } from '@/services/lastfm';

export const Player = async () => {
  const track = await getLatestPlayedTrack();

  return (
    <section
      aria-label={`A última música que Guilehrme ouviu foi: ${track.song} by ${track.artist}`}
      className='flex gap-2 items-center'
    >
      <div>
        <p className='text-xs text-secondary'>última música tocada.</p>
        <p className='line-clamp-1 max-w-xs text-sm text-secondary'>
          {track.artist} - {track.song}
        </p>
      </div>
    </section>
  );
};
