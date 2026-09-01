#!/usr/bin/env python3
"""
Test script for WebSocket configuration handling.

This script tests the enhanced WebSocket configuration handling to ensure
that the system properly handles null ws_doc_root configurations.
"""

import json
import os
import sys
import tempfile
import unittest
from unittest.mock import patch, MagicMock

# Add the parent directory to the path so we can import serve modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from serve import ConfigBuilder, start_ws_server, start_wss_server


class TestWebSocketConfiguration(unittest.TestCase):
    """Test cases for WebSocket configuration handling."""

    def setUp(self):
        """Set up test fixtures."""
        self.logger = MagicMock()
        self.host = "localhost"
        self.port = 8080
        self.paths = {"doc_root": "/tmp/test"}
        self.routes = {}
        self.bind_address = True
        self.config = MagicMock()

    def test_null_ws_doc_root_configuration(self):
        """Test that null ws_doc_root is handled gracefully."""
        # Mock config with null ws_doc_root
        self.config.paths = {"ws_doc_root": None, "ws_extra": None}
        
        # Test start_ws_server with null configuration
        result = start_ws_server(
            self.logger, self.host, self.port, self.paths, 
            self.routes, self.bind_address, self.config
        )
        
        # Should return None and log warning
        self.assertIsNone(result)
        self.logger.warning.assert_called_with(
            "WebSocket server not started: ws_doc_root is not configured"
        )

    def test_nonexistent_ws_doc_root_path(self):
        """Test that nonexistent ws_doc_root path is handled gracefully."""
        # Mock config with nonexistent path
        self.config.paths = {"ws_doc_root": "/nonexistent/path", "ws_extra": None}
        
        # Test start_ws_server with invalid path
        result = start_ws_server(
            self.logger, self.host, self.port, self.paths, 
            self.routes, self.bind_address, self.config
        )
        
        # Should return None and log warning
        self.assertIsNone(result)
        self.logger.warning.assert_called_with(
            "WebSocket server not started: ws_doc_root path does not exist: /nonexistent/path"
        )

    def test_valid_ws_doc_root_configuration(self):
        """Test that valid ws_doc_root configuration works normally."""
        # Create a temporary directory for testing
        with tempfile.TemporaryDirectory() as temp_dir:
            # Mock config with valid path
            self.config.paths = {"ws_doc_root": temp_dir, "ws_extra": None}
            
            # Mock the WebSocketDaemon to avoid actual server creation
            with patch('serve.WebSocketDaemon') as mock_daemon:
                mock_instance = MagicMock()
                mock_daemon.return_value = mock_instance
                
                # Test start_ws_server with valid configuration
                result = start_ws_server(
                    self.logger, self.host, self.port, self.paths, 
                    self.routes, self.bind_address, self.config
                )
                
                # Should return the daemon instance
                self.assertEqual(result, mock_instance)
                mock_daemon.assert_called_once()

    def test_wss_server_null_configuration(self):
        """Test that WSS server handles null configuration gracefully."""
        # Mock config with null ws_doc_root
        self.config.paths = {"ws_doc_root": None, "ws_extra": None}
        
        # Test start_wss_server with null configuration
        result = start_wss_server(
            self.logger, self.host, self.port, self.paths, 
            self.routes, self.bind_address, self.config
        )
        
        # Should return None and log warning
        self.assertIsNone(result)
        self.logger.warning.assert_called_with(
            "WebSocket Secure server not started: ws_doc_root is not configured"
        )

    def test_config_builder_get_ws_doc_root(self):
        """Test ConfigBuilder._get_ws_doc_root method."""
        config_builder = ConfigBuilder(self.logger)
        
        # Test with explicit null
        data = {"ws_doc_root": None, "doc_root": "/tmp"}
        result = config_builder._get_ws_doc_root(data)
        self.assertIsNone(result)
        
        # Test with valid path
        data = {"ws_doc_root": "/valid/path", "doc_root": "/tmp"}
        result = config_builder._get_ws_doc_root(data)
        self.assertEqual(result, "/valid/path")
        
        # Test with missing ws_doc_root (should use default)
        data = {"doc_root": "/tmp"}
        result = config_builder._get_ws_doc_root(data)
        self.assertEqual(result, os.path.join("/tmp", "websockets", "handlers"))

    def test_config_builder_get_paths(self):
        """Test ConfigBuilder._get_paths method."""
        config_builder = ConfigBuilder(self.logger)
        
        # Mock the parent class method
        with patch.object(config_builder.__class__.__bases__[0], '_get_paths') as mock_parent:
            mock_parent.return_value = {}
            
            data = {"ws_doc_root": "/test/path", "ws_extra": ["/extra/path"]}
            result = config_builder._get_paths(data)
            
            self.assertEqual(result["ws_doc_root"], "/test/path")
            self.assertEqual(result["ws_extra"], ["/extra/path"])


def create_test_config_files():
    """Create test configuration files for manual testing."""
    test_configs = {
        "config_null_ws.json": {
            "browser_host": "web-platform.test",
            "doc_root": ".",
            "ws_doc_root": None,
            "ports": {
                "http": [8000, "auto"],
                "ws": ["auto"],
                "wss": ["auto"]
            }
        },
        "config_missing_ws.json": {
            "browser_host": "web-platform.test",
            "doc_root": ".",
            "ports": {
                "http": [8000, "auto"],
                "ws": ["auto"],
                "wss": ["auto"]
            }
        },
        "config_invalid_path.json": {
            "browser_host": "web-platform.test",
            "doc_root": ".",
            "ws_doc_root": "/nonexistent/path",
            "ports": {
                "http": [8000, "auto"],
                "ws": ["auto"],
                "wss": ["auto"]
            }
        }
    }
    
    for filename, config in test_configs.items():
        with open(filename, 'w') as f:
            json.dump(config, f, indent=2)
        print(f"Created test config: {filename}")


if __name__ == "__main__":
    # Create test configuration files
    create_test_config_files()
    
    # Run tests
    unittest.main(verbosity=2)
