export default async function sitemap() {
  const routes = ['', '/writing', '/about', '/crafts'].map(route => ({
    url: `https://guilhermevictor.space${route}`,
    lastModified: new Date().toISOString().split('T')[0],
  }));

  return routes;
}
