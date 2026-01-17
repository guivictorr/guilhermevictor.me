import { getDiscogsCollection } from '@/services/discogs';
import { RecordsList } from './records-list';

export default async function Records() {
  const records = await getDiscogsCollection();
  return (
    <main>
      <header className='py-8'>
        <h1 className='text-center'>Coleção de discos</h1>
        <p className='text-center'>(wip)</p>
      </header>
      <RecordsList records={records.releases} />
    </main>
  );
}
