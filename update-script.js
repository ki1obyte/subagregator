// update-script.js
const fs = require('fs').promises;
const axios = require('axios');

// --- ОБНОВЛЕННАЯ СТРУКТРУРА ИСТОЧНИКОВ ---
const SOURCES = [
    {
        groupName: "F0rc3Run", // Общее имя источника
        subscriptions: [ // Массив его подписок
            { protocol: "Best-Results", url: "https://raw.githubusercontent.com/F0rc3Run/F0rc3Run/refs/heads/main/Best-Results/proxies.txt" },
            { protocol: "Shadowsocks", url: "https://raw.githubusercontent.com/F0rc3Run/F0rc3Run/refs/heads/main/splitted-by-protocol/shadowsocks.txt" },
            { protocol: "VLESS", url: "https://raw.githubusercontent.com/F0rc3Run/F0rc3Run/refs/heads/main/splitted-by-protocol/vless.txt" },
            { protocol: "VMess", url: "https://raw.githubusercontent.com/F0rc3Run/F0rc3Run/refs/heads/main/splitted-by-protocol/vmess.txt" },
            { protocol: "Trojan", url: "https://raw.githubusercontent.com/F0rc3Run/F0rc3Run/refs/heads/main/splitted-by-protocol/trojan.txt" },
        ]
    },
    {
        groupName: "mahdibland", // Пример старого источника с одной ссылкой
        subscriptions: [
            { protocol: "Mixed", url: "https://raw.githubusercontent.com/mahdibland/V2RayAggregator/master/sub/sub_merge.txt" }
        ]
    }
    // ... сюда можно добавлять другие источники по такому же принципу
];


async function main() {
    const finalSubscriptions = []; // Тут будем хранить все карточки
    const today = new Date().toISOString().split('T')[0]; // Сегодняшняя дата

    // Внешний цикл: проходим по каждому источнику (F0rc3Run, mahdibland и т.д.)
    for (const source of SOURCES) {
        // Внутренний цикл: проходим по каждой подписке внутри источника
        for (const sub of source.subscriptions) {
            try {
                const cardTitle = sub.protocol === "Mixed" 
                    ? source.groupName // Если протокол "Mixed", используем только имя группы
                    : `${source.groupName} - ${sub.protocol}`; // Иначе, создаем имя "Группа - Протокол"

                console.log(`Загрузка из ${cardTitle}...`);
                const response = await axios.get(sub.url);
                const content = response.data;
                
                // Считаем количество серверов, как и раньше
                const serverCount = content.trim().split('\n').length;

                if (serverCount > 0) {
                    finalSubscriptions.push({
                        title: cardTitle,
                        servers: serverCount,
                        date: today,
                        url: sub.url // Важно: используем URL конкретной подписки
                    });
                    console.log(`Успешно: ${serverCount} серверов.`);
                } else {
                     console.log(`Предупреждение: в ${cardTitle} не найдено серверов.`);
                }

            } catch (error) {
                console.error(`Ошибка при загрузке ${source.groupName} (${sub.protocol}): ${error.message}`);
            }
        }
    }

    // Сохраняем результат в файл data.json
    await fs.writeFile('data.json', JSON.stringify(finalSubscriptions, null, 2));
    console.log('Файл data.json успешно обновлен!');
}

main();
