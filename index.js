document.addEventListener('DOMContentLoaded', () => {
    const cardsContainer = document.getElementById('cardsContainer');
    const filterByDate = document.getElementById('option1');
    const filterByServers = document.getElementById('option2');
    
    // Получаем доступ к элементам модального окна
    const qrModal = document.getElementById('qrModal');
    const qrModalImage = document.getElementById('qrModalImage');

    const copyIconSVG = `...`; // Оставьте SVG как есть
    const qrIconSVG = `...`;   // Оставьте SVG как есть

    // 1. Функция загрузки (без изменений)
    async function loadSubscriptions() {
        try {
            const response = await fetch('data.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const subscriptions = await response.json();
            subscriptions.sort((a, b) => new Date(b.date) - new Date(a.date));
            renderCards(subscriptions);
        } catch (error) {
            console.error("Не удалось загрузить данные о подписках:", error);
            cardsContainer.innerHTML = "<p>Ошибка загрузки данных.</p>";
        }
    }

    // 2. Функция рендера карточек (ключевые изменения здесь)
    function renderCards(data) {
        cardsContainer.innerHTML = '';
        data.forEach(sub => {
            const card = document.createElement('div');
            card.className = 'card';
            card.dataset.date = sub.date;
            card.dataset.servers = sub.servers;

            const formattedDate = new Date(sub.date).toLocaleDateString('ru-RU', {
                day: '2-digit',
                month: '2-digit'
            });

            // Заменяем <a> на <button> с вызовом функции showQrModal
            card.innerHTML = `
                <div class="card-header">
                    <span class="card-title">${sub.title}</span>
                    <div class="card-meta">
                        <div class="card-info-box">${sub.servers}</div>
                        <div class="card-info-box">${formattedDate}</div>
                    </div>
                </div>
                <div class="card-url-container">
                    <span class="card-url">${sub.url}</span>
                    <div class="card-actions">
                        <button class="icon-button" title="Копировать ссылку" onclick="copyToClipboard('${sub.url}', this)">
                            ${copyIconSVG}
                        </button>
                        <button class="icon-button" title="Показать QR-код" onclick="showQrModal('${sub.url}')">
                            ${qrIconSVG}
                        </button>
                    </div>
                </div>
            `;
            cardsContainer.appendChild(card);
        });
    }

    // 3. Функция сортировки (без изменений)
    function sortCards(sortBy) { /* ... без изменений ... */ }

    // Вспомогательная функция копирования (без изменений)
    window.copyToClipboard = (text, element) => { /* ... без изменений ... */ };

    // --- НОВАЯ ФУНКЦИЯ ДЛЯ ПОКАЗА МОДАЛЬНОГО ОКНА ---
    window.showQrModal = (url) => {
        // Генерируем ссылку на изображение с QR-кодом
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(url)}`;
        // Устанавливаем эту ссылку в наш тег <img>
        qrModalImage.src = qrCodeUrl;
        // Показываем модальное окно, добавляя класс 'visible'
        qrModal.classList.add('visible');
    }

    // --- ЛОГИКА ЗАКРЫТИЯ МОДАЛЬНОГО ОКНА ---
    // Закрываем окно при клике на темный фон
    qrModal.addEventListener('click', (event) => {
        // Если клик был по самому фону (qrModal), а не по его содержимому
        if (event.target === qrModal) {
            qrModal.classList.remove('visible');
            qrModalImage.src = ""; // Очищаем src, чтобы не показывать старый QR
        }
    });

    // Слушатели событий (без изменений)
    filterByDate.addEventListener('change', () => sortCards('date'));
    filterByServers.addEventListener('change', () => sortCards('servers'));

    // Запуск
    loadSubscriptions();
});

// Убедитесь, что вы скопировали полные версии функций sortCards и copyToClipboard
// из предыдущего ответа, если сомневаетесь. Я сократил их здесь для краткости.
