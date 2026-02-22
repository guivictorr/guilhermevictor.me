import { ExternalLink } from '@/components/external-link';
import Link from 'next/link';

import { getPosts } from '@/services/content';
import { Disc3, DownloadIcon } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import { Time } from '@/components/time';
import { getLatestPlayedTrack } from '@/services/lastfm';

type HomeProps = {
  params: Promise<{ locale: string }>;
};

export default async function Home({ params }: HomeProps) {
  const { locale } = await params;
  const t = await getTranslations('home-page');
  return (
    <div className='space-y-8 max-w-xl mx-auto pt-20 md:pt-28 px-8 sm:px-0'>
      <main className='space-y-8'>
        <section>
          <div>
            <p className='leading-tight'>Guilherme Victor</p>
            <h1 className='mt-1 flex-col text-2xl sm:text-4xl text-primary font-serif italic'>
              {t('software-developer')}
            </h1>
            <Link
              href='/records'
              className='group no-underline flex items-center gap-2 text-2xl sm:text-4xl text-primary font-serif italic leading-0 w-fit'
            >
              {t('record-collector')}
              <Disc3 className='group-hover:rotate-180 transition-[rotate] duration-300 ease-in-out size-8!' />
            </Link>
            <p className='mb-2 flex-col text-2xl sm:text-4xl text-primary font-serif italic'>
              neovim user
            </p>
            <p className='max-w-sm'>
              {t.rich('social-media', {
                twitter: chunks => (
                  <ExternalLink href='/x'>{chunks}</ExternalLink>
                ),
                bluesky: chunks => (
                  <ExternalLink href='/bluesky'>{chunks}</ExternalLink>
                ),
                linkedin: chunks => (
                  <ExternalLink href='/linkedin'>{chunks}</ExternalLink>
                ),
                github: chunks => (
                  <ExternalLink href='/github'>{chunks}</ExternalLink>
                ),
              })}
            </p>
            <a
              href={`/cv_${locale}.pdf`}
              download='Guilherme_Victor_CV.pdf'
              className='flex items-center gap-1 mt-2 w-fit'
            >
              <DownloadIcon />
              {t('download-cv')}
            </a>
          </div>
        </section>
        <section>
          <Posts />
        </section>
      </main>
      <Footer />
    </div>
  );
}

async function Posts() {
  const locale = await getLocale();
  const posts = getPosts({ locale }).map(post => post.metadata);
  const groupedPostsByYear = Object.groupBy(posts, post =>
    new Date(post.publishedAt).getFullYear().toString(),
  );
  return (
    <nav>
      <ul className='flex flex-col gap-4'>
        {Object.entries(groupedPostsByYear)
          .reverse()
          .map(([year, posts]) => (
            <li key={year} className='relative'>
              <span className='text-sm text-secondary mb-1 block'>{year}</span>
              <ul>
                {posts?.map(post => (
                  <li key={post.title}>
                    <Link
                      href={post.url ?? ''}
                      className='flex items-center w-full gap-2 justify-between py-2 no-underline'
                    >
                      <span className='transition line-clamp-1'>
                        {post.title}
                      </span>
                      {!!post.publishedAt && (
                        <Time>{post.publishedAt.toISOString()}</Time>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          ))}
      </ul>
    </nav>
  );
}

function Footer() {
  return (
    <footer className='flex items-center pb-14 sm:pb-0 w-full justify-between gap-4'>
      <Player />
      <p className='text-xs text-secondary ml-auto'>
        {new Date().getFullYear()}
      </p>
    </footer>
  );
}

async function Player() {
  const t = await getTranslations('home-page');
  const track = await getLatestPlayedTrack();

  return (
    <section
      aria-label={t('a11y.last-played-song', {
        song: track.song,
        artist: track.artist,
      })}
      className='flex gap-2 items-center'
    >
      <div>
        <p className='text-xs text-secondary'>{t('last-played-song')}</p>
        <p className='line-clamp-1 max-w-xs text-sm text-secondary'>
          {track.artist} - {track.song}
        </p>
      </div>
    </section>
  );
}
