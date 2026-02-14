import pandas as pd
import json
import re
import i18n
import http_client

# --- CONFIGURATION ---
BASE_URL = "https://akasha.cv/api/leaderboards"
CALCULATION_ID = "" 
MAX_SIZE = 50
REQUEST_TIMEOUT = 15

def sanitize_filename(name):
    """Cleans a name for use in a filename."""
    # Replace special characters with underscores
    sanitized = re.sub(r'[^a-zA-Z0-9_-]', '_', name)
    # Remove multiple underscores
    sanitized = re.sub(r'_+', '_', sanitized)
    # Remove leading/trailing underscores
    return sanitized.strip('_')

def get_value(obj):
    """Extracts value from object {'value': X} or returns the object directly."""
    if isinstance(obj, dict) and 'value' in obj:
        return obj['value']
    return obj

def get_calculation_id():
    """Asks for Calculation ID if not configured."""
    if CALCULATION_ID:
        return CALCULATION_ID
    
    print("=" * 60)
    print(i18n.get("AKASHA_TITLE"))
    print("=" * 60)
    print()
    
    calc_id = input(i18n.get("ENTER_CALC_ID")).strip()
    
    if not calc_id:
        print(i18n.get("CALC_ID_REQUIRED"))
        exit(1)
    
    return calc_id

def fetch_leaderboard(calculation_id, limit=MAX_SIZE, timeout=REQUEST_TIMEOUT):
    """Fetches leaderboard data for a given Calculation ID."""
    # Use optimized http_client with Cloudflare bypass
    session = http_client.create_session(
        browser='chrome',
        platform='windows',  # Windows has better reputation
        use_nodejs=True
    )
    
    print(i18n.get("FETCHING_LEADERBOARD", limit=limit), flush=True)

    param_sets = [
        {
            'sort': 'Leaderboard.result',
            'order': '-1',
            'size': limit,
            'LeaderboardId': calculation_id
        },
        {
            'sort': 'calculation.result',
            'order': '-1',
            'size': limit,
            'calculationId': calculation_id
        }
    ]

    last_status = None
    data = None

    try:
        for params in param_sets:
            try:
                response = http_client.get_with_retry(
                    session,
                    BASE_URL,
                    params=params,
                    timeout=timeout,
                    delay_min=1.5,
                    delay_max=3.0,
                    max_retries=3
                )
                last_status = response.status_code
                if response.status_code != 200:
                    continue
                payload = response.json()
                if payload and payload.get('data'):
                    data = payload
                    break
            except Exception as e:
                print(f"Request attempt failed: {e}")
                continue

        if not data or 'data' not in data or not data['data']:
            print(i18n.get("NO_DATA_RETURNED"))
            if last_status and last_status != 200:
                print(i18n.get("ERROR_STATUS", status=last_status))
                if last_status == 403:
                    print(i18n.get("CLOUDFLARE_BLOCK"))
                    print("TIP: If running on VPS, consider using residential proxy or FlareSolverr")
            return []

        # Get character name for filename
        char_name = data['data'][0].get('name', 'character').lower()
        safe_char_name = sanitize_filename(char_name)
        filename = f"{safe_char_name}_dataset.csv"

        all_profiles = []

        for entry in data['data']:
            stats = entry.get('stats', {})
            calc = entry.get('Leaderboard') or entry.get('calculation') or entry.get('Calculation') or {}
            weapon = entry.get('weapon', {})
            owner = entry.get('owner', {})

            weapon_info = weapon.get('weaponInfo', {})
            refine_obj = weapon_info.get('refinementLevel', {})

            # Dynamically retrieve elemental bonus
            elemental_bonus = None
            for key in stats:
                if 'DamageBonus' in key and key != 'physicalDamageBonus':
                    elemental_bonus = round(get_value(stats.get(key, 0)) * 100, 2)
                    break

            all_profiles.append({
                'Rank': entry.get('index'),
                'Player': owner.get('nickname'),
                'UID': entry.get('uid'),
                # 'Build_ID': entry.get('_id'),
                'Region': owner.get('region'),
                'Weapon': weapon.get('name'),
                'Refine': get_value(refine_obj) + 1 if refine_obj else None,
                'HP': round(get_value(stats.get('maxHp', 0))),
                'ATK': round(get_value(stats.get('atk', 0))),
                'DEF': round(get_value(stats.get('def', 0))),
                'EM': round(get_value(stats.get('elementalMastery', 0))),
                'ER': round(get_value(stats.get('energyRecharge', 0)) * 100, 2),
                'Crit_Rate': round(get_value(stats.get('critRate', 0)) * 100, 2),
                'Crit_DMG': round(get_value(stats.get('critDamage', 0)) * 100, 2),
                'Elem_Bonus': elemental_bonus,
                'DMG_Result': round(get_value(calc.get('result', 0)))
            })

        # Save
        df = pd.DataFrame(all_profiles)
        df.to_csv(filename, index=False)
        print(i18n.get("PROFILES_SAVED", count=len(df), filename=filename))

        # Show preview
        print(i18n.get("DATA_PREVIEW"))
        print(df.head(20).to_string())

        # Return full profiles with stats for API usage
        return all_profiles

    except Exception as e:
        print(i18n.get("CRASH_MSG", error=e))
        import traceback
        traceback.print_exc()

def main():
    calculation_id = get_calculation_id()
    fetch_leaderboard(calculation_id)
    
    print("\n" + "=" * 60)
    print(i18n.get("NOTE_WHERE_TO_FIND_ID"))
    print("=" * 60)
    print(i18n.get("NOTE_CONTENT"))

if __name__ == "__main__":
    main()
