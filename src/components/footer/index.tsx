import { Player } from '../player';

export const Footer = () => {
  return (
    <footer className='relative flex items-end overflow-hidden h-44 z-50 shrink-0 w-full '>
      <div className='flex items-center w-full justify-between gap-4 h-1/3 border-t border-primary/10 px-4 sm:px-8'>
        <Player />
        <p className='ml-auto'>{new Date().getFullYear()}</p>
      </div>
    </footer>
  );
};
