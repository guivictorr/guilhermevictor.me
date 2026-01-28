'use client';

import { DiscogsRelease } from '@/services/discogs';
import Image from 'next/image';
import Link from 'next/link';

type RecordsListProps = {
  records: DiscogsRelease[];
};
export function RecordsList({ records }: RecordsListProps) {
  return (
    <ul className='flex flex-wrap justify-center gap-8'>
      {records.map(record => (
        <li key={record.id}>
          <Link
            target='_blank'
            className='relative size-78.75 block'
            href={`https://discogs.com/release/${record.id}`}
          >
            <Image
              src={record.basic_information.cover_image}
              alt={record.basic_information.title}
              fill
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}
