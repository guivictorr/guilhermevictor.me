export default function Home() {
  return (
    <main className='bg-background text-primary flex h-[100dvh] flex-col items-center justify-between px-4 py-8'>
      <header className='grid h-[80px] place-items-center'>
        <span className='text-secondary border-secondary rounded-md border p-0.5  px-1.5 text-sm'>
          <abbr className='no-underline' title='Work in progress'>
            wip
          </abbr>
        </span>
      </header>
      <section className='space-y-6 text-center'>
        <h2 className='text-6xl font-bold md:text-7xl'>My place on the web</h2>
        <p className='text-secondary max-w-2xl text-base md:text-xl'>
          I&apos;m still planning what to do on this site, maybe blog posts,
          track games that I&apos;m playing, share some thoughts, etc...
        </p>
      </section>
      <footer className='text-secondary flex h-[80px] items-center space-x-4'>
        <a
          className='hover:bg-secondary/5 rounded-md p-2 transition'
          target='_blank'
          href='https://github.com/guivictorr'
        >
          Github
        </a>
        <a
          className='hover:bg-secondary/5 rounded-md p-2 transition'
          target='_blank'
          href='https://linkedin.com/in/guilhermeviictor'
        >
          Linkedin
        </a>
        <a
          className='hover:bg-secondary/5 rounded-md p-2 transition'
          target='_blank'
          href='https://x.com/oguivictor'
        >
          Twitter
        </a>
      </footer>
    </main>
  );
}
