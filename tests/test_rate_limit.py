import unittest
from unittest.mock import MagicMock, patch
import sys
import os
import asyncio
from fastapi import HTTPException

# Add Website/backend to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../Website/backend')))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../Website')))

# Import RateLimiter from api
try:
    from api import RateLimiter
except ImportError:
    # If backend/api.py cannot be imported due to relative imports inside it (like 'from backend import logic')
    # We might need to adjust sys.path or mock imports.
    # Given 'api.py' does 'from backend import logic', we need 'Website' in sys.path (which we added).
    # But we also need to make sure 'api' is importable.
    # Since we added 'Website/backend' to sys.path, 'import api' works.
    pass
from api import RateLimiter

class TestRateLimiter(unittest.TestCase):
    def setUp(self):
        self.limiter = RateLimiter(requests_limit=2, time_window=60)
        self.mock_request = MagicMock()
        self.mock_request.client.host = "127.0.0.1"

    def test_limit_enforced(self):
        async def run_test():
            # First request - should pass
            await self.limiter(self.mock_request)

            # Second request - should pass
            await self.limiter(self.mock_request)

            # Third request - should fail
            with self.assertRaises(HTTPException) as cm:
                await self.limiter(self.mock_request)
            self.assertEqual(cm.exception.status_code, 429)

        asyncio.run(run_test())

    @patch('time.time')
    def test_full_cycle(self, mock_time):
        async def run_test():
            # Initial time
            mock_time.return_value = 1000

            # 2 requests allowed
            await self.limiter(self.mock_request)
            await self.limiter(self.mock_request)

            # 3rd fails
            with self.assertRaises(HTTPException):
                await self.limiter(self.mock_request)

            # Advance time by 61 seconds (beyond window)
            mock_time.return_value = 1061

            # Should pass now (old requests expired)
            await self.limiter(self.mock_request)

        asyncio.run(run_test())

    def test_multiple_ips(self):
        async def run_test():
            req1 = MagicMock()
            req1.client.host = "1.1.1.1"

            req2 = MagicMock()
            req2.client.host = "2.2.2.2"

            # Exhaust IP 1
            await self.limiter(req1)
            await self.limiter(req1)

            with self.assertRaises(HTTPException):
                await self.limiter(req1)

            # IP 2 should still be fresh
            await self.limiter(req2)
            await self.limiter(req2)

        asyncio.run(run_test())

if __name__ == '__main__':
    unittest.main()
