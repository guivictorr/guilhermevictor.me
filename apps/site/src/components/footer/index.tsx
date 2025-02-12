import { Player } from '../player';

export const Footer = () => {
  return (
    <footer
      aria-label='Footer'
      className='flex items-center pb-14 sm:pb-0 w-full justify-between gap-4 mt-12'
    >
      <Player />
      <p aria-hidden className='text-xs text-secondary ml-auto'>
        {new Date().getFullYear()}
      </p>
    </footer>
  );
};
