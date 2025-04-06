import { MDXDataProps } from '@/services/content';
import { format } from 'date-fns';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Fragment, PropsWithChildren } from 'react';

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
    <Fragment>
      <header className='mt-6'>
        <h1 className='text-3xl font-serif text-primary'>
          {currentItem.metadata.title}
        </h1>
        {currentItem.metadata.publishedAt && (
          <time
            className='text-sm text-secondary'
            dateTime={currentItem.metadata.publishedAt.toString()}
          >
            {format(currentItem.metadata.publishedAt, 'MMMM dd, yyyy')}
          </time>
        )}
      </header>
      <hr className='border-secondary/10 my-8' />
      <section>{children}</section>
      <footer className='md:pb-32 pb-16'>
        <hr className='border-secondary/10 my-8' />

        <nav className='flex justify-between'>
          {!!previousItem && (
            <Link
              href={String(previousItem.metadata.url)}
              className='no-underline block'
            >
              <span className='text-sm text-secondary'>Previous</span>
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
              <span className='text-sm text-secondary'>Next</span>
              <span className='block text-primary'>
                {nextItem.metadata.title}
              </span>
            </Link>
          )}
        </nav>
      </footer>
    </Fragment>
  );
};
