import { ListColumn, ListItem } from '@/components/list-column';
import { ExternalLink } from '@/components/external-link';
import { getLatestPlayedGames } from '@/services/steam';
import { getCrafts, getPosts } from '@/services/content';
import { Footer } from '@/components/footer';

export default async function Home() {
  const games = (await getLatestPlayedGames({ count: 3 })) ?? [];
  const posts = getPosts();
  const crafts = getCrafts();

  return (
    <main className='flex flex-col justify-center gap-4 max-w-xl mx-auto  h-full'>
      <section
        aria-label='Information about Guilherme Victor'
        className='flex flex-col sm:flex-row items-start pb-4 border-b border-lowContrast/10'
      >
        <div>
          <p className='leading-4'>Guilherme Victor</p>
          <h1 className='text-3xl sm:text-2xl text-primary font-serif'>
            empathetic frontend developer.
            <br />
            learning golang. <br />
            neovim user.
          </h1>
          <p className='max-w-sm'>
            You can find me on{' '}
            <ExternalLink href='https://x.com/oguivictor'>Twitter</ExternalLink>{' '}
            or{' '}
            <ExternalLink href='https://linkedin.com/in/guilhermeviictor'>
              Linkedin
            </ExternalLink>{' '}
            and see my code on{' '}
            <ExternalLink href='https://github.com/guivictorr'>
              Github
            </ExternalLink>
          </p>
        </div>
      </section>
      <section className='grid grid-cols-1 gap-x-8 space-y-8 sm:space-y-0 sm:grid-cols-3'>
        <ListColumn title='Crafts'>
          {crafts.map(craft => (
            <ListItem
              key={craft.slug}
              title={craft.metadata.title}
              href={craft.metadata.url}
            />
          ))}
        </ListColumn>

        <ListColumn title='Writing'>
          {posts.map(post => (
            <ListItem
              key={post.slug}
              title={post.metadata.title}
              href={post.metadata.url}
            />
          ))}
        </ListColumn>

        <ListColumn title='Gaming'>
          {games.map(game => (
            <ListItem key={game.appid} title={game.name} href={game.url} />
          ))}
        </ListColumn>
      </section>
      <Footer />
    </main>
  );
}
