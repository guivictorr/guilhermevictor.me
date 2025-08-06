import { MDXRemote, MDXRemoteProps } from 'next-mdx-remote/rsc';
import { PropsWithChildren, HTMLAttributes, ReactNode } from 'react';
import { highlight } from 'sugar-high';
import { ExternalLink } from './external-link';
import { ExclusionTabs } from './exclusion-tabs';
import { ThemeSwitcher } from './theme-switcher';
import { Pre } from './pre';
import { TextReveal } from './text-reveal';

type CodeProps = PropsWithChildren & HTMLAttributes<HTMLDivElement>;
function Code({ children, ...props }: CodeProps) {
  if (!children) {
    return null;
  }

  const codeHTML = highlight(children.toString());
  return (
    <>
      <code dangerouslySetInnerHTML={{ __html: codeHTML }} {...props} />
      <span aria-hidden className='hidden' id='raw'>
        {children.toString()}
      </span>
    </>
  );
}

type HeadingProps = {
  level: 'h1' | 'h2';
  children: ReactNode;
} & HTMLHeadingElement;

function Heading({ level: Slot, children }: HeadingProps) {
  const id = String(children).toLowerCase().replace(/ /gi, '-');
  return (
    <Slot>
      <a className='no-underline text-primary' id={id}>
        <span>{children}</span>
      </a>
    </Slot>
  );
}

function CraftPreview({ children }: PropsWithChildren) {
  return (
    <div className='relative border bg-background border-secondary/10 rounded-md p-14 md:p-8 overflow-x-auto flex items-center justify-center'>
      {children}
    </div>
  );
}

function Callout({ children }: PropsWithChildren) {
  return (
    <aside className='border border-secondary/10 bg-primary/10 rounded-md px-6 py-4 gap-4 flex flex-col *:m-0 relative overflow-hidden'>
      <div
        aria-hidden
        className='w-1 h-full bg-lowcontrast absolute left-0 top-0'
      ></div>
      {children}
    </aside>
  );
}

const components: MDXRemoteProps['components'] = {
  code: Code,
  pre: Pre,
  ExclusionTabs: ExclusionTabs,
  ThemeSwitcher: ThemeSwitcher,
  TextReveal: TextReveal,
  CraftPreview: CraftPreview,
  a: ({ children, href }) => (
    <ExternalLink href={href ?? '/'}>{children}</ExternalLink>
  ),
  h1: props => <Heading level='h1' {...props} />,
  h2: props => <Heading level='h2' {...props} />,
  h3: props => <Heading level='h3' {...props} />,
  h4: props => <Heading level='h4' {...props} />,
  h5: props => <Heading level='h5' {...props} />,
  h6: props => <Heading level='h6' {...props} />,
  Callout: Callout,
};

export const MDX = (props: MDXRemoteProps) => {
  return (
    <article className='prose prose-sm md:prose-base lg:prose-lg'>
      <MDXRemote {...props} components={components} />
    </article>
  );
};
