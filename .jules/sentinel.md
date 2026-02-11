## 2025-02-23 - Unvalidated UID and Calc ID
**Vulnerability:** Input validation was missing for `uid` in `/scan/{uid}` and `calc_id` in `/leaderboard/{calc_id}`, passing arbitrary strings to external APIs and internal logic.
**Learning:** Even if external services (like Enka/Akasha) validate inputs, lack of local validation exposes the backend to DoS, SSRF attempts (path traversal in URLs), and unnecessary resource usage.
**Prevention:** Strictly validate all inputs at the API boundary using regex or strong typing before passing them to business logic.
