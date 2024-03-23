import { ListColumn } from '@/components/list-column';
import { ExternalLink } from '@/components/external-link';
import { getLatestPlayedGames } from '@/services/steam';
import { getPosts } from '@/services/content';

export default async function Home() {
  const games = (await getLatestPlayedGames({ count: 3 })) ?? [];
  const posts = getPosts();

  return (
    <main className='flex flex-col gap-8 max-w-lg mx-auto'>
      <section className='mt-24 sm:mt-44'>
        <p className='leading-4'>Guilherme Victor</p>
        <h1 className='text-3xl sm:text-2xl text-primary font-serif'>
          empathetic frontend developer.
          <br />
          learning golang. <br />
          neovim user.
        </h1>
        <p>
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
      <section className='grid grid-cols-1 gap-2 space-y-8 sm:space-y-0 sm:grid-cols-3 sm:mt-14'>
        <ListColumn title='Crafts'>
          <li>No content</li>
          {/* <ListColumn.Item */}
          {/*   title='Animated Tabs' */}
          {/*   description='Animated Tabs built with framer motion' */}
          {/*   href='/writing/post' */}
          {/* /> */}
        </ListColumn>

        <ListColumn title='Writing'>
          {posts.map(post => (
            <ListColumn.Item
              key={post.slug}
              title={post.title}
              description={post.description}
              href={post.url}
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
