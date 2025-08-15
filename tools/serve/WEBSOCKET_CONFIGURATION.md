# WebSocket Configuration Handling

## Problem Description

The WebSocket server configuration had an issue where `WebSocketDaemon` would attempt to spawn even when the `ws_doc_root` parameter was explicitly set to `null`, leading to potential configuration and spawning failures.

## Root Cause Analysis

1. **Configuration Issue**: When `ws_doc_root` was explicitly set to `null` in configuration files, the system would still attempt to start WebSocket servers
2. **Missing Validation**: No validation was performed to check if the WebSocket document root path existed or was properly configured
3. **Graceful Failure**: The system lacked graceful handling for cases where WebSocket configuration was incomplete

## Solution Implementation

### Approach: Conditional Spawning Logic

The solution implements **conditional spawning logic** that provides robust handling while maintaining backward compatibility.

### Key Changes

#### 1. Enhanced Configuration Handling (`_get_ws_doc_root`)

```python
def _get_ws_doc_root(self, data):
    # Handle explicit null configuration
    if data["ws_doc_root"] is None:
        # Return None to indicate no WebSocket handlers should be loaded
        # This allows the server startup functions to handle this gracefully
        return None
    elif data["ws_doc_root"] is not None:
        return data["ws_doc_root"]
    else:
        # Fallback to default path when ws_doc_root is not specified
        return os.path.join(data["doc_root"], "websockets", "handlers")
```

#### 2. Validation in WebSocket Server Startup Functions

**`start_ws_server`** and **`start_wss_server`** now include:

- **Configuration Validation**: Check if `ws_doc_root` is configured
- **Path Validation**: Verify the configured path exists
- **Graceful Logging**: Provide clear warning messages
- **Conditional Return**: Return `None` when configuration is invalid

```python
def start_ws_server(logger, host, port, paths, routes, bind_address, config, **kwargs):
    # Validate ws_doc_root configuration before attempting to spawn WebSocketDaemon
    ws_doc_root = config.paths.get("ws_doc_root")
    
    if ws_doc_root is None:
        logger.warning("WebSocket server not started: ws_doc_root is not configured")
        return None
    
    # Validate that the ws_doc_root path exists
    if not os.path.exists(ws_doc_root):
        logger.warning(f"WebSocket server not started: ws_doc_root path does not exist: {ws_doc_root}")
        return None
    
    # ... rest of implementation
```

#### 3. Enhanced Server Process Handling

The `create_daemon` method in `ServerProc` now handles `None` returns:

```python
# Handle case where WebSocket servers return None due to configuration issues
if self.daemon is None:
    logger.info(f"Server {self.scheme} on port {port} was not started due to configuration issues")
    return
```

## Configuration Scenarios

### 1. Explicit Null Configuration
```json
{
  "ws_doc_root": null
}
```
**Behavior**: WebSocket servers will not start, with clear warning messages.

### 2. Missing Configuration
```json
{
  // ws_doc_root not specified
}
```
**Behavior**: Uses default path `{doc_root}/websockets/handlers`.

### 3. Valid Configuration
```json
{
  "ws_doc_root": "./websockets/handlers"
}
```
**Behavior**: WebSocket servers start normally if path exists.

### 4. Invalid Path Configuration
```json
{
  "ws_doc_root": "/nonexistent/path"
}
```
**Behavior**: WebSocket servers will not start, with path validation warning.

## Benefits

1. **Fail-Safe Operation**: System continues to function even with invalid WebSocket configuration
2. **Clear Feedback**: Users receive informative warning messages about configuration issues
3. **Backward Compatibility**: Existing configurations continue to work without changes
4. **Predictable Behavior**: Consistent handling across different configuration scenarios
5. **Graceful Degradation**: HTTP/HTTPS servers continue to function even when WebSocket servers fail to start

## Testing

A test configuration file `config.test-null-ws.json` has been created to demonstrate the null configuration scenario:

```bash
# Test with null ws_doc_root configuration
python serve.py --config tools/wave/config.test-null-ws.json
```

## Migration Guide

### For Existing Users

No changes required. The solution maintains full backward compatibility.

### For New Configurations

- **To disable WebSocket servers**: Set `"ws_doc_root": null`
- **To use default path**: Omit `ws_doc_root` from configuration
- **To use custom path**: Set `"ws_doc_root": "/path/to/handlers"`

## Error Messages

The system now provides clear, actionable error messages:

- `"WebSocket server not started: ws_doc_root is not configured"`
- `"WebSocket server not started: ws_doc_root path does not exist: {path}"`
- `"Server {scheme} on port {port} was not started due to configuration issues"`

## Future Considerations

1. **Configuration Validation**: Consider adding comprehensive configuration validation at startup
2. **Documentation**: Update user documentation to explain WebSocket configuration options
3. **Monitoring**: Add metrics/logging for WebSocket server startup success/failure rates
4. **Testing**: Expand test coverage for various configuration scenarios

