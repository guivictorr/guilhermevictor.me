import Link from 'next/link';
import { format } from 'date-fns';
import { redirect } from 'next/navigation';
import { getPosts } from '@/services/content';
import { Metadata } from 'next';
import { buildSEO } from '@/app/seo';

export const metadata: Metadata = buildSEO({
  title: 'Writing',
  description: 'Blog posts from the software developer Guilherme Victor',
  dynamic_og: true,
});

export default function WritingHome() {
  const posts = getPosts().map(post => post.metadata);

  const groupedPostsByYear = Object.groupBy(posts, post =>
    new Date(post.publishedAt).getFullYear().toString(),
  );

  if (posts.length <= 0) {
    redirect('/not-found');
  }

  return (
    <div>
      <h1 className='font-serif text-xl my-4'>Writting</h1>
      <ul className='divide-y divide-secondary/10 border-y border-t-secondary/10 border-b-secondary/10'>
        {Object.entries(groupedPostsByYear)
          .reverse()
          .map(([year, posts]) => (
            <li key={year} className='relative'>
              <span className='absolute top-[14px] left-0 text-sm text-secondary'>
                {year}
              </span>
              <ul className='divide-y divide-secondary/10 group'>
                {posts?.map(post => (
                  <li key={post.title} className='ml-[25%]'>
                    <Link
                      href={post.url ?? ''}
                      className='group-hover:text-secondary/50 hover:!text-primary relative flex items-center w-full justify-between py-3 no-underline before:absolute before:h-full before:w-full before:-left-1/2'
                    >
                      <span className='transition truncate'>{post.title}</span>
                      {!!post.publishedAt && (
                        <time
                          dateTime={post.publishedAt.toString()}
                          className='transition text-sm'
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
    </div>
  );
}
