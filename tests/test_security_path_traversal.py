
import sys
import os
import unittest
from unittest.mock import MagicMock, patch
from pathlib import Path

# Add Website to path so we can import enka
sys.path.append(os.path.join(os.getcwd(), 'Website'))

import enka

class TestPathTraversal(unittest.TestCase):
    @patch('enka.http_client.create_session')
    @patch('enka.http_client.get_with_retry')
    def test_path_traversal_uid(self, mock_get, mock_create_session):
        # Mock create_session to return a dummy session
        mock_create_session.return_value = MagicMock()

        # Mock a successful response (though we expect it NOT to be called)
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "playerInfo": {"nickname": "TestPlayer", "level": 60},
            "avatarInfoList": []
        }
        mock_get.return_value = mock_response

        malicious_uid = "../malicious_uid"
        output_root = Path("./test_data")

        # Call fetch_player_data with malicious UID
        # We expect it to return (None, "Invalid UID format") and NOT make any HTTP request

        # Mock file operations just in case it slips through (though it shouldn't)
        with patch('builtins.open', unittest.mock.mock_open()), \
             patch('os.makedirs'), \
             patch('pathlib.Path.mkdir'), \
             patch('pandas.DataFrame.to_csv'):

            result, error = enka.fetch_player_data(malicious_uid, output_root=output_root)

        # Assertions for SECURE behavior
        self.assertIsNone(result, "Result should be None for invalid UID")
        self.assertEqual(error, "Invalid UID format", "Error message should match")

        # Verify that get_with_retry was NOT called (preventing any network request)
        mock_get.assert_not_called()

if __name__ == '__main__':
    unittest.main()
