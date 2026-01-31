import requests
import pandas as pd
import json
import os
import re
import glob
from datetime import datetime

# --- CONFIGURATION ---
API_URL = "https://enka.network/api/uid/{uid}"
UID = ""  # Laisser vide pour demander à l'utilisateur

# Mapping des équipements
EQUIP_TYPE_MAP = {
    "EQUIP_BRACER": "Flower",
    "EQUIP_NECKLACE": "Plume",
    "EQUIP_SHOES": "Sands",
    "EQUIP_RING": "Goblet",
    "EQUIP_DRESS": "Circlet"
}

# Mapping des props
PROP_MAP = {
    "FIGHT_PROP_HP": "HP",
    "FIGHT_PROP_HP_PERCENT": "HP%",
    "FIGHT_PROP_ATTACK": "ATK",
    "FIGHT_PROP_ATTACK_PERCENT": "ATK%",
    "FIGHT_PROP_DEFENSE": "DEF",
    "FIGHT_PROP_DEFENSE_PERCENT": "DEF%",
    "FIGHT_PROP_CRITICAL": "Crit Rate",
    "FIGHT_PROP_CRITICAL_HURT": "Crit DMG",
    "FIGHT_PROP_CHARGE_EFFICIENCY": "ER%",
    "FIGHT_PROP_ELEMENT_MASTERY": "EM",
    "FIGHT_PROP_HEAL_ADD": "Healing%",
    "FIGHT_PROP_FIRE_ADD_HURT": "Pyro DMG%",
    "FIGHT_PROP_WATER_ADD_HURT": "Hydro DMG%",
    "FIGHT_PROP_ELEC_ADD_HURT": "Electro DMG%",
    "FIGHT_PROP_ICE_ADD_HURT": "Cryo DMG%",
    "FIGHT_PROP_WIND_ADD_HURT": "Anemo DMG%",
    "FIGHT_PROP_ROCK_ADD_HURT": "Geo DMG%",
    "FIGHT_PROP_GRASS_ADD_HURT": "Dendro DMG%",
    "FIGHT_PROP_PHYSICAL_ADD_HURT": "Physical DMG%",
}

# Mapping des sets d'artéfacts (IDs courants)
SET_MAP = {
    15001: "Gladiator's Finale",
    15002: "Wanderer's Troupe",
    15006: "Noblesse Oblige",
    15007: "Bloodstained Chivalry",
    15008: "Maiden Beloved",
    15014: "Archaic Petra",
    15015: "Retracing Bolide",
    15016: "Tenacity of the Millelith",
    15017: "Pale Flame",
    15018: "Shimenawa's Reminiscence",
    15019: "Heart of Depth",
    15020: "Emblem of Severed Fate",
    15021: "Viridescent Venerer",
    15022: "Crimson Witch of Flames",
    15024: "Blizzard Strayer",
    15025: "Thundering Fury",
    15026: "Lavawalker",
    15027: "Desert Pavilion Chronicle",
    15028: "Flower of Paradise Lost",
    15029: "Nymph's Dream",
    15030: "Vourukasha's Glow",
    15031: "Marechaussee Hunter",
    15032: "Golden Troupe",
    15033: "Song of Days Past",
    15034: "Nighttime Whispers in the Echoing Woods",
    15035: "Fragment of Harmonic Whimsy",
    15036: "Unfinished Reverie",
    15037: "Scroll of the Hero of Cinder City",  # CORRIGÉ (était Obsidian Codex)
    15038: "Obsidian Codex",                     # CORRIGÉ (était Scroll)
}

# Mapping des personnages
CHARACTER_MAP = {
    10000086: "Wriothesley",
    10000060: "Yelan",
    10000030: "Zhongli",
    10000089: "Furina",
    10000075: "Wanderer",
    10000106: "Mavuika",       # CORRIGÉ (était Arlecchino)
    10000102: "Mualani",
    10000112: "Escoffier",     # CORRIGÉ (était Mavuika)
    10000107: "Citlali",       # CORRIGÉ (était Xilonen)
    10000087: "Neuvillette",
    10000047: "Kazuha",
    10000052: "Raiden Shogun",
    10000002: "Kamisato Ayaka",
    10000003: "Jean",
    10000005: "Traveler",
    10000006: "Lisa",
    10000007: "Aether",
    10000016: "Diluc",
    10000022: "Venti",
    10000029: "Klee",
    10000033: "Tartaglia",
    10000035: "Qiqi",
    10000037: "Ganyu",
    10000038: "Albedo",
    10000041: "Mona",
    10000042: "Keqing",
    10000046: "Hu Tao",
    10000048: "Yanfei",
    10000049: "Eula",
    10000051: "Ayato",
    10000053: "Sayu",
    10000054: "Kokomi",
    10000055: "Gorou",
    10000056: "Sara",
    10000057: "Arataki Itto",
    10000058: "Yae Miko",
    10000063: "Shenhe",
    10000064: "Yun Jin",
    10000066: "Kuki Shinobu",
    10000069: "Tighnari",
    10000070: "Collei",
    10000071: "Dori",
    10000073: "Nahida",
    10000074: "Layla",
    10000076: "Faruzan",
    10000078: "Alhaitham",
    10000079: "Dehya",
    10000080: "Mika",
    10000081: "Kaveh",
    10000082: "Baizhu",
    10000083: "Lynette",
    10000084: "Lyney",
    10000085: "Freminet",
    10000088: "Charlotte",
    10000090: "Chevreuse",
    10000091: "Navia",
    10000092: "Gaming",
    10000093: "Xianyun",
    10000094: "Chiori",
    10000095: "Sigewinne",
    10000096: "Clorinde",
    10000097: "Sethos",
    10000098: "Emilie",
    10000099: "Kinich",
    10000100: "Kachina",
    # 10000101: était Citlali mais vrai ID est 10000107
    10000103: "Ororon",
    10000104: "Varesa",
    10000105: "Iansan",
    10000108: "Chasca",
    10000109: "Utori",
    10000110: "Mizuki",
    # IDs à ajouter quand rencontrés:
    # Arlecchino: ID inconnu
    # Xilonen: ID inconnu
}

def get_uid():
    """Demande l'UID à l'utilisateur si non configuré."""
    if UID:
        return UID
    
    print("=" * 70)
    print("🎮 ENKA.NETWORK PLAYER DATA SCRAPER (avec Artéfacts)")
    print("=" * 70)
    print()
    
    uid = input("📌 Entre ton UID Genshin Impact: ").strip()
    
    if not uid or not uid.isdigit():
        print("❌ UID invalide (doit être un nombre).")
        exit(1)
    
    return uid

def format_prop(prop_id):
    """Convertit un prop ID en nom lisible."""
    return PROP_MAP.get(prop_id, prop_id.replace("FIGHT_PROP_", ""))

def normalize_value(val):
    """Normalise une valeur pour comparaison cohérente."""
    if val is None or val == '' or (isinstance(val, float) and pd.isna(val)):
        return ''
    # Convertir en nombre si possible, puis en string
    try:
        num = float(val)
        # Retourner comme entier si c'est un entier
        if num == int(num):
            return str(int(num))
        # Arrondir les floats pour éviter les différences de précision
        return str(round(num, 1))
    except (ValueError, TypeError):
        return str(val).strip()

def create_artifact_key(artifact):
    """Crée une clé unique pour identifier un artéfact."""
    # Clé basée sur: Personnage + Slot + Set + Main Stat + Substats
    key_parts = [
        normalize_value(artifact.get('Character', '')),
        normalize_value(artifact.get('Slot', '')),
        normalize_value(artifact.get('Set', '')),
        normalize_value(artifact.get('Main_Stat', '')),
        normalize_value(artifact.get('Main_Value', '')),
        normalize_value(artifact.get('Sub1', '')),
        normalize_value(artifact.get('Sub1_Val', '')),
        normalize_value(artifact.get('Sub2', '')),
        normalize_value(artifact.get('Sub2_Val', '')),
        normalize_value(artifact.get('Sub3', '')),
        normalize_value(artifact.get('Sub3_Val', '')),
        normalize_value(artifact.get('Sub4', '')),
        normalize_value(artifact.get('Sub4_Val', '')),
    ]
    return "|".join(key_parts)

def create_character_key(char):
    """Crée une clé unique pour identifier un personnage et son build."""
    # Clé basée sur les stats principales (changent quand le build change)
    key_parts = [
        normalize_value(char.get('Character', '')),
        normalize_value(char.get('HP', '')),
        normalize_value(char.get('ATK', '')),
        normalize_value(char.get('DEF', '')),
        normalize_value(char.get('Crit_Rate%', '')),
        normalize_value(char.get('Crit_DMG%', '')),
        normalize_value(char.get('Total_CV', '')),
    ]
    return "|".join(key_parts)

def merge_dataframes(existing_df, new_df, key_func, key_columns):
    """
    Fusionne intelligemment deux DataFrames.
    - Si les données existent déjà (même clé), on ne les ajoute pas
    - Si les données sont nouvelles, on les ajoute
    - Si les données ont changé (même identifiant mais valeurs différentes), on met à jour
    
    Returns: (merged_df, stats_dict)
    """
    if existing_df is None or existing_df.empty:
        return new_df, {'added': len(new_df), 'updated': 0, 'unchanged': 0}
    
    # Convertir toutes les colonnes en object pour éviter les conflits de type
    existing_df = existing_df.astype(object)
    new_df = new_df.astype(object)
    
    # Créer des clés pour comparer
    existing_keys = set()
    existing_id_to_row = {}  # Pour updates (même ID, mais valeurs différentes)
    
    for idx, row in existing_df.iterrows():
        full_key = key_func(row.to_dict())
        existing_keys.add(full_key)
        
        # ID = premiers éléments de la clé (Character + Slot pour artifacts, Character pour chars)
        id_key = "|".join([str(row.get(col, '')) for col in key_columns])
        existing_id_to_row[id_key] = idx
    
    rows_to_add = []
    rows_to_update = []
    stats = {'added': 0, 'updated': 0, 'unchanged': 0}
    
    for idx, row in new_df.iterrows():
        row_dict = row.to_dict()
        full_key = key_func(row_dict)
        id_key = "|".join([str(row.get(col, '')) for col in key_columns])
        
        if full_key in existing_keys:
            # Données identiques, rien à faire
            stats['unchanged'] += 1
        elif id_key in existing_id_to_row:
            # Même identifiant mais valeurs différentes = update
            existing_idx = existing_id_to_row[id_key]
            rows_to_update.append((existing_idx, row_dict))
            stats['updated'] += 1
        else:
            # Nouvelles données
            rows_to_add.append(row_dict)
            stats['added'] += 1
    
    # Appliquer les updates
    result_df = existing_df.copy()
    for existing_idx, new_row in rows_to_update:
        for col, val in new_row.items():
            result_df.at[existing_idx, col] = val
    
    # Ajouter les nouvelles lignes
    if rows_to_add:
        new_rows_df = pd.DataFrame(rows_to_add)
        result_df = pd.concat([result_df, new_rows_df], ignore_index=True)
    
    return result_df, stats

def load_existing_csv(filename):
    """Charge un CSV existant ou retourne None."""
    if os.path.exists(filename):
        try:
            return pd.read_csv(filename)
        except Exception as e:
            print(f"⚠️ Erreur lecture {filename}: {e}")
    return None

def sanitize_filename(name):
    """Nettoie un nom pour l'utiliser dans un fichier."""
    # Remplacer les caractères spéciaux par des underscores
    sanitized = re.sub(r'[^a-zA-Z0-9_-]', '_', name)
    # Supprimer les underscores multiples
    sanitized = re.sub(r'_+', '_', sanitized)
    # Supprimer les underscores en début/fin
    return sanitized.strip('_')

def get_current_version(base_pattern):
    """
    Trouve la version actuelle des fichiers existants.
    Retourne (version_number, existing_filepath) ou (0, None) si aucun fichier.
    """
    # Chercher tous les fichiers correspondant au pattern
    pattern = f"{base_pattern}_v*.csv"
    existing_files = glob.glob(pattern)
    
    if not existing_files:
        return 0, None
    
    # Trouver la version la plus élevée
    max_version = 0
    latest_file = None
    
    for filepath in existing_files:
        match = re.search(r'_v(\d+)\.csv$', filepath)
        if match:
            version = int(match.group(1))
            if version > max_version:
                max_version = version
                latest_file = filepath
    
    return max_version, latest_file

def save_with_versioning(df, base_name, existing_df, stats):
    """
    Sauvegarde le DataFrame avec versioning intelligent.
    - Si pas de changement: ne rien faire, garder la version actuelle
    - Si changement (ajouts ou updates): incrémenter la version
    
    Returns: (saved_filename, version, has_changed)
    """
    current_version, current_file = get_current_version(base_name)
    
    has_changes = stats['added'] > 0 or stats['updated'] > 0
    
    if current_version == 0:
        # Première fois, créer v1
        new_version = 1
        new_filename = f"{base_name}_v{new_version}.csv"
        df.to_csv(new_filename, index=False)
        return new_filename, new_version, True
    
    if has_changes:
        # Il y a des changements, incrémenter la version
        new_version = current_version + 1
        new_filename = f"{base_name}_v{new_version}.csv"
        df.to_csv(new_filename, index=False)
        return new_filename, new_version, True
    else:
        # Pas de changement, garder la version actuelle
        return current_file, current_version, False

def extract_artifacts(equip_list, char_name):
    """Extrait les données de tous les artéfacts équipés."""
    artifacts = []
    
    for equip in equip_list:
        if 'reliquary' not in equip:
            continue
        
        flat = equip.get('flat', {})
        reliquary = equip.get('reliquary', {})
        
        equip_type = flat.get('equipType', 'Unknown')
        set_id = flat.get('setId', 0)
        level = reliquary.get('level', 1) - 1
        
        main_stat = flat.get('reliquaryMainstat', {})
        main_prop = format_prop(main_stat.get('mainPropId', ''))
        main_value = main_stat.get('statValue', 0)
        
        substats = flat.get('reliquarySubstats', [])
        substat_data = {}
        for i, sub in enumerate(substats):
            prop_name = format_prop(sub.get('appendPropId', ''))
            prop_value = sub.get('statValue', 0)
            substat_data[f'Sub{i+1}'] = prop_name
            substat_data[f'Sub{i+1}_Val'] = prop_value
        
        for i in range(len(substats), 4):
            substat_data[f'Sub{i+1}'] = ""
            substat_data[f'Sub{i+1}_Val'] = ""
        
        crit_rate = 0
        crit_dmg = 0
        for sub in substats:
            prop = sub.get('appendPropId', '')
            val = sub.get('statValue', 0)
            if prop == 'FIGHT_PROP_CRITICAL':
                crit_rate = val
            elif prop == 'FIGHT_PROP_CRITICAL_HURT':
                crit_dmg = val
        crit_value = round(crit_rate * 2 + crit_dmg, 1)
        
        artifact = {
            'Character': char_name,
            'Slot': EQUIP_TYPE_MAP.get(equip_type, equip_type),
            'Set': SET_MAP.get(set_id, f"Set_{set_id}"),
            'Level': f"+{level}",
            'Main_Stat': main_prop,
            'Main_Value': main_value,
            'Sub1': substat_data.get('Sub1', ''),
            'Sub1_Val': substat_data.get('Sub1_Val', ''),
            'Sub2': substat_data.get('Sub2', ''),
            'Sub2_Val': substat_data.get('Sub2_Val', ''),
            'Sub3': substat_data.get('Sub3', ''),
            'Sub3_Val': substat_data.get('Sub3_Val', ''),
            'Sub4': substat_data.get('Sub4', ''),
            'Sub4_Val': substat_data.get('Sub4_Val', ''),
            'Crit_Value': crit_value,
        }
        
        artifacts.append(artifact)
    
    return artifacts

def get_element_bonus(fight_props):
    """Récupère le bonus élémentaire actif (non nul)."""
    element_bonuses = {
        "40": "Pyro",
        "41": "Electro",
        "42": "Hydro",
        "43": "Dendro",
        "44": "Anemo",
        "45": "Geo",
        "46": "Cryo",
    }
    for key, element in element_bonuses.items():
        value = fight_props.get(key, 0)
        if value > 0:
            return element, round(value * 100, 1)
    return None, 0

def extract_weapon_info(equip_list):
    """Extrait les infos de l'arme équipée."""
    for equip in equip_list:
        if 'weapon' in equip:
            flat = equip.get('flat', {})
            weapon_stats = flat.get('weaponStats', [])
            
            base_atk = 0
            substat_type = ""
            substat_value = 0
            
            for stat in weapon_stats:
                if stat.get('appendPropId') == 'FIGHT_PROP_BASE_ATTACK':
                    base_atk = stat.get('statValue', 0)
                else:
                    substat_type = format_prop(stat.get('appendPropId', ''))
                    substat_value = stat.get('statValue', 0)
            
            return {
                'icon': flat.get('icon', ''),
                'level': equip['weapon'].get('level', 0),
                'refinement': list(equip['weapon'].get('affixMap', {}).values())[0] + 1 if equip['weapon'].get('affixMap') else 1,
                'base_atk': base_atk,
                'substat': substat_type,
                'substat_value': substat_value
            }
    return None

def fetch_player_data(uid):
    """Récupère et formate les données du joueur."""
    print(f"\n🚀 Récupération des données pour UID: {uid}...", flush=True)
    
    try:
        response = requests.get(
            API_URL.format(uid=uid),
            headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0'
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            
            player = data.get('playerInfo', {})
            print(f"\n👤 Joueur: {player.get('nickname')}")
            print(f"   AR: {player.get('level')} | WL: {player.get('worldLevel')}")
            
            avatar_list = data.get('avatarInfoList', [])
            if not avatar_list:
                print("⚠️ Aucun personnage affiché dans la vitrine.")
                return
            
            print(f"\n📊 {len(avatar_list)} personnage(s) dans la vitrine:\n")
            
            all_characters = []
            all_artifacts = []
            
            for avatar in avatar_list:
                avatar_id = avatar.get('avatarId')
                char_name = CHARACTER_MAP.get(avatar_id, f"ID_{avatar_id}")
                
                prop_map = avatar.get('propMap', {})
                level = int(prop_map.get('4001', {}).get('val', 0))
                
                fight_props = avatar.get('fightPropMap', {})
                
                max_hp = round(fight_props.get('2000', 0))
                atk = round(fight_props.get('2001', 0))
                defense = round(fight_props.get('2002', 0))
                em = round(fight_props.get('28', 0))
                er = round(fight_props.get('23', 1) * 100, 1)
                crit_rate = round(fight_props.get('20', 0) * 100, 1)
                crit_dmg = round(fight_props.get('22', 0) * 100, 1)
                
                element, elem_bonus = get_element_bonus(fight_props)
                weapon_info = extract_weapon_info(avatar.get('equipList', []))
                
                char_artifacts = extract_artifacts(avatar.get('equipList', []), char_name)
                all_artifacts.extend(char_artifacts)
                
                total_cv = sum(a['Crit_Value'] for a in char_artifacts)
                
                print(f"  🎭 {char_name} (Lv.{level})")
                print(f"     Crit: {crit_rate}% / {crit_dmg}%  |  CV: {total_cv}")
                
                all_characters.append({
                    'Character': char_name,
                    'Level': level,
                    'HP': max_hp,
                    'ATK': atk,
                    'DEF': defense,
                    'EM': em,
                    'ER%': er,
                    'Crit_Rate%': crit_rate,
                    'Crit_DMG%': crit_dmg,
                    'Element': element or "N/A",
                    'Elem_Bonus%': elem_bonus,
                    'Total_CV': total_cv,
                    'Weapon_Refine': weapon_info['refinement'] if weapon_info else 0,
                })
            
            # --- MERGE INTELLIGENT ---
            print("\n" + "=" * 70)
            print("📊 FUSION INTELLIGENTE DES DONNÉES")
            print("=" * 70)
            
            # Préparer le dossier et le nom de base pour les fichiers
            nickname = player.get('nickname', 'Unknown')
            safe_nickname = sanitize_filename(nickname)
            folder_name = f"{safe_nickname}_{uid}"
            
            # Créer le dossier s'il n'existe pas
            if not os.path.exists(folder_name):
                os.makedirs(folder_name)
                print(f"\n📁 Dossier créé: {folder_name}/")
            
            # Chemins des fichiers dans le dossier
            base_name_chars = os.path.join(folder_name, "characters")
            base_name_artifacts = os.path.join(folder_name, "artifacts")
            
            # Personnages - Charger la version actuelle si elle existe
            current_char_version, current_char_file = get_current_version(base_name_chars)
            existing_chars = load_existing_csv(current_char_file) if current_char_file else None
            new_chars_df = pd.DataFrame(all_characters)
            
            merged_chars, char_stats = merge_dataframes(
                existing_chars, 
                new_chars_df,
                create_character_key,
                ['Character']
            )
            
            char_file, char_version, char_changed = save_with_versioning(
                merged_chars, base_name_chars, existing_chars, char_stats
            )
            
            print(f"\n📁 Personnages ({char_file}):")
            print(f"   📦 Version: v{char_version}" + (" 🆕" if char_changed else " (inchangée)"))
            print(f"   ➕ Ajoutés: {char_stats['added']}")
            print(f"   🔄 Mis à jour: {char_stats['updated']}")
            print(f"   ✅ Inchangés: {char_stats['unchanged']}")
            print(f"   📊 Total: {len(merged_chars)} entrées")
            
            # Artéfacts - Charger la version actuelle si elle existe
            current_art_version, current_art_file = get_current_version(base_name_artifacts)
            existing_artifacts = load_existing_csv(current_art_file) if current_art_file else None
            new_artifacts_df = pd.DataFrame(all_artifacts)
            
            merged_artifacts, artifact_stats = merge_dataframes(
                existing_artifacts,
                new_artifacts_df,
                create_artifact_key,
                ['Character', 'Slot']
            )
            
            art_file, art_version, art_changed = save_with_versioning(
                merged_artifacts, base_name_artifacts, existing_artifacts, artifact_stats
            )
            
            print(f"\n📁 Artéfacts ({art_file}):")
            print(f"   📦 Version: v{art_version}" + (" 🆕" if art_changed else " (inchangée)"))
            print(f"   ➕ Ajoutés: {artifact_stats['added']}")
            print(f"   🔄 Mis à jour: {artifact_stats['updated']}")
            print(f"   ✅ Inchangés: {artifact_stats['unchanged']}")
            print(f"   📊 Total: {len(merged_artifacts)} pièces")
            
            # --- FICHIER COMBINÉ (Stats + Artéfacts par personnage) ---
            base_name_combined = os.path.join(folder_name, "combined")
            
            # Créer le DataFrame combiné
            combined_rows = []
            slot_order = ['Flower', 'Plume', 'Sands', 'Goblet', 'Circlet']
            
            for char_data in all_characters:
                char_name = char_data['Character']
                
                # Ligne de base avec les stats du personnage
                row = {
                    'Character': char_name,
                    'Level': char_data['Level'],
                    'HP': char_data['HP'],
                    'ATK': char_data['ATK'],
                    'DEF': char_data['DEF'],
                    'EM': char_data['EM'],
                    'ER%': char_data['ER%'],
                    'Crit_Rate%': char_data['Crit_Rate%'],
                    'Crit_DMG%': char_data['Crit_DMG%'],
                    'Element': char_data['Element'],
                    'Elem_Bonus%': char_data['Elem_Bonus%'],
                    'Total_CV': char_data['Total_CV'],
                }
                
                # Récupérer les artéfacts de ce personnage
                char_arts = [a for a in all_artifacts if a['Character'] == char_name]
                arts_by_slot = {a['Slot']: a for a in char_arts}
                
                # Ajouter chaque artéfact en colonnes
                for slot in slot_order:
                    art = arts_by_slot.get(slot, {})
                    prefix = slot[:2].upper()  # FL, PL, SA, GO, CI
                    
                    row[f'{prefix}_Set'] = art.get('Set', '')
                    row[f'{prefix}_Main'] = art.get('Main_Stat', '')
                    row[f'{prefix}_MainVal'] = art.get('Main_Value', '')
                    row[f'{prefix}_CV'] = art.get('Crit_Value', '')
                    # Substats condensées
                    subs = []
                    for i in range(1, 5):
                        sub_name = art.get(f'Sub{i}', '')
                        sub_val = art.get(f'Sub{i}_Val', '')
                        if sub_name:
                            subs.append(f"{sub_name}:{sub_val}")
                    row[f'{prefix}_Subs'] = ' | '.join(subs)
                
                combined_rows.append(row)
            
            combined_df = pd.DataFrame(combined_rows)
            
            # Versioning pour le fichier combiné
            has_combined_changes = char_stats['added'] > 0 or char_stats['updated'] > 0 or \
                                   artifact_stats['added'] > 0 or artifact_stats['updated'] > 0
            combined_stats = {
                'added': char_stats['added'],
                'updated': max(char_stats['updated'], artifact_stats['updated']),
                'unchanged': 0 if has_combined_changes else len(combined_rows)
            }
            
            current_comb_version, current_comb_file = get_current_version(base_name_combined)
            existing_combined = load_existing_csv(current_comb_file) if current_comb_file else None
            
            comb_file, comb_version, comb_changed = save_with_versioning(
                combined_df, base_name_combined, existing_combined, combined_stats
            )
            
            print(f"\n📁 Combiné ({comb_file}):")
            print(f"   📦 Version: v{comb_version}" + (" 🆕" if comb_changed else " (inchangée)"))
            print(f"   📊 {len(combined_df)} personnages avec artéfacts intégrés")
            
            # JSON brut (toujours écrasé - c'est un snapshot)
            json_filename = os.path.join(folder_name, "raw.json")
            with open(json_filename, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            print(f"\n📁 JSON brut: '{json_filename}' (snapshot actuel)")
            print(f"\n✅ Tous les fichiers sont dans le dossier: {folder_name}/")
            
        elif response.status_code == 400:
            print("❌ UID invalide.")
        elif response.status_code == 404:
            print("❌ Joueur non trouvé.")
        elif response.status_code == 424:
            print("❌ Maintenance en cours.")
        elif response.status_code == 429:
            print("❌ Trop de requêtes. Attends quelques secondes.")
        else:
            print(f"❌ Erreur {response.status_code}")
            
    except Exception as e:
        print(f"❌ Crash : {e}")
        import traceback
        traceback.print_exc()

def main():
    uid = get_uid()
    fetch_player_data(uid)
    
    print("\n" + "=" * 70)
    print("💡 LÉGENDE:")
    print("=" * 70)
    print("""
• ➕ Ajouté = Nouveau personnage/artéfact ajouté au CSV
• 🔄 Mis à jour = Build changé (stats différentes)
• ✅ Inchangé = Données identiques, non modifiées

Le script est IDEMPOTENT: tu peux le lancer plusieurs fois
sans créer de doublons !
""")

if __name__ == "__main__":
    main()
