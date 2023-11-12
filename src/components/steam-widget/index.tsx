export const SteamWidget = async () => {
  return (
    <section className='text-start'>
      <div className='flex items-center gap-2'>
        <h3 className='font-black text-xl'>last played game</h3>
      </div>
      <p>The Elder Scrolls V: Skyrim</p>
      <p className='text-secondary text-sm'>13.9h past two weeks</p>
    </section>
  );
};
