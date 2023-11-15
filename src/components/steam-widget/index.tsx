import { getLatestPlayedGame } from '@/services/steam';

export const SteamWidget = async () => {
  const latestGame = await getLatestPlayedGame();

  if (!latestGame) return;

  const { name, playtime_2weeks } = latestGame;
  const playtimeInHours = playtime_2weeks / 60;

  return (
    <section className='text-start'>
      <div className='flex items-center gap-2'>
        <h3 className='font-black text-lg sm:text-xl text-primary'>
          last played game
        </h3>
      </div>
      <p className='text-sm sm:text-base'>{name}</p>
      <p className='text-xs sm:text-sm'>
        {playtimeInHours.toFixed(2)} hours past two weeks
      </p>
    </section>
  );
};
