
import sys
import os
import unittest
import time
from unittest.mock import MagicMock, patch
from collections import defaultdict
from fastapi import Request, HTTPException

# Ensure Website is in path
sys.path.append(os.path.join(os.getcwd(), 'Website'))

from backend.api import RateLimiter, limiter_analyze, limiter_chat, limiter_scan, limiter_auth, app

class TestRateLimiter(unittest.IsolatedAsyncioTestCase):
    async def test_rate_limiter_logic(self):
        # Limit 5 requests in 60 seconds
        limiter = RateLimiter(requests_limit=5, time_window=60)

        # Mock Request
        mock_request = MagicMock(spec=Request)
        mock_request.client.host = "127.0.0.1"

        # 5 calls should pass
        for _ in range(5):
            await limiter(mock_request)

        # 6th call should fail
        with self.assertRaises(HTTPException) as cm:
            await limiter(mock_request)

        self.assertEqual(cm.exception.status_code, 429)

    async def test_rate_limiter_window_reset(self):
        # Limit 2 requests in 1 second
        limiter = RateLimiter(requests_limit=2, time_window=1)

        mock_request = MagicMock(spec=Request)
        mock_request.client.host = "127.0.0.1"

        # 2 calls pass
        await limiter(mock_request)
        await limiter(mock_request)

        # 3rd fails
        with self.assertRaises(HTTPException):
            await limiter(mock_request)

        # Wait > 1 second
        time.sleep(1.1)

        # Should pass again
        await limiter(mock_request)

class TestApiIntegration(unittest.TestCase):
    def setUp(self):
        from fastapi.testclient import TestClient
        self.client = TestClient(app)

    @patch('backend.api.call_ai')
    @patch('backend.logic.prepare_inventory')
    @patch('backend.logic.prepare_context')
    def test_analyze_endpoint_rate_limit(self, mock_ai, mock_inv, mock_ctx):
        # Setup mocks
        mock_inv.return_value = ({"target_set": "TestSet", "pool": []}, None)
        mock_ctx.return_value = "Summary"
        mock_ai.return_value = "Analysis"

        payload = {
            "user_data": [{"stats": {"Character": "TestChar"}, "artifacts": []}],
            "target_char": "TestChar",
            "provider": "ollama"
        }

        # Clear global limiter state
        limiter_analyze.ip_requests.clear()

        # 5 calls OK
        for i in range(5):
            response = self.client.post("/analyze", json=payload)
            # We verify it's NOT 429. It might be 500 if other logic fails, but as long as it's not rate limited.
            self.assertNotEqual(response.status_code, 429, f"Failed at call {i+1}")

        # 6th call FAIL
        response = self.client.post("/analyze", json=payload)
        self.assertEqual(response.status_code, 429)

    def test_verify_key_rate_limit(self):
        limiter_auth.ip_requests.clear()

        payload = {"api_key": "dummy"}

        with patch('google.genai.Client') as MockClient:
            instance = MockClient.return_value
            instance.models.generate_content.return_value = MagicMock()

            for i in range(10):
                response = self.client.post("/verify_key", json=payload)
                self.assertNotEqual(response.status_code, 429, f"Failed at call {i+1}")

            response = self.client.post("/verify_key", json=payload)
            self.assertEqual(response.status_code, 429)

if __name__ == '__main__':
    unittest.main()
