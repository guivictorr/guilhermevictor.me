import { Icon } from '@/components/icon';
import Link from 'next/link';

const links = [
  {
    label: 'Linkedin',
    href: 'https://linkedin.com/in/guilhermeviictor',
  },
  {
    label: 'Github',
    href: 'https://github.com/guivictorr',
  },
  {
    label: 'Bluesky',
    href: 'https://bsky.app/profile/guilhermevictor.me',
  },
  {
    label: 'X (Twitter)',
    href: 'https://x.com/oguivictor',
  },
];

export default function Links() {
  return (
    <div className='max-w-2xl mt-8 mx-auto space-y-8'>
      <header>
        <nav className='flex flex-col text-center md:flex-row md:text-left gap-8 items-center justify-between'>
          <Link href='/' className='no-underline'>
            <p className='text-primary'>Guilherme Victor</p>
            <p className='font-serif italic'>software developer</p>
          </Link>

          <ul className='font-serif italic flex items-center gap-4'>
            <li>
              <Link href='/writing'>/writing</Link>
            </li>
            <li>
              <Link href='/crafts'>/crafts</Link>
            </li>
          </ul>
        </nav>
      </header>

      <main>
        <ul>
          {links.map(link => (
            <li key={link.label} className='border-b'>
              <Link
                href={link.href}
                target='_blank'
                className='no-underline flex items-center justify-between size-full py-4'
              >
                <p>{link.label}</p>
                <Icon icon='external' />
              </Link>
            </li>
          ))}
        </ul>
      </main>
      <footer>
        <Link
          href='/cv_en.pdf'
          download='Guilherme_Victor_CV.pdf'
          target='_blank'
          className='font-serif flex items-center justify-center ml-auto italic h-14 bg-primary text-background px-12'
        >
          Download my CV
        </Link>
      </footer>
    </div>
  );
}
