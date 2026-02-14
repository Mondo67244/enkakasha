
import sys
import os
import unittest
from unittest.mock import MagicMock, patch
import pandas as pd

# Add Website to path so we can import akasha
sys.path.insert(0, os.path.join(os.getcwd(), 'Website'))

import akasha

class TestAkashaPathTraversal(unittest.TestCase):

    @patch('akasha.http_client')
    @patch('pandas.DataFrame.to_csv')
    def test_path_traversal_sanitization(self, mock_to_csv, mock_http_client):
        # Mock session
        mock_session = MagicMock()
        mock_http_client.create_session.return_value = mock_session

        # Mock response data with malicious name
        malicious_name = "../VULNERABLE"
        expected_safe_filename = "vulnerable_dataset.csv"

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "data": [
                {
                    "name": malicious_name,
                    "index": 1,
                    "stats": {
                         "maxHp": {"value": 10000},
                         "atk": {"value": 2000},
                         "def": {"value": 1000},
                         "elementalMastery": {"value": 100},
                         "energyRecharge": {"value": 1.5},
                         "critRate": {"value": 0.5},
                         "critDamage": {"value": 1.0}
                    },
                    "owner": {"nickname": "Attacker"},
                    "weapon": {"name": "Weapon"},
                    "Calculation": {"result": 10000}
                }
            ]
        }

        mock_http_client.get_with_retry.return_value = mock_response

        # Run the function
        print("Running akasha.fetch_leaderboard with malicious input...")
        akasha.fetch_leaderboard("123", limit=1)

        # Assertions
        # Verify to_csv was called exactly once with the expected safe filename
        mock_to_csv.assert_called_once()
        args, kwargs = mock_to_csv.call_args
        filename = args[0]

        print(f"File saved to: {filename}")
        self.assertEqual(filename, expected_safe_filename,
                         f"Path traversal detected or sanitization failed! Expected {expected_safe_filename}, got {filename}")

        # Ensure path traversal characters are gone
        self.assertNotIn("..", filename)
        self.assertNotIn("/", filename)

if __name__ == '__main__':
    unittest.main()
