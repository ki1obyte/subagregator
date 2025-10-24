// pages/index.js
import Head from 'next/head'; // <--- ВОТ ЭТА СТРОКА БЫЛА ПРОПУЩЕНА
import dynamic from 'next/dynamic';

// Путь теперь ведет в корневую папку components
const AggregatorComponent = dynamic(() => import('../components/Aggregator'), {
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
