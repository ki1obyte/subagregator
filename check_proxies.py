# check_proxies.py (финальная версия с повторными попытками)

import requests
import subprocess
import tempfile
import os
import time
import json
from urllib.parse import urlparse, parse_qs, unquote
import sys
import random

def read_proxies_from_file(filepath):
    """Читает VLESS URL из файла."""
    print(f"Reading proxies from {filepath}...")
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
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
            'ws_host': params.get('host', [''])[0] or host,
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
    Проверяет прокси с несколькими попытками.
    Возвращает URL в случае успеха, иначе None.
    """
    parsed = parse_vless(proxy_url)
    if not parsed:
        return None

    remark = parsed.get('remark') or parsed.get('address')
    print(f"\n--- Checking proxy: {remark} ({parsed.get('network')}) ---")

    # --- ЛОГИКА ПОВТОРНЫХ ПОПЫТОК ---
    max_retries = 10
    retry_delay = 2 # секунды

    for attempt in range(max_retries):
        if attempt > 0:
            print(f"--- Retrying ({attempt + 1}/{max_retries})... ---")

        # Вся логика проверки находится внутри цикла
        stream_settings = {"network": parsed['network'], "security": parsed['security']}
    
        if parsed['security'] in ['tls', 'reality']:
            tls_settings = {"serverName": parsed['sni']}
            if parsed.get('fp'):
                tls_settings["utls"] = {"enabled": True, "fingerprint": parsed['fp']}
            
            if parsed.get('security') == 'reality' and parsed.get('pbk'):
                stream_settings["security"] = "reality"
                stream_settings["realitySettings"] = {
                    "show": False,
                    "fingerprint": parsed.get('fp') or "chrome",
                    "serverName": parsed['sni'],
                    "publicKey": parsed['pbk'],
                    "shortId": parsed.get('sid', ''),
                    "spiderX": parsed.get('spx', '')
                }
            else:
                stream_settings["security"] = "tls"
                stream_settings["tlsSettings"] = tls_settings
        
        if parsed['network'] == 'ws':
            stream_settings["wsSettings"] = {"path": parsed['ws_path'], "headers": {"Host": parsed['ws_host']}}
        if parsed['network'] == 'grpc':
            stream_settings["grpcSettings"] = {"serviceName": parsed['grpc_serviceName']}

        local_port = random.randint(20000, 40000)

        config = {
            "log": {"loglevel": "warning"},
            "inbounds": [{ "port": local_port, "listen": "127.0.0.1", "protocol": "socks" }],
            "outbounds": [{
                "protocol": "vless", 
                "settings": { "vnext": [{"address": parsed['address'], "port": parsed['port'], "users": [{"id": parsed['id'], "encryption": "none", "flow": parsed.get('flow', '')}] }] },
                "streamSettings": stream_settings
            }]
        }
        
        config_path = ''
        process = None
        try:
            with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False, encoding='utf-8') as f:
                json.dump(config, f, indent=2)
                config_path = f.name

            xray_path = setup_xray()
            if not xray_path:
                # Если Xray не удалось скачать, нет смысла в повторах
                return None

            process = subprocess.Popen([xray_path, 'run', '-c', config_path], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            time.sleep(2)

            start_time = time.time()
            curl_cmd = ['curl', '--socks5-hostname', f'127.0.0.1:{local_port}', 'https://www.cloudflare.com/cdn-cgi/trace', '-s', '--max-time', '10']
            
            result = subprocess.run(curl_cmd, capture_output=True, timeout=15)
            latency = (time.time() - start_time) * 1000

            stdout_str = result.stdout.decode('utf-8', errors='ignore')
            
            if result.returncode == 0 and 'fl=' in stdout_str:
                print(f"SUCCESS: Proxy is working. Latency: {latency:.2f} ms")
                return proxy_url # Немедленный выход из функции при успехе
            else:
                stderr_str = result.stderr.decode('utf-8', errors='ignore')
                print(f"FAILURE (Attempt {attempt + 1}/{max_retries}): Proxy check failed. Curl exit code: {result.returncode}, Stderr: {stderr_str.strip()}")
        
        except Exception as e:
            print(f"FAILURE (Attempt {attempt + 1}/{max_retries}): An error occurred during check: {e}")
        
        finally:
            if process:
                process.terminate()
                process.wait()
            if os.path.exists(config_path):
                os.unlink(config_path)

        # Если это не последняя попытка, делаем задержку
        if attempt < max_retries - 1:
            time.sleep(retry_delay)

    # Если цикл завершился без успешного `return`, значит все попытки провалены
    print(f"All {max_retries} attempts failed for this proxy.")
    return None

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python check_proxies.py <input_file> <output_file>")
        sys.exit(1)

    input_file = sys.argv[1]
    output_file = sys.argv[2]

    proxies_to_check = read_proxies_from_file(input_file)
    working_proxies = []
    
    for proxy_url in proxies_to_check:
        res = check_proxy(proxy_url)
        if res:
            working_proxies.append(res)

    with open(output_file, 'w', encoding='utf-8') as f:
        if working_proxies:
            f.write('\n'.join(working_proxies) + '\n')
        else:
            f.write('')

    print(f"\n======================================")
    print(f"Check complete. Found {len(working_proxies)} working proxies in this batch.")
    print(f"Results saved to {output_file}.")
    print(f"======================================")
