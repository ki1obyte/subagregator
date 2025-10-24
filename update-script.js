const fs = require('fs').promises;
const axios = require('axios');

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
            { protocol: "VLESS", url: "https://raw.githubusercontent.com/Epodonios/v2ray-configs/main/Splitted-By-Protocol/vless.txt" },
            { protocol: "VMess", url: "https://raw.githubusercontent.com/Epodonios/v2ray-configs/main/Splitted-By-Protocol/vmess.txt" },
            { protocol: "Shadowsocks", url: "https://raw.githubusercontent.com/Epodonios/v2ray-configs/main/Splitted-By-Protocol/ss.txt" },
            { protocol: "SSR", url: "https://raw.githubusercontent.com/Epodonios/v2ray-configs/main/Splitted-By-Protocol/ssr.txt" },
            { protocol: "Trojan", url: "https://raw.githubusercontent.com/Epodonios/v2ray-configs/main/Splitted-By-Protocol/trojan.txt" }
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
        groupName: "wuqb2i4f",
        subscriptions: [
            { protocol: "Trojan", url: "https://raw.githubusercontent.com/wuqb2i4f/xray-config-toolkit/refs/heads/main/output/base64/mix-protocol-tr" },
            { protocol: "VLESS", url: "https://raw.githubusercontent.com/wuqb2i4f/xray-config-toolkit/refs/heads/main/output/base64/mix-protocol-vl" },
            { protocol: "VMess", url: "https://raw.githubusercontent.com/wuqb2i4f/xray-config-toolkit/refs/heads/main/output/base64/mix-protocol-vm" }
        ]
    },
    {
        groupName: "mahdibland",
        subscriptions: [
            { protocol: "VMess", url: "https://raw.githubusercontent.com/mahdibland/ShadowsocksAggregator/master/sub/splitted/vmess.txt" },
            { protocol: "Trojan", url: "https://raw.githubusercontent.com/mahdibland/ShadowsocksAggregator/master/sub/splitted/trojan.txt" },
            { protocol: "SSR", url: "https://raw.githubusercontent.com/mahdibland/ShadowsocksAggregator/master/sub/splitted/ssr.txt" },
            { protocol: "Shadowsocks", url: "https://raw.githubusercontent.com/mahdibland/ShadowsocksAggregator/master/sub/splitted/ss.txt" }
        ]
    },
    {
        groupName: "roosterkid",
        subscriptions: [
            { protocol: "HTTPS", url: "https://raw.githubusercontent.com/roosterkid/openproxylist/refs/heads/main/HTTPS_RAW.txt" },
            { protocol: "SOCKS4", url: "https://raw.githubusercontent.com/roosterkid/openproxylist/refs/heads/main/SOCKS4_RAW.txt" },
            { protocol: "SOCKS5", url: "https://raw.githubusercontent.com/roosterkid/openproxylist/refs/heads/main/SOCKS5_RAW.txt" },
            { protocol: "V2Ray", url: "https://raw.githubusercontent.com/roosterkid/openproxylist/refs/heads/main/V2RAY_RAW.txt" }
        ]
    },
    {
        groupName: "ssrsub",
        subscriptions: [
            { protocol: "Hysteria2", url: "https://raw.githubusercontent.com/ssrsub/ssr/refs/heads/master/hysteria2.txt" },
            { protocol: "Shadowsocks", url: "https://raw.githubusercontent.com/ssrsub/ssr/refs/heads/master/ss.txt" },
            { protocol: "Trojan", url: "https://raw.githubusercontent.com/ssrsub/ssr/refs/heads/master/trojan.txt" },
            { protocol: "VLESS", url: "https://raw.githubusercontent.com/ssrsub/ssr/refs/heads/master/vless.txt" },
            { protocol: "VMess", url: "https://raw.githubusercontent.com/ssrsub/ssr/refs/heads/master/vmess.txt" }
        ]
    },
    // --- ОБЪЕДИНЕННАЯ ГРУППА MIXED ---
    {
        groupName: "group-mixed",
        subscriptions: [
            { protocol: "LalatinaHub", url: "https://raw.githubusercontent.com/LalatinaHub/Mineral/refs/heads/master/result/nodes" },
            { protocol: "istanbulsydneyhotel", url: "https://istanbulsydneyhotel.com/blogs/site/sni.php" },
            { protocol: "acymz", url: "https://raw.githubusercontent.com/acymz/AutoVPN/refs/heads/main/data/V2.txt" },
            { protocol: "shadowmere.xyz", url: "https://shadowmere.xyz/api/b64sub/" },
            { protocol: "AzadNetCH", url: "https://raw.githubusercontent.com/AzadNetCH/Clash/main/AzadNet.txt" },
            { protocol: "liketolivefree", url: "https://raw.githubusercontent.com/liketolivefree/kobabi/refs/heads/main/sub_all.txt" },
            { protocol: "STR97", url: "https://raw.githubusercontent.com/STR97/STRUGOV/refs/heads/main/STR.BYPASS" },
            { protocol: "aiboboxx", url: "https://raw.githubusercontent.com/free-nodes/v2rayfree/refs/heads/main/v2" },
            { protocol: "mehran1404", url: "https://raw.githubusercontent.com/mehran1404/Sub_Link/refs/heads/main/V2RAY-Sub.txt" },
            { protocol: "Kwinshadow", url: "https://raw.githubusercontent.com/Kwinshadow/TelegramV2rayCollector/main/sublinks/mix.txt" },
            { protocol: "Pawdroid", url: "https://raw.githubusercontent.com/Pawdroid/Free-servers/refs/heads/main/static/sub_ru" }
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
                const response = await axios.get(sub.url, { transformResponse: (res) => res });
                const rawContent = response.data;

                let serverCount = 0;
                const lines = rawContent.trim().split(/\r?\n/);
                const regex = /(vless:\/\/|vmess:\/\/|ss:\/\/|ssr:\/\/|trojan:\/\/|hy2:\/\/|hysteria2:\/\/)/g;

                for (const line of lines) {
                    const trimmedLine = line.trim();
                    if (trimmedLine.length < 10 || trimmedLine.startsWith('#')) continue;

                    let matches = trimmedLine.match(regex);
                    if (matches) {
                        serverCount += matches.length;
                        continue;
                    }

                    try {
                        const decodedLine = Buffer.from(trimmedLine, 'base64').toString('utf-8');
                        matches = decodedLine.match(regex);
                        if (matches) {
                            serverCount += matches.length;
                        }
                    } catch (e) { /* Игнорируем ошибки декодирования */ }
                }

                // --- ВОТ ГЛАВНОЕ ИСПРАВЛЕНИЕ ---
                // Если после всех умных проверок серверов все еще 0,
                // то считаем, что это простой список (SOCKS, HTTP, и т.д.) и считаем строки.
                if (serverCount === 0) {
                    console.log(` -> Префиксы не найдены. Используем подсчет по строкам.`);
                    serverCount = lines.filter(line => {
                        const trimmed = line.trim();
                        // Считаем строку валидной, если она не пустая и не комментарий
                        return trimmed.length > 0 && !trimmed.startsWith('#');
                    }).length;
                }
                // --- КОНЕЦ ИСПРАВЛЕНИЯ ---

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

    await fs.writeFile('public/data.json', JSON.stringify(finalGroups, null, 2));
    console.log('Файл data.json успешно обновлен!');
}

main();




