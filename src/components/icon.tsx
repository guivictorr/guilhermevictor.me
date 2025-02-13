import {
  ArrowUpRightIcon,
  DownloadIcon,
  LucideProps,
  MoveLeftIcon,
} from 'lucide-react';
import { ComponentType } from 'react';

type IconNames = 'download' | 'back' | 'external';
//| 'linkedin'
//| 'github'
//| 'twitter'
//| 'bluesky';

const icons: Record<IconNames, ComponentType<LucideProps>> = {
  download: DownloadIcon,
  back: MoveLeftIcon,
  external: ArrowUpRightIcon,
  //linkedin: <p>Linkedin</p>,
  //github: <p>Github</p>,
  //twitter: <p>Twitter</p>,
  //bluesky: <p>TODO: add bluesky icon</p>,
};

type IconProps = {
  icon: IconNames;
  className?: string;
};

export function Icon({ icon }: IconProps) {
  const Icon = icons[icon];
  return <Icon className='size-4 mb-px' />;
}
