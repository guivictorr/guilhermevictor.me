import { ExternalLink } from '@/components/external-link';
import { Footer } from '@/components/footer';
import Link from 'next/link';

import { getPosts } from '@/services/content';
import { format } from 'date-fns';
import { Disc3, DownloadIcon } from 'lucide-react';

export default async function Home() {
  return (
    <main className='space-y-8 max-w-xl mx-auto pt-20 md:pt-28 px-2'>
      <section aria-label='Informações sobre Guilherme Victor'>
        <div>
          <p className='leading-tight'>Guilherme Victor</p>
          <h1 className='mt-1 flex-col text-2xl sm:text-4xl text-primary font-serif italic'>
            desenvolvedor de software
          </h1>
          <Link
            href='/records'
            className='group no-underline flex items-center gap-2 text-2xl sm:text-4xl text-primary font-serif italic leading-0 w-fit'
          >
            colecionador de discos
            <Disc3 className='group-hover:rotate-180 transition-[rotate] duration-300 ease-in-out size-8!' />
          </Link>
          <p className='mb-2 flex-col text-2xl sm:text-4xl text-primary font-serif italic'>
            neovim user
          </p>
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
            className='flex items-center gap-1 mt-2 w-fit'
          >
            <DownloadIcon />
            Baixe meu CV
          </a>
        </div>
      </section>
      <section aria-label='Navegação principal'>
        <Posts />
      </section>
      <Footer />
    </main>
  );
}

async function Posts() {
  const posts = getPosts().map(post => post.metadata);
  const groupedPostsByYear = Object.groupBy(posts, post =>
    new Date(post.publishedAt).getFullYear().toString(),
  );
  return (
    <nav>
      <ul className='flex flex-col gap-4'>
        {Object.entries(groupedPostsByYear)
          .reverse()
          .map(([year, posts]) => (
            <li key={year} className='relative'>
              <span className='text-sm text-secondary mb-1 block'>{year}</span>
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
                          className='transition text-sm shrink-0 capitalize'
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
  );
}
