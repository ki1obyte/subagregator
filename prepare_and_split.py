# prepare_and_split.py
import requests
import sys
import base64
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
        print("Usage: python prepare_and_split.py <source_urls> <num_jobs>")
        sys.exit(1)

    # Принимаем строку с URL, разделенную пробелами или переносами
    source_urls = sys.argv[1].split()
    
    try:
        num_jobs = int(sys.argv[2])
    except ValueError:
        print("Error: num_jobs must be an integer.")
        sys.exit(1)

    print(f"Processing {len(source_urls)} sources...")
    all_lines = []

    # Проходим по всем источникам
    for url in source_urls:
        if not url.strip(): continue
        print(f"Fetching proxies from: {url}")
        try:
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            content = response.text.strip()
            
            # --- Блок обработки Base64 ---
            # Если в тексте нет '://', скорее всего это Base64
            if '://' not in content and len(content) > 10:
                try:
                    # Добавляем паддинг (=), если нужно, и декодируем
                    decoded_bytes = base64.b64decode(content + '=' * (-len(content) % 4))
                    content = decoded_bytes.decode('utf-8', errors='ignore')
                    print("  -> Successfully decoded Base64 content.")
                except Exception:
                    print("  -> Failed to decode Base64, treating as plain text.")
            # -----------------------------

            new_lines = content.split('\n')
            all_lines.extend(new_lines)
            print(f"  -> Found {len(new_lines)} lines.")
            
        except requests.RequestException as e:
            print(f"  -> Failed to fetch proxies from {url}: {e}")

    print(f"Total raw lines collected: {len(all_lines)}")

    # 1. Фильтрация: оставляем только VLESS с REALITY
    # Это ключевой фильтр, который ты просил не удалять
    reality_proxies = [
        line.strip() for line in all_lines 
        if line.strip().startswith('vless://') and 'security=reality' in line
    ]
    print(f"Found {len(reality_proxies)} potential REALITY proxies.")

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
