import { Article } from '@/components/article';
import { ExternalLink } from '@/components/external-link';
import { SpotifyWidget } from '@/components/spotify-widget';
import { SteamWidget } from '@/components/steam-widget';

export default function Home() {
  return (
    <main className='flex flex-col gap-8 max-w-xl mx-auto'>
      <header className='w-full py-8'>
        <div className='mx-auto border rounded-md text-center w-fit px-2 h-8 grid place-items-center'>
          <abbr title='Work in progress'>wip</abbr>
        </div>
      </header>
      <section>
        <p className='text-sm'>Guilherme Victor</p>
        <h1 className='text-xl sm:text-2xl text-primary'>
          empathetic frontend developer.
          <br />
          future native mobile developer. <br />
          neovim user.
        </h1>
        <nav aria-label='External links for social media'>
          <ul className='flex items-center gap-4 mt-4 text-sm sm:text-base'>
            <li>
              <ExternalLink href='https://github.com/guivictorr'>
                github
              </ExternalLink>
            </li>

            <li>
              <ExternalLink href='https://x.com/oguivictor'>
                twitter
              </ExternalLink>
            </li>

            <li>
              <ExternalLink href='https://linkedin.com/in/guilhermeviictor'>
                linkedin
              </ExternalLink>
            </li>
          </ul>
        </nav>
      </section>
      <section className='border-b'>
        <div className='flex items-center gap-2'>
          <h2 className='text-xl sm:text-2xl shrink-0'>writing</h2>
          <hr className='w-full mt-1' />
        </div>
        <ul className='mb-4 mt-2 hover:text-secondary/50 focus-within:text-secondary/50 w-fit'>
          <Article />
          <Article />
        </ul>
      </section>
      <section className='flex flex-col sm:flex-row items-start justify-between gap-4'>
        <SpotifyWidget />
        <SteamWidget />
      </section>
    </main>
  );
}
