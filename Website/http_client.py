"""
HTTP Client Module - Cloudflare Bypass Optimized with FlareSolverr
==================================================================
Centralized HTTP client handling:
1. FlareSolverr (Priority 1) - Full browser emulation via external service
2. Cloudscraper (Priority 2) - Python-based JS solver
3. Requests (Fallback) - Basic HTTP

Auto-detects environment configuration.
"""

import os
import random
import time
import logging
import json
from typing import Optional, Dict, Any

# Logging configuration
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Check for FlareSolverr configuration
FLARESOLVERR_URL = os.environ.get('FLARESOLVERR_URL')

try:
    import cloudscraper
    HAS_CLOUDSCRAPER = True
except ImportError:
    import requests
    HAS_CLOUDSCRAPER = False
    logging.warning("cloudscraper not installed, falling back to requests")

# Modern, realistic User-Agent strings (updated 2024)
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0",
]

# Standard browser headers
BROWSER_HEADERS = {
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9,fr;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Sec-Ch-Ua': '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-origin',
}

# Default configuration
DEFAULT_TIMEOUT = 60  # Higher timeout for FlareSolverr
DEFAULT_DELAY_MIN = 1.0
DEFAULT_DELAY_MAX = 3.0
MAX_RETRIES = 3
BACKOFF_FACTOR = 2


class MockResponse:
    """Mock requests.Response object for FlareSolverr compatibility."""
    def __init__(self, json_data):
        self.status_code = json_data.get('status', 500)
        # FlareSolverr returns 'solution' object with 'status', 'headers', 'response' (body)
        solution = json_data.get('solution', {})
        self.status_code = solution.get('status', 200)
        self.text = solution.get('response', '')
        self.content = self.text.encode('utf-8')
        self.headers = solution.get('headers', {})
        self._json = None

    def json(self):
        if self._json is None:
            # FlareSolverr returns text inside <pre> sometimes if direct JSON, or just raw text
            # We try to parse self.text directly
            try:
                self._json = json.loads(self.text)
            except json.JSONDecodeError:
                # Sometimes returned as HTML with json inside pre tag
                if '<pre' in self.text:
                    import re
                    match = re.search(r'<pre[^>]*>(.*?)</pre>', self.text, re.DOTALL)
                    if match:
                        self._json = json.loads(match.group(1))
                    else:
                        raise
                else:
                    raise
        return self._json


def get_random_user_agent() -> str:
    """Returns a random User-Agent string."""
    return random.choice(USER_AGENTS)


def create_session(
    browser: str = 'chrome',
    platform: str = 'windows',
    use_nodejs: bool = True
) -> Any:
    """
    Creates an optimized session. 
    If FLARESOLVERR_URL is set, returns a requests.Session aimed at FlareSolverr.
    Otherwise returns cloudscraper or standard requests.
    """
    if FLARESOLVERR_URL:
        logger.info(f"Using FlareSolverr at {FLARESOLVERR_URL}")
        import requests
        return requests.Session()

    if HAS_CLOUDSCRAPER:
        interpreter = 'nodejs' if use_nodejs else 'native'
        try:
            scraper = cloudscraper.create_scraper(
                browser={'browser': browser, 'platform': platform, 'desktop': True},
                interpreter=interpreter,
                delay=3,
            )
            logger.info(f"Created cloudscraper session ({interpreter})")
            return scraper
        except Exception as e:
            logger.warning(f"Failed to create cloudscraper: {e}, fallback to default")
            return cloudscraper.create_scraper()
    else:
        import requests
        session = requests.Session()
        session.headers.update({'User-Agent': get_random_user_agent()})
        return session


def add_delay(min_delay: float = DEFAULT_DELAY_MIN, max_delay: float = DEFAULT_DELAY_MAX):
    delay = random.uniform(min_delay, max_delay)
    time.sleep(delay)


def get_with_retry(
    session: Any,
    url: str,
    params: Optional[Dict] = None,
    headers: Optional[Dict] = None,
    timeout: int = DEFAULT_TIMEOUT,
    max_retries: int = MAX_RETRIES,
    add_browser_headers: bool = True,
    delay_before: bool = True,
    delay_min: float = DEFAULT_DELAY_MIN,
    delay_max: float = DEFAULT_DELAY_MAX,
) -> Any:
    """
    Makes a GET request, routing through FlareSolverr if configured.
    """
    import requests
    
    # Prepare Headers
    request_headers = {}
    if add_browser_headers:
        request_headers.update(BROWSER_HEADERS)
    request_headers['User-Agent'] = get_random_user_agent()
    if headers:
        request_headers.update(headers)
    
    # Handle Query Params in URL for FlareSolverr
    full_url = url
    if params:
        from urllib.parse import urlencode
        full_url = f"{url}?{urlencode(params)}"

    last_exception = None
    
    for attempt in range(max_retries):
        try:
            if delay_before or attempt > 0:
                add_delay(delay_min, delay_max)
            
            logger.info(f"GET {url} (attempt {attempt + 1}/{max_retries})")
            
            # --- STRATEGY 1: FLARESOLVERR ---
            if FLARESOLVERR_URL:
                try:
                    payload = {
                        "cmd": "request.get",
                        "url": full_url,
                        "maxTimeout": timeout * 1000,
                        "headers": request_headers
                    }
                    fs_resp = session.post(
                        FLARESOLVERR_URL,
                        json=payload,
                        headers={"Content-Type": "application/json"},
                        timeout=timeout + 5
                    )
                    
                    if fs_resp.status_code == 200:
                        json_resp = fs_resp.json()
                        if json_resp.get("status") == "ok":
                            return MockResponse(json_resp)
                        else:
                            logger.warning(f"FlareSolverr error: {json_resp.get('message')}")
                            # If FlareSolverr fails, we might want to fallback or retry
                    else:
                        logger.warning(f"FlareSolverr HTTP {fs_resp.status_code}")

                except Exception as e:
                    logger.error(f"FlareSolverr request failed: {e}")
                    # Fallback to direct request logic below if you want mixed mode,
                    # but usually if FS is configured, we rely on it.
                    pass

            # --- STRATEGY 2: DIRECT (Cloudscraper/Requests) ---
            # If FlareSolverr is not configured OR if it failed (optional fallback)
            # For now, if FS is set, we strictly use it to avoid leaking IP? 
            # Actually, let's fallback only if FS is NOT configured.
            
            if not FLARESOLVERR_URL:
                response = session.get(
                    url,
                    params=params,
                    headers=request_headers,
                    timeout=timeout
                )
                
                # Check blocks
                if response.status_code in [403, 503, 429]:
                    text = response.text.lower()
                    if "cloudflare" in text or "challenge" in text:
                        logger.warning(f"Got {response.status_code} Cloudflare Block")
                        if attempt < max_retries - 1:
                            time.sleep((BACKOFF_FACTOR ** attempt) * 5)
                            continue
                
                return response
            
            # If we are here, FS was used but failed/retried.
            if attempt < max_retries - 1:
                logger.info("Retrying...")
                continue

        except Exception as e:
            last_exception = e
            logger.error(f"Request failed: {e}")
            if attempt < max_retries - 1:
                time.sleep((BACKOFF_FACTOR ** attempt) * 3)
    
    raise last_exception or Exception(f"All retries failed for {url}")


# Shared session
_shared_session = None

def get_shared_session() -> Any:
    global _shared_session
    if _shared_session is None:
        _shared_session = create_session()
    return _shared_session

def reset_shared_session():
    global _shared_session
    _shared_session = None

def get(url: str, params: Optional[Dict] = None, **kwargs) -> Any:
    return get_with_retry(get_shared_session(), url, params=params, **kwargs)
