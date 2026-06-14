import json
import os
import time
from typing import Any, List, Optional

_memory_cache: dict[str, tuple[float, Any]] = {}
_redis_client = None


def _get_redis():
    global _redis_client
    if _redis_client is not None:
        return _redis_client
    redis_url = os.getenv("REDIS_URL", "redis://127.0.0.1:6379/0")
    try:
        import redis
        client = redis.from_url(redis_url, decode_responses=True, socket_connect_timeout=1)
        client.ping()
        _redis_client = client
        print(f"[CatalogCache] Connected to Redis at {redis_url}")
    except Exception as e:
        print(f"[CatalogCache] Redis unavailable ({e}); using in-memory cache")
        _redis_client = False
    return _redis_client


def get_catalog(cache_key: str = "secondlife:catalog") -> Optional[List[dict]]:
    client = _get_redis()
    if client and client is not False:
        try:
            raw = client.get(cache_key)
            if raw:
                return json.loads(raw)
        except Exception as e:
            print(f"[CatalogCache] Redis read failed: {e}")

    entry = _memory_cache.get(cache_key)
    if entry and entry[0] > time.time():
        return entry[1]
    return None


def set_catalog(items: List[dict], ttl_seconds: int = 3600, cache_key: str = "secondlife:catalog") -> None:
    client = _get_redis()
    payload = json.dumps(items)
    if client and client is not False:
        try:
            client.setex(cache_key, ttl_seconds, payload)
            return
        except Exception as e:
            print(f"[CatalogCache] Redis write failed: {e}")
    _memory_cache[cache_key] = (time.time() + ttl_seconds, items)
