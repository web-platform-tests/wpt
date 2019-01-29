# Welcome to the idle detection test suite!

To run the manual tests locally:

```
third_party/blink/tools/run_blink_wptserve.py
out/Default/content_shell
    --enable-blink-features=IdleDetection
    http://localhost:8001/idle-detection/idle.manual.html
```
