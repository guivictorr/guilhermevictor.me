import { PropsWithChildren } from 'react';

export const CraftPreview = ({ children }: PropsWithChildren) => {
  return (
    <div className='border bg-[#342318]/20 border-lowContrast/10 rounded-md p-24 overflow-x-auto flex items-center justify-center'>
      {children}
    </div>
  );
};
