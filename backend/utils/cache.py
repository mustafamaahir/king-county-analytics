"""
cache.py
In-memory store for all pre-computed ML results.
Pipelines write here at startup. Routes read from here at request time.
No ML runs during a user request — only cached JSON is served.
"""

from typing import Any, Dict

# Single global dict — lives in memory for the lifetime of the server process
_cache: Dict[str, Any] = {}


def set_result(key: str, value: Any) -> None:
    """Store a computed result by key."""
    _cache[key] = value


def get_result(key: str) -> Any:
    """
    Retrieve a stored result.
    Returns None if the key does not exist (server still warming up).
    """
    return _cache.get(key, None)


def is_ready(key: str) -> bool:
    """Check whether a pipeline result has been stored."""
    return key in _cache


def all_keys() -> list:
    """List all keys currently in cache — used by /health endpoint."""
    return list(_cache.keys())
