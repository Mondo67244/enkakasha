"""
HTTP Client Module - Cloudflare Bypass Optimized
=================================================
Centralized HTTP client for all API requests with:
- Cloudscraper with optimal configuration
- Rotating User-Agents
- Random delays between requests
- Retry logic with exponential backoff
"""

import random
import time
import logging
from typing import Optional, Dict, Any

try:
    import cloudscraper
    HAS_CLOUDSCRAPER = True
except ImportError:
    import requests
    HAS_CLOUDSCRAPER = False
    logging.warning("cloudscraper not installed, falling back to requests (may be blocked by Cloudflare)")

# Logging configuration
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Modern, realistic User-Agent strings (updated 2024)
USER_AGENTS = [
    # Chrome on Windows
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    # Chrome on Mac
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    # Firefox on Windows
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
    # Chrome on Linux
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    # Edge on Windows
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36 Edg/121.0.0.0",
    # Safari on Mac
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
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
DEFAULT_TIMEOUT = 30
DEFAULT_DELAY_MIN = 1.0  # seconds
DEFAULT_DELAY_MAX = 3.0  # seconds
MAX_RETRIES = 3
BACKOFF_FACTOR = 2  # Exponential backoff multiplier


def get_random_user_agent() -> str:
    """Returns a random User-Agent string."""
    return random.choice(USER_AGENTS)


def create_session(
    browser: str = 'chrome',
    platform: str = 'windows',
    use_nodejs: bool = True
) -> Any:
    """
    Creates an optimized cloudscraper session.
    
    Args:
        browser: Browser to emulate ('chrome', 'firefox')
        platform: Platform to emulate ('windows', 'linux', 'darwin')
        use_nodejs: Use Node.js interpreter for better JS solving
    
    Returns:
        A configured session object (cloudscraper or requests.Session)
    """
    if HAS_CLOUDSCRAPER:
        # Try Node.js interpreter first (more reliable), fallback to native
        interpreter = 'nodejs' if use_nodejs else 'native'
        
        try:
            scraper = cloudscraper.create_scraper(
                browser={
                    'browser': browser,
                    'platform': platform,
                    'desktop': True,
                },
                interpreter=interpreter,
                delay=3,  # Built-in delay for JS challenges
            )
            logger.info(f"Created cloudscraper session (browser={browser}, platform={platform}, interpreter={interpreter})")
            return scraper
        except Exception as e:
            logger.warning(f"Failed to create cloudscraper with {interpreter}: {e}, trying fallback")
            # Fallback to default interpreter
            scraper = cloudscraper.create_scraper(
                browser={
                    'browser': browser,
                    'platform': platform,
                    'desktop': True,
                }
            )
            return scraper
    else:
        # Fallback to standard requests
        import requests
        session = requests.Session()
        session.headers.update({'User-Agent': get_random_user_agent()})
        return session


def add_delay(min_delay: float = DEFAULT_DELAY_MIN, max_delay: float = DEFAULT_DELAY_MAX):
    """Adds a random delay to appear more human-like."""
    delay = random.uniform(min_delay, max_delay)
    logger.debug(f"Sleeping for {delay:.2f}s")
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
    Makes a GET request with retry logic and Cloudflare bypass.
    
    Args:
        session: The session object (cloudscraper or requests.Session)
        url: URL to request
        params: Query parameters
        headers: Additional headers
        timeout: Request timeout in seconds
        max_retries: Maximum number of retry attempts
        add_browser_headers: Whether to add realistic browser headers
        delay_before: Whether to add a delay before the request
        delay_min: Minimum delay in seconds
        delay_max: Maximum delay in seconds
    
    Returns:
        Response object
    
    Raises:
        Exception: If all retries fail
    """
    # Prepare headers
    request_headers = {}
    if add_browser_headers:
        request_headers.update(BROWSER_HEADERS)
    request_headers['User-Agent'] = get_random_user_agent()
    if headers:
        request_headers.update(headers)
    
    last_exception = None
    
    for attempt in range(max_retries):
        try:
            # Add delay before request (except first attempt if no delay_before)
            if delay_before or attempt > 0:
                add_delay(delay_min, delay_max)
            
            logger.info(f"GET {url} (attempt {attempt + 1}/{max_retries})")
            
            response = session.get(
                url,
                params=params,
                headers=request_headers,
                timeout=timeout
            )
            
            # Check for Cloudflare blocks
            if response.status_code == 403 or response.status_code == 503:
                # Check known Cloudflare signatures
                text = response.text.lower()
                if "cloudflare" in text or "just a moment" in text or "challenge" in text:
                    logger.warning(f"Got {response.status_code} - Detected Cloudflare Challenge/Block")
                    if attempt < max_retries - 1:
                        backoff_delay = (BACKOFF_FACTOR ** attempt) * 5
                        logger.info(f"Cloudflare block detected, retrying in {backoff_delay}s...")
                        time.sleep(backoff_delay)
                        continue
                else:
                    # Normal 403/503 from server
                    logger.warning(f"Got {response.status_code} - Server error (not necessarily Cloudflare)")
            
            elif response.status_code == 429:
                logger.warning(f"Got 429 Too Many Requests - rate limited")
                if attempt < max_retries - 1:
                    # Longer backoff for rate limits
                    backoff_delay = (BACKOFF_FACTOR ** attempt) * 10
                    logger.info(f"Rate limited, retrying in {backoff_delay}s...")
                    time.sleep(backoff_delay)
                    continue

            # Return response if successful or status code handled by caller
            # Check content type for JSON if expected
            return response
            
        except Exception as e:
            last_exception = e
            logger.error(f"Request failed: {e}")
            if attempt < max_retries - 1:
                backoff_delay = (BACKOFF_FACTOR ** attempt) * 3
                logger.info(f"Retrying in {backoff_delay}s...")
                time.sleep(backoff_delay)
    
    # All retries failed
    raise last_exception or Exception(f"All {max_retries} retries failed for {url}")


# Pre-create a shared session for reuse
_shared_session = None

def get_shared_session() -> Any:
    """Returns a shared session for efficiency (reuses connections)."""
    global _shared_session
    if _shared_session is None:
        _shared_session = create_session()
    return _shared_session


def reset_shared_session():
    """Resets the shared session (useful if blocked)."""
    global _shared_session
    _shared_session = None
    logger.info("Shared session reset")


# Convenience function for simple GET requests
def get(url: str, params: Optional[Dict] = None, **kwargs) -> Any:
    """Simple GET request using the shared session."""
    session = get_shared_session()
    return get_with_retry(session, url, params=params, **kwargs)
