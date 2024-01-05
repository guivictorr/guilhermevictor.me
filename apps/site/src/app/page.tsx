import { ListColumn } from '@/components/article';
import { ExternalLink } from '@/components/external-link';

export default function Home() {
  return (
    <main className='flex flex-col gap-8 max-w-xl mx-auto'>
      <header className='w-full py-8'>
        <div className='mx-auto border rounded-md text-center w-fit px-2 h-8 grid place-items-center'>
          <abbr title='Work in progress'>wip</abbr>
        </div>
      </header>
      <section className='mt-12'>
        <p className='leading-4'>Guilherme Victor</p>
        <h1 className='text-3xl sm:text-2xl text-primary font-serif'>
          empathetic frontend developer.
          <br />
          learning golang. <br />
          neovim user.
        </h1>
        <p>
          You can find me on{' '}
          <ExternalLink href='https://x.com/oguivictor'>Twitter</ExternalLink>{' '}
          or{' '}
          <ExternalLink href='https://linkedin.com/in/guilhermeviictor'>
            Linkedin
          </ExternalLink>{' '}
          and see my code on{' '}
          <ExternalLink href='https://github.com/guivictorr'>
            Github
          </ExternalLink>
        </p>
      </section>
      <section className='grid grid-cols-1 space-y-8 sm:space-y-0 sm:grid-cols-3 mt-14'>
        <ListColumn title='Crafts'>
          <ListColumn.Item
            title='Animated Tabs'
            description='Animated Tabs built with framer motion'
            href='/'
          />
        </ListColumn>

        <ListColumn title='Writing'>
          <ListColumn.Item
            title='Accessibility on web'
            description='How to build accessible websites'
            href='/'
          />
        </ListColumn>

        <ListColumn title='Gaming'>
          <ListColumn.Item
            title='Disco Elysium'
            description='33.9h past two weeks'
            href='/'
          />
        </ListColumn>
      </section>
    </main>
  );
}
