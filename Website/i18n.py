# i18n.py

# Global variable to store the selected language
# Default is 'FR' for backward compatibility, but will be set by user.
CURRENT_LANG = 'FR'

def set_language(lang):
    """Sets the current language ('FR' or 'EN')."""
    global CURRENT_LANG
    if lang in ['FR', 'EN']:
        CURRENT_LANG = lang

def get(key, *args, **kwargs):
    """
    Retrieves the translation for the given key in the current language.
    Supports straightforward string formatting.
    """
    if key not in TRANSLATIONS:
        return key
    
    text = TRANSLATIONS[key].get(CURRENT_LANG, key)
    
    if args or kwargs:
        try:
            return text.format(*args, **kwargs)
        except Exception:
            return text
    return text

# Dictionary of translations
TRANSLATIONS = {
    # General
    "YES": {
        "FR": "Oui",
        "EN": "Yes"
    },
    "NO": {
        "FR": "Non",
        "EN": "No"
    },
    
    # akasha.py
    "AKASHA_TITLE": {
        "FR": "🎮 SCRAPER DE LEADERBOARD AKASHA.CV",
        "EN": "🎮 AKASHA.CV LEADERBOARD SCRAPER"
    },
    "ENTER_CALC_ID": {
        "FR": "📌 Entre le Leaderboard ID: ",
        "EN": "📌 Enter the Leaderboard ID: "
    },
    "CALC_ID_REQUIRED": {
        "FR": "❌ Leaderboard ID requis.",
        "EN": "❌ Leaderboard ID required."
    },
    "FETCHING_LEADERBOARD": {
        "FR": "\n🚀 Récupération du leaderboard (top {limit})...",
        "EN": "\n🚀 Fetching leaderboard (top {limit})..."
    },
    "NO_DATA_RETURNED": {
        "FR": "⚠️ Aucune donnée retournée. Vérifie le Leaderboard ID.",
        "EN": "⚠️ No data returned. Check the Leaderboard ID."
    },
    "PROFILES_SAVED": {
        "FR": "✅ {count} profils sauvegardés dans '{filename}'",
        "EN": "✅ {count} profiles saved in '{filename}'"
    },
    "DATA_PREVIEW": {
        "FR": "\n📊 Aperçu des données:",
        "EN": "\n📊 Data preview:"
    },
    "ERROR_STATUS": {
        "FR": "❌ Erreur {status}",
        "EN": "❌ Error {status}"
    },
    "CLOUDFLARE_BLOCK": {
        "FR": "   -> Cloudflare bloque. Réessaie plus tard.",
        "EN": "   -> Cloudflare is blocking. Try again later."
    },
    "CRASH_MSG": {
        "FR": "❌ Crash : {error}",
        "EN": "❌ Crash : {error}"
    },
    "NOTE_WHERE_TO_FIND_ID": {
        "FR": "💡 NOTE: OÙ TROUVER LE Leaderboard ID ?",
        "EN": "💡 NOTE: WHERE TO FIND THE Leaderboard ID?"
    },
    "NOTE_CONTENT": {
        "FR": """
1. Choisis un personnage et clique sur "show **** Leaderboard"
2. L'URL ressemblera à: https://akasha.cv/leaderboards/**********
3. Copie le nombre après 'leaderboards/' (ex: 1000010212)

Exemples de d'IDs courants:
  • 1000010212 = Mualani (Forward Vaporize with Xilonen)
  • (Explore akasha.cv pour d'autres personnages)
""",
        "EN": """
1. Pick a character and click "show **** Leaderboard"
2. The URL will look like: https://akasha.cv/leaderboards/**********
3. Copy the number after 'leaderboards/' (e.g., 1000010212)

Examples of common IDs:
  • 1000010212 = Mualani (Forward Vaporize with Xilonen)
  • (Explore akasha.cv for other characters)
"""
    },

    # enka.py
    "ENKA_TITLE": {
        "FR": "🎮 SCRAPER DE DONNÉES JOUEUR ENKA.NETWORK (avec Artéfacts)",
        "EN": "🎮 ENKA.NETWORK PLAYER DATA SCRAPER (with Artifacts)"
    },
    "ENTER_UID": {
        "FR": "📌 Entre ton UID Genshin Impact: ",
        "EN": "📌 Enter your Genshin Impact UID: "
    },
    "INVALID_UID_FORMAT": {
        "FR": "❌ UID invalide (doit être un nombre).",
        "EN": "❌ Invalid UID (must be a number)."
    },
    "ERROR_READING_FILE": {
        "FR": "⚠️ Erreur lecture {filename}: {error}",
        "EN": "⚠️ Error reading {filename}: {error}"
    },
    "FETCHING_DATA_UID": {
        "FR": "\n🚀 Récupération des données pour UID: {uid}...",
        "EN": "\n🚀 Fetching data for UID: {uid}..."
    },
    "PLAYER_INFO": {
        "FR": "\n👤 Joueur: {nickname}",
        "EN": "\n👤 Player: {nickname}"
    },
    "PLAYER_LEVEL": {
        "FR": "   AR: {level} | WL: {world_level}",
        "EN": "   AR: {level} | WL: {world_level}"
    },
    "NO_CHARACTERS": {
        "FR": "⚠️ Aucun personnage affiché dans la vitrine.",
        "EN": "⚠️ No characters displayed in showcase."
    },
    "SHOWCASE_COUNT": {
        "FR": "\n📊 {count} personnage(s) dans la vitrine:\n",
        "EN": "\n📊 {count} character(s) in showcase:\n"
    },
    "INTELLIGENT_MERGE": {
        "FR": "📊 FUSION INTELLIGENTE DES DONNÉES",
        "EN": "📊 INTELLIGENT DATA MERGE"
    },
    "FOLDER_CREATED": {
        "FR": "\n📁 Dossier créé: {folder}/",
        "EN": "\n📁 Folder created: {folder}/"
    },
    "FILE_CHARACTERS": {
        "FR": "\n📁 Personnages ({filename}):",
        "EN": "\n📁 Characters ({filename}):"
    },
    "FILE_ARTIFACTS": {
        "FR": "\n📁 Artéfacts ({filename}):",
        "EN": "\n📁 Artifacts ({filename}):"
    },
    "FILE_COMBINED": {
        "FR": "\n📁 Combiné ({filename}):",
        "EN": "\n📁 Combined ({filename}):"
    },
    "VERSION_INFO": {
        "FR": "   📦 Version: v{version}",
        "EN": "   📦 Version: v{version}"
    },
    "NEW_TAG": {
        "FR": " 🆕",
        "EN": " 🆕"
    },
    "UNCHANGED_TAG": {
        "FR": " (inchangée)",
        "EN": " (unchanged)"
    },
    "STATS_ADDED": {
        "FR": "   ➕ Ajoutés: {count}",
        "EN": "   ➕ Added: {count}"
    },
    "STATS_UPDATED": {
        "FR": "   🔄 Mis à jour: {count}",
        "EN": "   🔄 Updated: {count}"
    },
    "STATS_UNCHANGED": {
        "FR": "   ✅ Inchangés: {count}",
        "EN": "   ✅ Unchanged: {count}"
    },
    "STATS_TOTAL_ENTRIES": {
        "FR": "   📊 Total: {count} entrées",
        "EN": "   📊 Total: {count} entries"
    },
    "STATS_TOTAL_PIECES": {
        "FR": "   📊 Total: {count} pièces",
        "EN": "   📊 Total: {count} pieces"
    },
    "COMBINED_INFO": {
        "FR": "   📊 {count} personnages avec artéfacts intégrés",
        "EN": "   📊 {count} characters with integrated artifacts"
    },
    "RAW_JSON": {
        "FR": "\n📁 JSON brut: '{filename}' (snapshot actuel)",
        "EN": "\n📁 Raw JSON: '{filename}' (current snapshot)"
    },
    "ALL_FILES_IN_FOLDER": {
        "FR": "\n✅ Tous les fichiers sont dans le dossier: {folder}/",
        "EN": "\n✅ All files are in folder: {folder}/"
    },
    "UID_INVALID": {
        "FR": "❌ UID invalide.",
        "EN": "❌ Invalid UID."
    },
    "PLAYER_NOT_FOUND": {
        "FR": "❌ Joueur non trouvé.",
        "EN": "❌ Player not found."
    },
    "MAINTENANCE": {
        "FR": "❌ Maintenance en cours.",
        "EN": "❌ Maintenance in progress."
    },
    "RATE_LIMITED": {
        "FR": "❌ Trop de requêtes. Attends quelques secondes.",
        "EN": "❌ Too many requests. Wait a few seconds."
    },
    "LEGEND_TITLE": {
        "FR": "💡 LÉGENDE:",
        "EN": "💡 LEGEND:"
    },
    "LEGEND_CONTENT": {
        "FR": """
• ➕ Ajouté = Nouveau personnage/artéfact ajouté au CSV
• 🔄 Mis à jour = Build changé (stats différentes)
• ✅ Inchangé = Données identiques, non modifiées

Le script est IDEMPOTENT: tu peux le lancer plusieurs fois
sans créer de doublons !
""",
        "EN": """
• ➕ Added = New character/artifact added to CSV
• 🔄 Updated = Build changed (different stats)
• ✅ Unchanged = Identical data, not modified

The script is IDEMPOTENT: you can run it multiple times
without creating duplicates!
"""
    },

    # leaderboard.py
    "NO_DATA_TO_SAVE": {
        "FR": "⚠️ Aucune donnée à sauvegarder.",
        "EN": "⚠️ No data to save."
    },
    "SAVED_MD": {
        "FR": "✅ Sauvegardé (Markdown): {filename}",
        "EN": "✅ Saved (Markdown): {filename}"
    },
    "ERROR_MD": {
        "FR": "⚠️ Erreur lors de la génération Markdown: {error}",
        "EN": "⚠️ Error generating Markdown: {error}"
    },
    "SAVED_CSV": {
        "FR": "\n✅ Sauvegardé (CSV): {filename}",
        "EN": "\n✅ Saved (CSV): {filename}"
    },
    "SAVED_JSON": {
        "FR": "✅ Sauvegardé (JSON): {filename}",
        "EN": "✅ Saved (JSON): {filename}"
    },
    "TOTAL_ROWS_PLAYERS": {
        "FR": "   📊 {count} lignes ({players} joueurs)",
        "EN": "   📊 {count} rows ({players} players)"
    },
    "UNKNOWN_IDS": {
        "FR": "\n⚠️  IDs de personnages inconnus trouvés: {ids}",
        "EN": "\n⚠️  Unknown character IDs found: {ids}"
    },
    "ERRORS_ENCOUNTERED": {
        "FR": "\n⚠️  {count} erreurs rencontrées (voir logs).",
        "EN": "\n⚠️  {count} errors encountered (see logs)."
    },
    "COMBINED_TITLE": {
        "FR": "🏆 Akasha + Enka Combined Scraper",
        "EN": "🏆 Akasha + Enka Combined Scraper"
    },
    "ENTER_AKASHA_ID": {
        "FR": "📌 Entrez l'ID du classement Akasha (ex: 1000010212): ",
        "EN": "📌 Enter Akasha Leaderboard ID (e.g. 1000010212): "
    },
    "ID_REQUIRED_STOP": {
        "FR": "❌ ID requis. Arrêt.",
        "EN": "❌ ID required. Stopping."
    },
    "INVALID_LIMIT_DEFAULT": {
        "FR": "⚠️ Limit invalide, défaut: 50.",
        "EN": "⚠️ Invalid limit, default: 50."
    },
    "ENTER_LIMIT": {
        "FR": "🔢 Nombre de joueurs à récupérer (défaut 50): ",
        "EN": "🔢 Number of players to fetch (default 50): "
    },
    "STEP_1_AKASHA": {
        "FR": "\n🎮 Étape 1: Récupération du leaderboard Akasha (top {limit})...",
        "EN": "\n🎮 Step 1: Fetching Akasha leaderboard (top {limit})..."
    },
    "CANNOT_FETCH_LEADERBOARD": {
        "FR": "❌ Impossible de récupérer le leaderboard.",
        "EN": "❌ Cannot fetch leaderboard."
    },
    "PLAYERS_FOUND": {
        "FR": "✅ {count} joueurs trouvés",
        "EN": "✅ {count} players found"
    },
    "STEP_2_ENKA": {
        "FR": "\n📊 Étape 2: Récupération des données Enka pour chaque joueur...",
        "EN": "\n📊 Step 2: Fetching Enka data for each player..."
    },
    "RATE_LIMIT_DELAY": {
        "FR": "   ⏱️  Délai entre requêtes: {seconds}s (rate limiting)",
        "EN": "   ⏱️  Delay between requests: {seconds}s (rate limiting)"
    },
    "FAILED_FETCH": {
        "FR": "❌ Échec ({error})",
        "EN": "❌ Failed ({error})"
    },
    "INTERMEDIATE_SAVE": {
        "FR": "   💾 (Sauvegarde intermédiaire...)",
        "EN": "   💾 (Intermediate save...)"
    },
    "USER_INTERRUPT": {
        "FR": "\n\n⚠️ Interruption utilisateur detected!",
        "EN": "\n\n⚠️ User interruption detected!"
    },
    "SAVING_BEFORE_EXIT": {
        "FR": "💾 Sauvegarde des données récupération avant l'arrêt...",
        "EN": "💾 Saving recovered data before exit..."
    },
    "STEP_3_FINAL_SAVE": {
        "FR": "\n💾 Étape 3: Sauvegarde finale...",
        "EN": "\n💾 Step 3: Final save..."
    },
    "CHOOSE_LANG": {
        "FR": "🌐 Choisissez la langue / Choose language (FR/EN) [FR]: ",
        "EN": "🌐 Choose language / Choisissez la langue (FR/EN) [EN]: " 
    }
}
