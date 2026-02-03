import asyncio
import aiohttp
import json
import os
import logging
from pathlib import Path
from PIL import Image
from io import BytesIO
from typing import Dict, Any, List

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Constants
ENKA_CHARACTERS_URL = "https://raw.githubusercontent.com/EnkaNetwork/API-docs/master/store/characters.json"
ENKA_LOC_URL = "https://raw.githubusercontent.com/EnkaNetwork/API-docs/master/store/loc.json"
ENKA_ASSET_URL_BASE = "https://enka.network/ui"
OUTPUT_DIR = Path("/home/mondo/Bureau/enkakasha/Artifacts/GenshinArtifacts2/Characters")
DATA_OUTPUT_FILE = OUTPUT_DIR / "characters.json"

# Mapping Enka Element/Weapon to Standard Format
ELEMENT_MAP = {
    "Fire": "Pyro",
    "Water": "Hydro",
    "Wind": "Anemo",
    "Electric": "Electro",
    "Grass": "Dendro",
    "Ice": "Cryo",
    "Rock": "Geo"
}

WEAPON_MAP = {
    "WEAPON_SWORD_ONE_HAND": "Sword",
    "WEAPON_CLAYMORE": "Claymore",
    "WEAPON_POLE": "Polearm",
    "WEAPON_BOW": "Bow",
    "WEAPON_CATALYST": "Catalyst"
}

class EnkaScraper:
    def __init__(self):
        self.session = None
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    async def init_session(self):
        self.session = aiohttp.ClientSession(headers={"User-Agent": "EnkakashaScraper/1.0"})

    async def close_session(self):
        if self.session:
            await self.session.close()

    async def fetch_json(self, url: str) -> Dict[str, Any]:
        async with self.session.get(url) as response:
            response.raise_for_status()
            return await response.json(content_type=None)

    async def download_image(self, filename: str, save_path: Path) -> bool:
        if save_path.exists():
            return True # Skip if exists

        url = f"{ENKA_ASSET_URL_BASE}/{filename}.png"
        try:
            async with self.session.get(url) as response:
                if response.status == 200:
                    content = await response.read()
                    image = Image.open(BytesIO(content))
                    image.save(save_path, "PNG")
                    return True
                else:
                    logger.warning(f"Failed to download {url}: Status {response.status}")
                    return False
        except Exception as e:
            logger.error(f"Error downloading {url}: {e}")
            return False

    async def run(self):
        await self.init_session()
        try:
            logger.info("Fetching metadata...")
            chars_data = await self.fetch_json(ENKA_CHARACTERS_URL)
            loc_data = await self.fetch_json(ENKA_LOC_URL)
            en_loc = loc_data.get("en", {})

            processed_chars = []
            tasks = []

            logger.info(f"Found {len(chars_data)} character entries.")

            for char_id_str, char_info in chars_data.items():
                # Filter out Traveler variants or test IDs if needed (keeping basic check)
                if "Element" not in char_info or char_info["Element"] == "None":
                    continue

                name_hash = str(char_info.get("NameTextMapHash", ""))
                name = en_loc.get(name_hash)

                if not name:
                    logger.warning(f"Could not find name for ID {char_id_str} (Hash: {name_hash})")
                    continue
                
                # Cleanup Name for directory (e.g., "Hu Tao" -> "HuTao")
                clean_name = name.replace(" ", "")
                
                # Skip Traveler for now if name is generic (usually "Traveler") or specific IDs
                if name == "Traveler":
                     continue

                # Extract Codename from SideIconName
                # e.g., UI_AvatarIcon_Side_Ayaka -> Ayaka
                side_icon = char_info.get("SideIconName", "")
                codename = side_icon.replace("UI_AvatarIcon_Side_", "")
                
                if not codename:
                    logger.warning(f"No codename derived for {name}")
                    continue

                element = ELEMENT_MAP.get(char_info.get("Element"), char_info.get("Element"))
                weapon = WEAPON_MAP.get(char_info.get("WeaponType"), char_info.get("WeaponType"))
                # Rank/Rarity: QualityType format is usually QUALITY_ORANGE (5) or QUALITY_PURPLE (4)
                rarity = 5 if "ORANGE" in char_info.get("QualityType", "") else 4
                
                # Prepare Paths
                char_dir = OUTPUT_DIR / clean_name
                char_dir.mkdir(exist_ok=True)

                icon_name = f"UI_AvatarIcon_{codename}"
                card_name = f"UI_Gacha_AvatarImg_{codename}"
                
                icon_path = char_dir / "icon.png"
                card_path = char_dir / "card.png"

                # Add download tasks
                tasks.append(self.download_image(icon_name, icon_path))
                tasks.append(self.download_image(card_name, card_path))

                processed_chars.append({
                    "id": char_id_str,
                    "name": name,
                    "element": element,
                    "weapon_type": weapon,
                    "rarity": rarity,
                    "codename": codename,
                    "icon_path": str(icon_path.relative_to(OUTPUT_DIR.parent.parent)), # Relative to Artifacts root usually
                    "card_path": str(card_path.relative_to(OUTPUT_DIR.parent.parent))
                })

            logger.info(f"Downloading assets for {len(processed_chars)} characters...")
            # Limit concurrency
            semaphore = asyncio.Semaphore(10)
            
            async def sem_task(task):
                async with semaphore:
                    return await task

            await asyncio.gather(*[sem_task(t) for t in tasks])

            # Save Summary
            with open(DATA_OUTPUT_FILE, "w") as f:
                json.dump(processed_chars, f, indent=2)
            
            logger.info(f"Scraping complete. Data saved to {DATA_OUTPUT_FILE}")

        finally:
            await self.close_session()

if __name__ == "__main__":
    scraper = EnkaScraper()
    asyncio.run(scraper.run())
