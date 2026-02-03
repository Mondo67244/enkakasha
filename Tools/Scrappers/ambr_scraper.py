import asyncio
import aiohttp
import json
import logging
import re
import hashlib
from pathlib import Path
from PIL import Image
from io import BytesIO

# --- Configuration ---
API_BASE = "https://api.ambr.top/v2/en"
ASSET_BASE = "https://api.ambr.top/assets/UI"
OUTPUT_DIR = Path(__file__).resolve().parent / "data"
IMAGES_DIR = OUTPUT_DIR / "images"
DATA_FILE = OUTPUT_DIR / "characters.json"

# Logging Setup
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("ambr_scraper.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# --- Mappings ---
ELEMENT_MAP = {
    "Wind": "Anemo",
    "Rock": "Geo",
    "Electric": "Electro",
    "Grass": "Dendro",
    "Water": "Hydro",
    "Fire": "Pyro",
    "Ice": "Cryo"
}

WEAPON_MAP = {
    "WEAPON_SWORD_ONE_HAND": "Sword",
    "WEAPON_CLAYMORE": "Claymore",
    "WEAPON_POLE": "Polearm",
    "WEAPON_BOW": "Bow",
    "WEAPON_CATALYST": "Catalyst"
}

# --- Utilities ---
class AssetManager:
    @staticmethod
    def get_hash(content: bytes) -> str:
        return hashlib.md5(content).hexdigest()[:8]

    @staticmethod
    def process_image(content: bytes, char_name: str, img_type: str) -> str:
        """
        Validates, converts (WebP -> PNG), and saves the image.
        Returns the relative local path.
        """
        try:
            img = Image.open(BytesIO(content))
            img_hash = AssetManager.get_hash(content)
            
            # Sanitize names
            clean_char = re.sub(r'[^a-zA-Z0-9]', '_', char_name)
            filename = f"{clean_char}_{img_type}_{img_hash}.png"
            
            # Create char directory
            char_dir = IMAGES_DIR / clean_char
            char_dir.mkdir(parents=True, exist_ok=True)
            
            save_path = char_dir / filename
            
            # Convert to PNG if needed for compatibility
            if img.format != 'PNG':
                img = img.convert('RGBA')
            
            img.save(save_path, 'PNG', optimize=True)
            return str(save_path.relative_to(OUTPUT_DIR))
        except Exception as e:
            logger.error(f"Failed to process image for {char_name}: {e}")
            return None

class AmbrClient:
    def __init__(self):
        self.session = None

    async def get_session(self):
        if self.session is None:
            self.session = aiohttp.ClientSession()
        return self.session

    async def close(self):
        if self.session:
            await self.session.close()

    async def fetch_json(self, url: str):
        session = await self.get_session()
        try:
            async with session.get(url) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    logger.warning(f"Failed to fetch JSON {url} (Status: {response.status})")
        except Exception as e:
            logger.error(f"Error fetching JSON {url}: {e}")
        return None

    async def fetch_image(self, url: str):
        session = await self.get_session()
        try:
            async with session.get(url) as response:
                if response.status == 200:
                    return await response.read()
                else:
                    logger.warning(f"Failed to fetch Image {url} (Status: {response.status})")
        except Exception as e:
            logger.error(f"Error fetching Image {url}: {e}")
        return None

async def process_character(client, char_id, char_data):
    name = char_data.get('name')
    if not name:
        return None

    logger.info(f"Processing {name} ({char_id})...")

    # Map Metadata
    element = ELEMENT_MAP.get(char_data.get('element'), 'Unknown')
    weapon = WEAPON_MAP.get(char_data.get('weaponType'), 'Unknown')
    rarity = char_data.get('rank', 0)

    # Clean Name for Travelers
    if name == "Traveler":
        name = f"Traveler ({element})"

    result = {
        "id": char_id,
        "name": name,
        "element": element,
        "weapon": weapon,
        "rarity": rarity,
        "images": {}
    }

    # API provides icon filename without extension, e.g., "UI_AvatarIcon_Ayaka"
    icon_name = char_data.get('icon')
    
    # Construct Asset URLs
    # Icon: Standard square icon
    # Card: Gacha splash art (usually UI_AvatarIcon_Name_Card)
    # Side: Side portrait (UI_AvatarIcon_Side_Name)
    
    # Determine Card Name (heuristic: usually icon_name + _Card, but specific handling is safe)
    # The API response doesn't always explicitly list the card filename, but standard convention applies.
    # However, sometimes we might need to fetch the detailed avatar entry /v2/en/avatar/{id} for more assets.
    # For now, let's try the standard patterns.
    
    assets_to_fetch = {
        "icon": f"{ASSET_BASE}/{icon_name}.png",
        "card": f"{ASSET_BASE}/{icon_name}_Card.png",
        "portrait": f"{ASSET_BASE}/{icon_name.replace('Icon', 'Icon_Side')}.png" 
    }

    for type_key, url in assets_to_fetch.items():
        try:
            content = await client.fetch_image(url)
            if content:
                local_path = AssetManager.process_image(content, name, type_key)
                if local_path:
                    result["images"][f"{type_key}_local"] = local_path
        except Exception as e:
            logger.warning(f"Could not fetch {type_key} for {name}: {e}")

    return result

async def main():
    IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    client = AmbrClient()
    
    try:
        logger.info("Fetching Character List from Ambr.top...")
        # Get list of avatars
        data = await client.fetch_json(f"{API_BASE}/avatar")
        
        if not data or 'data' not in data:
            logger.error("Invalid API response.")
            return

        avatars = data['data']['items']
        logger.info(f"Found {len(avatars)} characters.")

        tasks = []
        # Limit concurrency to be polite
        sem = asyncio.Semaphore(10)

        async def sem_task(cid, cdata):
            async with sem:
                return await process_character(client, cid, cdata)

        for char_id, char_info in avatars.items():
            tasks.append(sem_task(char_id, char_info))

        results = await asyncio.gather(*tasks)
        valid_results = [r for r in results if r]

        # Save JSON
        final_json = {
            "meta": {
                "source": "Ambr.top",
                "count": len(valid_results)
            },
            "characters": valid_results
        }
        
        with open(DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(final_json, f, indent=2, ensure_ascii=False)
            
        logger.info(f"Scraping complete. Data saved to {DATA_FILE}")

    finally:
        await client.close()

if __name__ == "__main__":
    asyncio.run(main())
