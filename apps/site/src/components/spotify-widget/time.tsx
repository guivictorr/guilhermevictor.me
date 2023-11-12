'use client';

import { formatRelative } from 'date-fns';

export const Time = ({ dateTime }: { dateTime: string }) => {
  const formattedDate = formatRelative(new Date(dateTime), Date.now());
  return <time className='text-secondary text-sm mt-0.5'>{formattedDate}</time>;
};
