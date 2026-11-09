import { getDiscogsCollection } from '@/services/discogs';
import { RecordsList } from './records-list';
import { HomeButton } from '@/components/home-button';
import { buildSEO } from '@/app/seo';
import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'records-page' });
  return buildSEO({
    title: t('title'),
    description: t('description'),
    canonical: '/records',
    locale,
    dynamic_og: false,
  });
}

export default async function Records({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'records-page' });
  const records = await getDiscogsCollection();

  return (
    <main>
      <header className='fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-background/80 backdrop-blur-sm border-b border-secondary/10'>
        <HomeButton />
        <p className='text-xs text-secondary tabular-nums'>
          {records.releases.length} records
        </p>
      </header>
      <div className='pt-[49px]'>
        <h1 className='sr-only'>{t('title')}</h1>
        <RecordsList records={records.releases} />
      </div>
    </main>
  );
}
