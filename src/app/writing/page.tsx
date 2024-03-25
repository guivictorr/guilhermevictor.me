import Link from 'next/link';
import { PiArrowBendUpLeftBold } from 'react-icons/pi';
import { Metadata, getPosts } from '@/services/content';
import { format, parseISO } from 'date-fns';

export default function WritingHome() {
  const posts = getPosts()
    .map(post => post.metadata)
    .sort((a, b) => {
      return (
        new Date(String(b.publishedAt)).getTime() -
        new Date(String(a.publishedAt)).getTime()
      );
    });
  const groupedPostsByYear = posts.reduce(
    (acc, post) => {
      if (!post.publishedAt) return acc;
      const year = new Date(post.publishedAt).getFullYear();
      console.log(year);

      if (!acc[year]) {
        acc[year] = [];
      }

      acc[year].push(post);

      return acc;
    },
    {} as Record<string, Partial<Metadata>[]>,
  );
  console.log(groupedPostsByYear);

  return (
    <main className='mt-24 sm:mt-32 max-w-lg mx-auto'>
      <nav className='mb-4'>
        <Link
          href='/'
          className='no-underline [&>svg]:w-6 flex items-center gap-1.5 text-secondary w-fit font-serif italic'
        >
          <PiArrowBendUpLeftBold />
          <span>Home</span>
        </Link>
      </nav>
      <h1 className='font-serif text-xl'>Writting</h1>
      <section className='mt-8'>
        <ul className='group divide-y divide-lowContrast/10 border-y border-t-lowContrast/10 border-b-lowContrast/10'>
          {Object.entries(groupedPostsByYear)
            .reverse()
            .map(([year, posts]) => (
              <li key={year} className='relative'>
                <span className='absolute top-3 left-0 text-sm text-lowContrast'>
                  {year}
                </span>
                <ul className='divide-y divide-lowContrast/10'>
                  {posts.map(post => (
                    <li
                      key={post.title}
                      className='group/listItem ml-[25%] group-hover:text-lowContrast'
                    >
                      <Link
                        href={post.url ?? ''}
                        className='relative flex items-center justify-between py-3 no-underline before:absolute before:h-full before:w-full before:-left-1/2'
                      >
                        <span className='group-hover/listItem:!text-primary transition'>
                          {post.title}
                        </span>
                        {!!post.publishedAt && (
                          <time className='group-hover/listItem:!text-secondary transition text-sm'>
                            {format(parseISO(post.publishedAt), 'MMMM dd')}
                          </time>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
        </ul>
      </section>
    </main>
  );
}
