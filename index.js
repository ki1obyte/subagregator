document.addEventListener('DOMContentLoaded', () => {
    const cardsContainer = document.getElementById('cardsContainer');
    const filterByDate = document.getElementById('option1');
    const filterByServers = document.getElementById('option2');

    // Иконки в формате SVG. Это позволяет не подключать внешние библиотеки.
    const copyIconSVG = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20px" height="20px">
            <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
        </svg>`;
    const qrIconSVG = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20px" height="20px">
            <path d="M3 11h8V3H3v8zm2-6h4v4H5V5zM3 21h8v-8H3v8zm2-6h4v4H5v-4zM13 3v8h8V3h-8zm6 6h-4V5h4v4zM13 21h8v-8h-8v8zm2-6h4v4h-4v-4z"/>
        </svg>`;

    // 1. Функция для загрузки данных из JSON
    async function loadSubscriptions() {
        try {
            const response = await fetch('data.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const subscriptions = await response.json();
            // Сразу сортируем по дате по умолчанию
            subscriptions.sort((a, b) => new Date(b.date) - new Date(a.date));
            renderCards(subscriptions);
        } catch (error) {
            console.error("Не удалось загрузить данные о подписках:", error);
            cardsContainer.innerHTML = "<p>Ошибка загрузки данных.</p>";
        }
    }

    // 2. Функция для создания и отображения карточек (полностью переписана)
    function renderCards(data) {
        cardsContainer.innerHTML = ''; // Очищаем контейнер
        data.forEach(sub => {
            const card = document.createElement('div');
            card.className = 'card';
            card.dataset.date = sub.date;
            card.dataset.servers = sub.servers;

            // Форматируем дату в вид "23.10"
            const formattedDate = new Date(sub.date).toLocaleDateString('ru-RU', {
                day: '2-digit',
                month: '2-digit'
            });

            // Генерируем ссылку для QR-кода
            const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(sub.url)}`;

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
                        <a href="${qrCodeUrl}" target="_blank" class="icon-button" title="Показать QR-код">
                            ${qrIconSVG}
                        </a>
                    </div>
                </div>
            `;
            cardsContainer.appendChild(card);
        });
    }

    // 3. Функция для сортировки (остается без изменений)
    function sortCards(sortBy) {
        const cards = Array.from(cardsContainer.querySelectorAll('.card'));
        cards.sort((a, b) => {
            if (sortBy === 'date') {
                return new Date(b.dataset.date) - new Date(a.dataset.date);
            } else {
                return parseInt(b.dataset.servers) - parseInt(a.dataset.servers);
            }
        });
        cards.forEach(card => cardsContainer.appendChild(card));
    }

    // Вспомогательная функция для копирования + визуальный отклик
    window.copyToClipboard = (text, element) => {
        navigator.clipboard.writeText(text).then(() => {
            const originalColor = element.style.color;
            element.style.color = '#4CAF50'; // Зеленый цвет при успехе
            setTimeout(() => {
                element.style.color = originalColor;
            }, 1500);
        }).catch(err => {
            console.error('Ошибка копирования: ', err);
        });
    };

    // Слушатели событий
    filterByDate.addEventListener('change', () => sortCards('date'));
    filterByServers.addEventListener('change', () => sortCards('servers'));

    // Запуск
    loadSubscriptions();
});
