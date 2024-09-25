import { PropsWithChildren } from 'react';

type ExternalLinkProps = PropsWithChildren & {
  href: string;
};

export const ExternalLink = ({ href, children }: ExternalLinkProps) => {
  return (
    <a
      className='text-primary underline underline-offset-2 focus:text-primary transition-colors duration-300'
      href={href}
      target='_blank'
    >
      {children}
    </a>
  );
};
