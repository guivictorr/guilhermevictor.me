import Link from 'next/link';
import { Children, PropsWithChildren, useId } from 'react';
import { ExternalLink } from '../external-link';

type ArticleProps = PropsWithChildren & {
  title: string;
};

export const ListColumn = ({ title, children }: ArticleProps) => {
  const titleId = useId();
  const isEmpty = Children.count(children) <= 0;

  return (
    <section aria-labelledby={titleId}>
      <p aria-hidden className='text-sm' id={titleId}>
        {title}
      </p>
      <ul className='mt-3'>{isEmpty ? <li>No content</li> : children}</ul>
    </section>
  );
};

type ListItemProps = {
  title: string;
  href: string;
};

export const ListItem = ({ title, href }: ListItemProps) => {
  const LinkComponent = href.includes('https://') ? ExternalLink : Link;

  return (
    <li className='line-clamp-1'>
      <LinkComponent href={href} className='text-primary mt-3 block'>
        {title}
      </LinkComponent>
    </li>
  );
};
