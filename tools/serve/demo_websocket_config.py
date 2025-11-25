#!/usr/bin/env python3
"""
Demonstration script for WebSocket configuration handling.

This script demonstrates the enhanced WebSocket configuration handling
and shows how different configuration scenarios are handled.
"""

import json
import os
import sys
import tempfile
from pathlib import Path

# Add the parent directory to the path so we can import serve modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from serve import ConfigBuilder


def demonstrate_config_scenarios():
    """Demonstrate different WebSocket configuration scenarios."""
    
    print("=" * 60)
    print("WebSocket Configuration Handling Demonstration")
    print("=" * 60)
    
    # Create a temporary directory for testing
    with tempfile.TemporaryDirectory() as temp_dir:
        logger = None  # We'll use None for this demo
        
        # Scenario 1: Explicit null configuration
        print("\n1. Explicit Null Configuration")
        print("-" * 30)
        config_data = {
            "ws_doc_root": None,
            "doc_root": temp_dir
        }
        config_builder = ConfigBuilder(logger)
        result = config_builder._get_ws_doc_root(config_data)
        print(f"Input: ws_doc_root = null")
        print(f"Output: {result}")
        print(f"Behavior: WebSocket servers will not start")
        
        # Scenario 2: Missing configuration (uses default)
        print("\n2. Missing Configuration (Uses Default)")
        print("-" * 40)
        config_data = {
            "doc_root": temp_dir
        }
        config_builder = ConfigBuilder(logger)
        result = config_builder._get_ws_doc_root(config_data)
        print(f"Input: ws_doc_root not specified")
        print(f"Output: {result}")
        print(f"Behavior: Uses default path {result}")
        
        # Scenario 3: Valid configuration
        print("\n3. Valid Configuration")
        print("-" * 20)
        config_data = {
            "ws_doc_root": temp_dir,
            "doc_root": "/some/other/path"
        }
        config_builder = ConfigBuilder(logger)
        result = config_builder._get_ws_doc_root(config_data)
        print(f"Input: ws_doc_root = {temp_dir}")
        print(f"Output: {result}")
        print(f"Behavior: WebSocket servers will start normally")
        
        # Scenario 4: Invalid path configuration
        print("\n4. Invalid Path Configuration")
        print("-" * 30)
        config_data = {
            "ws_doc_root": "/nonexistent/path",
            "doc_root": temp_dir
        }
        config_builder = ConfigBuilder(logger)
        result = config_builder._get_ws_doc_root(config_data)
        print(f"Input: ws_doc_root = /nonexistent/path")
        print(f"Output: {result}")
        print(f"Behavior: WebSocket servers will not start (path validation will fail)")


def create_demo_config_files():
    """Create demonstration configuration files."""
    
    print("\n" + "=" * 60)
    print("Creating Demo Configuration Files")
    print("=" * 60)
    
    demo_configs = {
        "demo_null_ws.json": {
            "browser_host": "web-platform.test",
            "doc_root": ".",
            "ws_doc_root": None,
            "server_host": None,
            "ports": {
                "http": [8000, "auto"],
                "https": [8443],
                "ws": ["auto"],
                "wss": ["auto"]
            },
            "check_subdomains": True,
            "log_level": "debug",
            "bind_address": True
        },
        "demo_default_ws.json": {
            "browser_host": "web-platform.test",
            "doc_root": ".",
            "server_host": None,
            "ports": {
                "http": [8000, "auto"],
                "https": [8443],
                "ws": ["auto"],
                "wss": ["auto"]
            },
            "check_subdomains": True,
            "log_level": "debug",
            "bind_address": True
        },
        "demo_custom_ws.json": {
            "browser_host": "web-platform.test",
            "doc_root": ".",
            "ws_doc_root": "./websockets/handlers",
            "server_host": None,
            "ports": {
                "http": [8000, "auto"],
                "https": [8443],
                "ws": ["auto"],
                "wss": ["auto"]
            },
            "check_subdomains": True,
            "log_level": "debug",
            "bind_address": True
        }
    }
    
    for filename, config in demo_configs.items():
        with open(filename, 'w') as f:
            json.dump(config, f, indent=2)
        print(f"✓ Created: {filename}")
    
    print(f"\nDemo files created in: {os.getcwd()}")


def show_usage_examples():
    """Show usage examples for the enhanced configuration."""
    
    print("\n" + "=" * 60)
    print("Usage Examples")
    print("=" * 60)
    
    print("\n1. Disable WebSocket servers:")
    print("   Set ws_doc_root to null in your config file:")
    print("   {")
    print('     "ws_doc_root": null')
    print("   }")
    
    print("\n2. Use default WebSocket handlers:")
    print("   Omit ws_doc_root from your config file or set to default path:")
    print("   {")
    print('     "ws_doc_root": "./websockets/handlers"')
    print("   }")
    
    print("\n3. Use custom WebSocket handlers:")
    print("   Set ws_doc_root to your custom path:")
    print("   {")
    print('     "ws_doc_root": "/path/to/your/websocket/handlers"')
    print("   }")
    
    print("\n4. Command line usage:")
    print("   python serve.py --config demo_null_ws.json")
    print("   python serve.py --config demo_default_ws.json")
    print("   python serve.py --config demo_custom_ws.json")


def show_error_messages():
    """Show the error messages that users will see."""
    
    print("\n" + "=" * 60)
    print("Error Messages")
    print("=" * 60)
    
    print("\nWhen ws_doc_root is null:")
    print("  WARNING: WebSocket server not started: ws_doc_root is not configured")
    print("  WARNING: WebSocket Secure server not started: ws_doc_root is not configured")
    
    print("\nWhen ws_doc_root path doesn't exist:")
    print("  WARNING: WebSocket server not started: ws_doc_root path does not exist: /nonexistent/path")
    print("  WARNING: WebSocket Secure server not started: ws_doc_root path does not exist: /nonexistent/path")
    
    print("\nWhen server process handles None return:")
    print("  INFO: Server ws on port 8080 was not started due to configuration issues")
    print("  INFO: Server wss on port 8443 was not started due to configuration issues")


def main():
    """Main demonstration function."""
    
    print("WebSocket Configuration Enhancement Demo")
    print("This demo shows how the enhanced WebSocket configuration handling works.")
    
    # Demonstrate different scenarios
    demonstrate_config_scenarios()
    
    # Create demo configuration files
    create_demo_config_files()
    
    # Show usage examples
    show_usage_examples()
    
    # Show error messages
    show_error_messages()
    
    print("\n" + "=" * 60)
    print("Demo Complete!")
    print("=" * 60)
    print("\nKey Benefits:")
    print("✓ Fail-safe operation with invalid configurations")
    print("✓ Clear, informative error messages")
    print("✓ Backward compatibility with existing configs")
    print("✓ Graceful degradation when WebSocket servers can't start")
    print("✓ Predictable behavior across different scenarios")


if __name__ == "__main__":
    main()
