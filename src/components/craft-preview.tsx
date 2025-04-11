import { PropsWithChildren } from 'react';

export const CraftPreview = ({ children }: PropsWithChildren) => {
  return (
    <div className='border bg-background border-secondary/10 rounded-md p-14 md:p-20 overflow-x-auto flex items-center justify-center'>
      {children}
    </div>
  );
};
