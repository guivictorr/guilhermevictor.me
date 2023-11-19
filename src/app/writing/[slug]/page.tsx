import Link from 'next/link';
import { formatRelative } from 'date-fns';
import { PiArrowUUpLeft } from 'react-icons/pi';
import Layout from '@/components/layout';

export default function Article() {
  const formattedDate = formatRelative(new Date(Date.now()), Date.now());
  return (
    <Layout backHref='/'>
      <h1 className='text-primary text-lg font-bold'>Article title</h1>
      <time className='mb-8 block'>{formattedDate}</time>
      <article>
        <h1 className='text-primary text-lg'>title</h1>
        <p className='mb-8 mt-4'>
          Eu enim dolor exercitation excepteur ea cupidatat sunt veniam. Ipsum
          irure non aute Lorem velit cillum non sunt eiusmod incididunt anim.
          Officia aliquip ut exercitation ipsum est elit. Commodo aliqua est
          mollit aliqua exercitation nisi nulla tempor et nisi. Excepteur tempor
          aute nostrud ea cupidatat dolor minim magna pariatur eu. Anim occaecat
          consequat non nulla occaecat enim eiusmod cupidatat anim reprehenderit
          proident consectetur sint. Lorem sint velit qui dolore dolor. Qui
          deserunt labore do ullamco cupidatat velit ut exercitation.
          Adipisicing amet excepteur cupidatat ad fugiat irure occaecat et in
          commodo consequat do. Enim non excepteur officia velit ut excepteur
          minim aliqua mollit et nostrud ut adipisicing. Quis labore enim fugiat
          adipisicing non duis esse ipsum in consectetur aliquip fugiat cillum
          laborum. Velit id est nostrud culpa nulla exercitation qui nisi minim
          duis. Nostrud incididunt et nostrud amet ullamco excepteur excepteur
          qui sunt velit eu ipsum non. Enim labore consectetur nulla proident do
          eiusmod do fugiat quis dolor. Cupidatat aliqua duis veniam labore
          dolore est nostrud ipsum esse fugiat proident et aute aute. Cupidatat
          ut nisi cillum exercitation ipsum sit magna laborum nulla. Culpa sunt
          aliqua est sit tempor ad in mollit eu reprehenderit est. Ipsum eiusmod
          aliqua cillum anim enim do quis in id excepteur. Cupidatat enim
          deserunt id occaecat voluptate esse magna officia eu consectetur dolor
          velit.
        </p>
        <h1 className='text-primary text-lg'>title</h1>
        <p className='mb-8 mt-4'>
          Pariatur enim dolore sunt commodo reprehenderit. Eu duis in culpa
          minim. Laborum pariatur veniam cillum eu anim. Ullamco amet pariatur
          veniam. Cillum aute officia sunt commodo deserunt id aliquip velit est
          aliqua enim exercitation ipsum mollit ad. Tempor ex aliquip aliqua
          exercitation mollit anim velit sit sunt eu commodo elit id laborum.
          Excepteur Lorem mollit qui officia aute qui aliquip duis laboris
          pariatur proident do. Dolor voluptate quis dolore fugiat quis. Ut esse
          ullamco cillum aliquip ad magna irure. Velit ex culpa ex elit deserunt
          deserunt irure adipisicing veniam commodo ex dolore nulla irure
          eiusmod. Incididunt labore occaecat enim voluptate. Sint tempor
          laboris adipisicing elit aute quis commodo voluptate aliqua id
          occaecat ut enim adipisicing. Proident sunt tempor consectetur
          voluptate est officia Lorem minim magna occaecat qui. Aute occaecat
          mollit ut nostrud velit. Sit ut veniam duis. Anim mollit ipsum nulla
          quis anim id eu mollit aute. Voluptate quis cupidatat minim mollit.
        </p>
      </article>
    </Layout>
  );
}
