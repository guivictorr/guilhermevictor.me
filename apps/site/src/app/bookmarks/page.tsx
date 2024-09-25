import { format } from 'date-fns';
import bookmarksJson from './bookmarks.json';
import Link from 'next/link';
import { PiArrowBendUpLeftBold } from 'react-icons/pi';

export default function Bookmarks() {
  return (
    <div className='max-w-2xl mx-auto md:pb-32 pb-16'>
      <header>
        <nav className='mb-8'>
          <Link
            href='/'
            className='no-underline [&>svg]:w-6 flex items-center gap-1.5 text-secondary w-fit font-serif italic'
          >
            <PiArrowBendUpLeftBold />
            <span>Back</span>
          </Link>
        </nav>
        <h1 className='text-3xl font-serif text-primary'>Bookmarks</h1>

        <time
          className='text-sm text-lowContrast'
          dateTime={bookmarksJson.lastUpdate}
        >
          Last Update:{' '}
          {format(new Date(bookmarksJson.lastUpdate), 'MMMM dd, yyyy')}
        </time>
        <hr className='border-lowContrast/10 my-8' />
      </header>

      <ul className='space-y-4'>
        {bookmarksJson.data.map(bookmark => (
          <li key={bookmark.id}>
            <Link className='line-clamp-1' href={bookmark.originalArticleUrl}>
              {bookmark.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
