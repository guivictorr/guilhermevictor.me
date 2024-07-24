import { formatRelative } from 'date-fns';

type LastUpdateProps = {
  playedAt: string;
};

const LastUpdate = ({ playedAt }: LastUpdateProps) => {
  const formattedPlayedAt = formatRelative(new Date(playedAt), Date.now());
  return <p className='text-xs text-lowContrast'>{formattedPlayedAt}</p>;
};

export default LastUpdate;
