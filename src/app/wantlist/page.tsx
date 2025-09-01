import { Shimmer } from '@/components/shimmer';
import { getDiscogsWantList } from '@/services/discogs';
import Image from 'next/image';

export default async function Wantlist() {
  const discogsWantlist = await getDiscogsWantList();

  return (
    <main className='space-y-8 max-w-xl mx-auto my-20 md:mt-32 px-2'>
      <header className='p-4'>
        <h1 className='font-serif text-3xl text-primary'>Lista de desejos</h1>
        <span className='text-xs text-lowcontrast'>
          Dados fornecidos por{' '}
          <a href='https://www.discogs.com/' target='_blank'>
            Discogs
          </a>
        </span>
      </header>
      <ul className='space-y-4'>
        {discogsWantlist.wants.map(record => (
          <li
            key={record.id}
            className='group hover:bg-secondary/10 p-4 rounded transition'
          >
            <a
              href={`https://www.google.com/search?tbm=shop&q=LP%20${record.basic_information.artists[0].name}-${record.basic_information.title}`}
              target='_blank'
              className='no-underline flex gap-3 text-primary'
            >
              <Shimmer className='h-[100px] w-full max-w-[100px] md:max-w-[250px] md:h-[250px]'>
                <Image
                  src={record.basic_information.cover_image}
                  alt={record.basic_information.title}
                  sizes='(max-width: 768px) 20vw, 33vw'
                  fill
                />
              </Shimmer>

              <div className='flex flex-col'>
                <span className='text-lg line-clamp-2'>
                  {record.basic_information.title}
                </span>
                <span className='text-secondary'>
                  {record.basic_information.artists
                    .map(artist => artist.name)
                    .join(', ')}
                </span>
                <span className='text-secondary'>
                  {Boolean(record.basic_information.year)
                    ? record.basic_information.year
                    : 'Ano não definido'}
                </span>
              </div>
            </a>
          </li>
        ))}
      </ul>
    </main>
  );
}
