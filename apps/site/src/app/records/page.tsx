import { getDiscogsCollection } from '@/services/discogs';
import { RecordsList } from './records-list';

export default async function Records() {
  const records = await getDiscogsCollection();
  return (
    <main>
      <header className='py-8'>
        <h1 className='text-center font-serif text-6xl'>
          Minha coleção de discos (wip)
        </h1>
      </header>
      <RecordsList records={records.releases} />
    </main>
  );
}
