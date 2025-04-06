import { ExternalLink } from '@/components/external-link';
import { Footer } from '@/components/footer';
import { Icon } from '@/components/icon';
import Link from 'next/link';

const links = [
  { label: 'Crafts', href: '/crafts' },
  { label: 'Writing', href: '/writing' },
];

export default async function Home() {
  return (
    <main className='flex flex-col justify-bet gap-4 max-w-xl mx-auto  h-full'>
      <section
        aria-label='Information about Guilherme Victor'
        className='flex flex-col sm:flex-row items-start pb-4 border-b'
      >
        <div>
          <p className='leading-tight'>Guilherme Victor</p>
          <h1 className='flex mb-2 mt-1 flex-col text-2xl sm:text-4xl text-primary font-serif italic'>
            software developer
          </h1>
          <p className='max-w-sm'>
            You can find me on{' '}
            <ExternalLink href='https://x.com/oguivictor'>Twitter</ExternalLink>
            ,{' '}
            <ExternalLink href='https://bsky.app/profile/guilhermevictor.me'>
              Bluesky
            </ExternalLink>{' '}
            or{' '}
            <ExternalLink href='https://linkedin.com/in/guilhermeviictor'>
              Linkedin
            </ExternalLink>{' '}
            and see my code on{' '}
            <ExternalLink href='https://github.com/guivictorr'>
              Github.
            </ExternalLink>
          </p>
          <a
            href='/cv.pdf'
            download='Guilherme_Victor_CV.pdf'
            className='flex items-center gap-1 mt-2'
          >
            <Icon icon='download' />
            Download my CV
          </a>
        </div>
      </section>
      <section aria-label='Main navigation'>
        <nav>
          <ul className='flex flex-col gap-2'>
            {links.map(link => (
              <li
                key={link.href}
                className='hover:bg-secondary/5 rounded-lg px-2 transition-all'
              >
                <Link
                  href={link.href}
                  className='flex items-center justify-between w-full h-10 no-underline'
                >
                  <span>{link.label}</span>
                  <Icon icon='chevron-right' className='size-6' />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </section>
      <Footer />
    </main>
  );
}
