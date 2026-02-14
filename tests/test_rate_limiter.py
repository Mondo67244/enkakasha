import sys
import os
import unittest
import time
import asyncio
from unittest.mock import MagicMock
from fastapi import HTTPException

# Add Website to path so we can import backend.api
sys.path.append(os.path.join(os.getcwd(), 'Website'))

from backend.api import RateLimiter

class TestRateLimiter(unittest.TestCase):
    def setUp(self):
        self.limiter = RateLimiter(limit=2, window=1) # 2 requests per 1 second

    def test_rate_limiter_allow(self):
        request = MagicMock()
        request.client.host = "127.0.0.1"

        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        # 1st request
        loop.run_until_complete(self.limiter(request))
        # 2nd request
        loop.run_until_complete(self.limiter(request))

        loop.close()

    def test_rate_limiter_block(self):
        request = MagicMock()
        request.client.host = "127.0.0.1"

        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        # 1st request
        loop.run_until_complete(self.limiter(request))
        # 2nd request
        loop.run_until_complete(self.limiter(request))

        # 3rd request should fail
        with self.assertRaises(HTTPException) as cm:
            loop.run_until_complete(self.limiter(request))

        self.assertEqual(cm.exception.status_code, 429)
        self.assertEqual(cm.exception.detail, "Rate limit exceeded. Please try again later.")

        loop.close()

    def test_rate_limiter_reset(self):
        request = MagicMock()
        request.client.host = "127.0.0.1"

        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        # 1st request
        loop.run_until_complete(self.limiter(request))
        # 2nd request
        loop.run_until_complete(self.limiter(request))

        # Wait for window to expire
        time.sleep(1.1)

        # 3rd request should succeed now
        loop.run_until_complete(self.limiter(request))

        loop.close()

    def test_rate_limiter_multiple_clients(self):
        req1 = MagicMock()
        req1.client.host = "127.0.0.1"

        req2 = MagicMock()
        req2.client.host = "192.168.1.1"

        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        # Client 1 uses quota
        loop.run_until_complete(self.limiter(req1))
        loop.run_until_complete(self.limiter(req1))

        # Client 2 should still be allowed
        loop.run_until_complete(self.limiter(req2))

        # Client 1 blocked
        with self.assertRaises(HTTPException):
             loop.run_until_complete(self.limiter(req1))

        loop.close()

if __name__ == '__main__':
    unittest.main()
