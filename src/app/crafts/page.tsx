import Link from 'next/link';
import { PiArrowBendUpLeftBold } from 'react-icons/pi';
import { format } from 'date-fns';
import { redirect } from 'next/navigation';
import { MetadataOutput, getCrafts } from '@/services/content';
import { buildSEO } from '@/seo/seo';
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
    <div className='max-w-2xl mx-auto'>
      <header>
        <nav className='mb-4'>
          <Link
            href='/'
            className='no-underline [&>svg]:w-6 flex items-center gap-1.5 text-secondary w-fit font-serif italic'
          >
            <PiArrowBendUpLeftBold />
            <span>Home</span>
          </Link>
        </nav>
        <h1 className='font-serif text-xl'>Crafts</h1>
      </header>
      <main className='mt-8'>
        <ul className='group divide-y divide-lowContrast/10 border-y border-t-lowContrast/10 border-b-lowContrast/10'>
          {Object.entries(groupedCraftsByYear)
            .reverse()
            .map(([year, crafts]) => (
              <li key={year} className='relative'>
                <span className='absolute top-[14px] left-0 text-sm text-lowContrast'>
                  {year}
                </span>
                <ul className='divide-y divide-lowContrast/10'>
                  {crafts.map(post => (
                    <li
                      key={post.title}
                      className='group/listItem ml-[25%] group-hover:text-lowContrast'
                    >
                      <Link
                        href={post.url ?? ''}
                        className='relative flex items-center justify-between py-3 no-underline before:absolute before:h-full before:w-full before:-left-1/2'
                      >
                        <span className='group-hover/listItem:!text-primary transition truncate'>
                          {post.title}
                        </span>
                        {!!post.publishedAt && (
                          <time
                            dateTime={post.publishedAt.toString()}
                            className='group-hover/listItem:!text-secondary transition text-sm'
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
      </main>
    </div>
  );
}
