import Link from 'next/link';
import { ThemeSwitcher } from './theme-switcher';

export function NavigationMenu() {
  const pages = [
    {
      href: '/',
      label: 'Home',
    },
    {
      href: '/writing',
      label: 'Posts',
    },
  ];
  return (
    <div className='fixed bottom-8 left-1/2 -translate-x-1/2 z-20 bg-background border rounded-full'>
      <div className='flex items-center divide-x divide-x-secondary/10'>
        {pages.length && (
          <nav className='px-3 py-1'>
            <ul className='flex items-center gap-4'>
              {pages.map(page => (
                <li key={page.href} className='text-sm'>
                  <Link
                    className='no-underline text-sm text-secondary hover:text-primary transition'
                    href={page.href}
                  >
                    {page.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
        <div className='pr-1 py-1 pl-3'>
          <ThemeSwitcher />
        </div>
      </div>
    </div>
  );
}
