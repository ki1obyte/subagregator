// update-script.js
const fs = require('fs').promises;
const axios = require('axios'); // Библиотека для скачивания данных по URL

// --- НАСТРОЙКА: Добавьте сюда ссылки на ваши источники подписок ---
const SOURCES = [
    { name: "F0rc3Run", url: "https://raw.githubusercontent.com/F0rc3Run/F0rc3Run/refs/heads/main/splitted-by-protocol/vless.txt" },
    { name: "roosterkid", url: "https://raw.githubusercontent.com/roosterkid/openproxylist/main/V2RAY_RAW.txt" },
    { name: "mahdibland", url: "https://raw.githubusercontent.com/mahdibland/V2RayAggregator/master/Eternity" },	
    { name: "wuqb2i4f", url: "https://raw.githubusercontent.com/wuqb2i4f/xray-config-toolkit/main/output/base64/mix-uri" }
    // Добавьте столько источников, сколько нужно
];

async function main() {
    const subscriptions = [];
    const today = new Date().toISOString().split('T')[0]; // Сегодняшняя дата в формате YYYY-MM-DD

    for (const source of SOURCES) {
        try {
            console.log(`Загрузка из ${source.name}...`);
            const response = await axios.get(source.url);
            const content = response.data;
            
            // --- ЛОГИКА ПАРСИНГА: Считаем количество серверов ---
            // Самый простой способ - посчитать количество строк. 
            // Каждая строка в таких файлах - это обычно один сервер.
            const serverCount = content.trim().split('\n').length;

            if (serverCount > 0) {
                subscriptions.push({
                    title: source.name,
                    servers: serverCount,
                    date: today,
                    url: source.url
                });
                console.log(`Успешно: ${serverCount} серверов.`);
            } else {
                 console.log(`Предупреждение: в ${source.name} не найдено серверов.`);
            }

        } catch (error) {
            console.error(`Ошибка при загрузке ${source.name}: ${error.message}`);
        }
    }

    // Сохраняем результат в файл data.json
    await fs.writeFile('data.json', JSON.stringify(subscriptions, null, 2));
    console.log('Файл data.json успешно обновлен!');
}

main();