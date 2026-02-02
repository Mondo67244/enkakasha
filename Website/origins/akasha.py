import cloudscraper
import pandas as pd
import json
import re

# --- CONFIGURATION ---
BASE_URL = "https://akasha.cv/api/leaderboards"
Leaderboard_ID = "" 
MAX_SIZE = 50

def get_value(obj):
    """Extrait la valeur d'un objet {'value': X} ou retourne l'objet directement."""
    if isinstance(obj, dict) and 'value' in obj:
        return obj['value']
    return obj

def get_Leaderboard_id():
    """Demande le Leaderboard ID à l'utilisateur si non configuré."""
    if Leaderboard_ID:
        return Leaderboard_ID
    
    print("=" * 60)
    print("🎮 AKASHA.CV LEADERBOARD SCRAPER")
    print("=" * 60)
    print()
    
    calc_id = input("📌 Entre le Leaderboard ID: ").strip()
    
    if not calc_id:
        print("❌ Leaderboard ID requis.")
        exit(1)
    
    return calc_id

def fetch_leaderboard(Leaderboard_id):
    """Récupère les données du leaderboard pour un Leaderboard ID donné."""
    scraper = cloudscraper.create_scraper(
        browser={
            'browser': 'chrome',
            'platform': 'linux',
            'desktop': True
        }
    )
    
    print(f"\n🚀 Récupération du leaderboard (top {MAX_SIZE})...", flush=True)

    params = {
        'sort': 'Leaderboard.result',
        'order': '-1',
        'size': MAX_SIZE,
        'LeaderboardId': Leaderboard_id
    }

    try:
        response = scraper.get(BASE_URL, params=params)
        
        if response.status_code == 200:
            data = response.json()
            
            if 'data' not in data or not data['data']:
                print("⚠️ Aucune donnée retournée. Vérifie le Leaderboard ID.")
                return
            
            # Récupérer le nom du personnage pour le fichier
            char_name = data['data'][0].get('name', 'character').lower()
            filename = f"{char_name}_dataset.csv"
            
            all_profiles = []
            
            for entry in data['data']:
                stats = entry.get('stats', {})
                calc = entry.get('Leaderboard', {})
                weapon = entry.get('weapon', {})
                owner = entry.get('owner', {})
                
                weapon_info = weapon.get('weaponInfo', {})
                refine_obj = weapon_info.get('refinementLevel', {})
                
                # Récupérer dynamiquement le bonus élémentaire
                elemental_bonus = None
                for key in stats:
                    if 'DamageBonus' in key and key != 'physicalDamageBonus':
                        elemental_bonus = round(get_value(stats.get(key, 0)) * 100, 2)
                        break
                
                all_profiles.append({
                    'Rank': entry.get('index'),
                    'Player': owner.get('nickname'),
                    'UID': entry.get('uid'),                    # UID Genshin du joueur
                    # 'Build_ID': entry.get('_id'),               # ID unique du build Akasha
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
            
            # Sauvegarder
            df = pd.DataFrame(all_profiles)
            df.to_csv(filename, index=False)
            print(f"✅ {len(df)} profils sauvegardés dans '{filename}'")
            
            # Afficher un aperçu
            print("\n📊 Aperçu des données:")
            print(df.head(20).to_string())
            
        else:
            print(f"❌ Erreur {response.status_code}")
            if response.status_code == 403:
                print("   -> Cloudflare bloque. Réessaie plus tard.")
                
    except Exception as e:
        print(f"❌ Crash : {e}")
        import traceback
        traceback.print_exc()

def main():
    Leaderboard_id = get_Leaderboard_id()
    fetch_leaderboard(Leaderboard_id)
    
    print("\n" + "=" * 60)
    print("💡 NOTE: OÙ TROUVER LE Leaderboard ID ?")
    print("=" * 60)
    print("""
1. Va sur https://akasha.cv/leaderboards
2. Choisis un personnage et clique sur "show **** Leaderboard"
3. L'URL ressemblera à: https://akasha.cv/leaderboards/**********
4. Copie le nombre après 'leaderboards/' (ex: 1000010212)

Exemples de d'IDs courants:
  • 1000010212 = Mualani (Forward Vaporize with Xilonen)
  • (Explore akasha.cv pour d'autres personnages)
""")

if __name__ == "__main__":
    main()

