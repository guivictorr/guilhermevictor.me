import { Player } from './player';

export const Footer = () => {
  return (
    <footer className='flex items-center pb-14 sm:pb-0 w-full justify-between gap-4'>
      <Player />
      <p className='text-xs text-secondary ml-auto'>
        {new Date().getFullYear()}
      </p>
    </footer>
  );
};
