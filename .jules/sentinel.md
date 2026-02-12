## 2025-02-23 - Path Traversal in Enka Scraper
**Vulnerability:** Found a Path Traversal vulnerability in `enka.fetch_player_data`. The `uid` argument was used directly to construct file paths (`output_root / f"{safe_nickname}_{uid}"`), allowing attackers to write files outside the intended directory using `../`.
**Learning:** Even internal helper functions like scrapers can become critical vulnerabilities when exposed via API endpoints without sanitization. The assumption that `uid` is always numeric was not enforced in code.
**Prevention:** Validate all inputs at the entry point (API) AND at the function level (Defense in Depth). Ensure file path construction uses sanitized components.

## 2025-02-23 - Hardcoded API Key in Utility Script
**Vulnerability:** A valid Google Gemini API Key was hardcoded in `Tools/Cleaners/list_models.py`.
**Learning:** Developers often overlook security in "Tools" or "Scripts" folders, assuming they are not part of the production build. However, these files are part of the repository and expose secrets if committed.
**Prevention:** Use environment variables for ALL secrets, even in quick utility scripts. Pre-commit hooks should scan for high-entropy strings or known key patterns.
