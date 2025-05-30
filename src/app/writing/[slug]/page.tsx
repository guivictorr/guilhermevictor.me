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

  const headings = getMarkdownTitles(post.content);

  return (
    <div className='lg:grid lg:grid-cols-[70%_30%]'>
      <section
        className={`w-full max-w-4xl mx-auto pt-20 pb-14 px-4 ${
          headings.length === 0 && 'col-span-2'
        }`}
      >
        <Header metadata={post.metadata} />
        <main>
          <hr className='border-secondary/10 my-8' />
          <MDX source={post.content} />
        </main>
        <Footer slug={slug} />
      </section>

      {headings.length > 0 && (
        <aside
          className='hidden lg:block border-l border-l-secondary/10 pt-32 px-14'
          aria-hidden={headings.length === 0}
          aria-labelledby='toc'
        >
          <nav className='relative h-full w-full'>
            <ol className='fixed top-28 space-y-4 list-decimal list-inside'>
              <div>
                <h3 id='toc' className='font-serif text-primary text-2xl'>
                  Índice
                </h3>
              </div>
              {headings.map(heading => (
                <li
                  style={{
                    marginLeft: heading.level === 2 ? 0 : heading.level * 8,
                  }}
                  className='marker:text-lowcontrast'
                  key={heading.id}
                >
                  <a href={heading.id} className='no-underline'>
                    <span className='max-w-[90%] text-secondary hover:text-primary transition'>
                      {heading.text}
                    </span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </aside>
      )}
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
          className='text-sm text-secondary capitalize'
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
    <footer>
      <hr className='border-secondary/10 my-8' />

      <nav className='flex justify-between'>
        {!!previousItem && (
          <Link
            href={String(previousItem.metadata.url)}
            className='no-underline block'
          >
            <span className='text-sm text-secondary'>Anterior</span>
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
            <span className='text-sm text-secondary'>Próximo</span>
            <span className='block text-primary'>
              {nextItem.metadata.title}
            </span>
          </Link>
        )}
      </nav>
    </footer>
  );
}
