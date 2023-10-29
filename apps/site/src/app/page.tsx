export default function Home() {
  return (
    <main className='flex h-screen flex-col items-center justify-between bg-yellow-950 px-4 py-8 text-orange-200'>
      <header className='grid h-[80px] place-items-center'>
        <span className='rounded-md border border-orange-300 p-0.5 px-1.5  text-sm text-orange-300'>
          <abbr className='no-underline' title='Work in progress'>
            wip
          </abbr>
        </span>
      </header>
      <section className='space-y-6 text-center'>
        <h2 className='text-7xl font-bold'>My place on the web</h2>
        <p className='max-w-2xl text-xl text-orange-200/60'>
          I&apos;m still planning what to do on this site, maybe blog posts,
          track games that I&apos;m playing, share some thoughts, etc...
        </p>
      </section>
      <footer className='flex h-[80px] items-center space-x-4'>
        <a
          className='rounded-md p-2 transition hover:bg-orange-50/5'
          target='_blank'
          href='https://github.com/guivictorr'
        >
          Github
        </a>
        <a
          className='rounded-md p-2 transition hover:bg-orange-50/5'
          target='_blank'
          href='https://linkedin.com/in/guilhermeviictor'
        >
          Linkedin
        </a>
        <a
          className='rounded-md p-2 transition hover:bg-orange-50/5'
          target='_blank'
          href='https://x.com/oguivictor'
        >
          Twitter
        </a>
      </footer>
    </main>
  );
}
