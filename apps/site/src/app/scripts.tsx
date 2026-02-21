import Script from 'next/script';
import { structuredData } from '@/app/structured-data';
import { useTranslations } from 'next-intl';

export function Scripts() {
  const t = useTranslations('metadata');
  if (process.env.NODE_ENV === 'development') return null;
  return (
    <>
      <Script
        strategy='afterInteractive'
        async
        src='https://www.googletagmanager.com/gtag/js?id=G-BX9KZ5K063'
      ></Script>
      <Script id='GOOGLE-ANALYTICS' strategy='afterInteractive'>{`
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-BX9KZ5K063');
`}</Script>
      <Script
        id='MICROSOFT_CLARITY'
        type='text/javascript'
        strategy='afterInteractive'
      >
        {`

    (function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", "p23rxyo4dc");
`}
      </Script>
      <Script
        id='STRUCTURED-DATA'
        key='structured-data'
        type='application/ld+json'
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData(t)),
        }}
      />
    </>
  );
}
