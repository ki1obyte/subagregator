# deduplicate.py
import sys
import os
from urllib.parse import urlparse, parse_qs

def deduplicate_file(filepath):
    """
    Deduplicates VLESS URLs in a file based on key connection parameters,
    ignoring remarks and non-essential query parameters.
    """
    unique_proxies = set()
    valid_lines = []
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            lines = f.read().strip().split('\n')
        
        raw_vless_lines = [line for line in lines if line.strip().startswith('vless://')]
        
        for line in raw_vless_lines:
            try:
                parsed_url = urlparse(line)
                params = parse_qs(parsed_url.query)
                
                # Create a fingerprint from key parameters only
                core_id = parsed_url.netloc
                pbk = params.get('pbk', [''])[0]
                sni = params.get('sni', [''])[0]
                network_type = params.get('type', ['tcp'])[0]
                
                service_name = ''
                if network_type == 'grpc':
                    service_name = params.get('serviceName', [''])[0]
                
                proxy_fingerprint = (core_id, pbk, sni, network_type, service_name)

                if proxy_fingerprint not in unique_proxies:
                    unique_proxies.add(proxy_fingerprint)
                    valid_lines.append(line)
            except Exception:
                continue
        
        if valid_lines:
            valid_lines.sort()
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write('\n'.join(valid_lines) + '\n')
            print(f"Deduplicated {filepath}: {len(raw_vless_lines)} -> {len(valid_lines)}")
        elif os.path.exists(filepath):
             open(filepath, 'w').close()
             print(f"Emptied {filepath} as no valid proxies were found.")

    except Exception as e:
        print(f"Error processing file {filepath}: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python deduplicate.py <directory_path>")
        sys.exit(1)
        
    target_dir = sys.argv[1]
    
    if not os.path.isdir(target_dir):
        print(f"Error: Directory not found at {target_dir}")
        sys.exit(1)
        
    print(f"Starting final deduplication in directory: {target_dir}")
    for filename in os.listdir(target_dir):
        if filename.endswith(".txt"):
            filepath = os.path.join(target_dir, filename)
            deduplicate_file(filepath)
    print("Final deduplication complete.")
