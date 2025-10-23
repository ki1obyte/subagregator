document.addEventListener('DOMContentLoaded', () => {
    const cardsContainer = document.getElementById('cardsContainer');
    const filterByDate = document.getElementById('option1');
    const filterByServers = document.getElementById('option2');
    const qrModal = document.getElementById('qrModal');
    const qrModalImage = document.getElementById('qrModalImage');

    const copyIconSVG = `<svg ... > ... </svg>`; // SVG код иконки не меняется, оставьте как есть
    const qrIconSVG = `<svg ... > ... </svg>`;   // SVG код иконки не меняется, оставьте как есть

    async function loadSubscriptions() {
        try {
            const response = await fetch('data.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const groups = await response.json();
            // Сортируем группы по дате по умолчанию
            groups.sort((a, b) => new Date(b.date) - new Date(a.date));
            renderCards(groups);
        } catch (error) {
            console.error("Не удалось загрузить данные о подписках:", error);
            cardsContainer.innerHTML = "<p>Ошибка загрузки данных.</p>";
        }
    }

    function renderCards(groups) {
        cardsContainer.innerHTML = '';
        groups.forEach(group => {
            const card = document.createElement('div');
            card.className = 'card';

            // Для сортировки считаем ОБЩЕЕ кол-во серверов в группе
            const totalServers = group.subscriptions.reduce((sum, sub) => sum + sub.servers, 0);
            card.dataset.servers = totalServers;
            card.dataset.date = group.date;

            const formattedDate = new Date(group.date).toLocaleDateString('ru-RU', {
                day: '2-digit', month: '2-digit'
            });

            // Создаем HTML для списка подписок внутри карточки
            const subscriptionsHTML = group.subscriptions.map(sub => `
                <div class="subscription-row">
                    <span class="protocol-name">${sub.protocol}</span>
                    <div class="card-url-container">
                        <span class="card-url">${sub.url}</span>
                        <div class="card-actions">
                            <button class="icon-button" title="Копировать ссылку" onclick="copyToClipboard('${sub.url}', this)">${copyIconSVG}</button>
                            <button class="icon-button" title="Показать QR-код" onclick="showQrModal('${sub.url}')">${qrIconSVG}</button>
                        </div>
                    </div>
                    <div class="card-meta">
                        <div class="card-info-box">${sub.servers}</div>
                        <div class="card-info-box">${formattedDate}</div>
                    </div>
                </div>
            `).join('');

            // Собираем всю карточку
            card.innerHTML = `
                <div class="card-header">${group.groupName}</div>
                <div class="subscriptions-list">${subscriptionsHTML}</div>
            `;
            cardsContainer.appendChild(card);
        });
    }

    function sortCards(sortBy) {
        const cards = Array.from(cardsContainer.querySelectorAll('.card'));
        cards.sort((a, b) => {
            if (sortBy === 'date') {
                return new Date(b.dataset.date) - new Date(a.dataset.date);
            } else {
                // Сортировка по общему числу серверов в группе
                return parseInt(b.dataset.servers) - parseInt(a.dataset.servers);
            }
        });
        cards.forEach(card => cardsContainer.appendChild(card));
    }

    // Функции copyToClipboard и showQrModal остаются БЕЗ ИЗМЕНЕНИЙ
    window.copyToClipboard = (text, element) => { /* ... ваш прежний код ... */ };
    window.showQrModal = (url) => { /* ... ваш прежний код ... */ };
    qrModal.addEventListener('click', (event) => { /* ... ваш прежний код ... */ });

    filterByDate.addEventListener('change', () => sortCards('date'));
    filterByServers.addEventListener('change', () => sortCards('servers'));

    loadSubscriptions();
});
