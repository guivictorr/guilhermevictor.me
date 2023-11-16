import { ExternalLink } from '@/components/external-link';
import { SpotifyWidget } from '@/components/spotify-widget';
import { SteamWidget } from '@/components/steam-widget';

export default function Home() {
  return (
    <main className='flex flex-col gap-8'>
      <header className='mx-auto py-10'>
        <div className='border rounded-md text-center w-fit px-2 h-8 grid place-items-center'>
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
        <div className='mb-6 mt-4'>
          <article>
            <div className='flex items-center gap-1'>
              <p className='text-primary'>post title</p>
              <p>2023</p>
            </div>
            <p>a little subtitle to give context</p>
          </article>
        </div>
      </section>
      <section className='flex flex-col sm:flex-row items-start justify-between gap-4'>
        <SpotifyWidget />
        <SteamWidget />
      </section>
    </main>
  );
}
