import asyncio
import os
import json
from pathlib import Path
from dotenv import load_dotenv
import httpx
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv(Path(__file__).parent / '.env')

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'merabazaar')
SUPABASE_URL = os.environ['SUPABASE_URL']
SUPABASE_KEY = os.environ['SUPABASE_KEY'] or os.environ['SUPABASE_SECRET_KEY']

HEADERS = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Content-Type': 'application/json',
    'Prefer': 'resolution=merge-duplicates,return=minimal',
}

async def fetch_mongo_collection(collection: str):
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    docs = []
    async for doc in db[collection].find({}, {'_id': 0}):
        docs.append(doc)
    client.close()
    return docs

async def push_to_supabase(table: str, rows: list[dict]):
    if not rows:
        return
    url = f"{SUPABASE_URL.rstrip('/')}/rest/v1/{table}"
    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(url, headers=HEADERS, json=rows)
        resp.raise_for_status()
        print(f'Pushed {len(rows)} rows to {table}')

async def main():
    collections = ['users', 'listings', 'activity_log', 'otp_store', 'login_attempts', 'mirror_events']
    for name in collections:
        rows = await fetch_mongo_collection(name)
        if rows:
            await push_to_supabase(name, rows)
        else:
            print(f'No rows found in {name}')

if __name__ == '__main__':
    asyncio.run(main())
