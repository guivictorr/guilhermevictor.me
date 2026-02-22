import { DateTimeFormatOptions, useFormatter } from 'next-intl';
import { PropsWithChildren } from 'react';

export function Time({
  children,
  ...dateFormatOptions
}: PropsWithChildren & DateTimeFormatOptions) {
  const format = useFormatter();
  if (typeof children !== 'string') return null;
  const date = new Date(children);
  const formattedDate = format.dateTime(date, {
    month: 'long',
    day: 'numeric',
    ...dateFormatOptions,
  });
  return (
    <time dateTime={children} className='text-sm'>
      {formattedDate}
    </time>
  );
}
