# prepare_and_split.py
import sys
import os
from urllib.parse import urlparse, parse_qs
import requests

def get_unique_proxies(url):
    """Downloads a list of proxies and returns a deduplicated list of URLs."""
    print(f"Fetching proxy list from {url}...")
    try:
        response = requests.get(url, timeout=60)
        response.raise_for_status()
        lines = response.text.strip().split('\n')
    except requests.RequestException as e:
        print(f"Failed to download proxy list: {e}")
        return []

    print("Filtering for REALITY proxies and deduplicating...")
    unique_proxies = set()
    valid_lines = []
    
    # Filter for lines that are likely REALITY proxies
    reality_lines = [line for line in lines if 'pbk=' in line or 'security=reality' in line]

    for line in reality_lines:
        line = line.strip()
        if not line.startswith('vless://'):
            continue
        try:
            parsed_url = urlparse(line)
            params = parse_qs(parsed_url.query)
            
            # Create a fingerprint from key parameters
            core_id = parsed_url.netloc
            pbk = params.get('pbk', [''])[0]
            sni = params.get('sni', [''])[0]
            network_type = params.get('type', ['tcp'])[0]
            service_name = params.get('serviceName', [''])[0] if network_type == 'grpc' else ''
            
            proxy_fingerprint = (core_id, pbk, sni, network_type, service_name)

            if proxy_fingerprint not in unique_proxies:
                unique_proxies.add(proxy_fingerprint)
                valid_lines.append(line)
        except Exception:
            continue
            
    print(f"Found {len(valid_lines)} unique REALITY proxies.")
    return valid_lines

def split_proxies(proxies, num_jobs):
    """Splits the list of proxies into a specified number of chunks."""
    if not proxies:
        print("No proxies to split.")
        return
        
    chunk_size = (len(proxies) + num_jobs - 1) // num_jobs  # Ceiling division
    
    for i in range(num_jobs):
        chunk = proxies[i * chunk_size:(i + 1) * chunk_size]
        if chunk:
            output_filename = f"proxies_{i}.txt"
            with open(output_filename, 'w', encoding='utf-8') as f:
                f.write('\n'.join(chunk) + '\n')
            print(f"Created chunk {output_filename} with {len(chunk)} proxies.")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python prepare_and_split.py <source_url> <num_jobs>")
        sys.exit(1)
        
    source_url = sys.argv[1]
    try:
        num_jobs = int(sys.argv[2])
    except ValueError:
        print("Error: num_jobs must be an integer.")
        sys.exit(1)
        
    unique_proxies_list = get_unique_proxies(source_url)
    split_proxies(unique_proxies_list, num_jobs)
    print("Preparation and splitting complete.")
