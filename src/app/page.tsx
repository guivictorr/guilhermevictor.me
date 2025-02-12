import { ListColumn, ListItem } from '@/components/list-column';
import { ExternalLink } from '@/components/external-link';
import { getCrafts, getPosts } from '@/services/content';
import { Footer } from '@/components/footer';
import bookmarksJson from '@/app/bookmarks/bookmarks.json';
import Link from 'next/link';
import { PiDownloadSimple } from 'react-icons/pi';

export default async function Home() {
  const posts = getPosts();
  const crafts = getCrafts();

  return (
    <main className='flex flex-col justify-center gap-4 max-w-xl mx-auto  h-full'>
      <section
        aria-label='Information about Guilherme Victor'
        className='flex flex-col sm:flex-row items-start pb-4 border-b border-lowContrast/10'
      >
        <div>
          <p className='leading-none'>Guilherme Victor</p>
          <h1 className='flex flex-col text-2xl sm:text-3xl text-primary font-serif italic'>
            software developer
          </h1>
          <p className='max-w-sm'>
            You can find me on{' '}
            <ExternalLink href='https://x.com/oguivictor'>Twitter</ExternalLink>
            ,{' '}
            <ExternalLink href='https://bsky.app/profile/guilhermevictor.me'>
              Bluesky
            </ExternalLink>{' '}
            or{' '}
            <ExternalLink href='https://linkedin.com/in/guilhermeviictor'>
              Linkedin
            </ExternalLink>{' '}
            and see my code on{' '}
            <ExternalLink href='https://github.com/guivictorr'>
              Github
            </ExternalLink>
          </p>
          <a
            href='/cv.pdf'
            download='Guilherme_Victor_CV.pdf'
            className='flex items-center gap-1 mt-2'
          >
            Download my CV
            <PiDownloadSimple />
          </a>
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

        <ListColumn title='Bookmarks'>
          {bookmarksJson.data.slice(0, 3).map(bookmark => (
            <ListItem
              key={bookmark.id}
              title={bookmark.title}
              href={bookmark.originalArticleUrl}
            />
          ))}
          <li>
            <Link className='block pt-4' href='/bookmarks'>
              More Bookmarks
            </Link>
          </li>
        </ListColumn>
      </section>
      <Footer />
    </main>
  );
}
