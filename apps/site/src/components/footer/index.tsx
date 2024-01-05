import { getLatestPlayedTrack } from '@/services/spotify';
import { Play } from './play';

export const Footer = async () => {
  const { track } = await getLatestPlayedTrack();
  const artists = track.artists.map(artist => artist.name).join(',');

  return (
    <footer className='h-14 w-full border-t border-primary/10'>
      <div className='md:max-w-6xl mx-auto flex items-center justify-between h-full'>
        <div className='flex items-center gap-2'>
          <Play audioUrl={track.preview_url} />
          <p
            aria-description={`Last played song ${track.name} from ${artists}`}
          >
            {artists} - {track.name}
          </p>
        </div>
        <p>{new Date().getFullYear()}</p>
      </div>
    </footer>
  );
};
