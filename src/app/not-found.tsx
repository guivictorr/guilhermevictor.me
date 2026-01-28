import { HomeButton } from '@/components/home-button';

export default function NotFound() {
  return (
    <main className='h-full'>
      <HomeButton />

      <section className='flex items-center justify-center flex-1 h-full'>
        <h1 className='font-serif text-3xl'>404</h1>
      </section>
    </main>
  );
}
