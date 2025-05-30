import { getLatestPlayedTrack } from '@/services/lastfm';
import { ExternalLink } from './external-link';

export const Player = async () => {
  const track = await getLatestPlayedTrack();

  return (
    <section
      aria-label={`A última música que Guilehrme ouviu foi: ${track.song} by ${track.artist}`}
    >
      {' '}
      <p className='line-clamp-1 max-w-xs text-sm text-secondary'>
        {track.artist} - {track.song}
      </p>
      <p className='text-xs text-secondary'>
        <span className='inline-block mr-1'>última música tocada. Por</span>
        <ExternalLink href='https://www.last.fm/user/oguivictor'>
          last.fm
        </ExternalLink>
      </p>
    </section>
  );
};
