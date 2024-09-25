const OMNIVORE_API_URL = 'https://api-prod.omnivore.app/api/graphql';
const OMNIVORE_API_KEY = process.env.OMNIVORE_API_KEY;

import fs from 'fs';

// Type definition for Bookmark
type Bookmark = {
  id: string;
  title: string;
  slug: string;
  createdAt: string;
  updatedAt?: string;
  description?: string;
  originalArticleUrl?: string;
  labels: string[];
  savedAt: string;
};

// Function to fetch bookmarks from the API
async function fetchBookmarks(): Promise<any> {
  const query = `
    query {
      search(first: 1000, query: "", includeContent: false, format: "JSON") {
        ... on SearchSuccess {
          edges {
            node {
              id
              title
              slug
              createdAt
              updatedAt
              description
              originalArticleUrl
              labels {
                name
              }
              savedAt
            }
          }
        }
        ... on SearchError {
          errorCodes
        }
      }
    }
  `;

  const response = await fetch(OMNIVORE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: String(OMNIVORE_API_KEY),
    },
    body: JSON.stringify({ query }),
  });

  const jsonResponse = await response.json();

  return jsonResponse;
}

// Function to map the GraphQL response to the desired bookmark structure
function mapBookmarksData(data: any): Bookmark[] {
  if (data.search.__typename === 'SearchError') {
    throw new Error(
      'Failed to fetch bookmarks: ' + data.search.errorCodes.join(', '),
    );
  }

  return data.search.edges.map((edge: any) => ({
    id: edge.node.id,
    title: edge.node.title,
    slug: edge.node.slug,
    createdAt: edge.node.createdAt,
    updatedAt: edge.node.updatedAt,
    description: edge.node.description,
    originalArticleUrl: edge.node.originalArticleUrl,
    labels: edge.node.labels.map((label: any) => label.name),
    savedAt: edge.node.savedAt,
  }));
}

// IIFE to fetch, map, and save the bookmarks data to a JSON file
(async () => {
  try {
    const apiResponse = await fetchBookmarks();
    const bookmarks = mapBookmarksData(apiResponse.data);

    // Write the bookmarks to a JSON file
    fs.writeFileSync(
      'bookmarks.json',
      JSON.stringify(bookmarks, null, 2),
      'utf-8',
    );
    console.log('Bookmarks data saved to bookmarks.json');
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
  }
})();
