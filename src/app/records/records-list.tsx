'use client';

import { cn } from '@/lib/utils';
import { DiscogsRelease } from '@/services/discogs';
import Image from 'next/image';
import { useRef, useState } from 'react';

type RecordsListProps = {
  records: DiscogsRelease[];
};
export function RecordsList({ records }: RecordsListProps) {
  const [selectedRecord, setSelectedRecord] = useState('');
  const listItemRef = useRef<HTMLLIElement>(null);
  return (
    <ul
      className='flex items-end h-full justify-start px-24 overflow-x-scroll'
      style={{ perspective: '900px' }}
    >
      {records.map((record, index) => (
        <li
          ref={listItemRef}
          data-selected={String(record.id) === selectedRecord}
          key={record.id}
          className={cn(
            'flex gap-4 shrink-0 duration-200 data-[selected=false]:hover:brightness-125 transition-[transform] data-[selected=true]:!-translate-y-[332px]',
            {
              '-ml-60': index !== 0,
            },
          )}
          style={{
            transformStyle: 'preserve-3d',
            transform: `rotateY(16deg) rotateX(0deg) translateZ(20px)`,
            willChange: 'transform',
          }}
        >
          <input
            id={String(record.id)}
            type='radio'
            value={selectedRecord}
            name='records'
            onChange={() => {
              setSelectedRecord(String(record.id));
            }}
            hidden
          />
          <label htmlFor={String(record.id)}>
            <Image
              src={record.basic_information.cover_image}
              width={310}
              height={310}
              alt={record.basic_information.title}
            />
          </label>
          {String(record.id) === selectedRecord && (
            <div>
              <p className='line-clamp-2'>{record.basic_information.title}</p>
              <p>
                {record.basic_information.artists
                  .map(artist => artist.name)
                  .join(', ')}
              </p>
              {Boolean(record.basic_information.year) && (
                <p>{record.basic_information.year}</p>
              )}
              <a
                className='text-sm'
                target='_blank'
                href={`https://discogs.com/release/${record.id}`}
              >
                Discogs
              </a>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
