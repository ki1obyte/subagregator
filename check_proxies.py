import requests
import subprocess
import tempfile
import os
import time
import json
from urllib.parse import urlparse, parse_qs
import socket
import socks  # PySocks

# Скачиваем первые 100 прокси
def fetch_proxies(url, num=100):
    try:
        response = requests.get(url, timeout=10)
        lines = response.text.strip().split('\n')[:num]
        return [line.strip() for line in lines if line.strip() and line.startswith('vless://')]
    except Exception:
        return []

# Кастомный парсер VLESS (работает с вашими примерами)
def parse_vless(vless_url):
    try:
        if not vless_url.startswith('vless://'):
            return None
        content = vless_url[8:]
        remark = ''
        if '#' in content:
            content, remark = content.rsplit('#', 1)
        user, addr_port_query = content.split('@', 1)
        uuid = user
        if '?' in addr_port_query:
            addr_port, query = addr_port_query.split('?', 1)
            params = {k: v[0] for k, v in parse_qs(query).items()}
        else:
            addr_port = addr_port_query
            params = {}
        host, port = addr_port.rsplit(':', 1)
        port = int(port)
        # Defaults
        security = params.get('security', 'none')
        network = params.get('type', 'tcp')
        path = params.get('path', '/')
        sni = params.get('sni', host)
        return {
            'id': uuid,
            'address': host,
            'port': port,
            'security': security,
            'network': network,
            'path': path,
            'sni': sni,
            'params': params,
            'remark': remark
        }
    except Exception:
        return None

# Скачиваем V2Ray бинарник (linux-64 для Actions; для Windows адаптируйте URL)
def setup_v2ray():
    if not os.path.exists('v2ray'):
        url = 'https://github.com/v2fly/v2ray-core/releases/latest/download/v2ray-linux-64.zip'  # Для Windows: v2ray-windows-64.zip
        with open('v2ray.zip', 'wb') as f:
            f.write(requests.get(url).content)
        subprocess.run(['unzip', 'v2ray.zip', '-d', '.'], check=True)
        os.chmod('v2ray', 0o755)
        os.remove('v2ray.zip')
    return './v2ray'

# Проверка одного прокси (timeout 5 сек)
def check_proxy(parsed):
    if not parsed:
        return False
    # Генерируем V2Ray config
    config = {
        "inbounds": [{"port": 10808, "listen": "127.0.0.1", "protocol": "socks"}],
        "outbounds": [{
            "protocol": "vless",
            "settings": {
                "vnext": [{
                    "address": parsed['address'],
                    "port": parsed['port'],
                    "users": [{"id": parsed['id']}]
                }]
            },
            "streamSettings": {
                "network": parsed['network'],
                "security": parsed['security'],
                "tlsSettings": {"serverName": parsed['sni']} if parsed['security'] == 'tls' else {},
                "wsSettings": {"path": parsed['path']} if parsed['network'] == 'ws' else {}
            }
        }]
    }
    with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
        json.dump(config, f, indent=2)
        config_path = f.name

    v2ray_path = setup_v2ray()
    proc = None
    try:
        proc = subprocess.Popen([v2ray_path, 'run', '-c', config_path], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        time.sleep(2)  # Ждём запуска

        # Тест через SOCKS
        socks.set_default_proxy(socks.SOCKS5, "127.0.0.1", 10808)
        socket.socket = socks.socksocket
        response = requests.get('http://httpbin.org/ip', timeout=5)
        return response.status_code == 200
    except Exception:
        return False
    finally:
        if proc:
            proc.terminate()
            proc.wait(timeout=5)
        os.unlink(config_path)
        socks.set_default_proxy()  # Сброс
        socket.socket = socket.socket

# Основная логика
url = "https://raw.githubusercontent.com/F0rc3Run/F0rc3Run/refs/heads/main/splitted-by-protocol/vless.txt"
proxies = fetch_proxies(url, 100)
working = []

for proxy in proxies:
    parsed = parse_vless(proxy)
    if parsed and check_proxy(parsed):
        working.append(proxy)
    time.sleep(2)  # Пауза от банов

with open('working_vless.txt', 'w') as f:
    f.write('\n'.join(working) + '\n')

print(f"Рабочих прокси: {len(working)}")