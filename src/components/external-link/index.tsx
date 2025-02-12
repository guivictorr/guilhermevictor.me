import { PropsWithChildren } from 'react';

type ExternalLinkProps = PropsWithChildren & {
  href: string;
  className?: string;
};

export const ExternalLink = ({
  href,
  children,
  className,
}: ExternalLinkProps) => {
  return (
    <a
      className={`text-primary focus:text-primary ${className}`}
      href={href}
      target='_blank'
    >
      {children}
    </a>
  );
};
