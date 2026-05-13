import { Link } from '@/components/link';
import { HomeButton } from '@/components/home-button';
import { Time } from '@/components/time';
import { getPosts } from '@/services/content';
import { setRequestLocale } from 'next-intl/server';
import { routing } from '@/lib/next-intl';

type Props = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export default async function WritingPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const posts = getPosts({ locale }).map(post => post.metadata);
  const groupedByYear = Object.groupBy(posts, post =>
    new Date(post.publishedAt).getFullYear().toString(),
  );

  return (
    <main className='max-w-xl mx-auto pt-20 md:pt-28 px-2 pb-20'>
      <HomeButton />
      <nav className='mt-8'>
        <ul className='flex flex-col gap-4'>
          {Object.entries(groupedByYear)
            .reverse()
            .map(([year, posts]) => (
              <li key={year}>
                <span className='text-sm text-secondary mb-1 block'>
                  {year}
                </span>
                <ul>
                  {posts?.map(post => (
                    <li key={post.title}>
                      <Link
                        href={post.url ?? ''}
                        icon={false}
                        className='flex items-center w-full gap-2 justify-between py-2 no-underline'
                      >
                        <span className='line-clamp-1'>{post.title}</span>
                        {!!post.publishedAt && (
                          <Time>{post.publishedAt.toISOString()}</Time>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
        </ul>
      </nav>
    </main>
  );
}
