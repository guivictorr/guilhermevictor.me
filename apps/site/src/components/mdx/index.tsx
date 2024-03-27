import { MDXRemote, MDXRemoteProps } from 'next-mdx-remote/rsc';
import { PropsWithChildren, HTMLAttributes } from 'react';
import { highlight } from 'sugar-high';
import { ExternalLink } from '../external-link';
import { ExclusionTabs } from '../crafts/exclusion-tabs';
import { CraftPreview } from '../craft-preview.tsx';

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
  ExclusionTabs: ExclusionTabs,
  CraftPreview: CraftPreview,
};

export const MDX = (props: MDXRemoteProps) => {
  return (
    <article className='prose'>
      <MDXRemote {...props} components={components} />
    </article>
  );
};
