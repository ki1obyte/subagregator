document.addEventListener('DOMContentLoaded', () => {
    const cardsContainer = document.getElementById('cardsContainer');
    const filterByDate = document.getElementById('option1');
    const filterByServers = document.getElementById('option2');
    const qrModal = document.getElementById('qrModal');
    const qrModalImage = document.getElementById('qrModalImage');

    const copyIconSVG = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20px" height="20px">
            <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
        </svg>`;
    const qrIconSVG = `
        <svg xmlns="http://www.w.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20px" height="20px">
            <path d="M3 11h8V3H3v8zm2-6h4v4H5V5zM3 21h8v-8H3v8zm2-6h4v4H5v-4zM13 3v8h8V3h-8zm6 6h-4V5h4v4zM13 21h8v-8h-8v8zm2-6h4v4h-4v-4z"/>
        </svg>`;

    async function loadSubscriptions() {
        try {
            const response = await fetch('data.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const groups = await response.json();
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
            const totalServers = group.subscriptions.reduce((sum, sub) => sum + sub.servers, 0);
            card.dataset.servers = totalServers;
            card.dataset.date = group.date;

            const formattedDate = new Date(group.date).toLocaleString('ru-RU', {
                day: '2-digit', month: '2-digit'
            });

            const subscriptionsHTML = group.subscriptions.map(sub => {
                // --- ВОТ ГЛАВНОЕ ИЗМЕНЕНИЕ ---
                // Получаем только имя файла из полного URL
                const urlParts = sub.url.split('/');
                const shortUrl = urlParts[urlParts.length - 1];
                // --- КОНЕЦ ИЗМЕНЕНИЯ ---

                return `
                <div class="subscription-item">
                    <div class="subscription-top-row">
                        <span class="protocol-name">${sub.protocol}</span>
                        <div class="card-meta">
                            <div class="card-info-box">${sub.servers}</div>
                            <div class="card-info-box">${formattedDate}</div>
                        </div>
                    </div>
                    <div class="card-url-container">
                        <span class="card-url" title="${sub.url}">${shortUrl}</span>
                        <div class="card-actions">
                            <button class="icon-button" title="Копировать ссылку" onclick="copyToClipboard('${sub.url}', this)">${copyIconSVG}</button>
                            <button class="icon-button" title="Показать QR-код" onclick="showQrModal('${sub.url}')">${qrIconSVG}</button>
                        </div>
                    </div>
                </div>
            `}).join('');

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
            if (sortBy === 'date') { return new Date(b.dataset.date) - new Date(a.date); } 
            else { return parseInt(b.dataset.servers) - parseInt(a.dataset.servers); }
        });
        cards.forEach(card => cardsContainer.appendChild(card));
    }

    window.copyToClipboard = (text, element) => {
        navigator.clipboard.writeText(text).then(() => {
            const originalColor = element.style.color;
            element.style.color = '#4CAF50';
            setTimeout(() => { element.style.color = originalColor; }, 1500);
        }).catch(err => { console.error('Ошибка копирования: ', err); });
    };

    window.showQrModal = (url) => {
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(url)}`;
        qrModalImage.src = qrCodeUrl;
        qrModal.classList.add('visible');
    };

    qrModal.addEventListener('click', (event) => {
        if (event.target === qrModal) {
            qrModal.classList.remove('visible');
            qrModalImage.src = "";
        }
    });

    filterByDate.addEventListener('change', () => sortCards('date'));
    filterByServers.addEventListener('change', () => sortCards('servers'));

    loadSubscriptions();
});
