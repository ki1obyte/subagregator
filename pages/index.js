import Head from 'next/head';
import Script from 'next/script';

export default function HomePage() {
  return (
    <>
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content="Агрегатор бесплатных подписок. Данные о подписках обновляются каждый день." />
        <title>Агрегатор подписок</title>
        <meta property="og:title" content="Агрегатор подписок" />
        <meta property="og:description" content="Агрегатор бесплатных подписок. Данные о подписках обновляются каждый день" />
        <meta name="twitter:title" content="Агрегатор подписок" />
        <meta name="twitter:description" content="Агрегатор бесплатных подписок. Данные о подписках обновляются каждый день" />
        <link rel="icon" href="/icon.svg" type="image/x-icon" />
        <link rel="stylesheet" href="/styles.css" />
      </Head>

      <body>
        <div id="firstFilter" className="filter-switch">
          <input defaultChecked id="option1" name="options" type="radio" />
          <label className="option" htmlFor="option1">По дате</label>
          <input id="option2" name="options" type="radio" />
          <label className="option" htmlFor="option2">По серверам</label>
          <span className="background"></span>
        </div>
        <div className="grid-container" id="cardsContainer"></div>
        
        {/* Модальное окно для QR-кода */}
        <div id="qrModal" className="qr-modal">
            <div className="qr-modal-content">
                <h3>QR код для подключения</h3>
                <img id="qrModalImage" src="" alt="QR Code" />
            </div>
        </div>

        {/* Важно: скрипт подключается в конце */}
        <Script src="/index.js" strategy="afterInteractive" />
      </body>
    </>
  );
}
