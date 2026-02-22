import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';
import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export default getRequestConfig(async ({ requestLocale }) => {
  // Typically corresponds to the `[locale]` segment
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
    // ...
  };
});
export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ['en', 'pt-br'],

  // Used when no locale matches
  defaultLocale: 'en',
});
// Lightweight wrappers around Next.js' navigation
// APIs that consider the routing configuration
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
