import { PropsWithChildren } from 'react';
import { GoArrowUpRight } from 'react-icons/go';

type ExternalLinkProps = PropsWithChildren & {
  href: string;
};

export const ExternalLink = ({ href, children }: ExternalLinkProps) => {
  return (
    <a
      className='text-secondary underline underline-offset-2 focus:text-primary transition-colors duration-300'
      href={href}
      target='_blank'
    >
      {children}

      <span aria-hidden className='[&>svg]:inline'>
        &nbsp;
        <GoArrowUpRight />
      </span>
    </a>
  );
};
