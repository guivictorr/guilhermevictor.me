import { ListColumn } from '@/components/list-column';
import { ExternalLink } from '@/components/external-link';
import { getLatestPlayedGames } from '@/services/steam';
import { getCrafts, getPosts } from '@/services/content';

export default async function Home() {
  const games = (await getLatestPlayedGames({ count: 3 })) ?? [];
  const posts = getPosts();
  const crafts = getCrafts();

  return (
    <main className='flex flex-col gap-8 max-w-xl mx-auto'>
      <section>
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
      </section>
      <section className='grid grid-cols-1 gap-8 space-y-8 sm:space-y-0 sm:grid-cols-3 sm:mt-14'>
        <ListColumn title='Crafts'>
          {crafts.map(craft => (
            <ListColumn.Item
              key={craft.slug}
              title={craft.metadata.title ?? ''}
              description={craft.metadata.description ?? ''}
              href={craft.metadata.url ?? ''}
            />
          ))}
        </ListColumn>

        <ListColumn title='Writing'>
          {posts.map(post => (
            <ListColumn.Item
              key={post.slug}
              title={post.metadata.title ?? ''}
              description={post.metadata.description ?? ''}
              href={post.metadata.url ?? ''}
            />
          ))}
        </ListColumn>

        <ListColumn title='Gaming'>
          {games.map(game => (
            <ListColumn.Item
              key={game.appid}
              title={game.name}
              description={`${game.playtime_2weeks}h past two weeks`}
              href={game.url}
            />
          ))}
        </ListColumn>
      </section>
    </main>
  );
}
