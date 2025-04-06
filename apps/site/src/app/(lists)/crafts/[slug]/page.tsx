import { notFound } from 'next/navigation';
import { MDX } from '@/components/mdx';
import { getCraft, getCrafts } from '@/services/content';

import { buildSEO } from '@/app/seo';
import { PostLayout } from '@/components/post-layout';

type CraftPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return getCrafts().map(({ slug }) => ({
    slug,
  }));
}

export async function generateMetadata(props: CraftPageProps) {
  const params = await props.params;
  const post = getCraft(params.slug);

  return buildSEO({
    title: post?.metadata.title ?? '',
    description: post?.metadata.description ?? '',
    dynamic_og: true,
  });
}

export default async function CraftPage(props: CraftPageProps) {
  const params = await props.params;
  const { slug } = params;
  const craft = getCraft(slug);
  const crafts = getCrafts();

  if (!craft) {
    return notFound();
  }

  return (
    <PostLayout
      backLink='/crafts'
      backLabel='Crafts'
      items={crafts}
      currentItem={craft}
    >
      <MDX source={craft.content} />
    </PostLayout>
  );
}
