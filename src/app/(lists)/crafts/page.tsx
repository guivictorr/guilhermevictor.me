import Link from 'next/link';
import { format } from 'date-fns';
import { redirect } from 'next/navigation';
import { MetadataOutput, getCrafts } from '@/services/content';
import { buildSEO } from '@/app/seo';
import { Metadata } from 'next';

export const metadata: Metadata = buildSEO({
  title: 'Crafts',
  description:
    'Frontend experiments from the software developer Guilherme Victor',
  dynamic_og: true,
});

export default function CraftsPage() {
  const crafts = getCrafts().map(post => post.metadata);
  const groupedCraftsByYear = crafts.reduce(
    (acc, post) => {
      if (!post.publishedAt) return acc;
      const year = new Date(post.publishedAt).getFullYear();

      if (!acc[year]) {
        acc[year] = [];
      }

      acc[year].push(post);

      return acc;
    },
    {} as Record<string, MetadataOutput[]>,
  );

  if (crafts.length <= 0) {
    redirect('/not-found');
  }

  return (
    <div>
      <h1 className='font-serif text-xl my-4'>Crafts</h1>
      <ul className='group divide-y divide-secondary/10 border-y border-t-secondary/10 border-b-secondary/10'>
        {Object.entries(groupedCraftsByYear)
          .reverse()
          .map(([year, crafts]) => (
            <li key={year} className='relative'>
              <span className='absolute top-[14px] left-0 text-sm text-secondary'>
                {year}
              </span>
              <ul className='divide-y divide-secondary/10 group'>
                {crafts.map(post => (
                  <li key={post.title} className='group/listItem ml-[25%]'>
                    <Link
                      href={post.url ?? ''}
                      className='group-hover:text-secondary/50 hover:!text-primary relative w-full flex items-center justify-between py-3 no-underline before:absolute before:h-full before:w-full before:-left-1/2'
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
