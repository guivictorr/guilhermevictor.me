import { Undo2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

export function HomeButton() {
  const t = useTranslations('components.home-button');
  return (
    <Link
      href='/'
      className='no-underline [&>svg]:w-6 flex items-center gap-1.5 text-secondary w-fit font-serif italic'
    >
      <Undo2 />
      <span>{t('home')}</span>
    </Link>
  );
}
