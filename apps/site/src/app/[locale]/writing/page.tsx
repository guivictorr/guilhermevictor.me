import { Link } from '@/components/link';
import { HomeButton } from '@/components/home-button';
import { Time } from '@/components/time';
import { getPosts } from '@/services/content';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { routing } from '@/lib/next-intl';
import { buildSEO } from '@/app/seo';
import { Metadata } from 'next';

type Props = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'writing-page' });
  return buildSEO({
    title: t('title'),
    description: t('description'),
    canonical: '/writing',
    locale,
    dynamic_og: false,
  });
}

export default async function WritingPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'writing-page' });
  const posts = getPosts({ locale }).map(post => post.metadata);
  const groupedByYear = Object.groupBy(posts, post =>
    new Date(post.publishedAt).getFullYear().toString(),
  );

  return (
    <main className='max-w-xl mx-auto pt-20 md:pt-28 px-2 pb-20'>
      <HomeButton />
      <h1 className='sr-only'>{t('title')}</h1>
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
