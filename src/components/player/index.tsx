import { getLatestPlayedTrack } from '@/services/lastfm';
import { ExternalLink } from '../external-link';

export const Player = async () => {
  const track = await getLatestPlayedTrack();

  const formattedPlayedAt = new Date(track.date).toLocaleString('en', {
    day: 'numeric',
    month: 'long',
  });

  return (
    <section
      aria-label={`${formattedPlayedAt} Guilherme was listening to ${track.song} by ${track.artist}`}
    >
      <p aria-hidden className='line-clamp-1 max-w-xs text-sm text-secondary'>
        {track.artist} - {track.song}
      </p>
      <p className='text-xs text-lowContrast'>
        <span className='inline-block mr-1'>latest played song on</span>
        <ExternalLink href='https://www.last.fm/user/oguivictor'>
          last.fm
        </ExternalLink>
      </p>
    </section>
  );
};
