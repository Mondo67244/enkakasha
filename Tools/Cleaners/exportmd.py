
import pandas as pd

def generate_report(csv_file):
    try:
        df = pd.read_csv(csv_file)
    except Exception as e:
        print(f"Error reading {csv_file}: {e}")
        return

    # Group by UID
    grouped = df.groupby(['UID', 'Player', 'Region', 'LB_Rank', 'LB_Weapon', 'LB_DMG'])
    
    report = "# 🏆 Résultats du Scan\n\n"
    
    for (uid, player, region, rank, weapon, dmg), group in grouped:
        report += f"## {player} (UID: {uid})\n"
        report += f"- **Région**: {region}\n"
        report += f"- **Rang**: {rank}\n"
        report += f"- **Arme Leaderboard**: {weapon}\n"
        report += f"- **Dégâts**: {dmg:,}\n\n"
        
        report += "### 📊 Statistiques de Combat\n"
        stats_cols = ['Character', 'Level', 'HP', 'ATK', 'DEF', 'EM', 'ER%', 'Crit_Rate%', 'Crit_DMG%']
        report += "| " + " | ".join(stats_cols) + " |\n"
        report += "| " + " | ".join(['---'] * len(stats_cols)) + " |\n"
        
        for _, row in group.iterrows():
            line = [str(row[c]) for c in stats_cols]
            report += "| " + " | ".join(line) + " |\n"
            
        report += "\n### 🏺 Artefacts (Détails)\n"
        # Artifacts are tricky due to width. Let's list them per character?
        # Or a table per slot? Too wide for one table.
        # Let's do a table with condensed info: Character | Flower | Plume | Sands | Goblet | Circlet
        
        report += "| Personnage | Fleur | Plume | Sablier | Coupe | Diadème |\n"
        report += "| --- | --- | --- | --- | --- | --- |\n"
        
        for _, row in group.iterrows():
            char = row['Character']
            # Condensed format: "Set\nMainStat\nSubs\nCV"
            flower = f"**{row['FL_Set']}**<br>{row['FL_Main']}<br>_{row['FL_Subs']}_<br>CV: {row['FL_CV']}"
            plume = f"**{row['PL_Set']}**<br>{row['PL_Main']}<br>_{row['PL_Subs']}_<br>CV: {row['PL_CV']}"
            sands = f"**{row['SA_Set']}**<br>{row['SA_Main']}<br>_{row['SA_Subs']}_<br>CV: {row['SA_CV']}"
            goblet = f"**{row['GO_Set']}**<br>{row['GO_Main']}<br>_{row['GO_Subs']}_<br>CV: {row['GO_CV']}"
            circlet = f"**{row['CI_Set']}**<br>{row['CI_Main']}<br>_{row['CI_Subs']}_<br>CV: {row['CI_CV']}"
            
            report += f"| {char} | {flower} | {plume} | {sands} | {goblet} | {circlet} |\n"
            
        report += "\n---\n"
        
    return report

if __name__ == "__main__":
    report_md = generate_report('scanresult310126_1000008706.csv')
    with open('scan_report.md', 'w') as f:
        f.write(report_md)
    print("Report generated: scan_report.md")
