import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MDX } from '@/components/mdx';
import { getPost, getPosts } from '@/services/content';

import { PiArrowBendUpLeftBold } from 'react-icons/pi';
import { buildSEO } from '@/seo/seo';
import { format, parseISO } from 'date-fns';

type PostPageProps = {
  params: { slug: string };
};

export async function generateStaticParams() {
  return getPosts().map(({ slug }) => ({
    params: { slug },
  }));
}

export async function generateMetadata({ params }: PostPageProps) {
  const post = getPost(params.slug);

  return buildSEO({
    title: post?.metadata.title ?? '',
    description: post?.metadata.description ?? '',
    dynamic_og: true,
  });
}

export default function PostPage({ params }: PostPageProps) {
  const { slug } = params;
  const post = getPost(slug);
  const posts = getPosts();

  if (!post) {
    return notFound();
  }

  const nextItem = posts
    .filter(
      ({ metadata }) =>
        new Date(String(metadata.publishedAt)) >
        new Date(String(post.metadata.publishedAt)),
    )
    .sort(
      (a, b) =>
        new Date(String(a.metadata.publishedAt)).getTime() -
        new Date(String(b.metadata.publishedAt)).getTime(),
    )[0];

  const previousItem = posts
    .filter(
      ({ metadata }) =>
        new Date(String(metadata.publishedAt)) <
        new Date(String(post.metadata.publishedAt)),
    )
    .sort(
      (a, b) =>
        new Date(String(a.metadata.publishedAt)).getTime() -
        new Date(String(b.metadata.publishedAt)).getTime(),
    )[0];

  return (
    <main className='grid grid-cols-1 grid-rows-[max-content_1fr_max-content] md:grid-cols-12 gap-8 md:gap-0'>
      <header className='row-start-1 md:col-start-3 md:col-end-11 md:pt-32 pt-16'>
        <nav className='mb-8'>
          <Link
            href='/'
            className='no-underline [&>svg]:w-6 flex items-center gap-1.5 text-secondary w-fit'
          >
            <PiArrowBendUpLeftBold />
            <span>Home</span>
          </Link>
        </nav>
        <h1 className='text-3xl font-serif text-primary'>
          {post.metadata.title}
        </h1>
        {post.metadata.publishedAt && (
          <time
            className='text-sm text-lowContrast'
            dateTime={post.metadata.publishedAt}
          >
            {format(parseISO(post.metadata.publishedAt), 'MMMM dd, yyyy')}
          </time>
        )}
        <hr className='border-lowContrast/10 mt-8' />
      </header>
      <section className='prose row-start-2 w-full mx-auto md:col-start-3 md:col-end-11'>
        <MDX source={post.content} />
      </section>
      <footer className='row-start-3 md:col-start-3 md:col-end-11 '>
        <hr className='border-lowContrast/10 my-8' />

        <nav className='flex justify-between'>
          {!!previousItem && (
            <Link
              href={String(previousItem.metadata.url)}
              className='no-underline block'
            >
              <span className='text-sm text-lowContrast'>Previous</span>
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
              <span className='text-sm text-lowContrast'>Next</span>
              <span className='block text-primary'>
                {nextItem.metadata.title}
              </span>
            </Link>
          )}
        </nav>
      </footer>
    </main>
  );
}
