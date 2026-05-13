import { cn } from '@/lib/utils';
import Image from 'next/image';
import NextLink from 'next/link';
import { ComponentProps, PropsWithChildren } from 'react';
import { type LucideIcon } from 'lucide-react';

type LinkProps = PropsWithChildren &
  ComponentProps<typeof NextLink> & {
    icon?: string | boolean | LucideIcon;
  };

export const Link = ({
  href,
  children,
  className,
  icon = true,
  ...rest
}: LinkProps) => {
  const iconElement = resolveIcon(icon, href.toString());

  return (
    <NextLink
      className={cn(
        'text-primary focus:text-primary no-underline relative hover:text-lowcontrast transition-colors',
        className,
      )}
      href={href}
      rel='noopener'
      {...rest}
    >
      {iconElement}
      {children}
    </NextLink>
  );
};

function getFaviconUrl(href: string): string | null {
  try {
    return `${new URL(href).origin}/favicon.ico`;
  } catch {
    return null;
  }
}

function resolveIconSrc(icon: string | true, href: string): string | null {
  if (typeof icon === 'string') return icon;
  return getFaviconUrl(href);
}

function resolveIcon(icon: LinkProps['icon'], href: string) {
  if (!icon) return null;

  const isComponent = typeof icon !== 'string' && icon !== true;
  if (isComponent) {
    const Icon = icon;
    return (
      <Icon className='size-3 inline align-middle mr-1 mb-1' aria-hidden />
    );
  }

  const src = resolveIconSrc(icon, href);
  if (!src) return null;

  return (
    <Image
      src={src}
      width={12}
      height={12}
      alt=''
      aria-hidden
      className='inline align-baseline mr-1 shrink-0'
      priority
    />
  );
}
