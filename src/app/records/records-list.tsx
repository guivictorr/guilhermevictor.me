'use client';

import { DiscogsRelease } from '@/services/discogs';
import Image from 'next/image';

type RecordsListProps = {
  records: DiscogsRelease[];
};
export function RecordsList({ records }: RecordsListProps) {
  return (
    <ul className='flex flex-wrap justify-center gap-8'>
      {records.map(record => (
        <li className='relative size-78.75' key={record.id}>
          <Image
            src={record.basic_information.cover_image}
            alt={record.basic_information.title}
            fill
          />
        </li>
      ))}
    </ul>
  );
}
