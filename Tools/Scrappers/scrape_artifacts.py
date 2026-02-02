import requests
from bs4 import BeautifulSoup
import os
import time
import re
from urllib.parse import urljoin

BASE_URL = "https://game8.co"
MAIN_LIST_URL = "https://game8.co/games/Genshin-Impact/archives/297493"
OUTPUT_DIR = "../../Artifacts/GenshinArtifacts"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
}

def setup_directory(path):
    if not os.path.exists(path):
        os.makedirs(path)

def download_image(url, save_path):
    try:
        response = requests.get(url, headers=HEADERS, stream=True)
        if response.status_code == 200:
            with open(save_path, 'wb') as f:
                for chunk in response.iter_content(1024):
                    f.write(chunk)
            # print(f"Downloaded: {save_path}")
            return True
        else:
            print(f"Failed to download {url}: Status {response.status_code}")
    except Exception as e:
        print(f"Error downloading {url}: {e}")
    return False

def get_artifact_list():
    print(f"Fetching main list from {MAIN_LIST_URL}...")
    response = requests.get(MAIN_LIST_URL, headers=HEADERS)
    soup = BeautifulSoup(response.text, 'html.parser')
    
    # Find the header "List of Max 5-Star Artifacts"
    # Based on observation, it might be an h3
    header = soup.find(lambda tag: tag.name in ['h2', 'h3'] and "List of Max 5-Star Artifacts" in tag.text)
    
    artifacts = []
    
    if header:
        print(f"Found header: {header.text.strip()}")
        # Traverse siblings
        for sibling in header.next_siblings:
            # Stop if we hit the next section header
            if getattr(sibling, 'name', None) in ['h2', 'h3']:
                print(f"Reached next header: {sibling.text.strip()}. Stopping.")
                break
            
            # Skip strings/navigable strings that are just whitespace
            if sibling.name is None:
                continue
                
            if sibling.name in ['p', 'div', 'ul', 'table']:
                links = sibling.find_all('a')
                for link in links:
                    name = link.text.strip()
                    href = link.get('href')
                    if name and href and "/archives/" in href:
                        # Simple filter to avoid unrelated links
                        full_url = urljoin(BASE_URL, href)
                        artifacts.append((name, full_url))
            else:
                # Debug print for unexpected tags
                # print(f"Skipping tag: {sibling.name}")
                pass
            
    else:
        print("Could not find 'List of Max 5-Star Artifacts' header.")
        
    # Remove duplicates if any
    artifacts = list(set(artifacts))
    # Sort by name
    artifacts.sort(key=lambda x: x[0])
    
    print(f"Found {len(artifacts)} artifacts.")
    return artifacts

def scrape_artifact_page(name, url):
    print(f"Processing {name}...")
    folder_name = re.sub(r'[\\/*?:"<>|]', "", name)
    folder_path = os.path.join(OUTPUT_DIR, folder_name)
    setup_directory(folder_path)
    
    response = requests.get(url, headers=HEADERS)
    soup = BeautifulSoup(response.text, 'html.parser')
    
    # Look for "Set Images" header
    # Usually "[Artifact Name] Set Images"
    # Or just search for any header containing "Set Images"
    
    images_header = soup.find(lambda tag: tag.name in ['h2', 'h3'] and "Set Images" in tag.text)
    
    images_found = []
    
    if images_header:
        # The images are likely in a table following this header
        table = images_header.find_next('table')
        if table:
            imgs = table.find_all('img')
            # We expect 5 images usually
            for img in imgs:
                # Prioritize data-src because src is often a placeholder (lazy load)
                src = img.get('data-src') or img.get('src')
                
                # Check if it's the specific base64 placeholder and ignore if that's all we have?
                # Actually, just taking data-src if available is usually enough.
                # If src was the placeholder, data-src should be there.
                
                if src and "data:image" not in src:
                    images_found.append(src)
    
    
    if len(images_found) < 5:
        print(f"  Standard header scrape yielded {len(images_found)}. Scanning all tables for candidates...")
        tables = soup.find_all('table')
        for tbl in tables:
            candidates_in_table = []
            imgs = tbl.find_all('img')
            for img in imgs:
                src = img.get('data-src') or img.get('src')
                if not src or "data:image" in src: continue
                
                # Check width if available to filter out icons
                w = img.get('width')
                try:
                    if w and int(w) < 45: 
                        continue
                except:
                    pass
                
                # Also filter out generic "Set Icon" if they are the placeholder ones (usually small) 
                # but valid images might have "Set Icon" in alt.
                # Let's rely on size and uniqueness.
                
                candidates_in_table.append(src)
            
            # remove duplicates
            candidates_in_table = list(set(candidates_in_table))
            
            if len(candidates_in_table) >= 5:
                # This table looks promising.
                # However, some tables might have many character icons (Best Characters).
                # We want 5 images ideally. If > 5, it might be the character list.
                # Artifact pieces are usually exactly 5.
                # But sometimes 4 if one is missing?
                # Let's verify against keywords or context if possible.
                # Characters usually don't look like artifacts.
                
                # Heuristic: If count is 5, it's perfect.
                if len(candidates_in_table) == 5:
                    images_found = candidates_in_table
                    break
                elif len(candidates_in_table) > 5 and len(candidates_in_table) <= 10:
                     # Maybe 5 icons + 5 real images?
                     # Or multiple rows.
                     # Let's accept it if we haven't found anything else.
                     if not images_found:
                         images_found = candidates_in_table[:5]
    
    # Still no images? Last fallback: look for large images in list
    if len(images_found) < 5:
         pass # Existing fallback was weak. Let's stick to what we have.
    
    if not images_found:
        print(f"  No images found for {name}.")
        return

    print(f"  Found {len(images_found)} images. Downloading...")
    
    for i, img_url in enumerate(images_found):
        # Clean URL if needed (remove query params for extension check?)
        # Game8 images: https://img.game8.co/.../show
        # We can treat them as png or jpg. 
        # The URL ends in .png/show usually.
        
        clean_url = img_url
        ext = ".png"
        if ".jpg" in img_url: ext = ".jpg"
        elif ".jpeg" in img_url: ext = ".jpeg"
        
        # Name them systematically: 1_Flower, 2_Plume, etc if possible, 
        # otherwise just 1, 2, 3, 4, 5. 
        # The order in table is usually Flower, Plume, Sands, Goblet, Circlet.
        
        file_name = f"{i+1}{ext}"
        
        # If we parsed alts, we could name them better, but 1..5 is safe for "set"
        save_path = os.path.join(folder_path, file_name)
        download_image(clean_url, save_path)
        
    print(f"  Done {name}.")
    # Sleep to be polite
    pass 

def main():
    setup_directory(OUTPUT_DIR)
    artifacts = get_artifact_list()
    
    # For testing, let's just do the first 3 or specific ones? 
    # User said "sauvegarde tous les liens", "visite manuellement chaque lien".
    # I will do all of them.
    
    for name, url in artifacts:
        scrape_artifact_page(name, url)
        time.sleep(1) # 1 sec delay

if __name__ == "__main__":
    main()
