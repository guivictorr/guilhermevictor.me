import {
  ArrowUpRightIcon,
  ChevronRightIcon,
  DownloadIcon,
  MonitorCogIcon,
  MoonIcon,
  MoveLeftIcon,
  SunIcon,
} from 'lucide-react';

const icons = {
  download: DownloadIcon,
  back: MoveLeftIcon,
  external: ArrowUpRightIcon,
  system: MonitorCogIcon,
  dark: MoonIcon,
  light: SunIcon,
  'chevron-right': ChevronRightIcon,
};
type IconNames = keyof typeof icons;

type IconProps = {
  icon: IconNames;
  className?: string;
};

export function Icon({ icon }: IconProps) {
  const Icon = icons[icon];
  return <Icon className='size-4 mb-px' />;
}
