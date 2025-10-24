// pages/index.js
import Head from 'next/head';
import dynamic from 'next/dynamic'; // ИСПРАВЛЕННЫЙ ИМПОРТ

// Динамически импортируем наш основной компонент с ОТКЛЮЧЕННЫМ серверным рендерингом (SSR)
const AggregatorComponent = dynamic(() => import('../components/Aggregator'), {
  ssr: false, 
  loading: () => <p style={{ textAlign: 'center', marginTop: '50px' }}>Загрузка агрегатора...</p>
});

export default function HomePage() {
  return (
    <>
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Агрегатор подписок</title>
        <link rel="stylesheet" href="/styles.css" />
        {/* Добавляем ссылку на иконку, если она есть в public */}
        <link rel="icon" href="/icon.svg" type="image/x-icon" /> 
      </Head>
      
      <main>
        <AggregatorComponent />
      </main>
    </>
  );
}
