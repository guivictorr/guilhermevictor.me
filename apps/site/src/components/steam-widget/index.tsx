import { getLatestPlayedGame } from '@/services/steam';

export const SteamWidget = async () => {
  const { name, playtime_2weeks } = await getLatestPlayedGame();

  return (
    <section className='text-start'>
      <div className='flex items-center gap-2'>
        <h3 className='font-black text-xl'>last played game</h3>
      </div>
      <p>{name}</p>
      <p className='text-secondary text-sm'>
        {playtime_2weeks / 60}h past two weeks
      </p>
    </section>
  );
};
