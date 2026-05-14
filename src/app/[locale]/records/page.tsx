import { getDiscogsCollection } from '@/services/discogs';
import { RecordsList } from './records-list';
import { HomeButton } from '@/components/home-button';

export default async function Records() {
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
        <RecordsList records={records.releases} />
      </div>
    </main>
  );
}
