import { MDXDataProps } from '@/services/content';
import { format, parseISO } from 'date-fns';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PropsWithChildren } from 'react';
import { PiArrowBendUpLeftBold } from 'react-icons/pi';

type PostLayoutProps = {
  items: MDXDataProps[];
  currentItem: MDXDataProps;
} & PropsWithChildren;

export const PostLayout = ({
  children,
  currentItem,
  items,
}: PostLayoutProps) => {
  if (!currentItem) {
    return notFound();
  }

  const nextItem = items
    .filter(
      ({ metadata }) =>
        new Date(String(metadata.publishedAt)) >
        new Date(String(currentItem.metadata.publishedAt)),
    )
    .sort(
      (a, b) =>
        new Date(String(a.metadata.publishedAt)).getTime() -
        new Date(String(b.metadata.publishedAt)).getTime(),
    )[0];

  const previousItem = items
    .filter(
      ({ metadata }) =>
        new Date(String(metadata.publishedAt)) <
        new Date(String(currentItem.metadata.publishedAt)),
    )
    .sort(
      (a, b) =>
        new Date(String(a.metadata.publishedAt)).getTime() -
        new Date(String(b.metadata.publishedAt)).getTime(),
    )[0];

  return (
    <main className='grid grid-cols-1 grid-rows-[max-content_1fr_max-content] md:grid-cols-12 gap-8 md:gap-0'>
      <header className='row-start-1 md:col-start-3 md:col-end-11 md:pt-32 pt-16'>
        <nav className='mb-8'>
          <Link
            href='/'
            className='no-underline [&>svg]:w-6 flex items-center gap-1.5 text-secondary w-fit'
          >
            <PiArrowBendUpLeftBold />
            <span>Home</span>
          </Link>
        </nav>
        <h1 className='text-3xl font-serif text-primary'>
          {currentItem.metadata.title}
        </h1>
        {currentItem.metadata.publishedAt && (
          <time
            className='text-sm text-lowContrast'
            dateTime={currentItem.metadata.publishedAt}
          >
            {format(
              parseISO(currentItem.metadata.publishedAt),
              'MMMM dd, yyyy',
            )}
          </time>
        )}
        <hr className='border-lowContrast/10 mt-8' />
      </header>
      <section className='prose row-start-2 w-full mx-auto md:col-start-3 md:col-end-11'>
        {children}
      </section>
      <footer className='row-start-3 md:col-start-3 md:col-end-11 '>
        <hr className='border-lowContrast/10 my-8' />

        <nav className='flex justify-between'>
          {!!previousItem && (
            <Link
              href={String(previousItem.metadata.url)}
              className='no-underline block'
            >
              <span className='text-sm text-lowContrast'>Previous</span>
              <span className='block text-primary'>
                {previousItem.metadata.title}
              </span>
            </Link>
          )}
          <div className='grow' />
          {!!nextItem && (
            <Link
              href={String(nextItem.metadata.url)}
              className='no-underline block text-end'
            >
              <span className='text-sm text-lowContrast'>Next</span>
              <span className='block text-primary'>
                {nextItem.metadata.title}
              </span>
            </Link>
          )}
        </nav>
      </footer>
    </main>
  );
};
