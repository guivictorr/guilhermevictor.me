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
    <article aria-labelledby={titleId}>
      <p className='text-sm' id={titleId}>
        {title}
      </p>
      <ul className='mt-3 space-y-6'>
        {isEmpty ? <li>No content</li> : children}
      </ul>
    </article>
  );
};

type ListItemProps = {
  title: string;
  description: string;
  href: string;
};

const ListItem = ({ title, description, href }: ListItemProps) => {
  const LinkComponent = href.includes('https://') ? ExternalLink : Link;

  return (
    <li>
      <LinkComponent href={href} className='text-primary'>
        {title}
      </LinkComponent>
      <p className='text-sm'>{description}</p>
    </li>
  );
};

ListColumn.Item = ListItem;
