import { ExternalLink } from '@/components/external-link';
import { Footer } from '@/components/footer';
import { Icon } from '@/components/icon';
import Link from 'next/link';

import { getPosts } from '@/services/content';
import { format } from 'date-fns';

export default function Home() {
  const posts = getPosts().map(post => post.metadata);

  const groupedPostsByYear = Object.groupBy(posts, post =>
    new Date(post.publishedAt).getFullYear().toString(),
  );

  return (
    <main className='space-y-8 max-w-xl mx-auto mt-20 md:mt-32 px-2'>
      <section
        aria-label='Informações sobre Guilherme Victor'
        className='flex items-start pb-4 border-b'
      >
        <div>
          <p className='leading-tight'>Guilherme Victor</p>
          <h1 className='flex mb-2 mt-1 flex-col text-2xl sm:text-4xl text-primary font-serif italic'>
            desenvolvedor de software
          </h1>
          <p className='max-w-sm'>
            Você pode me encontrar no{' '}
            <ExternalLink href='https://x.com/oguivictor'>Twitter</ExternalLink>
            ,{' '}
            <ExternalLink href='https://bsky.app/profile/guilhermevictor.me'>
              Bluesky
            </ExternalLink>{' '}
            or{' '}
            <ExternalLink href='https://linkedin.com/in/guilhermeviictor'>
              Linkedin
            </ExternalLink>{' '}
            e ver meu código no{' '}
            <ExternalLink href='https://github.com/guivictorr'>
              Github.
            </ExternalLink>
          </p>
          <a
            href='/cv.pdf'
            download='Guilherme_Victor_CV.pdf'
            className='flex items-center gap-1 mt-2'
          >
            <Icon icon='download' />
            Baixe meu CV
          </a>
        </div>
      </section>
      <section aria-label='Navegação principal'>
        <nav>
          <ul className='flex flex-col gap-4'>
            {Object.entries(groupedPostsByYear)
              .reverse()
              .map(([year, posts]) => (
                <li key={year} className='relative'>
                  <span className='text-sm text-secondary mb-1 block'>
                    {year}
                  </span>
                  <ul>
                    {posts?.map(post => (
                      <li key={post.title}>
                        <Link
                          href={post.url ?? ''}
                          className='flex items-center w-full gap-2 justify-between py-2 no-underline'
                        >
                          <span className='transition line-clamp-1'>
                            {post.title}
                          </span>
                          {!!post.publishedAt && (
                            <time
                              dateTime={post.publishedAt.toString()}
                              className='transition text-sm shrink-0'
                            >
                              {format(post.publishedAt, 'MMMM dd')}
                            </time>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
          </ul>
        </nav>
      </section>
      <Footer />
    </main>
  );
}
