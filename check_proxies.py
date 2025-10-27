# check_proxies.py (финальная версия с повторными попытками)

import requests
import subprocess
import tempfile
import os
import time
import json
from urllib.parse import urlparse, parse_qs, unquote
import socket
import socks

def fetch_proxies(url, num=100):
    print(f"Fetching {num} proxies from {url}...")
    try:
        response = requests.get(url, timeout=10)
        lines = response.text.strip().split('\n')[:num]
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
            'sni': params.get('sni', [params.get('host', [''])[0]])[0] or host,
            'ws_path': params.get('path', ['/'])[0],
            'ws_host': params.get('host', [''])[0],
            'grpc_serviceName': params.get('serviceName', [''])[0],
            'remark': remark
        }
    except Exception as e:
        print(f"Failed to parse VLESS URL: {vless_url} | Error: {e}")
        return None

def setup_v2ray():
    if not os.path.exists('v2ray'):
        print("V2Ray not found, downloading...")
        url = 'https://github.com/v2fly/v2ray-core/releases/latest/download/v2ray-linux-64.zip'
        try:
            with open('v2ray.zip', 'wb') as f:
                f.write(requests.get(url, timeout=30).content)
            subprocess.run(['unzip', '-o', 'v2ray.zip', '-d', '.'], check=True, stdout=subprocess.DEVNULL)
            os.chmod('v2ray', 0o755)
            os.remove('v2ray.zip')
            print("V2Ray downloaded and set up successfully.")
        except Exception as e:
            print(f"Failed to setup V2Ray: {e}")
            return None
    return './v2ray'

def check_proxy(vless_url, parsed):
    if not parsed:
        return False

    print(f"\n--- Checking proxy: {parsed.get('remark') or parsed.get('address')} ({parsed.get('network')}) ---")
    
    stream_settings = {"network": parsed['network'], "security": parsed['security']}
    if parsed['security'] == 'tls':
        stream_settings["tlsSettings"] = {"serverName": parsed['sni']}
    if parsed['network'] == 'ws':
        stream_settings["wsSettings"] = {"path": parsed['ws_path'], "headers": {"Host": parsed['ws_host']}}
    if parsed['network'] == 'grpc':
        stream_settings["grpcSettings"] = {"serviceName": parsed['grpc_serviceName']}

    config = {
        "log": {"loglevel": "warning"},
        "inbounds": [{"port": 10808, "listen": "127.0.0.1", "protocol": "socks"}],
        "outbounds": [{"protocol": "vless", "settings": {"vnext": [{"address": parsed['address'], "port": parsed['port'], "users": [{"id": parsed['id'], "encryption": "none"}]}]}, "streamSettings": stream_settings}]
    }
    
    # --- НОВАЯ ЛОГИКА С ПОВТОРНЫМИ ПОПЫТКАМИ ---
    max_retries = 3
    retry_delay = 5  # секунды
    
    for attempt in range(max_retries):
        print(f"Attempt {attempt + 1}/{max_retries}...")
        config_path = ''
        proc = None
        try:
            with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
                json.dump(config, f, indent=2)
                config_path = f.name

            v2ray_path = setup_v2ray()
            if not v2ray_path: return False
                
            proc = subprocess.Popen([v2ray_path, 'run', '-c', config_path], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            time.sleep(3) 

            if proc.poll() is not None:
                stdout, stderr = proc.communicate()
                print(f"V2Ray process failed to start. Stderr: {stderr.strip()}")
                return False # Если V2ray не стартует, повторять нет смысла

            socks.set_default_proxy(socks.SOCKS5, "127.0.0.1", 10808)
            socket.socket = socks.socksocket
            
            start_time = time.time()
            response = requests.get('http://httpbin.org/ip', timeout=20) # Увеличенный таймаут
            end_time = time.time()

            if response.status_code == 200:
                print(f"SUCCESS: Proxy is working. Response time: {end_time - start_time:.2f}s")
                return True # Успех, выходим из функции
            else:
                print(f"FAILURE on attempt {attempt + 1}: Proxy responded with status code {response.status_code}")
                # Продолжаем цикл для следующей попытки
        
        except Exception as e:
            print(f"FAILURE on attempt {attempt + 1}: An error occurred: {e}")
            # Продолжаем цикл для следующей попытки
            
        finally:
            if proc and proc.poll() is None:
                proc.terminate()
                try: proc.wait(timeout=5)
                except subprocess.TimeoutExpired: proc.kill()
            if os.path.exists(config_path):
                os.unlink(config_path)
            socks.set_default_proxy()
        
        # Если это не последняя попытка, ждем перед следующей
        if attempt < max_retries - 1:
            print(f"Waiting for {retry_delay} seconds before retrying...")
            time.sleep(retry_delay)

    # Если все попытки провалились
    print("All attempts failed for this proxy.")
    return False

# Основная логика
url = "https://raw.githubusercontent.com/ki1obyte/325234657545/refs/heads/main/test.txt"
proxies = fetch_proxies(url, 100)
working = []

for i, proxy_url in enumerate(proxies):
    print(f"\n======== Processing proxy {i+1}/{len(proxies)} ========")
    parsed = parse_vless(proxy_url)
    if parsed and check_proxy(proxy_url, parsed):
        working.append(proxy_url)

with open('working_vless.txt', 'w') as f:
    if working:
        f.write('\n'.join(working) + '\n')
    else:
        f.write('')

print(f"\n======================================")
print(f"Check complete. Found {len(working)} working proxies.")
print(f"======================================")
