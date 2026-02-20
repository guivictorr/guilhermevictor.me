'use client';

import { DiscogsRelease } from '@/services/discogs';
import Image from 'next/image';
import Link from 'next/link';
import { useScroll, useTransform, motion, MotionValue } from 'motion/react';
import { useRef } from 'react';

type RecordsListProps = {
  records: DiscogsRelease[];
};

type CardProps = {
  i: number;
  record: DiscogsRelease;
  progress: MotionValue<number>;
  total: number;
};

const Card = ({ i, record, progress, total }: CardProps) => {
  const step = 1 / (total - 1);

  const center = step * i;

  const range = [center - step, center, center + step];

  const scale = useTransform(progress, range, [0.5, 1, 1.5]);
  const opacity = useTransform(progress, range, [0.1, 1, 0]);
  const y = useTransform(progress, range, [0, 0, 1000]);

  return (
    <motion.div
      style={{
        scale,
        opacity,
        y,
        zIndex: total - i,
        animationDuration: '2s',
      }}
      className='absolute inset-0 flex items-center justify-center pointer-events-none'
    >
      <div className='relative size-125 block overflow-hidden rounded-md'>
        <Image
          src={record.basic_information.cover_image}
          alt={record.basic_information.title}
          fill
          className='object-cover'
          priority={i < 2}
        />
      </div>
    </motion.div>
  );
};

export function RecordsList({ records }: RecordsListProps) {
  const container = useRef(null);

  const { scrollYProgress } = useScroll({
    target: container,
    offset: ['start start', 'end end'],
  });

  return (
    <div ref={container} className='grid grid-cols-1 relative'>
      <div className='col-start-1 row-start-1 sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center pointer-events-none'>
        <div className='relative w-full h-full flex items-center justify-center'>
          {records.map((record, i) => (
            <Card
              key={record.id}
              i={i}
              record={record}
              progress={scrollYProgress}
              total={records.length}
            />
          ))}
        </div>
      </div>

      <div className='col-start-1 row-start-1 w-full'>
        {records.map((_, i) => (
          <div key={i} className='h-screen w-full snap-start' />
        ))}
      </div>
    </div>
  );
}
