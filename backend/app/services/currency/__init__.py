"""Currency conversion modules.

This package implements a production-ready currency conversion flow using
Frankfurter API v2.

It is intentionally organized into small, testable units:
- provider (HTTP fetch + response parsing)
- cache (TTL + persistence)
- converter (pure conversion logic)
- service (orchestration + logging + safe fallbacks)
"""

