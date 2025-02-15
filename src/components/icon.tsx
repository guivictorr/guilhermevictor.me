import {
  ArrowUpRightIcon,
  DownloadIcon,
  LucideProps,
  MonitorCogIcon,
  MoonIcon,
  MoveLeftIcon,
  SunIcon,
} from 'lucide-react';
import { ComponentType } from 'react';

type IconNames = 'download' | 'back' | 'external' | 'system' | 'dark' | 'light';

const icons: Record<IconNames, ComponentType<LucideProps>> = {
  download: DownloadIcon,
  back: MoveLeftIcon,
  external: ArrowUpRightIcon,
  system: MonitorCogIcon,
  dark: MoonIcon,
  light: SunIcon,
};

type IconProps = {
  icon: IconNames;
  className?: string;
};

export function Icon({ icon }: IconProps) {
  const Icon = icons[icon];
  return <Icon className='size-4 mb-px' />;
}
