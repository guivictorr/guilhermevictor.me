import { getLatestPlayedTrack } from '@/services/lastfm';
import Image from 'next/image';

export const Player = async () => {
  const track = await getLatestPlayedTrack();

  return (
    <section
      aria-label={`A última música que Guilehrme ouviu foi: ${track.song} by ${track.artist}`}
      className='flex gap-2 items-center'
    >
      <Image src={track.image} alt={track.song} width={36} height={36} />
      <div>
        <p className='text-xs text-secondary'>última música tocada.</p>
        <p className='line-clamp-1 max-w-xs text-sm text-secondary'>
          {track.artist} - {track.song}
        </p>
      </div>
    </section>
  );
};
