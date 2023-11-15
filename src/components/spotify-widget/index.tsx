import { getLatestPlayedTrack } from '@/services/spotify';
import { Time } from './time';
import { Play } from './play';

export const SpotifyWidget = async () => {
  const { track, played_at } = await getLatestPlayedTrack();
  const { artists, name } = track;
  const artistNames = artists.map(artist => artist.name).join(', ');

  return (
    <section className='text-start'>
      <div className='flex items-center gap-2'>
        <Play audioUrl={track.preview_url} />
        <h3 className='font-black text-xl text-primary'>last played song</h3>
        <Time dateTime={played_at} />
      </div>
      <a
        className='underline underline-offset-2'
        href={track.external_urls.spotify}
        target='_blank'
      >
        {name}

        <span aria-hidden className='text-xs'>
          &nbsp; &#x2197;
        </span>
      </a>

      <p className='text-secondary text-sm'>{artistNames}</p>
    </section>
  );
};
