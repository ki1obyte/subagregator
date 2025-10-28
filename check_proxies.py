# check_proxies.py (исправленная версия с параллельным запуском и полноценной проверкой соединения)

import requests
import subprocess
import tempfile
import os
import time
import json
from urllib.parse import urlparse, parse_qs, unquote
import sys
import random
import multiprocessing

def read_proxies_from_file(filepath):
    """Читает VLESS URL из файла."""
    print(f"Reading proxies from {filepath}...")
    try:
        with open(filepath, 'r') as f:
            lines = f.read().strip().split('\n')
        valid_lines = [line for line in lines if line.strip().startswith('vless://')]
        print(f"Successfully read {len(valid_lines)} VLESS links.")
        return valid_lines
    except FileNotFoundError:
        print(f"Input file not found: {filepath}. It might be empty, which is normal.")
        return []
    except Exception as e:
        print(f"Error reading proxies from file: {e}")
        return []

def parse_vless(vless_url):
    """Парсит VLESS URL и извлекает параметры конфигурации."""
    try:
        parsed_url = urlparse(vless_url)
        params = parse_qs(parsed_url.query)
        
        remark = unquote(parsed_url.fragment) if parsed_url.fragment else ''
        host, port_str = parsed_url.netloc.split('@')[1].rsplit(':', 1)
        
        return {
            'id': parsed_url.netloc.split('@')[0],
            'address': host,
            'port': int(port_str),
            'network': params.get('type', ['tcp'])[0],
            'security': params.get('security', ['none'])[0],
            'flow': params.get('flow', [''])[0],
            'sni': params.get('sni', [params.get('host', [''])[0]])[0] or host,
            'fp': params.get('fp', [''])[0],
            'pbk': params.get('pbk', [''])[0],
            'sid': params.get('sid', [''])[0],
            'spx': params.get('spx', [''])[0],
            'ws_path': params.get('path', ['/'])[0],
            'ws_host': params.get('host', [''])[0],
            'grpc_serviceName': params.get('serviceName', [''])[0],
            'remark': remark
        }
    except Exception as e:
        print(f"Failed to parse VLESS URL: {vless_url} | Error: {e}")
        return None

def setup_xray():
    """Скачивает и настраивает исполняемый файл Xray, если он отсутствует."""
    if not os.path.exists('xray'):
        print("Xray not found, downloading...")
        url = 'https://github.com/XTLS/Xray-core/releases/latest/download/Xray-linux-64.zip'
        try:
            with open('xray.zip', 'wb') as f:
                f.write(requests.get(url, timeout=30).content)
            subprocess.run(['unzip', '-o', 'xray.zip', '-d', '.'], check=True, stdout=subprocess.DEVNULL)
            os.chmod('xray', 0o755)
            os.remove('xray.zip')
            print("Xray downloaded and set up successfully.")
        except Exception as e:
            print(f"Failed to setup Xray: {e}")
            return None
    return './xray'

def check_proxy(proxy_url):
    """
    Проверяет прокси, запуская Xray как клиент и тестируя соединение через curl.
    Возвращает исходный URL, если работает, иначе None.
    """
    parsed = parse_vless(proxy_url)
    if not parsed:
        return None

    remark = parsed.get('remark') or parsed.get('address')
    print(f"\n--- Checking proxy: {remark} ({parsed.get('network')}) ---")
    
    stream_settings = {"network": parsed['network'], "security": parsed['security']}
    
    if parsed['security'] in ['tls', 'reality']:
        tls_settings = {"serverName": parsed['sni']}
        if parsed['fp']:
            tls_settings["utls"] = {"enabled": True, "fingerprint": parsed['fp']}
        
        if parsed['security'] == 'reality' or parsed['pbk']:
            stream_settings["security"] = "reality"
            stream_settings["realitySettings"] = {
                "show": False,
                "fingerprint": parsed['fp'] or "chrome",
                "serverName": parsed['sni'],
                "publicKey": parsed['pbk'],
                "shortId": parsed['sid'],
                "spiderX": parsed['spx']
            }
        else:
            stream_settings["tlsSettings"] = tls_settings
    
    if parsed['network'] == 'ws':
        stream_settings["wsSettings"] = {"path": parsed['ws_path'], "headers": {"Host": parsed['ws_host']}}
    if parsed['network'] == 'grpc':
        stream_settings["grpcSettings"] = {"serviceName": parsed['grpc_serviceName']}

    # Выбираем случайный порт для inbound, чтобы избежать конфликтов в параллели
    local_port = random.randint(10800, 10900)

    # Конфигурация с outbound и inbound (SOCKS для теста)
    config = {
        "log": {"loglevel": "warning"},
        "inbounds": [{
            "port": local_port,
            "listen": "127.0.0.1",
            "protocol": "socks",
            "settings": {"udp": True}
        }],
        "outbounds": [{
            "protocol": "vless", 
            "settings": {
                "vnext": [{
                    "address": parsed['address'], 
                    "port": parsed['port'], 
                    "users": [{"id": parsed['id'], "encryption": "none", "flow": parsed['flow']}]
                }]
            },
            "streamSettings": stream_settings,
            "tag": "proxy"
        }]
    }
    
    config_path = ''
    process = None
    try:
        # Создаем временный файл конфигурации
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            json.dump(config, f, indent=2)
            config_path = f.name

        xray_path = setup_xray()
        if not xray_path:
            return None

        # Сначала проверяем синтаксис конфига
        syntax_check = subprocess.run([xray_path, '-test', '-c', config_path], capture_output=True, text=True, timeout=10)
        if syntax_check.returncode != 0:
            print(f"FAILURE: Config syntax error. Stderr: {syntax_check.stderr.strip()}")
            return None

        # Запускаем Xray в фоне
        process = subprocess.Popen([xray_path, 'run', '-c', config_path], stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
        time.sleep(2)  # Даем время на запуск

        # Тестируем соединение через curl (проверяем доступ к Google)
        start_time = time.time()
        curl_cmd = ['curl', '-x', f'socks5://127.0.0.1:{local_port}', 'https://www.google.com', '-s', '--max-time', '10']
        result = subprocess.run(curl_cmd, capture_output=True, text=True)
        latency = (time.time() - start_time) * 1000

        if result.returncode == 0 and 'google' in result.stdout.lower():
            print(f"SUCCESS: Proxy is working. Latency: {latency:.2f} ms")
            return proxy_url
        else:
            print(f"FAILURE: Proxy check failed. Curl error: {result.stderr.strip()}")
            return None

    except subprocess.TimeoutExpired:
        print("FAILURE: Test timed out.")
        return None
    except Exception as e:
        print(f"FAILURE: An error occurred during check: {e}")
        return None
    finally:
        if process:
            process.terminate()
            process.wait()
        if os.path.exists(config_path):
            os.unlink(config_path)

# Основная логика с параллельным запуском
if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python check_proxies.py <input_file> <output_file>")
        sys.exit(1)

    input_file = sys.argv[1]
    output_file = sys.argv[2]

    proxies_to_check = read_proxies_from_file(input_file)

    # Параллельная проверка (4 процесса одновременно)
    with multiprocessing.Pool(processes=4) as pool:
        working_proxies = pool.map(check_proxy, proxies_to_check)
    
    # Фильтруем None
    working_proxies = [p for p in working_proxies if p]

    # Записываем рабочие прокси в файл
    with open(output_file, 'w') as f:
        if working_proxies:
            f.write('\n'.join(working_proxies) + '\n')
        else:
            f.write('')

    print(f"\n======================================")
    print(f"Check complete. Found {len(working_proxies)} working proxies in this batch.")
    print(f"Results saved to {output_file}.")
    print(f"======================================")
