import Head from 'next/head';
import { useEffect, useState } from 'react';

// --- КОМПОНЕНТ КАРТОЧКИ ---
// Мы вынесем логику отображения карточек в отдельный компонент для чистоты
function SubscriptionCard({ group }) {
    const formattedDate = new Date(group.date).toLocaleString('ru-RU', {
        day: '2-digit', month: '2-digit'
    });

    const copyIconSVG = `<svg ... >...</svg>`; // Вставьте сюда ваш SVG для копирования
    const qrIconSVG = `<svg ... >...</svg>`;   // Вставьте сюда ваш SVG для QR-кода

    return (
        <div className="card">
            <div className="card-header">{group.groupName}</div>
            <div className="subscriptions-list">
                {group.subscriptions.map((sub, index) => (
                    <div className="subscription-row" key={index}>
                        <span className="protocol-name">{sub.protocol}</span>
                        <div className="subscription-controls">
                            <div className="card-meta">
                                <div className="card-info-box">{sub.servers}</div>
                                <div className="card-info-box">{formattedDate}</div>
                            </div>
                            <div className="card-actions">
                                <button className="icon-button" title={`Копировать: ${sub.url}`} 
                                    dangerouslySetInnerHTML={{ __html: copyIconSVG }}
                                    onClick={() => copyToClipboard(sub.url, event.currentTarget)} />
                                <button className="icon-button" title={`QR-код: ${sub.url}`}
                                    dangerouslySetInnerHTML={{ __html: qrIconSVG }}
                                    onClick={() => showQrModal(sub.url)} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}


// --- ГЛАВНЫЙ КОМПОНЕНТ СТРАНИЦЫ ---
export default function HomePage() {
    // Состояние для хранения загруженных данных и типа сортировки
    const [groups, setGroups] = useState([]);
    const [sortBy, setSortBy] = useState('date'); // 'date' или 'servers'

    // Хук useEffect сработает один раз после того, как компонент будет отрисован на клиенте
    useEffect(() => {
        // --- ВСЯ НАША КЛИЕНТСКАЯ ЛОГИКА ТЕПЕРЬ ЗДЕСЬ ---

        // Функции для копирования и QR-кода
        window.copyToClipboard = (text, element) => {
            navigator.clipboard.writeText(text).then(() => {
                const originalColor = element.style.color;
                element.style.color = '#4CAF50';
                setTimeout(() => { element.style.color = originalColor; }, 1500);
            }).catch(err => console.error('Ошибка копирования: ', err));
        };

        window.showQrModal = (url) => {
            const qrModal = document.getElementById('qrModal');
            const qrModalImage = document.getElementById('qrModalImage');
            if (qrModal && qrModalImage) {
                const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(url)}`;
                qrModalImage.src = qrCodeUrl;
                qrModal.classList.add('visible');
            }
        };

        const qrModal = document.getElementById('qrModal');
        if (qrModal) {
            qrModal.addEventListener('click', (event) => {
                if (event.target === qrModal) {
                    qrModal.classList.remove('visible');
                }
            });
        }
        
        // Загрузка данных
        async function loadSubscriptions() {
            try {
                const response = await fetch('/data.json');
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data = await response.json();
                setGroups(data); // Сохраняем данные в состояние
            } catch (error) {
                console.error("Не удалось загрузить данные о подписках:", error);
            }
        }
        
        loadSubscriptions();

    }, []); // Пустой массив зависимостей означает, что код выполнится только один раз

    // Логика сортировки
    const sortedGroups = [...groups].sort((a, b) => {
        if (sortBy === 'servers') {
            const totalA = a.subscriptions.reduce((sum, sub) => sum + sub.servers, 0);
            const totalB = b.subscriptions.reduce((sum, sub) => sum + sub.servers, 0);
            return totalB - totalA;
        }
        // По умолчанию сортируем по дате
        return new Date(b.date) - new Date(a.date);
    });

    return (
        <>
          <Head>
            {/* ... все ваши meta-теги и title ... */}
            <link rel="stylesheet" href="/styles.css" />
          </Head>

          <div id="firstFilter" className="filter-switch">
              <input checked={sortBy === 'date'} onChange={() => setSortBy('date')} id="option1" name="options" type="radio" />
              <label className="option" htmlFor="option1">По дате</label>
              <input checked={sortBy === 'servers'} onChange={() => setSortBy('servers')} id="option2" name="options" type="radio" />
              <label className="option" htmlFor="option2">По серверам</label>
              <span className="background"></span>
          </div>
          
          <div className="grid-container">
              {sortedGroups.map((group, index) => (
                  <SubscriptionCard group={group} key={index} />
              ))}
          </div>
            
          {/* Модальное окно для QR-кода */}
          <div id="qrModal" className="qr-modal">
              <div className="qr-modal-content">
                  <h3>QR код для подключения</h3>
                  <img id="qrModalImage" src="" alt="QR Code" />
              </div>
          </div>
        </>
    );
}
