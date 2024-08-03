import dynamic from 'next/dynamic';
import { getLatestPlayedTrack } from '@/services/spotify';
import { PlayerRoot } from './player-provider';
import { Play } from './play';

export const Player = async () => {
  const result = await getLatestPlayedTrack();

  if (result === null) {
    return null;
  }
  const { track, played_at } = result;

  const artists = track.artists.map(artist => artist.name).join(',');
  const hasPreviewUrl = track.preview_url !== null;
  const formattedPlayedAt = new Date(played_at).toLocaleString('en', {
    day: 'numeric',
    month: 'long',
  });

  return (
    <section
      aria-label={`${formattedPlayedAt} Guilherme was listening to ${track.name} by ${artists}`}
    >
      <PlayerRoot audioUrl={track.preview_url}>
        <Play hasPreviewUrl={hasPreviewUrl}>
          <p
            aria-hidden
            className='line-clamp-1 max-w-xs text-sm text-lowContrast'
          >
            {artists} - {track.name}
          </p>
        </Play>
      </PlayerRoot>
    </section>
  );
};
