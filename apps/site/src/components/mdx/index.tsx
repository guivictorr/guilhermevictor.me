import { MDXRemote, MDXRemoteProps } from 'next-mdx-remote/rsc';
import { PropsWithChildren, HTMLAttributes } from 'react';
import { highlight } from 'sugar-high';
import { ExternalLink } from '../external-link';

type CodeProps = PropsWithChildren & HTMLAttributes<HTMLDivElement>;
function Code({ children, ...props }: CodeProps) {
  if (!children) {
    return null;
  }

  const codeHTML = highlight(children.toString());
  return <code dangerouslySetInnerHTML={{ __html: codeHTML }} {...props} />;
}

const components: MDXRemoteProps['components'] = {
  code: Code,
  a: ({ children, href }) => (
    <ExternalLink href={href ?? '/'}>{children}</ExternalLink>
  ),
};

export const MDX = (props: MDXRemoteProps) => {
  return (
    <article className='prose'>
      <MDXRemote {...props} components={components} />
    </article>
  );
};
