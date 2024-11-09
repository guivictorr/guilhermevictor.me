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
      className={`text-primary underline underline-offset-2 focus:text-primary transition-colors duration-300 ${className}`}
      href={href}
      target='_blank'
    >
      {children}
    </a>
  );
};
