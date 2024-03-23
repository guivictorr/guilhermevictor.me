import { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { MDX } from '@/components/mdx';
import { getPost, getPosts } from '@/services/content';

import { PiArrowUUpLeft } from 'react-icons/pi';
import { buildSEO } from '@/seo/seo';

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

  if (!post) {
    redirect('/');
  }

  return (
    <main className='grid grid-cols-1 grid-rows-[max-content_1fr] md:grid-cols-12 gap-8 md:gap-0'>
      <header className='row-start-1 md:col-start-3 md:col-end-11 md:pt-32 pt-16'>
        <nav className='mb-8'>
          <Link
            href='/'
            className='font-serif no-underline [&>svg]:w-3 italic flex items-center gap-1.5 text-secondary w-fit'
          >
            <PiArrowUUpLeft />
            <span>back</span>
          </Link>
        </nav>
        <h1 className='text-3xl font-serif text-primary'>
          {post.metadata.title}
        </h1>
        <time
          className='text-sm text-lowContrast'
          dateTime={post.metadata.publishedAt}
        >
          {post.metadata.publishedAt}
        </time>
        <hr className='border-lowContrast/10 mt-8' />
      </header>
      <section className='prose row-start-2 w-full mx-auto md:col-start-3 md:col-end-11'>
        <MDX source={post.content} />
      </section>
    </main>
  );
}
