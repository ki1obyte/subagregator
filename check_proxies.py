# check_proxies.py (исправленная версия)

import requests
import subprocess
import tempfile
import os
import time
import json
from urllib.parse import urlparse, parse_qs
import socket
import socks  # PySocks

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
            
        host, port_str = addr_port.rsplit(':', 1)
        
        # --- ИСПРАВЛЕНИЕ №1: Убираем слэш из порта, если он есть ---
        if '/' in port_str:
            port_str = port_str.split('/')[0]
            
        port = int(port_str)
        
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
            subprocess.run(['unzip', 'v2ray.zip', '-d', '.'], check=True, stdout=subprocess.DEVNULL)
            os.chmod('v2ray', 0o755)
            os.remove('v2ray.zip')
            print("V2Ray downloaded and set up successfully.")
        except Exception as e:
            print(f"Failed to setup V2Ray: {e}")
            return None
    return './v2ray'

def check_proxy(vless_url, parsed_proxy):
    if not parsed_proxy:
        return False

    print(f"\n--- Checking proxy: {parsed_proxy.get('remark', parsed_proxy.get('address'))} ---")
    
    # --- ИСПРАВЛЕНИЕ №2: Добавлен обязательный параметр "encryption": "none" ---
    config = {
        "log": {"loglevel": "warning"},
        "inbounds": [{"port": 10808, "listen": "127.0.0.1", "protocol": "socks"}],
        "outbounds": [{
            "protocol": "vless",
            "settings": { "vnext": [{"address": parsed_proxy['address'], "port": parsed_proxy['port'], "users": [{"id": parsed_proxy['id'], "encryption": "none"}] }] },
            "streamSettings": {
                "network": parsed_proxy['network'],
                "security": parsed_proxy['security'],
                "tlsSettings": {"serverName": parsed_proxy['sni']} if parsed_proxy['security'] == 'tls' else None,
                "wsSettings": {"path": parsed_proxy['path']} if parsed_proxy['network'] == 'ws' else None
            }
        }]
    }
    
    if config["outbounds"][0]["streamSettings"]["tlsSettings"] is None:
        del config["outbounds"][0]["streamSettings"]["tlsSettings"]
    if config["outbounds"][0]["streamSettings"]["wsSettings"] is None:
        del config["outbounds"][0]["streamSettings"]["wsSettings"]

    config_path = ''
    with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
        json.dump(config, f, indent=2)
        config_path = f.name

    v2ray_path = setup_v2ray()
    if not v2ray_path:
        return False
        
    proc = None
    try:
        print("Starting V2Ray process...")
        proc = subprocess.Popen([v2ray_path, 'run', '-c', config_path], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        time.sleep(3) 

        if proc.poll() is not None:
            stdout, stderr = proc.communicate()
            print(f"V2Ray process failed to start. Stderr: {stderr.strip()}")
            return False

        print("Testing connection through SOCKS proxy...")
        socks.set_default_proxy(socks.SOCKS5, "127.0.0.1", 10808)
        socket.socket = socks.socksocket
        
        start_time = time.time()
        response = requests.get('http://httpbin.org/ip', timeout=10)
        end_time = time.time()

        if response.status_code == 200:
            print(f"SUCCESS: Proxy is working. Response time: {end_time - start_time:.2f}s")
            return True
        else:
            print(f"FAILURE: Proxy responded with status code {response.status_code}")
            return False
            
    except Exception as e:
        print(f"FAILURE: An error occurred during check: {e}")
        return False
        
    finally:
        if proc and proc.poll() is None:
            proc.terminate()
            try: proc.wait(timeout=5)
            except subprocess.TimeoutExpired: proc.kill()
        if os.path.exists(config_path):
            os.unlink(config_path)
        socks.set_default_proxy()
        socket.socket = socket.socket

# Основная логика
url = "https://raw.githubusercontent.com/F0rc3Run/F0rc3Run/refs/heads/main/splitted-by-protocol/vless.txt"
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
