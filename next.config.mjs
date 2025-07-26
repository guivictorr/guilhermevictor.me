// @ts-check

/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  experimental: {
    viewTransition: true,
  },
  async redirects() {
    return [
      {
        source: '/bluesky',
        destination: 'https://bsky.app/profile/guilhermevictor.me',
        permanent: true,
      },
      {
        source: '/linkedin',
        destination: 'https://linkedin.com/in/guilhermeviictor',
        permanent: true,
      },
      {
        source: '/github',
        destination: 'https://github.com/guivictorr',
        permanent: true,
      },
      {
        source: '/twitter',
        destination: 'https://x.com/oguivictor',
        permanent: true,
      },
      {
        source: '/x',
        destination: 'https://x.com/oguivictor',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
