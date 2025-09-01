import { Shimmer } from '@/components/shimmer';
import { getDiscogsWantList } from '@/services/discogs';
import Image from 'next/image';

export default async function Wantlist() {
  const discogsWantlist = await getDiscogsWantList();

  return (
    <main className='space-y-8 mx-auto my-20 md:mt-32 px-2'>
      <header className='p-4'>
        <h1 className='font-serif text-3xl text-primary'>Lista de desejos</h1>
        <span className='text-xs text-lowcontrast'>
          Dados fornecidos por{' '}
          <a href='https://www.discogs.com/' target='_blank'>
            Discogs
          </a>
        </span>
      </header>
      <ul className='grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-8'>
        {discogsWantlist.wants.map(record => (
          <li key={record.id} className='group'>
            <a
              href={`https://www.google.com/search?tbm=shop&q="LP"%20${record.basic_information.artists[0].name} - ${record.basic_information.title}`}
              className='flex gap-4 no-underline'
              target='_blank'
            >
              <Shimmer className='size-[75px] min-h-[75px] min-w-[75px] md:size-[150px] md:min-h-[150px] md:min-w-[150px]'>
                <Image
                  src={record.basic_information.cover_image}
                  alt={record.basic_information.title}
                  sizes='(max-width: 768px) 20vw, 33vw'
                  width={500}
                  height={500}
                />
              </Shimmer>

              <div className='flex flex-col'>
                <span className='text-lg line-clamp-2 text-primary'>
                  {record.basic_information.title}
                </span>
                <span className='text-secondary'>
                  {record.basic_information.artists
                    .map(artist => artist.name)
                    .join(', ')}
                </span>
                <span className='text-sm text-secondary'>
                  {Boolean(record.basic_information.year) &&
                    record.basic_information.year}
                </span>
              </div>
            </a>
          </li>
        ))}
      </ul>
    </main>
  );
}
