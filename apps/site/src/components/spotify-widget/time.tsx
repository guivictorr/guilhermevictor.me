'use client';

import { formatRelative } from 'date-fns';

export const Time = ({ dateTime }: { dateTime: string }) => {
  const formattedDate = formatRelative(new Date(dateTime), Date.now());
  return <time dateTime={new Date(dateTime).toString()}>{formattedDate}</time>;
};
