import { MDX } from '@/components/mdx';
import { getPost, getPosts } from '@/services/content';

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

export default async function PostPage(props: PostPageProps) {
  const params = await props.params;
  const { slug } = params;
  const post = getPost(slug);
  const posts = getPosts();

  if (!post) {
    return notFound();
  }

  const nextItemIndex = posts.findIndex(p => p.slug === slug);
  const nextItem = posts[nextItemIndex - 1];

  const previousItem = posts.filter(
    ({ metadata }) =>
      new Date(String(metadata.publishedAt)) <
      new Date(String(post.metadata.publishedAt)),
  )[0];

  return (
    <div className='max-w-2xl mx-auto'>
      <nav>
        <Link
          href='/'
          className='no-underline [&>svg]:w-6 flex items-center gap-1.5 text-secondary w-fit font-serif italic'
        >
          <Icon icon='back' />
          <span>Home</span>
        </Link>
      </nav>
      <main>
        <header className='mt-6'>
          <h1 className='text-3xl font-serif text-primary'>
            {post.metadata.title}
          </h1>
          {post.metadata.publishedAt && (
            <time
              className='text-sm text-secondary'
              dateTime={post.metadata.publishedAt.toString()}
            >
              {format(post.metadata.publishedAt, 'MMMM dd, yyyy')}
            </time>
          )}
        </header>
        <hr className='border-secondary/10 my-8' />
        <MDX source={post.content} />
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
      </main>
    </div>
  );
}
