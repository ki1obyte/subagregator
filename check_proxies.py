# check_proxies.py (версия для проверки ТОЛЬКО REALITY прокси)

import requests
import subprocess
import tempfile
import os
import time
import json
from urllib.parse import urlparse, parse_qs, unquote
import socket
import socks

# --- ИЗМЕНЕНИЕ 1: Функция теперь скачивает ВСЕ прокси ---
def fetch_proxies(url):
    print(f"Fetching ALL proxies from {url}...")
    try:
        response = requests.get(url, timeout=20) # Увеличим таймаут для больших списков
        lines = response.text.strip().split('\n')
        print(f"Successfully fetched {len(lines)} lines.")
        return [line.strip() for line in lines if line.strip() and line.startswith('vless://')]
    except Exception as e:
        print(f"Error fetching proxies: {e}")
        return []

def parse_vless(vless_url):
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
    # Эта функция остается без изменений
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

def check_proxy(vless_url, parsed):
    # Эта функция остается без изменений
    if not parsed:
        return False

    print(f"\n--- Checking proxy: {parsed.get('remark') or parsed.get('address')} ({parsed.get('network')}) ---")
    
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

    config = {
        "log": {"loglevel": "warning"},
        "inbounds": [{"port": 10808, "listen": "127.0.0.1", "protocol": "socks"}],
        "outbounds": [{"protocol": "vless", 
                       "settings": {"vnext": [{"address": parsed['address'], "port": parsed['port'], 
                                               "users": [{"id": parsed['id'], "encryption": "none", "flow": parsed['flow']}]}]},
                       "streamSettings": stream_settings}]
    }
    
    max_retries = 10
    retry_delay = 5
    
    for attempt in range(max_retries):
        print(f"Attempt {attempt + 1}/{max_retries}...")
        config_path = ''
        proc = None
        try:
            with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
                json.dump(config, f, indent=2)
                config_path = f.name

            xray_path = setup_xray()
            if not xray_path: return False
                
            proc = subprocess.Popen([xray_path, 'run', '-c', config_path], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            time.sleep(5)

            if proc.poll() is not None:
                stdout, stderr = proc.communicate()
                print(f"Xray process failed to start. Stderr: {stderr.strip()}")
                return False

            socks.set_default_proxy(socks.SOCKS5, "127.0.0.1", 10808)
            socket.socket = socks.socksocket
            
            start_time = time.time()
            response = requests.get('http://httpbin.org/ip', timeout=30)
            end_time = time.time()

            if response.status_code == 200:
                print(f"SUCCESS: Proxy is working. Response time: {end_time - start_time:.2f}s")
                return True
            else:
                print(f"FAILURE on attempt {attempt + 1}: Proxy responded with status code {response.status_code}")

        except Exception as e:
            print(f"FAILURE on attempt {attempt + 1}: An error occurred: {e}")
            
        finally:
            if proc:
                if proc.poll() is None:
                    proc.terminate()
                    try:
                        proc.wait(timeout=5)
                    except subprocess.TimeoutExpired:
                        proc.kill()
                stdout, stderr = proc.communicate()
                if stderr:
                    print(f"Xray stderr: {stderr.strip()}")
            if os.path.exists(config_path):
                os.unlink(config_path)
            socks.set_default_proxy()
            time.sleep(1)
        
        if attempt < max_retries - 1:
            print(f"Waiting for {retry_delay} seconds before retrying...")
            time.sleep(retry_delay)

    print("All attempts failed for this proxy.")
    return False

# --- ИЗМЕНЕНИЕ 2: Полностью переписанная основная логика ---
# Main logic
url = "https://raw.githubusercontent.com/F0rc3Run/F0rc3Run/refs/heads/main/splitted-by-protocol/vless.txt"
all_proxies = fetch_proxies(url)
working = []
reality_proxies_to_check = []

print(f"\nFound {len(all_proxies)} total VLESS proxies. Filtering for REALITY configurations...")

# Этап 1: Отфильтровываем только REALITY прокси
for proxy_url in all_proxies:
    parsed_proxy = parse_vless(proxy_url)
    # Главный признак REALITY - наличие 'pbk' или явное указание 'security=reality'
    if parsed_proxy and (parsed_proxy.get('pbk') or parsed_proxy.get('security') == 'reality'):
        reality_proxies_to_check.append(proxy_url)

print(f"Found {len(reality_proxies_to_check)} REALITY proxies. Starting checks...")

# Этап 2: Проверяем только отфильтрованные REALITY прокси
for i, proxy_url in enumerate(reality_proxies_to_check):
    print(f"\n======== Processing REALITY proxy {i+1}/{len(reality_proxies_to_check)} ========")
    # Перепарсиваем, чтобы получить чистый словарь для функции проверки
    parsed = parse_vless(proxy_url)
    if parsed and check_proxy(proxy_url, parsed):
        working.append(proxy_url)

# Этап 3: Записываем рабочие в файл
with open('test.txt', 'w') as f:
    if working:
        f.write('\n'.join(working) + '\n')
    else:
        f.write('')

print(f"\n======================================")
print(f"Check complete. Found {len(working)} working REALITY proxies.")
print(f"======================================")
