import asyncio
import os
import sys
from pathlib import Path
from unittest.mock import AsyncMock

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import server


def test_seed_users_uses_supabase_helpers_when_supabase_enabled(monkeypatch):
    monkeypatch.setenv("ADMIN_EMAIL", "admin@example.com")
    monkeypatch.setenv("ADMIN_PASSWORD", "Admin123!")
    monkeypatch.setenv("SELLER_EMAIL", "seller@example.com")
    monkeypatch.setenv("SELLER_PASSWORD", "Seller123!")
    monkeypatch.setattr(server, "USE_SUPABASE", True)
    monkeypatch.setattr(server, "db", None)

    db_find_one = AsyncMock(return_value=None)
    db_insert_one = AsyncMock(return_value=None)
    monkeypatch.setattr(server, "db_find_one", db_find_one)
    monkeypatch.setattr(server, "db_insert_one", db_insert_one)

    asyncio.run(server.seed_users())

    assert db_find_one.await_count >= 2
    assert db_insert_one.await_count >= 2
