import { getLatestPlayedTrack } from '@/services/spotify';
import { Play } from './play';

export const Footer = async () => {
  const { track } = await getLatestPlayedTrack();
  const artists = track.artists.map(artist => artist.name).join(',');

  return (
    <footer className='h-[52px] shrink-0 w-full border-t border-primary/10 px-4 sm:px-8'>
      <div className='flex items-center justify-between h-full'>
        <div className='flex items-center gap-2'>
          <Play audioUrl={track.preview_url} />
          <p
            aria-description={`Last played song ${track.name} from ${artists}`}
            className='truncate max-w-[24ch] sm:max-w-none'
          >
            {artists} - {track.name}
          </p>
        </div>
        <p>{new Date().getFullYear()}</p>
      </div>
    </footer>
  );
};
