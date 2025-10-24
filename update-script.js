const fs = require('fs').promises;
const axios = require('axios');

// Ваш список SOURCES остается без изменений
const SOURCES = [
    {
        groupName: "F0rc3Run",
        subscriptions: [
            { protocol: "Proxies", url: "https://raw.githubusercontent.com/F0rc3Run/F0rc3Run/refs/heads/main/Best-Results/proxies.txt" },
            { protocol: "VLESS", url: "https://raw.githubusercontent.com/F0rc3Run/F0rc3Run/refs/heads/main/splitted-by-protocol/vless.txt" },
            { protocol: "VMess", url: "https://raw.githubusercontent.com/F0rc3Run/F0rc3Run/refs/heads/main/splitted-by-protocol/vmess.txt" },
            { protocol: "Shadowsocks", url: "https://raw.githubusercontent.com/F0rc3Run/F0rc3Run/refs/heads/main/splitted-by-protocol/shadowsocks.txt" },
            { protocol: "Trojan", url: "https://raw.githubusercontent.com/F0rc3Run/F0rc3Run/refs/heads/main/splitted-by-protocol/trojan.txt" },
            { protocol: "Telegram", url: "https://raw.githubusercontent.com/F0rc3Run/F0rc3Run/main/Special/Telegram.txt" }
        ]
    },
    {
        groupName: "mheidari98",
        subscriptions: [
            { protocol: "VLESS", url: "https://raw.githubusercontent.com/mheidari98/.proxy/refs/heads/main/vless" },
            { protocol: "VMess", url: "https://raw.githubusercontent.com/mheidari98/.proxy/refs/heads/main/vmess" },
            { protocol: "Trojan", url: "https://raw.githubusercontent.com/mheidari98/.proxy/refs/heads/main/trojan" },
            { protocol: "Shadowsocks", url: "https://raw.githubusercontent.com/mheidari98/.proxy/refs/heads/main/ss" }
        ]
    },
    {
        groupName: "Epodonios",
        subscriptions: [
            { protocol: "VLESS", url: "https://github.com/Epodonios/v2ray-configs/raw/main/Splitted-By-Protocol/vless.txt" },
            { protocol: "VMess", url: "https://github.com/Epodonios/v2ray-configs/raw/main/Splitted-By-Protocol/vmess.txt" },
            { protocol: "Shadowsocks", url: "https://github.com/Epodonios/v2ray-configs/raw/main/Splitted-By-Protocol/ss.txt" },
            { protocol: "SSR", url: "https://github.com/Epodonios/v2ray-configs/raw/main/Splitted-By-Protocol/ssr.txt" },
            { protocol: "Trojan", url: "https://github.com/Epodonios/v2ray-configs/raw/main/Splitted-By-Protocol/trojan.txt" }
        ]
    },
    {
        groupName: "Firmfox",
        subscriptions: [
            { protocol: "VLESS", url: "https://raw.githubusercontent.com/Firmfox/proxify/main/v2ray_configs/seperated_by_protocol/vless.txt" },
            { protocol: "VMess", url: "https://raw.githubusercontent.com/Firmfox/proxify/main/v2ray_configs/seperated_by_protocol/vmess.txt" },
            { protocol: "Trojan", url: "https://raw.githubusercontent.com/Firmfox/proxify/main/v2ray_configs/seperated_by_protocol/trojan.txt" },
            { protocol: "Shadowsocks", url: "https://raw.githubusercontent.com/Firmfox/proxify/main/v2ray_configs/seperated_by_protocol/shadowsocks.txt" },
            { protocol: "Other", url: "https://raw.githubusercontent.com/Firmfox/proxify/main/v2ray_configs/seperated_by_protocol/other.txt" },
            { protocol: "MTProto", url: "https://raw.githubusercontent.com/Firmfox/proxify/main/telegram_proxies/mtproto.txt" },
            { protocol: "SOCKS5 (TG)", url: "https://raw.githubusercontent.com/Firmfox/proxify/main/telegram_proxies/socks5.txt" },
            { protocol: "SOCKS4", url: "https://raw.githubusercontent.com/Firmfox/proxify/main/proxies/socks4.txt" },
            { protocol: "SOCKS5", url: "https://raw.githubusercontent.com/Firmfox/proxify/main/proxies/socks5.txt" },
            { protocol: "HTTPS", url: "https://raw.githubusercontent.com/Firmfox/proxify/main/proxies/https.txt" }
        ]
    },
    {
        groupName: "shabane",
        subscriptions: [
            { protocol: "VLESS", url: "https://raw.githubusercontent.com/shabane/kamaji/master/hub/vless.txt" },
            { protocol: "VMess", url: "https://raw.githubusercontent.com/shabane/kamaji/master/hub/vmess.txt" },
            { protocol: "Trojan", url: "https://raw.githubusercontent.com/shabane/kamaji/master/hub/trojan.txt" },
            { protocol: "Shadowsocks", url: "https://raw.githubusercontent.com/shabane/kamaji/master/hub/ss.txt" }
        ]
    },
    {
        groupName: "MhdiTaheri",
        subscriptions: [
            { protocol: "VLESS", url: "https://raw.githubusercontent.com/MhdiTaheri/V2rayCollector/main/sub/vless" },
            { protocol: "VMess", url: "https://raw.githubusercontent.com/MhdiTaheri/V2rayCollector/main/sub/vmess" },
            { protocol: "Trojan", url: "https://raw.githubusercontent.com/MhdiTaheri/V2rayCollector/main/sub/trojan" },
            { protocol: "Shadowsocks", url: "https://raw.githubusercontent.com/MhdiTaheri/V2rayCollector/main/sub/ss" }
        ]
    },
    {
        groupName: "LalatinaHub",
        subscriptions: [
            { protocol: "Mixed", url: "https://raw.githubusercontent.com/LalatinaHub/Mineral/refs/heads/master/result/nodes" }
        ]
    },
    {
        groupName: "istanbulsydneyhotel",
        subscriptions: [
            { protocol: "Mixed", url: "https://istanbulsydneyhotel.com/blogs/site/sni.php" }
        ]
    },
    {
        groupName: "acymz",
        subscriptions: [
            { protocol: "Mixed", url: "https://raw.githubusercontent.com/acymz/AutoVPN/refs/heads/main/data/V2.txt" }
        ]
    },
    {
        groupName: "shadowmere.xyz",
        subscriptions: [
            { protocol: "Mixed", url: "https://shadowmere.xyz/api/b64sub/" }
        ]
    }
];

async function main() {
    const finalGroups = [];
    const today = new Date().toISOString().split('T')[0];

    for (const source of SOURCES) {
        const newGroup = { groupName: source.groupName, date: today, subscriptions: [] };

        for (const sub of source.subscriptions) {
            try {
                console.log(`Загрузка: ${source.groupName} - ${sub.protocol}...`);
                const response = await axios.get(sub.url, { transformResponse: (res) => res }); // Получаем ответ как "сырой" текст
                const rawContent = response.data;

                // --- ФИНАЛЬНЫЙ НАДЕЖНЫЙ МЕТОД ПОДСЧЕТА ---
                const regex = /(vless:\/\/|vmess:\/\/|ss:\/\/|ssr:\/\/|trojan:\/\/)/g;
                let serverCount = 0;
                
                // 1. Сначала ищем в "сыром" тексте
                const rawMatches = rawContent.match(regex);
                if (rawMatches) {
                    serverCount = rawMatches.length;
                }

                // 2. Если ничего не найдено, пробуем декодировать из Base64
                if (serverCount === 0) {
                    try {
                        // Используем Buffer для декодирования
                        const decodedContent = Buffer.from(rawContent, 'base64').toString('utf-8');
                        const decodedMatches = decodedContent.match(regex);
                        if (decodedMatches) {
                            serverCount = decodedMatches.length;
                        }
                    } catch (e) {
                        // Если декодирование не удалось, это не Base64, ничего страшного.
                        // console.log(` -> Не является Base64.`);
                    }
                }

                // 3. Если и после этого 0, используем старый метод подсчета строк как последний шанс
                if (serverCount === 0) {
                    serverCount = rawContent.trim().split('\n').filter(line => line.length > 10).length;
                }
                // --- КОНЕЦ ФИНАЛЬНОГО МЕТОДА ---

                if (serverCount > 0) {
                    newGroup.subscriptions.push({ protocol: sub.protocol, url: sub.url, servers: serverCount });
                    console.log(` -> Успешно: ${serverCount} серверов.`);
                } else {
                    console.log(` -> Предупреждение: 0 серверов.`);
                }
            } catch (error) {
                console.error(` -> Ошибка при загрузке: ${error.message}`);
            }
        }
        
        if (newGroup.subscriptions.length > 0) {
            finalGroups.push(newGroup);
        }
    }

    // Убедитесь, что путь правильный для Next.js проекта
    await fs.writeFile('public/data.json', JSON.stringify(finalGroups, null, 2));
    console.log('Файл data.json успешно обновлен!');
}

main();
