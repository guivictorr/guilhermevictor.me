import { ExternalLink } from '@/components/external-link';
import type { MDXComponents } from 'mdx/types';
import { HTMLAttributes, PropsWithChildren } from 'react';
import { highlight } from 'sugar-high';

type CodeProps = PropsWithChildren & HTMLAttributes<HTMLDivElement>;

function Code({ children, ...props }: CodeProps) {
  if (!children) {
    return null;
  }

  const codeHTML = highlight(children.toString());
  return <code dangerouslySetInnerHTML={{ __html: codeHTML }} {...props} />;
}

// This file is required to use MDX in `app` directory.
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    // Allows customizing built-in components, e.g. to add styling.
    // h1: ({ children }) => <h1 style={{ fontSize: "100px" }}>{children}</h1>,
    a: ({ children, href }) => (
      <ExternalLink href={href ?? '/'}>{children}</ExternalLink>
    ),
    code: Code,
    ...components,
  };
}
