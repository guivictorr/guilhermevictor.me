'use client';

import { DiscogsRelease } from '@/services/discogs';
import Image from 'next/image';

export function RecordsList({ records }: { records: DiscogsRelease[] }) {
  return (
    <section className='grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8'>
      {records.map(record => (
        <RecordCard key={record.id} record={record} />
      ))}
    </section>
  );
}

function RecordCard({ record }: { record: DiscogsRelease }) {
  const artist = record.basic_information.artists
    .map(a => a.name.replace(/\s\(\d+\)$/, ''))
    .join(', ');

  return (
    <div className='relative aspect-square group overflow-hidden'>
      <Image
        src={record.basic_information.cover_image}
        alt={record.basic_information.title}
        fill
        sizes='(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, 14vw'
        className='object-cover transition-transform duration-500 ease-out group-hover:scale-110'
      />
      <div className='absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3'>
        <p className='text-white text-xs font-semibold leading-tight line-clamp-2'>
          {record.basic_information.title}
        </p>
        <p className='text-white/60 text-xs truncate mt-0.5'>{artist}</p>
        {record.basic_information.year > 0 && (
          <p className='text-white/40 text-xs mt-0.5'>
            {record.basic_information.year}
          </p>
        )}
      </div>
    </div>
  );
}
