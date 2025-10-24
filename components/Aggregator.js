// components/Aggregator.js
import { useEffect, useState } from 'react';

// --- Вспомогательные функции ---
const copyIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20px" height="20px"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>`;
const qrIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20px" height="20px"><path d="M3 11h8V3H3v8zm2-6h4v4H5V5zM3 21h8v-8H3v8zm2-6h4v4H5v-4zM13 3v8h8V3h-8zm6 6h-4V5h4v4zM13 21h8v-8h-8v8zm2-6h4v4h-4v-4z"/></svg>`;

const copyToClipboard = (text, element) => {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            const originalColor = element.style.color;
            element.style.color = '#4CAF50';
            setTimeout(() => { element.style.color = originalColor; }, 1500);
        }).catch(err => console.error('Ошибка копирования: ', err));
    }
};

const showQrModal = (url) => {
    const qrModal = document.getElementById('qrModal');
    const qrModalImage = document.getElementById('qrModalImage');
    if (qrModal && qrModalImage) {
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(url)}`;
        qrModalImage.src = qrCodeUrl;
        qrModal.classList.add('visible');
    }
};

// --- Компонент Карточки ---
function SubscriptionCard({ group }) {
    const formattedDate = new Date(group.date).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit' });

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
                                    onClick={(e) => copyToClipboard(sub.url, e.currentTarget)}
                                    dangerouslySetInnerHTML={{ __html: copyIconSVG }} />
                                <button className="icon-button" title={`QR-код: ${sub.url}`}
                                    onClick={() => showQrModal(sub.url)}
                                    dangerouslySetInnerHTML={{ __html: qrIconSVG }} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// --- Главный компонент Агрегатора ---
export default function Aggregator() {
    const [groups, setGroups] = useState([]);
    const [sortBy, setSortBy] = useState('date');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const qrModal = document.getElementById('qrModal');
        const closeModal = (event) => {
            if (event.target === qrModal) qrModal.classList.remove('visible');
        };
        if (qrModal) qrModal.addEventListener('click', closeModal);
        
        async function loadSubscriptions() {
            try {
                const response = await fetch('/data.json');
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data = await response.json();
                setGroups(data);
            } catch (error) {
                console.error("Не удалось загрузить данные о подписках:", error);
            } finally {
                setLoading(false);
            }
        }
        loadSubscriptions();

        return () => {
            if (qrModal) qrModal.removeEventListener('click', closeModal);
        };
    }, []);

    const sortedGroups = [...groups].sort((a, b) => {
        if (sortBy === 'servers') {
            const totalA = a.subscriptions.reduce((sum, sub) => sum + sub.servers, 0);
            const totalB = b.subscriptions.reduce((sum, sub) => sum + sub.servers, 0);
            return totalB - totalA;
        }
        return new Date(b.date) - new Date(a.date);
    });

    return (
        <>
            <div id="firstFilter" className="filter-switch">
                <input checked={sortBy === 'date'} onChange={() => setSortBy('date')} id="option1" name="options" type="radio" />
                <label className="option" htmlFor="option1">По дате</label>
                <input checked={sortBy === 'servers'} onChange={() => setSortBy('servers')} id="option2" name="options" type="radio" />
                <label className="option" htmlFor="option2">По серверам</label>
                <span className="background"></span>
            </div>
            
            <div className="grid-container">
                {loading ? (
                    <p style={{ textAlign: 'center', gridColumn: '1 / -1' }}>Загрузка данных...</p>
                ) : (
                    sortedGroups.map((group, index) => <SubscriptionCard group={group} key={index} />)
                )}
            </div>
              
            <div id="qrModal" className="qr-modal">
                <div className="qr-modal-content">
                    <h3>QR код для подключения</h3>
                    <img id="qrModalImage" src="" alt="QR Code" />
                </div>
            </div>
        </>
    );
}
