import fs from 'fs';
import path from 'path';
import { BuildSEOParams } from '@/seo/seo';

const parseMetadata = (rawContent: string): BuildSEOParams | null => {
  const metadataRegex = /buildSEO\(([^)]+)\)/;
  const match = rawContent.match(metadataRegex);

  if (!match) {
    console.error('No match found');
    return null;
  }

  try {
    const seoObject = eval('(' + match[1] + ')');
    if (typeof seoObject === 'object' && seoObject !== null) {
      return seoObject as BuildSEOParams;
    } else {
      throw new Error('Invalid object format');
    }
  } catch (error) {
    console.error('Error parsing metadata', error);
    return null;
  }
};

const readMDXFile = (filePath: string) => {
  const rawContent = fs.readFileSync(filePath, 'utf-8');
  return parseMetadata(rawContent);
};

const getMDXFiles = (dir: string) => {
  const files: string[] = [];

  const traverseDirectory = (currentDir: string) => {
    const items = fs.readdirSync(currentDir);

    for (const item of items) {
      const itemPath = path.join(currentDir, item);
      const stats = fs.statSync(itemPath);

      if (stats.isDirectory()) {
        traverseDirectory(itemPath); // Recursively traverse subdirectories
      } else if (stats.isFile() && item === 'page.mdx') {
        files.push(itemPath); // Add file path to the list
      }
    }
  };

  traverseDirectory(dir); // Start traversal from the specified directory
  return files;
};

const getMDXData = (dir: string) => {
  const mdxFiles = getMDXFiles(dir);
  return mdxFiles.map(file => {
    const metadata = readMDXFile(file);

    const path = file.split('/');
    const slug = path[path.length - 2];

    return {
      title: metadata?.title ?? '',
      description: metadata?.description ?? '',
      url: metadata?.url ?? '',
      slug,
      publishedAt: metadata?.other?.publishedAt,
    };
  });
};

export const getPosts = () => {
  return getMDXData(path.join(process.cwd(), 'src/app/writing'));
};

export const getPost = (slug: string) => {
  return getMDXData(path.join(process.cwd(), `src/app/writing/${slug}`))[0];
};
