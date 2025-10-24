// pages/index.js
import Head from 'next/head';
import dynamic from 'next/dynamic';

// Динамически импортируем наш основной компонент с ОТКЛЮЧЕННЫМ серверным рендерингом (SSR)
const AggregatorComponent = dynamic(() => import('./components/Aggregator'), {
  ssr: false, 
});

export default function HomePage() {
  return (
    <>
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Агрегатор подписок</title>
        <link rel="stylesheet" href="/styles.css" />
      </Head>
      
      <main>
        <AggregatorComponent />
      </main>
    </>
  );
}
