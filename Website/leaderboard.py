import time
import pandas as pd
import akasha
import enka
try:
    import exportmd
except ImportError:
    exportmd = None
import sys
import os
import json
from datetime import datetime
import i18n


# --- CONFIGURATION ---
REQUEST_DELAY = 5.0  # Seconds between requests
MAX_RETRIES = 3      # Max retries for Enka API

def save_data(rows, calculation_id, errors=None):
    """Save data to CSV and JSON."""
    if not rows:
        print(i18n.get("NO_DATA_TO_SAVE"))
        return

    df = pd.DataFrame(rows)
    
    # Create folder: scan_<ID>
    folder_name = f"scan_{calculation_id}"
    if not os.path.exists(folder_name):
        os.makedirs(folder_name)
        print(i18n.get("FOLDER_CREATED", folder=folder_name))
    
    # Generate filename with path
    date_str = datetime.now().strftime("%d%m%y")
    base_filename = f"scanresult{date_str}_{calculation_id}"
    
    # Paths relative to current directory (inside the folder)
    csv_filename = os.path.join(folder_name, f"{base_filename}.csv")
    json_filename = os.path.join(folder_name, f"{base_filename}.json")
    
    # Save CSV
    df.to_csv(csv_filename, index=False)
    print(i18n.get("SAVED_CSV", filename=csv_filename))
    
    # Save JSON
    with open(json_filename, 'w', encoding='utf-8') as f:
        json.dump(rows, f, indent=4, ensure_ascii=False)
    print(i18n.get("SAVED_JSON", filename=json_filename))
    
    unique_players = len(set(r['UID'] for r in rows))
    print(i18n.get("TOTAL_ROWS_PLAYERS", count=len(df), players=unique_players))
    
    # Check for unmapped IDs
    unmapped = [r['Character'] for r in rows if str(r['Character']).startswith('ID_')]
    if unmapped:
        unique_unmapped = sorted(list(set(unmapped)))
        print(i18n.get("UNKNOWN_IDS", ids=unique_unmapped))
    
    # Generate detailed Markdown report
    if exportmd:
        try:
            report_md = exportmd.generate_report(csv_filename)
            md_filename = os.path.join(folder_name, f"{base_filename}.md")
            with open(md_filename, 'w', encoding='utf-8') as f:
                f.write(report_md)
            print(i18n.get("SAVED_MD", filename=md_filename))
        except Exception as e:
            print(i18n.get("ERROR_MD", error=e))
    else:
        print(i18n.get("ERROR_MD", error="exportmd module not available"))

    if errors:
        print(i18n.get("ERRORS_ENCOUNTERED", count=len(errors)))

def main():
    # 0. Ask for language
    lang_input = input(i18n.get("CHOOSE_LANG")).strip().upper()
    i18n.set_language(lang_input if lang_input in ['FR', 'EN'] else 'FR')
    
    calc_id = ""
    limit = 50

    # 1. Check CLI args first
    if len(sys.argv) >= 2:
        calc_id = sys.argv[1]
    
    # 2. If no CLI arg, ask interactively
    if not calc_id:
        print("=" * 70)
        print(i18n.get("COMBINED_TITLE"))
        print("=" * 70)
        calc_id = input(i18n.get("ENTER_AKASHA_ID")).strip()
        if not calc_id:
            print(i18n.get("ID_REQUIRED_STOP"))
            return

    # 3. Check for limit flag or ask interactively
    if "--limit" in sys.argv:
        try:
            limit_idx = sys.argv.index("--limit")
            limit = int(sys.argv[limit_idx + 1])
        except (ValueError, IndexError):
            print(i18n.get("INVALID_LIMIT_DEFAULT"))
    elif len(sys.argv) < 2: 
        # Only ask for limit if we are in interactive mode (no args provided at start)
        limit_input = input(i18n.get("ENTER_LIMIT")).strip()
        if limit_input.isdigit():
            limit = int(limit_input)

    print("=" * 70)
    print(i18n.get("COMBINED_TITLE"))
    print("=" * 70)
    print(f"\n📌 {i18n.get('ENTER_AKASHA_ID').strip(': ')}: {calc_id}")

    # --- STEP 1: AKASHA ---
    print(i18n.get("STEP_1_AKASHA", limit=limit))
    leaderboard = akasha.fetch_leaderboard(calc_id, limit=limit)
    
    if not leaderboard:
        print(i18n.get("CANNOT_FETCH_LEADERBOARD"))
        return
        
    print(i18n.get("PLAYERS_FOUND", count=len(leaderboard)))

    # --- STEP 2: ENKA ---
    print(i18n.get("STEP_2_ENKA"))
    print(i18n.get("RATE_LIMIT_DELAY", seconds=REQUEST_DELAY))
    
    all_rows = []
    errors = []
    
    try:
        for i, entry in enumerate(leaderboard, 1):
            uid = entry['UID']
            player_name = entry['Player']
            print(f"\n   [{i}/{len(leaderboard)}] {player_name} (UID: {uid})...", end=" ", flush=True)
            
            # Retry logic
            char_data_list = None
            for attempt in range(MAX_RETRIES):
                char_data_list, error = enka.fetch_player_data(uid)
                if char_data_list:
                    break
                # Only retry if it's a timeout/network error, not 404
                if "404" in str(error):
                    break
                time.sleep(2) # Short wait before retry

            if not char_data_list:
                print(i18n.get("FAILED_FETCH", error=error))
                errors.append({'uid': uid, 'error': error})
            else:
                print(i18n.get("SHOWCASE_COUNT", count=len(char_data_list)))
                
                # Combine Akasha info with Enka info
                for char_data in char_data_list:
                    stats = char_data['stats']
                    artifacts = char_data['artifacts']
                    
                    # Base row info (Leaderboard context)
                    row = {
                        'UID': uid,
                        'Player': player_name,
                        'Region': entry['Region'],
                        'LB_Rank': entry['Rank'],
                        'LB_Weapon': entry['Weapon'],
                        'LB_DMG': entry['DMG_Result'],
                    }
                    
                    # Add Character Stats
                    row.update(stats)
                    
                    # Add Artifacts (Columns)
                    slot_map = {'Flower': 'FL', 'Plume': 'PL', 'Sands': 'SA', 'Goblet': 'GO', 'Circlet': 'CI'}
                    
                    for art in artifacts:
                        slot = art['Slot']
                        prefix = slot_map.get(slot)
                        if prefix:
                            row[f'{prefix}_Set'] = art['Set']
                            row[f'{prefix}_Main'] = f"{art['Main_Stat']} {art['Main_Value']}"
                            row[f'{prefix}_CV'] = art['Crit_Value']
                            
                            # Substats formatting
                            subs = []
                            for k in range(1, 5):
                                s_name = art.get(f'Sub{k}')
                                s_val = art.get(f'Sub{k}_Val')
                                if s_name:
                                    subs.append(f"{s_name}:{s_val}")
                            row[f'{prefix}_Subs'] = " | ".join(subs)
                            
                    all_rows.append(row)

            # Intermediate save
            if i % 10 == 0 and all_rows:
                 print(i18n.get("INTERMEDIATE_SAVE"))
                 save_data(all_rows, calc_id)

            # Rate limiting
            if i < len(leaderboard):
                time.sleep(REQUEST_DELAY)
                
    except KeyboardInterrupt:
        print(i18n.get("USER_INTERRUPT"))
        print(i18n.get("SAVING_BEFORE_EXIT"))
        save_data(all_rows, calc_id, errors)
        return

    # Step 3: Save final combined CSV
    print(i18n.get("STEP_3_FINAL_SAVE"))
    save_data(all_rows, calc_id, errors)

if __name__ == "__main__":
    main()

# --- API helper (non-interactive) ---
def fetch_leaderboard_character(calculation_id, target_character_name, limit=50, request_delay=REQUEST_DELAY, max_retries=MAX_RETRIES):
    """
    Fetches leaderboard entries, then pulls Enka data per UID and returns only the target character.
    Returns a list of dicts compatible with backend context summary.
    """
    leaderboard = akasha.fetch_leaderboard(calculation_id, limit=limit)
    if not leaderboard:
        return []

    rows = []
    for i, entry in enumerate(leaderboard, 1):
        uid = entry.get('UID')
        if not uid:
            continue

        char_data_list = None
        error = None
        for _ in range(max_retries):
            char_data_list, error = enka.fetch_player_data(uid)
            if char_data_list:
                break
            if error and "404" in str(error):
                break
            time.sleep(2)

        if not char_data_list:
            continue

        target_char = next((c for c in char_data_list if c['stats'].get('Character') == target_character_name), None)
        if not target_char:
            continue

        stats = target_char['stats']
        row = {
            'Rank': entry.get('Rank'),
            'Player': entry.get('Player'),
            'UID': uid,
            'Region': entry.get('Region'),
            'Weapon': entry.get('Weapon'),
            'DMG_Result': entry.get('DMG_Result'),
            'Character': stats.get('Character'),
            'HP': stats.get('HP'),
            'ATK': stats.get('ATK'),
            'DEF': stats.get('DEF'),
            'EM': stats.get('EM'),
            'ER': stats.get('ER%') if stats.get('ER%') is not None else stats.get('ER'),
            'Crit_Rate': stats.get('Crit_Rate%') if stats.get('Crit_Rate%') is not None else stats.get('Crit_Rate'),
            'Crit_DMG': stats.get('Crit_DMG%') if stats.get('Crit_DMG%') is not None else stats.get('Crit_DMG'),
            'Elem_Bonus': stats.get('Elem_Bonus%') if stats.get('Elem_Bonus%') is not None else stats.get('Elem_Bonus'),
            'Artifacts': target_char.get('artifacts', []),
        }
        rows.append(row)

        if i < len(leaderboard):
            time.sleep(request_delay)

    return rows
