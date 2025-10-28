import { getDiscogsCollection } from '@/services/discogs';
import { RecordsList } from './records-list';

export default async function Records() {
  const records = await getDiscogsCollection();
  return (
    <main className='flex flex-col justify-between h-screen overflow-hidden'>
      <h1 className='font-serif text-7xl text-center pt-24'>
        Coleção de discos
      </h1>
      <p className='text-center'>(wip)</p>
      <RecordsList records={records.releases} />
    </main>
  );
}
