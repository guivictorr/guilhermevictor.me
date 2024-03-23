import fs from 'fs';
import path from 'path';

type Metadata = {
  title: string;
  description: string;
  publishedAt: string;
  url: string;
};

const parseMetadata = (fileContent: string) => {
  const frontmatterRegex = /---\s*([\s\S]*?)\s*---/;
  const match = frontmatterRegex.exec(fileContent);
  const frontMatterBlock = match![1];
  const content = fileContent.replace(frontmatterRegex, '').trim();
  const frontMatterLines = frontMatterBlock.trim().split('\n');
  const metadata: Partial<Metadata> = {};

  frontMatterLines.forEach(line => {
    const [key, ...valueArr] = line.split(': ');
    let value = valueArr.join(': ').trim();
    value = value.replace(/^['"](.*)['"]$/, '$1'); // Remove quotes
    metadata[key.trim() as keyof Metadata] = value;
  });

  return { metadata, content };
};

const readMDXFile = (filePath: string) => {
  const rawContent = fs.readFileSync(filePath, 'utf-8');
  return parseMetadata(rawContent);
};

const getMDXFiles = (dir: string) => {
  return fs.readdirSync(dir).filter(file => path.extname(file) === '.mdx');
};

const getMDXData = (dir: string) => {
  const mdxFiles = getMDXFiles(dir);
  return mdxFiles.map(file => {
    const { metadata, content } = readMDXFile(path.join(dir, file));
    const slug = path.basename(file, path.extname(file));
    return {
      metadata,
      slug,
      content,
    };
  });
};

export const getPosts = () => {
  return getMDXData(path.join(process.cwd(), 'content'));
};

export const getPost = (slug: string) => {
  return getMDXData(path.join(process.cwd(), 'content')).find(
    file => file.slug === slug,
  );
};
export type MDXDataProps = NonNullable<ReturnType<typeof getPost>>;
