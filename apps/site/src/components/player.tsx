import { getLatestPlayedTrack } from '@/services/lastfm';
import { ExternalLink } from './external-link';
import Image from 'next/image';

export const Player = async () => {
  const track = await getLatestPlayedTrack();

  return (
    <section
      aria-label={`A última música que Guilehrme ouviu foi: ${track.song} by ${track.artist}`}
      className='flex gap-2 items-center'
    >
      <Image
        src={track.image}
        alt={track.song}
        width={36}
        height={36}
        className='sepia brightness-90 saturate-50'
      />
      <div>
        <p className='line-clamp-1 max-w-xs text-sm text-secondary'>
          {track.artist} - {track.song}
        </p>
        <p className='text-xs text-secondary'>
          <span className='inline-block mr-1'>última música tocada. Por</span>
          <ExternalLink href='https://www.last.fm/user/oguivictor'>
            last.fm
          </ExternalLink>
        </p>
      </div>
    </section>
  );
};
