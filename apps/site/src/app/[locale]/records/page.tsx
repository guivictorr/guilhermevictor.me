import { getDiscogsCollection } from '@/services/discogs';
import { RecordsList } from './records-list';
import { HomeButton } from '@/components/home-button';
import { getTranslations } from 'next-intl/server';

export default async function Records() {
  const t = await getTranslations('records-page');
  const records = await getDiscogsCollection();
  return (
    <main>
      <header className='fixed top-0 flex items-center gap-8 w-full py-8 px-8 z-50'>
        <nav>
          <HomeButton />
        </nav>
        <h1 className='text-center font-serif text-6xl'>{t('title')}</h1>
      </header>
      <RecordsList records={records.releases} />
    </main>
  );
}
