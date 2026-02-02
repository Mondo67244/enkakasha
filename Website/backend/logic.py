
import pandas as pd

def prepare_context(leaderboard_data):
    """
    Summarizes the leaderboard data to provide a concise context for the AI.
    """
    if not leaderboard_data:
        return "No leaderboard data available."
    
    df = pd.DataFrame(leaderboard_data)
    
    # Calculate averages for top 20
    avg_hp = df['HP'].mean()
    avg_atk = df['ATK'].mean()
    avg_def = df['DEF'].mean()
    avg_em = df['EM'].mean()
    avg_er = df['ER'].mean()
    avg_cr = df['Crit_Rate'].mean()
    avg_cd = df['Crit_DMG'].mean()
    
    
    summary = f"""
    --- LEADERBOARD CONTEXT (Top {len(df)} Players) ---
    Average Stats Targets:
    - HP: {avg_hp:.0f}
    - ATK: {avg_atk:.0f}
    - DEF: {avg_def:.0f}
    - EM: {avg_em:.0f}
    - ER: {avg_er:.1f}%
    - Crit Rate: {avg_cr:.1f}%
    - Crit DMG: {avg_cd:.1f}%
    
    Top Weapon: {df['Weapon'].mode()[0] if not df['Weapon'].empty else 'N/A'}
    """
    return summary

def prepare_inventory(user_data, target_character_name):
    """
    Filters user artifacts to find the pool of relevant pieces.
    1. Find the target character in user_data.
    2. Identify their equipped set (count most frequent set or 4-piece).
    3. Collect ALL artifacts from ALL characters in user_data that match this set.
    """
    target_char = next((c for c in user_data if c['stats']['Character'] == target_character_name), None)
    
    if not target_char:
        return None, f"Character {target_character_name} not found in user data."
    
    # Identify Target Set
    # We look at the artifacts on the target character
    artifacts = target_char['artifacts']
    if not artifacts:
        return None, "Target character has no artifacts equipped."
        
    # Count sets
    set_counts = {}
    for art in artifacts:
        s = art.get('Set')
        set_counts[s] = set_counts.get(s, 0) + 1
        
    # Pick the set with the most pieces (assumed to be the one we want to optimize)
    target_set = max(set_counts, key=set_counts.get)
    
    # Now collect all artifacts from ALL characters matching this set
    inventory_pool = []
    
    for char_entry in user_data:
        for art in char_entry['artifacts']:
            if art.get('Set') == target_set:
                # Add owner info for clarity
                art_copy = art.copy()
                art_copy['Current_Owner'] = char_entry['stats']['Character']
                inventory_pool.append(art_copy)
                
    return {
        "target_set": target_set,
        "pool": inventory_pool
    }, None
