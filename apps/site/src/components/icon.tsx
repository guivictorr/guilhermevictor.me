import { DownloadIcon, LucideProps, MoveLeftIcon } from 'lucide-react';
import { ComponentType } from 'react';

type IconNames = 'download' | 'back';

const icons: Record<IconNames, ComponentType<LucideProps>> = {
  download: DownloadIcon,
  back: MoveLeftIcon,
};

type IconProps = {
  icon: IconNames;
  className?: string;
};

export function Icon({ icon }: IconProps) {
  const Icon = icons[icon];
  return <Icon className='size-4 mb-px' />;
}
