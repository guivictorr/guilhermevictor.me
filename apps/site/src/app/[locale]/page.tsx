import { Link } from '@/components/link';
import { MusicHoverCard } from '@/app/[locale]/music-hover-card';

import { getLocale, getTranslations } from 'next-intl/server';
import { Disc3Icon, FileTextIcon, PenLineIcon } from 'lucide-react';
import { getLatestPlayedTrack } from '@/services/lastfm';
import { buildSEO } from '@/app/seo';
import { Metadata } from 'next';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });
  return buildSEO({
    title: 'Guilherme Victor',
    description: t('description'),
    canonical: '/',
    locale,
    dynamic_og: false,
  });
}

export default async function Home() {
  return (
    <main className='grid place-content-center w-screen h-screen'>
      <div className='max-w-xl space-y-2 px-4 sm:px-0'>
        <h1 className='font-serif text-primary text-3xl'>Guilherme Victor</h1>
        <Information />
      </div>
    </main>
  );
}

async function Information() {
  const locale = await getLocale();
  const t = await getTranslations('home-page');
  const track = await getLatestPlayedTrack();
  return (
    <>
      <p className='font-normal text-secondary leading-relaxed'>
        {t.rich('bio', {
          linka: chunks => (
            <Link target='_blank' href={links.linka}>
              {chunks}
            </Link>
          ),
          pecege: chunks => (
            <Link target='_blank' href={links.pecege}>
              {chunks}
            </Link>
          ),
          records: chunks => (
            <Link href={links.records} icon={Disc3Icon}>
              {chunks}
            </Link>
          ),
          writing: chunks => (
            <Link href={links.writing} icon={PenLineIcon}>
              {chunks}
            </Link>
          ),
          song: chunks => (
            <MusicHoverCard track={track}>{chunks}</MusicHoverCard>
          ),
        })}
      </p>
      <p>
        {t.rich('socials', {
          github: chunks => (
            <Link target='_blank' href={links.github}>
              {chunks}
            </Link>
          ),
          linkedin: chunks => (
            <Link target='_blank' href={links.linkedin}>
              {chunks}
            </Link>
          ),
          x: chunks => (
            <Link target='_blank' href={links.x}>
              {chunks}
            </Link>
          ),
          bluesky: chunks => (
            <Link target='_blank' href={links.bluesky}>
              {chunks}
            </Link>
          ),
        })}
      </p>
      <p>
        <Link target='_blank' href={`/cv_${locale}.pdf`} icon={FileTextIcon}>
          {t('cv')}
        </Link>
      </p>
    </>
  );
}

const links = {
  linka: 'https://www.linka.la',
  pecege: 'https://pecege.com',
  records: '/records',
  writing: '/writing',
  github: '/github',
  linkedin: '/linkedin',
  x: '/x',
  bluesky: '/bluesky',
} as const;
