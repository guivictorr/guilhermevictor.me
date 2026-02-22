import fs from 'fs';
import path from 'path';

export type Metadata = {
  title: string;
  description: string;
  publishedAt: string;
  url: string;
};

export type MetadataOutput = {
  title: string;
  description: string;
  publishedAt: Date;
  url: string;
  keywords: string[];
};

const parseMetadata = (fileContent: string) => {
  const frontmatterRegex = /---\s*([\s\S]*?)\s*---/;
  const match = frontmatterRegex.exec(fileContent);
  const frontMatterBlock = match![1];
  const content = fileContent.replace(frontmatterRegex, '').trim();
  const frontMatterLines = frontMatterBlock.trim().split('\n');
  const metadata: Metadata = {
    title: '',
    url: '',
    description: '',
    publishedAt: '',
  };

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
  try {
    return fs
      .readdirSync(dir)
      .filter(file => ['.md', '.mdx'].includes(path.extname(file)));
  } catch (error) {
    return [];
  }
};

const getMDXData = (dir: string) => {
  const mdxFiles = getMDXFiles(dir);
  return mdxFiles.map(file => {
    const { metadata, content } = readMDXFile(path.join(dir, file));
    const slug = path.basename(file, path.extname(file));
    return {
      metadata: {
        ...metadata,
        publishedAt: new Date(String(metadata.publishedAt)),
      } as MetadataOutput,
      slug,
      content,
    };
  });
};

export const getPosts = ({ locale }: { locale: string }) => {
  return getMDXData(path.join(process.cwd(), `content/writing/${locale}`)).sort(
    (a, b) => {
      return (
        new Date(String(b.metadata.publishedAt)).getTime() -
        new Date(String(a.metadata.publishedAt)).getTime()
      );
    },
  );
};

export const getPost = ({ locale, slug }: { locale: string; slug: string }) => {
  return getMDXData(path.join(process.cwd(), `content/writing/${locale}`)).find(
    file => file.slug === slug,
  );
};
export type MDXDataProps = NonNullable<ReturnType<typeof getPost>>;
