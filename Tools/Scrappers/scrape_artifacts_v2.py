import requests
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.util.retry import Retry
from bs4 import BeautifulSoup
import os
import time
import re
from urllib.parse import urljoin
import sys

# --- Configuration ---
BASE_URL = "https://game8.co"
ENTRY_URL = "https://game8.co/games/Genshin-Impact/archives/297493"
OUTPUT_DIR = "../../Artifacts/GenshinArtifacts2"
LOG_FILE = "error_log.txt"
DELAY_SECONDS = 2.0

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9"
}

# --- Utilities ---

def setup_logging():
    with open(LOG_FILE, 'w') as f:
        f.write(f"Scrape started at {time.ctime()}\n")

def log_error(message):
    print(f"[ERROR] {message}")
    with open(LOG_FILE, 'a') as f:
        f.write(f"[ERROR] {time.ctime()} - {message}\n")

def sanitize_filename(name):
    """Sanitize directory names by replacing restricted characters."""
    return re.sub(r'[\\/*?:"<>|]', "_", name).replace(" ", "_").replace("'", "")

def get_session():
    """Create a requests Session with retry logic."""
    session = requests.Session()
    session.headers.update(HEADERS)
    
    retry_strategy = Retry(
        total=3,
        backoff_factor=1,
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["HEAD", "GET", "OPTIONS"]
    )
    adapter = HTTPAdapter(max_retries=retry_strategy)
    session.mount("https://", adapter)
    session.mount("http://", adapter)
    return session

# --- Core Logic ---

def get_master_list(session):
    print(f"[*] Accessing Master List: {ENTRY_URL}")
    try:
        response = session.get(ENTRY_URL)
        response.raise_for_status()
    except Exception as e:
        log_error(f"Failed to fetch master list: {e}")
        sys.exit(1)

    soup = BeautifulSoup(response.text, 'html.parser')
    
    # Target: Header containing "List of Max 5-Star Artifacts"
    # Using re.compile to be case-insensitive and partial match robust
    target_header = soup.find(lambda tag: tag.name in ['h2', 'h3', 'h4'] and "Max 5-Star" in tag.text)
    
    if not target_header:
        log_error("Could not find 'List of Max 5-Star Artifacts' header.")
        sys.exit(1)

    artifacts = []
    
    # Traverse siblings to find the container (table or ul)
    print(f"[*] Found header: {target_header.text.strip()}")
    
    current = target_header.next_sibling
    while current:
        if getattr(current, 'name', None) in ['h2', 'h3', 'h4']:
            # Stop if we hit the next section
            break
        
        if getattr(current, 'name', None) in ['table', 'ul', 'div']:
            # Extract links
            links = current.find_all('a')
            for link in links:
                name = link.text.strip()
                href = link.get('href')
                
                # Validation: must contain /archives/ and have a name
                if name and href and "/archives/" in href:
                    full_url = urljoin(BASE_URL, href)
                    artifacts.append((name, full_url))
        
        current = current.next_sibling

    # De-duplicate
    unique_artifacts = {}
    for name, url in artifacts:
        unique_artifacts[name] = url
        
    print(f"[*] Found {len(unique_artifacts)} unique 5-star artifacts.")
    return unique_artifacts

def download_image(session, url, save_path):
    try:
        with session.get(url, stream=True) as r:
            r.raise_for_status()
            
            # Validate Content-Type
            content_type = r.headers.get('Content-Type', '')
            if 'image' not in content_type:
                log_error(f"Invalid Content-Type {content_type} for {url}")
                return False
                
            with open(save_path, 'wb') as f:
                for chunk in r.iter_content(chunk_size=8192):
                    f.write(chunk)
        return True
    except Exception as e:
        log_error(f"Failed to download {url}: {e}")
        return False

def scrape_artifact_set(session, name, url, output_base):
    print(f"[-] Processing: {name}")
    
    # Sanitize and create directory
    safe_name = sanitize_filename(name)
    set_dir = os.path.join(output_base, safe_name)
    
    if not os.path.exists(set_dir):
        os.makedirs(set_dir)
        
    try:
        response = session.get(url)
        response.raise_for_status()
    except Exception as e:
        log_error(f"Failed to access page for {name}: {e}")
        # Clean up empty dir if created? Technical report says "Nettoyage"
        if os.path.exists(set_dir) and not os.listdir(set_dir):
            os.rmdir(set_dir)
        return

    soup = BeautifulSoup(response.text, 'html.parser')
    
    # Strategy 1: Look for "Set Images" Header
    images_found = []
    
    # Try finding specific header
    img_header = soup.find(lambda tag: tag.name in ['h2', 'h3'] and "Set Images" in tag.text)
    
    if img_header:
        # Find next table
        target_container = img_header.find_next(['table', 'div']) # Sometimes div grid
        if target_container:
            imgs = target_container.find_all('img')
            for img in imgs:
                 src = img.get('data-src') or img.get('src')
                 if src and "data:image" not in src:
                     images_found.append(src)
    
    # Strategy 2: Scan all tables if Strategy 1 fails or returns < 5
    if len(images_found) < 5:
        tables = soup.find_all('table')
        for tbl in tables:
            candidates = []
            imgs = tbl.find_all('img')
            for img in imgs:
                src = img.get('data-src') or img.get('src')
                if not src or "data:image" in src: continue
                # Size filter (heuristic from observation)
                w = img.get('width')
                if w and w.isdigit() and int(w) < 40: continue
                candidates.append(src)
            
            # De-dupe chars in candidates
            candidates = list(dict.fromkeys(candidates))
            
            if len(candidates) == 5:
                # Highly likely this is it
                images_found = candidates
                break
            elif len(candidates) > 5 and not images_found:
                 # Backup plan
                 images_found = candidates[:5]

    # Strategy 3: Keyword search (Last Resort)
    if len(images_found) < 5:
         keywords = ['flower', 'plume', 'sands', 'goblet', 'circlet']
         all_imgs = soup.find_all('img')
         candidates = []
         for img in all_imgs:
             alt = (img.get('alt') or '').lower()
             src = img.get('data-src') or img.get('src')
             if not src or "data:image" in src: continue
             
             if any(k in alt for k in keywords):
                 candidates.append(src)
         
         candidates = list(dict.fromkeys(candidates))
         if len(candidates) >= 5:
             images_found = candidates[:5]

    # Final Validation
    if len(images_found) != 5:
        log_error(f"Anomaly: Found {len(images_found)} images for {name} (Expected 5). Skipping download to avoid partial set.")
        # We assume 5 is strict requirement per tech report
        return

    # Download Phase
    filenames = ["01_Flower", "02_Plume", "03_Sands", "04_Goblet", "05_Circlet"]
    
    for i, img_url in enumerate(images_found):
        # Determine extension
        ext = ".png" # Default fallback
        if ".jpg" in img_url or ".jpeg" in img_url: ext = ".jpg"
        elif ".webp" in img_url: ext = ".webp"
        
        # Naming: 01_Flower.png, etc.
        fname = f"{filenames[i]}{ext}"
        save_path = os.path.join(set_dir, fname)
        
        # Download
        # Check output link cleanliness (remove /show suffix if present on game8)
        # Game8 imgs often end in .png/show.
        clean_url = img_url
        
        download_image(session, clean_url, save_path)
    
    print(f"    [+] Successfully archived {name}")

def main():
    setup_logging()
    
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
        
    session = get_session()
    
    artifacts_map = get_master_list(session)
    
    total = len(artifacts_map)
    count = 0
    
    for name, url in artifacts_map.items():
        count += 1
        print(f"[{count}/{total}] processing...")
        scrape_artifact_set(session, name, url, OUTPUT_DIR)
        
        # Politeness Delay
        time.sleep(DELAY_SECONDS)
        
    print("[*] Job Complete. Check error_log.txt for anomalies.")

if __name__ == "__main__":
    main()
