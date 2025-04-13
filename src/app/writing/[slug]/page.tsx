import { MDX } from '@/components/mdx';
import { getPost, getPosts, MetadataOutput } from '@/services/content';

import { buildSEO } from '@/app/seo';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Icon } from '@/components/icon';
import { format } from 'date-fns';

type PostPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return getPosts().map(({ slug }) => ({
    slug,
  }));
}

export async function generateMetadata(props: PostPageProps) {
  const params = await props.params;
  const post = getPost(params.slug);

  return buildSEO({
    title: post?.metadata.title ?? '',
    description: post?.metadata.description ?? '',
    dynamic_og: true,
    alternates: {
      canonical: `/writing/${post?.slug}`,
    },
  });
}
type MarkdownTitle = {
  level: number;
  text: string;
  id: string;
};
function getMarkdownTitles(markdown: string): MarkdownTitle[] {
  const lines = markdown.split('\n');
  const titles: MarkdownTitle[] = [];

  for (const line of lines) {
    const match = line.match(/^(#{1,6})\s+(.*)$/);
    if (match) {
      titles.push({
        level: match[1].length,
        text: match[2].trim(),
        id: `#${String(match[2].trim()).toLowerCase().replace(/ /gi, '-')}`,
      });
    }
  }

  return titles;
}

export default async function PostPage(props: PostPageProps) {
  const params = await props.params;
  const { slug } = params;
  const post = getPost(slug);

  if (!post) {
    return notFound();
  }

  const headings = [
    {
      level: 1,
      id: '#index',
      text: post.metadata.title,
    },
    ...getMarkdownTitles(post.content),
  ];

  return (
    <div className='lg:grid lg:grid-cols-[20%_60%_20%] place-content-center mx-auto mt-32 max-w-6xl'>
      <aside
        className='hidden lg:block'
        aria-hidden={headings.length === 0}
        aria-label='Table of contents'
      >
        <nav className='relative h-full'>
          <ul className='sticky top-20 left-0 space-y-2'>
            {headings.map(heading => (
              <li key={heading.id}>
                <a
                  href={heading.id}
                  className='no-underline text-lowcontrast hover:text-primary transition'
                >
                  <span className='line-clamp-1 max-w-[90%]'>
                    {heading.text}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <section className='w-full'>
        <Header metadata={post.metadata} />
        <main>
          <hr className='border-secondary/10 my-8' />
          <MDX source={post.content} />
        </main>
        <Footer slug={slug} />
      </section>
    </div>
  );
}

function Header({ metadata }: { metadata: MetadataOutput }) {
  return (
    <header>
      <nav className='mb-6'>
        <Link
          href='/'
          className='no-underline [&>svg]:w-6 flex items-center gap-1.5 text-secondary w-fit font-serif italic'
        >
          <Icon icon='back' />
          <span>Home</span>
        </Link>
      </nav>
      <h1 className='text-3xl font-serif text-primary'>
        <a className='no-underline text-primary' id='index'>
          <span>{metadata.title}</span>
        </a>
      </h1>
      {metadata.publishedAt && (
        <time
          className='text-sm text-secondary'
          dateTime={metadata.publishedAt.toString()}
        >
          {format(metadata.publishedAt, 'MMMM dd, yyyy')}
        </time>
      )}
    </header>
  );
}

function Footer({ slug }: { slug: string }) {
  const posts = getPosts();
  const currentItemIndex = posts.findIndex(p => p.slug === slug);
  const nextItem = posts[currentItemIndex - 1];
  const previousItem = posts[currentItemIndex + 1];

  return (
    <footer className='md:pb-32 pb-16'>
      <hr className='border-secondary/10 my-8' />

      <nav className='flex justify-between'>
        {!!previousItem && (
          <Link
            href={String(previousItem.metadata.url)}
            className='no-underline block'
          >
            <span className='text-sm text-secondary'>Previous</span>
            <span className='block text-primary'>
              {previousItem.metadata.title}
            </span>
          </Link>
        )}
        <div className='grow' />
        {!!nextItem && (
          <Link
            href={String(nextItem.metadata.url)}
            className='no-underline block text-end'
          >
            <span className='text-sm text-secondary'>Next</span>
            <span className='block text-primary'>
              {nextItem.metadata.title}
            </span>
          </Link>
        )}
      </nav>
    </footer>
  );
}
