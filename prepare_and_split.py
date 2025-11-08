# prepare_and_split.py
import requests
import sys
from urllib.parse import urlparse, parse_qs

def get_proxy_fingerprint(vless_url):
    """
    Создает уникальный "отпечаток" прокси на основе ключевых параметров,
    игнорируя имя (remark).
    """
    try:
        parsed_url = urlparse(vless_url)
        params = parse_qs(parsed_url.query)
        
        # Ключевые параметры для уникальности
        core_id = parsed_url.netloc  # Содержит UUID и address:port
        pbk = params.get('pbk', [''])[0]
        sni = params.get('sni', [''])[0]
        network_type = params.get('type', ['tcp'])[0]
        
        service_name = ''
        if network_type == 'grpc':
            service_name = params.get('serviceName', [''])[0]
            
        return (core_id, pbk, sni, network_type, service_name)
    except Exception:
        return None

def main():
    if len(sys.argv) < 3:
        print("Usage: python prepare_and_split.py <source_url> <num_jobs>")
        sys.exit(1)

    source_url = sys.argv[1]
    try:
        num_jobs = int(sys.argv[2])
    except ValueError:
        print("Error: num_jobs must be an integer.")
        sys.exit(1)

    print(f"Fetching proxies from {source_url}...")
    try:
        response = requests.get(source_url, timeout=30)
        response.raise_for_status()
        lines = response.text.strip().split('\n')
    except requests.RequestException as e:
        print(f"Failed to fetch proxies: {e}")
        sys.exit(1)

    print(f"Initial proxies found: {len(lines)}")

    # 1. Фильтрация: оставляем только VLESS с REALITY
    reality_proxies = [
        line for line in lines 
        if line.strip().startswith('vless://') and 'security=reality' in line
    ]
    print(f"Found {len(reality_proxies)} REALITY proxies.")

    # 2. Дедупликация по ключевым параметрам
    unique_proxies = {}
    for proxy in reality_proxies:
        fingerprint = get_proxy_fingerprint(proxy)
        if fingerprint and fingerprint not in unique_proxies:
            unique_proxies[fingerprint] = proxy
            
    final_proxies = list(unique_proxies.values())
    print(f"Found {len(final_proxies)} unique REALITY proxies after deduplication.")

    if not final_proxies:
        print("No proxies left to split. Creating empty chunk files.")
        for i in range(num_jobs):
            with open(f"proxies_{i}.txt", 'w') as f:
                pass # Создаем пустой файл
        return

    # 3. Разделение на N частей
    chunk_size = (len(final_proxies) + num_jobs - 1) // num_jobs  # Деление с округлением вверх
    for i in range(num_jobs):
        chunk = final_proxies[i * chunk_size:(i + 1) * chunk_size]
        output_filename = f"proxies_{i}.txt"
        with open(output_filename, 'w', encoding='utf-8') as f:
            if chunk:
                f.write('\n'.join(chunk) + '\n')
        print(f"Created {output_filename} with {len(chunk)} proxies.")

if __name__ == "__main__":
    main()
