document.addEventListener('DOMContentLoaded', () => {
    const cardsContainer = document.getElementById('cardsContainer');
    const filterByDate = document.getElementById('option1');
    const filterByServers = document.getElementById('option2');

    let subscriptions = []; // Для хранения загруженных данных

    // 1. Функция для загрузки данных из JSON
    async function loadSubscriptions() {
        try {
            const response = await fetch('data.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            subscriptions = await response.json();
            renderCards(subscriptions);
        } catch (error) {
            console.error("Не удалось загрузить данные о подписках:", error);
            cardsContainer.innerHTML = "<p>Ошибка загрузки данных.</p>";
        }
    }

    // 2. Функция для создания и отображения карточек
    function renderCards(data) {
        cardsContainer.innerHTML = ''; // Очищаем контейнер перед отрисовкой
        data.forEach(sub => {
            const card = document.createElement('div');
            card.className = 'card';
            // Добавляем data-атрибуты для сортировки
            card.dataset.date = sub.date;
            card.dataset.servers = sub.servers;

            card.innerHTML = `
                <h3>${sub.title}</h3>
                <div class="card-info">
                    <p>Серверов: ${sub.servers}</p>
                    <p>Обновлено: ${new Date(sub.date).toLocaleDateString()}</p>
                </div>
                <div class="card-buttons">
                    <button class="card-button" onclick="copyToClipboard('${sub.url}')">Копировать</button>
                    <a href="${sub.url}" class="card-button primary" target="_blank" rel="noopener noreferrer">Подписаться</a>
                </div>
            `;
            cardsContainer.appendChild(card);
        });
    }

    // 3. Функция для сортировки
    function sortCards(sortBy) {
        const cards = Array.from(cardsContainer.querySelectorAll('.card'));
        
        cards.sort((a, b) => {
            if (sortBy === 'date') {
                // Сортировка по дате (от новой к старой)
                return new Date(b.dataset.date) - new Date(a.dataset.date);
            } else if (sortBy === 'servers') {
                // Сортировка по количеству серверов (от большего к меньшему)
                return parseInt(b.dataset.servers) - parseInt(a.dataset.servers);
            }
        });

        // Перерисовываем отсортированные карточки
        cards.forEach(card => cardsContainer.appendChild(card));
    }

    // Вспомогательная функция для копирования в буфер обмена
    window.copyToClipboard = (text) => {
        navigator.clipboard.writeText(text).then(() => {
            alert('Ссылка скопирована!');
        }).catch(err => {
            console.error('Ошибка копирования: ', err);
        });
    };

    // Добавляем слушатели событий на переключатели
    filterByDate.addEventListener('change', () => sortCards('date'));
    filterByServers.addEventListener('change', () => sortCards('servers'));

    // Запускаем процесс
    loadSubscriptions();
});