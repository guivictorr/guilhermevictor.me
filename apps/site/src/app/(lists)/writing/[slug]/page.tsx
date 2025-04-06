import { notFound } from 'next/navigation';
import { MDX } from '@/components/mdx';
import { getPost, getPosts } from '@/services/content';

import { buildSEO } from '@/app/seo';
import { PostLayout } from '@/components/post-layout';

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

  return (
    <PostLayout items={posts} currentItem={post}>
      <MDX source={post.content} />
    </PostLayout>
  );
}
