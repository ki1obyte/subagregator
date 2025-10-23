const fs = require('fs').promises;
const axios = require('axios');

const SOURCES = [
    {
        groupName: "F0rc3Run",
        subscriptions: [
            { protocol: "Best-Results", url: "https://raw.githubusercontent.com/F0rc3Run/F0rc3Run/refs/heads/main/Best-Results/proxies.txt" },
            { protocol: "Shadowsocks", url: "https://raw.githubusercontent.com/F0rc3Run/F0rc3Run/refs/heads/main/splitted-by-protocol/shadowsocks.txt" },
            { protocol: "VLESS", url: "https://raw.githubusercontent.com/F0rc3Run/F0rc3Run/refs/heads/main/splitted-by-protocol/vless.txt" },
            { protocol: "VMess", url: "https://raw.githubusercontent.com/F0rc3Run/F0rc3Run/refs/heads/main/splitted-by-protocol/vmess.txt" },
            { protocol: "Trojan", url: "https://raw.githubusercontent.com/F0rc3Run/F0rc3Run/refs/heads/main/splitted-by-protocol/trojan.txt" },
        ]
    },
    {
        groupName: "mahdibland",
        subscriptions: [
            { protocol: "Mixed", url: "https://raw.githubusercontent.com/mahdibland/V2RayAggregator/master/sub/sub_merge.txt" }
        ]
    }
    // ... добавляйте другие источники по такому же принципу
];

async function main() {
    const finalGroups = [];
    const today = new Date().toISOString().split('T')[0];

    for (const source of SOURCES) {
        const newGroup = {
            groupName: source.groupName,
            date: today,
            subscriptions: []
        };

        for (const sub of source.subscriptions) {
            try {
                console.log(`Загрузка: ${source.groupName} - ${sub.protocol}...`);
                const response = await axios.get(sub.url);
                const content = response.data;
                const serverCount = content.trim().split('\n').length;

                if (serverCount > 0) {
                    newGroup.subscriptions.push({
                        protocol: sub.protocol,
                        url: sub.url,
                        servers: serverCount
                    });
                    console.log(` -> Успешно: ${serverCount} серверов.`);
                } else {
                    console.log(` -> Предупреждение: 0 серверов.`);
                }
            } catch (error) {
                console.error(` -> Ошибка при загрузке: ${error.message}`);
            }
        }
        
        // Добавляем группу в итоговый список, только если в ней есть хотя бы одна рабочая подписка
        if (newGroup.subscriptions.length > 0) {
            finalGroups.push(newGroup);
        }
    }

    await fs.writeFile('data.json', JSON.stringify(finalGroups, null, 2));
    console.log('Файл data.json успешно обновлен в новом групповом формате!');
}

main();
