## 2025-02-23 - Path Traversal in Enka Scraper
**Vulnerability:** Found a Path Traversal vulnerability in `enka.fetch_player_data`. The `uid` argument was used directly to construct file paths (`output_root / f"{safe_nickname}_{uid}"`), allowing attackers to write files outside the intended directory using `../`.
**Learning:** Even internal helper functions like scrapers can become critical vulnerabilities when exposed via API endpoints without sanitization. The assumption that `uid` is always numeric was not enforced in code.
**Prevention:** Validate all inputs at the entry point (API) AND at the function level (Defense in Depth). Ensure file path construction uses sanitized components.

## 2026-02-12 - Hardcoded Secrets in Utility Scripts
**Vulnerability:** Found a hardcoded Google Gemini API key in `Tools/Cleaners/list_models.py`. Utility scripts often bypass standard security reviews but are still part of the codebase and can leak secrets if committed.
**Learning:** Secrets in "Tools" or "Scripts" folders are just as dangerous as in production code. Developers often use these for quick testing and forget to clean them up.
**Prevention:** Use environment variables for ALL scripts, even temporary ones. Add pre-commit hooks to scan for secrets in all files, including non-source directories.

## 2026-03-01 - Second-Order Path Traversal in Akasha Scraper
**Vulnerability:** Found a Second-Order Path Traversal vulnerability in `akasha.fetch_leaderboard`. The character name returned by the external API was used directly to create a filename (`f"{char_name}_dataset.csv"`), allowing an attacker controlling the upstream API (or a malicious proxy) to write files to arbitrary locations.
**Learning:** Data from external APIs should be treated as untrusted, just like user input. "Trusted" sources can be compromised or return unexpected data.
**Prevention:** Always sanitize data from external sources before using it in sensitive operations like file system access. Use strict allow-lists (e.g., alphanumeric only) for filenames.

## 2025-02-18 - RateLimiter Memory Leak & Duplicate Definitions
**Vulnerability:** Found 3 duplicate definitions of `RateLimiter` in `api.py`. The active definition lacked a memory cleanup mechanism (present in the first unused definition), creating a potential Memory Exhaustion (DoS) vulnerability.
**Learning:** Copy-pasting code blocks without removing the old ones can lead to silent regressions where security features are lost in the active version.
**Prevention:** Use linters to detect redefined classes/variables. Refactor common logic into a single source of truth.
