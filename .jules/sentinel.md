## 2025-02-23 - Path Traversal in Enka Scraper
**Vulnerability:** Found a Path Traversal vulnerability in `enka.fetch_player_data`. The `uid` argument was used directly to construct file paths (`output_root / f"{safe_nickname}_{uid}"`), allowing attackers to write files outside the intended directory using `../`.
**Learning:** Even internal helper functions like scrapers can become critical vulnerabilities when exposed via API endpoints without sanitization. The assumption that `uid` is always numeric was not enforced in code.
**Prevention:** Validate all inputs at the entry point (API) AND at the function level (Defense in Depth). Ensure file path construction uses sanitized components.

## 2026-02-12 - Hardcoded Secrets in Utility Scripts
**Vulnerability:** Found a hardcoded Google Gemini API key in `Tools/Cleaners/list_models.py`. Utility scripts often bypass standard security reviews but are still part of the codebase and can leak secrets if committed.
**Learning:** Secrets in "Tools" or "Scripts" folders are just as dangerous as in production code. Developers often use these for quick testing and forget to clean them up.
**Prevention:** Use environment variables for ALL scripts, even temporary ones. Add pre-commit hooks to scan for secrets in all files, including non-source directories.

## 2026-06-25 - Memory Leak in In-Memory Rate Limiter
**Vulnerability:** The initial implementation of an in-memory Rate Limiter used a `defaultdict(list)` that grew indefinitely with every new client IP, leading to a potential Denial of Service (DoS) via Out-Of-Memory (OOM) crash.
**Learning:** Simple "security fixes" like rate limiting can introduce new vulnerabilities (DoS) if resource consumption (memory) is not bounded. Security code must itself be secure and resource-efficient.
**Prevention:** Always implement cleanup mechanisms or bounds (e.g., LRU cache, fixed size, periodic purge) for any in-memory state tracking user data.
