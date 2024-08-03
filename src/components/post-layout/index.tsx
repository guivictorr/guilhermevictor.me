import { MDXDataProps } from '@/services/content';
import { format } from 'date-fns';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PropsWithChildren } from 'react';
import { PiArrowBendUpLeftBold } from 'react-icons/pi';

type PostLayoutProps = {
  items: MDXDataProps[];
  currentItem: MDXDataProps;
  backLabel: string;
  backLink: string;
} & PropsWithChildren;

export const PostLayout = ({
  children,
  currentItem,
  items,
  backLabel,
  backLink,
}: PostLayoutProps) => {
  if (!currentItem) {
    return notFound();
  }

  const nextItem = items.filter(
    ({ metadata }) =>
      new Date(String(metadata.publishedAt)) >
      new Date(String(currentItem.metadata.publishedAt)),
  )[0];

  const previousItem = items.filter(
    ({ metadata }) =>
      new Date(String(metadata.publishedAt)) <
      new Date(String(currentItem.metadata.publishedAt)),
  )[0];

  return (
    <div className='max-w-2xl mx-auto'>
      <header>
        <nav className='mb-8'>
          <Link
            href={backLink}
            className='no-underline [&>svg]:w-6 flex items-center gap-1.5 text-secondary w-fit font-serif italic'
          >
            <PiArrowBendUpLeftBold />
            <span>{backLabel}</span>
          </Link>
        </nav>
        <h1 className='text-3xl font-serif text-primary'>
          {currentItem.metadata.title}
        </h1>
        {currentItem.metadata.publishedAt && (
          <time
            className='text-sm text-lowContrast'
            dateTime={currentItem.metadata.publishedAt.toString()}
          >
            {format(currentItem.metadata.publishedAt, 'MMMM dd, yyyy')}
          </time>
        )}
        <hr className='border-lowContrast/10 my-8' />
      </header>
      <main>{children}</main>
      <footer className='md:pb-32 pb-16'>
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
    </div>
  );
};
