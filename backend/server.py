from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import re
import uuid
import logging
import bcrypt
import httpx
import jwt
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Literal

from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response, Query
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr

# ---------------------------------------------------------------------------
# DB
# ---------------------------------------------------------------------------
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY") or os.environ.get("SUPABASE_SECRET_KEY")
SUPABASE_API = f"{SUPABASE_URL.rstrip('/')}/rest/v1" if SUPABASE_URL else None
SUPABASE_HEADERS = {
    "apikey": SUPABASE_KEY or "",
    "Authorization": f"Bearer {SUPABASE_KEY}" if SUPABASE_KEY else "",
    "Content-Type": "application/json",
}
USE_SUPABASE = bool(SUPABASE_API and SUPABASE_KEY)

if USE_SUPABASE:
    client = None
    db = None
else:
    mongo_url = os.environ["MONGO_URL"]
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ["DB_NAME"]]

async def supabase_request(method: str, path: str, json=None, params: dict | None = None, prefer_representation: bool = False, timeout: int = 30):
    if not SUPABASE_API or not SUPABASE_KEY:
        raise RuntimeError("Supabase is not configured. Set SUPABASE_URL and SUPABASE_KEY.")
    url = path if path.startswith("http") else f"{SUPABASE_API}/{path.lstrip('/') }"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
    if prefer_representation:
        headers["Prefer"] = "return=representation"
    async with httpx.AsyncClient(timeout=timeout) as client:
        resp = await client.request(method, url, headers=headers, params=params, json=json)
    if resp.status_code >= 400:
        raise HTTPException(status_code=resp.status_code, detail=f"Supabase error: {resp.text}")
    if resp.status_code == 204 or not resp.text:
        return None
    return resp.json()

async def supabase_select(table: str, filters: dict | None = None, extra_params: dict | None = None):
    params = {"select": "*"}
    if filters:
        params.update(filters)
    if extra_params:
        params.update(extra_params)
    return await supabase_request("GET", table, params=params)

async def supabase_get_one(table: str, filters: dict | None = None):
    rows = await supabase_select(table, filters, {"limit": "1"})
    return rows[0] if rows else None

async def supabase_insert(table: str, rows, on_conflict: str | None = None):
    params = {}
    if on_conflict:
        params["on_conflict"] = on_conflict
    return await supabase_request("POST", table, json=rows, params=params, prefer_representation=True)

async def supabase_update(table: str, filters: dict, values: dict):
    return await supabase_request("PATCH", table, json=values, params=filters, prefer_representation=True)

async def supabase_delete(table: str, filters: dict):
    return await supabase_request("DELETE", table, params=filters)

async def supabase_count(table: str, filters: dict | None = None):
    rows = await supabase_select(table, filters, {"select": "id", "limit": "1"})
    return len(rows)

async def db_find_one(table: str, query: dict):
    if USE_SUPABASE:
        filters = {k: f"eq.{v}" for k, v in query.items()}
        return await supabase_get_one(table, filters)
    return await db[table].find_one(query, {"_id": 0})

async def db_insert_one(table: str, doc: dict):
    if USE_SUPABASE:
        rows = await supabase_insert(table, [doc])
        return rows[0] if rows else None
    return await db[table].insert_one(doc)

async def db_insert_many(table: str, docs: list[dict]):
    if USE_SUPABASE:
        return await supabase_insert(table, docs)
    return await db[table].insert_many(docs)

async def db_update_one(table: str, query: dict, update: dict, upsert: bool = False):
    if USE_SUPABASE:
        values = {}
        if "$set" in update:
            values.update(update["$set"])
        if "$inc" in update:
            existing = await db_find_one(table, query)
            if existing is None:
                if upsert:
                    values.update({k: v for k, v in update.get("$set", {}).items()})
                    for k, v in update.get("$inc", {}).items():
                        values[k] = v
                    merged = {**query, **values}
                    return await db_insert_one(table, merged)
                raise HTTPException(status_code=404, detail="Document not found")
            for k, v in update["$inc"].items():
                values[k] = int(existing.get(k, 0) or 0) + v
        if not values:
            return None
        filters = {k: f"eq.{v}" for k, v in query.items()}
        return await supabase_update(table, filters, values)
    return await db[table].update_one(query, update, upsert=upsert)

async def db_delete_one(table: str, query: dict):
    if USE_SUPABASE:
        filters = {k: f"eq.{v}" for k, v in query.items()}
        return await supabase_delete(table, filters)
    return await db[table].delete_one(query)

async def db_find(table: str, query: dict, projection=None, limit: int = 50, sort: tuple | None = None, extra_params: dict | None = None):
    if USE_SUPABASE:
        filters = {}
        if query:
            for k, v in query.items():
                if isinstance(v, dict) and "$regex" in v:
                    pattern = v["$regex"]
                    if v.get("$options", "").lower() == "i":
                        filters[k] = f"ilike.*{pattern}*"
                    else:
                        filters[k] = f"like.*{pattern}*"
                else:
                    filters[k] = f"eq.{v}"
        params = extra_params.copy() if extra_params else {}
        params["limit"] = str(limit)
        if sort:
            params["order"] = f"{sort[0]}.{sort[1].lower()}"
        return await supabase_select(table, filters, params)
    cursor = db[table].find(query, projection)
    if sort:
        cursor.sort(sort[0], 1 if sort[1].lower() == "asc" else -1)
    return await cursor.to_list(limit)

async def db_count_documents(table: str, query: dict):
    if USE_SUPABASE:
        rows = await supabase_select(table, {k: f"eq.{v}" for k, v in query.items()}, {"select": "id", "limit": "1"})
        return len(rows)
    return await db[table].count_documents(query)

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = FastAPI(title="MeraBazaar API")
api = APIRouter(prefix="/api")

JWT_ALGORITHM = "HS256"


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def iso(dt: datetime) -> str:
    return dt.isoformat()


# ---------------------------------------------------------------------------
# Auth utilities
# ---------------------------------------------------------------------------
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]


def create_access_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": now_utc() + timedelta(hours=8),
        "type": "access",
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": now_utc() + timedelta(days=7),
        "type": "refresh",
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db_find_one("users", {"id": payload["sub"]})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user.pop("password_hash", None)
        user.pop("_id", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


async def require_role(user: dict, roles: list[str]) -> dict:
    if user.get("role") not in roles:
        raise HTTPException(status_code=403, detail="Forbidden")
    return user


def set_auth_cookies(response: Response, access: str, refresh: str) -> None:
    response.set_cookie(
        "access_token", access, httponly=True, secure=True, samesite="none",
        max_age=8 * 3600, path="/",
    )
    response.set_cookie(
        "refresh_token", refresh, httponly=True, secure=True, samesite="none",
        max_age=7 * 24 * 3600, path="/",
    )


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------
class RegisterBody(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    name: str = Field(min_length=1, max_length=80)
    role: Literal["seller", "buyer"] = "seller"
    phone: Optional[str] = None


class LoginBody(BaseModel):
    email: EmailStr
    password: str


class AadhaarInitBody(BaseModel):
    aadhaar_number: str = Field(min_length=12, max_length=12)


class AadhaarVerifyBody(BaseModel):
    aadhaar_number: str
    otp: str


class FssaiBody(BaseModel):
    fssai_number: str


class GstinBody(BaseModel):
    gstin: str


class ListingBody(BaseModel):
    title: str
    title_hi: Optional[str] = ""
    description: str = ""
    description_hi: Optional[str] = ""
    category: str
    price: float
    unit: str = "each"
    pincode: str
    stock: int = 0
    images: List[str] = []


# ---------------------------------------------------------------------------
# Seed
# ---------------------------------------------------------------------------
async def seed_users():
    seeds = [
        {
            "email": os.environ["ADMIN_EMAIL"].lower(),
            "password": os.environ["ADMIN_PASSWORD"],
            "name": "MeraBazaar Admin",
            "role": "admin",
        },
        {
            "email": os.environ["SELLER_EMAIL"].lower(),
            "password": os.environ["SELLER_PASSWORD"],
            "name": "Demo Seller",
            "role": "seller",
        },
    ]
    for s in seeds:
        existing = await db_find_one("users", {"email": s["email"]})
        if existing:
            if not verify_password(s["password"], existing.get("password_hash", "")):
                await db_update_one(
                    "users",
                    {"email": s["email"]},
                    {"$set": {"password_hash": hash_password(s["password"])}},
                )
            continue
        uid = str(uuid.uuid4())
        await db_insert_one("users", {
            "id": uid,
            "email": s["email"],
            "password_hash": hash_password(s["password"]),
            "name": s["name"],
            "role": s["role"],
            "created_at": iso(now_utc()),
            "trust_score": 4.5 if s["role"] == "seller" else 0,
            "identity_verified": s["role"] != "buyer",
            "gov_verified": s["role"] == "seller",
        })


async def seed_listings():
    if await db_count_documents("listings", {}) > 0:
        return
    seller = await db_find_one("users", {"email": os.environ["SELLER_EMAIL"].lower()})
    if not seller:
        return
    samples = [
        {"title": "Handloom Cotton Saree", "title_hi": "हैंडलूम कॉटन साड़ी",
         "description": "Authentic handloom cotton saree, hand-woven by artisans of Varanasi.",
         "description_hi": "वाराणसी के कारीगरों द्वारा बुनी गई प्रामाणिक हैंडलूम साड़ी।",
         "category": "Handloom", "price": 1499, "unit": "each", "pincode": "221001", "stock": 12,
         "images": ["https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&auto=format"]},
        {"title": "Organic Basmati Rice 5kg", "title_hi": "जैविक बासमती चावल 5किलो",
         "description": "Farm-fresh long grain basmati rice, chemical-free.",
         "description_hi": "खेत से ताज़ा लंबे दाने वाला बासमती चावल, रसायन मुक्त।",
         "category": "Kirana", "price": 649, "unit": "5kg pack", "pincode": "110001", "stock": 40,
         "images": ["https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format"]},
        {"title": "Brass Diya Set (12 pcs)", "title_hi": "पीतल दीया सेट (12 नग)",
         "description": "Traditional brass diyas for festivals & pooja.",
         "description_hi": "त्योहारों और पूजा के लिए पारंपरिक पीतल के दीये।",
         "category": "Handicrafts", "price": 899, "unit": "set of 12", "pincode": "302001", "stock": 25,
         "images": ["https://images.unsplash.com/photo-1604608672516-f1b9b1d0f4b8?w=600&auto=format"]},
        {"title": "Cold-Pressed Mustard Oil 1L", "title_hi": "कोल्ड-प्रेस्ड सरसों का तेल 1ली",
         "description": "Pure kachi-ghani mustard oil, cold-pressed for aroma & health.",
         "description_hi": "शुद्ध कच्ची-घानी सरसों तेल, स्वाद और सेहत के लिए।",
         "category": "Food", "price": 299, "unit": "1 litre", "pincode": "560001", "stock": 60,
         "images": ["https://images.unsplash.com/photo-1615486511484-92e172cc4fe0?w=600&auto=format"]},
        {"title": "Home Cleaning Service (2BHK)", "title_hi": "घर सफाई सेवा (2बीएचके)",
         "description": "Deep cleaning by verified professionals. Book in your pincode.",
         "description_hi": "सत्यापित पेशेवरों द्वारा गहरी सफाई। अपने पिनकोड में बुक करें।",
         "category": "Services", "price": 1299, "unit": "per visit", "pincode": "400001", "stock": 999,
         "images": ["https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&auto=format"]},
        {"title": "Pashmina Wool Shawl", "title_hi": "पश्मीना ऊनी शॉल",
         "description": "Handwoven pure pashmina shawl from Kashmir.",
         "description_hi": "कश्मीर से हाथ से बुनी शुद्ध पश्मीना शॉल।",
         "category": "Handloom", "price": 3499, "unit": "each", "pincode": "190001", "stock": 8,
         "images": ["https://images.unsplash.com/photo-1583394293214-28ded15ee548?w=600&auto=format"]},
        {"title": "A2 Desi Cow Ghee 500ml", "title_hi": "A2 देसी गाय घी 500मिली",
         "description": "Traditional bilona-method ghee from grass-fed A2 cows.",
         "description_hi": "घास खाने वाली A2 गायों से पारंपरिक बिलोना विधि का घी।",
         "category": "Food", "price": 849, "unit": "500 ml", "pincode": "302001", "stock": 30,
         "images": ["https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=600&auto=format"]},
        {"title": "Terracotta Planter Set", "title_hi": "टेराकोटा गमला सेट",
         "description": "Hand-crafted terracotta planters, set of 4.",
         "description_hi": "हाथ से बना टेराकोटा गमला, 4 का सेट।",
         "category": "Handicrafts", "price": 599, "unit": "set of 4", "pincode": "700001", "stock": 45,
         "images": ["https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=600&auto=format"]},
    ]
    docs = []
    for s in samples:
        docs.append({
            "id": str(uuid.uuid4()),
            "seller_id": seller["id"],
            "seller_name": seller["name"],
            "seller_verified": True,
            "gov_verified": True,
            "trust_score": 4.5,
            "created_at": iso(now_utc()),
            "whatsapp": "+919999900001",
            "upi_id": "merabazaar@upi",
            **s,
        })
    await db_insert_many("listings", docs)


async def supabase_mirror(collection: str, event: str, doc: dict):
    """Mirror events to Supabase via PostgREST. Falls back to local mongo audit collection.

    Writes to real Supabase tables (users, listings, verifications) when the incoming
    collection matches. Every event is ALSO logged to a `mirror_events` table for auditing.
    Failures are swallowed so the primary Mongo write is never blocked.
    """
    # Always log the mirror event to the active backend store
    await db_insert_one("mirror_events", {
        "id": str(uuid.uuid4()),
        "collection": collection,
        "event": event,
        "payload": {k: v for k, v in doc.items() if k not in ("password_hash", "_id")},
        "created_at": iso(now_utc()),
    })

    supa_url = os.environ.get("SUPABASE_URL")
    supa_key = os.environ.get("SUPABASE_KEY") or os.environ.get("SUPABASE_SECRET_KEY")
    if not supa_url or not supa_key:
        return

    clean = {k: v for k, v in doc.items() if k not in ("password_hash", "_id")}
    headers = {
        "apikey": supa_key,
        "Authorization": f"Bearer {supa_key}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates,return=minimal",
    }

    async def _post(table: str, rows, on_conflict: str = None):
        try:
            async with httpx.AsyncClient(timeout=8.0) as c:
                url = f"{supa_url}/rest/v1/{table}"
                if on_conflict:
                    url += f"?on_conflict={on_conflict}"
                r = await c.post(url, headers=headers, json=rows)
                if r.status_code >= 300:
                    logger.warning("supabase %s %s: %s %s", table, event, r.status_code, r.text[:200])
        except Exception as e:
            logger.warning("supabase %s error: %s", table, e)

    # 1) Always mirror to audit table
    await _post("mirror_events", [{
        "id": str(uuid.uuid4()),
        "collection": collection,
        "event": event,
        "payload": clean,
        "created_at": iso(now_utc()),
    }])

    # 2) Also upsert into typed tables when applicable
    if collection == "users":
        row = {
            "id": clean.get("id"),
            "email": clean.get("email"),
            "name": clean.get("name"),
            "role": clean.get("role"),
            "phone": clean.get("phone"),
            "trust_score": float(clean.get("trust_score") or 0),
            "identity_verified": bool(clean.get("identity_verified")),
            "gov_verified": bool(clean.get("gov_verified")),
            "created_at": clean.get("created_at") or iso(now_utc()),
        }
        await _post("users", [row])
    elif collection == "listings":
        row = {
            "id": clean.get("id"),
            "seller_id": clean.get("seller_id"),
            "seller_name": clean.get("seller_name"),
            "title": clean.get("title"),
            "title_hi": clean.get("title_hi"),
            "category": clean.get("category"),
            "price": float(clean.get("price") or 0),
            "unit": clean.get("unit"),
            "pincode": clean.get("pincode"),
            "stock": int(clean.get("stock") or 0),
            "images": clean.get("images") or [],
            "seller_verified": bool(clean.get("seller_verified")),
            "gov_verified": bool(clean.get("gov_verified")),
            "created_at": clean.get("created_at") or iso(now_utc()),
        }
        await _post("listings", [row])


async def audit(actor_id: Optional[str], action: str, target: str, meta: dict = None):
    await db_insert_one("activity_log", {
        "id": str(uuid.uuid4()),
        "actor_id": actor_id,
        "action": action,
        "target": target,
        "meta": meta or {},
        "created_at": iso(now_utc()),
    })


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@api.get("/")
async def root():
    return {"app": "MeraBazaar", "tagline": "मेरा भरोसेमंद बाज़ार · My Trusted Bazaar", "status": "ok"}


# ------------------ Auth ------------------
@api.post("/auth/register")
async def register(body: RegisterBody, response: Response):
    email = body.email.lower()
    if await db_find_one("users", {"email": email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    uid = str(uuid.uuid4())
    user_doc = {
        "id": uid,
        "email": email,
        "password_hash": hash_password(body.password),
        "name": body.name,
        "role": body.role,
        "phone": body.phone,
        "created_at": iso(now_utc()),
        "trust_score": 0,
        "identity_verified": False,
        "gov_verified": False,
    }
    await db_insert_one("users", user_doc)
    await supabase_mirror("users", "insert", user_doc)
    await audit(uid, "register", "user", {"email": email})
    access = create_access_token(uid, email, body.role)
    refresh = create_refresh_token(uid)
    set_auth_cookies(response, access, refresh)
    user_doc.pop("password_hash", None)
    user_doc.pop("_id", None)
    return {"user": user_doc, "access_token": access}


@api.post("/auth/login")
async def login(body: LoginBody, response: Response, request: Request):
    email = body.email.lower()
    xff = request.headers.get("x-forwarded-for", "")
    ip = xff.split(",")[0].strip() if xff else (request.client.host if request.client else "unknown")
    # Key by email alone so lockout survives k8s replica switching.
    ident = f"email:{email}"

    attempts_doc = await db_find_one("login_attempts", {"identifier": ident})
    if attempts_doc and attempts_doc.get("count", 0) >= 5:
        last = attempts_doc.get("last_at")
        if last:
            last_dt = datetime.fromisoformat(last)
            if now_utc() - last_dt < timedelta(minutes=15):
                raise HTTPException(status_code=429, detail="Too many attempts. Try again later.")

    user = await db_find_one("users", {"email": email})
    if not user or not verify_password(body.password, user.get("password_hash", "")):
        await db_update_one(
            "login_attempts",
            {"identifier": ident},
            {"$inc": {"count": 1}, "$set": {"last_at": iso(now_utc())}},
            upsert=True,
        )
        raise HTTPException(status_code=401, detail="Invalid email or password")

    await db_delete_one("login_attempts", {"identifier": ident})
    access = create_access_token(user["id"], user["email"], user["role"])
    refresh = create_refresh_token(user["id"])
    set_auth_cookies(response, access, refresh)
    await audit(user["id"], "login", "user", {"ip": ip})
    user.pop("password_hash", None)
    user.pop("_id", None)
    return {"user": user, "access_token": access}


@api.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"ok": True}


@api.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return user


# ------------------ Verification (MOCKED) ------------------
@api.post("/verify/aadhaar/init")
async def aadhaar_init(body: AadhaarInitBody, user: dict = Depends(get_current_user)):
    if not re.fullmatch(r"\d{12}", body.aadhaar_number):
        raise HTTPException(status_code=400, detail="Aadhaar must be 12 digits")
    # MOCKED OKYC — otp is always 123456
    await db_update_one(
        "otp_store",
        {"user_id": user["id"], "purpose": "aadhaar"},
        {"$set": {"aadhaar": body.aadhaar_number, "otp": "123456", "created_at": iso(now_utc())}},
        upsert=True,
    )
    await audit(user["id"], "aadhaar.init", "verification")
    return {"ok": True, "message": "OTP sent (MOCK: use 123456)"}


@api.post("/verify/aadhaar/confirm")
async def aadhaar_confirm(body: AadhaarVerifyBody, user: dict = Depends(get_current_user)):
    doc = await db_find_one("otp_store", {"user_id": user["id"], "purpose": "aadhaar"})
    if not doc or doc.get("otp") != body.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    await db_update_one(
        "users",
        {"id": user["id"]},
        {"$set": {"identity_verified": True, "aadhaar_masked": "XXXX-XXXX-" + body.aadhaar_number[-4:]}},
    )
    await db_delete_one("otp_store", {"user_id": user["id"], "purpose": "aadhaar"})
    await audit(user["id"], "aadhaar.confirm", "verification")
    fresh = await db_find_one("users", {"id": user["id"]})
    fresh.pop("password_hash", None)
    fresh.pop("_id", None)
    await supabase_mirror("users", "update", fresh)
    return {"ok": True, "identity_verified": True}


@api.post("/verify/fssai")
async def verify_fssai(body: FssaiBody, user: dict = Depends(get_current_user)):
    # FSSAI numbers are 14 digits
    if not re.fullmatch(r"\d{14}", body.fssai_number):
        raise HTTPException(status_code=400, detail="FSSAI must be 14 digits")
    await db_update_one(
        "users",
        {"id": user["id"]},
        {"$set": {"gov_verified": True, "fssai_number": body.fssai_number, "fssai_status": "VERIFIED"}},
    )
    await audit(user["id"], "fssai.verify", "verification", {"fssai": body.fssai_number})
    fresh = await db_find_one("users", {"id": user["id"]})
    fresh.pop("password_hash", None)
    fresh.pop("_id", None)
    await supabase_mirror("users", "update", fresh)
    return {"ok": True, "status": "VERIFIED", "kind": "FSSAI"}


@api.post("/verify/gstin")
async def verify_gstin(body: GstinBody, user: dict = Depends(get_current_user)):
    # GSTIN is 15 chars: 2 digit state + 10 char PAN + 1 digit + Z + 1 char
    if not re.fullmatch(r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9A-Z]{1}Z[0-9A-Z]{1}$", body.gstin.upper()):
        raise HTTPException(status_code=400, detail="Invalid GSTIN format")
    gstin = body.gstin.upper()
    await db_update_one(
        "users",
        {"id": user["id"]},
        {"$set": {"gov_verified": True, "gstin": gstin, "gstin_status": "VERIFIED"}},
    )
    await audit(user["id"], "gstin.verify", "verification", {"gstin": gstin})
    fresh = await db_find_one("users", {"id": user["id"]})
    fresh.pop("password_hash", None)
    fresh.pop("_id", None)
    await supabase_mirror("users", "update", fresh)
    return {"ok": True, "status": "VERIFIED", "kind": "GSTIN"}


# ------------------ Listings ------------------
@api.get("/listings")
async def list_listings(
    pincode: Optional[str] = None,
    category: Optional[str] = None,
    q: Optional[str] = None,
    limit: int = 50,
):
    query = {}
    if pincode:
        # near-pincode: first 3 digits match
        query["pincode"] = {"$regex": f"^{pincode[:3]}"}
    if category and category.lower() != "all":
        query["category"] = category
    if q:
        query["$or"] = [
            {"title": {"$regex": q, "$options": "i"}},
            {"title_hi": {"$regex": q, "$options": "i"}},
            {"description": {"$regex": q, "$options": "i"}},
        ]
    docs = await db_find("listings", query, {"_id": 0}, limit=limit)
    return docs


@api.get("/listings/{listing_id}")
async def get_listing(listing_id: str):
    doc = await db_find_one("listings", {"id": listing_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Listing not found")
    return doc


@api.post("/listings")
async def create_listing(body: ListingBody, user: dict = Depends(get_current_user)):
    await require_role(user, ["seller", "admin"])
    if user.get("role") == "seller" and not user.get("identity_verified"):
        raise HTTPException(status_code=403, detail="Complete Aadhaar verification first")
    doc = {
        "id": str(uuid.uuid4()),
        "seller_id": user["id"],
        "seller_name": user.get("name", ""),
        "seller_verified": bool(user.get("identity_verified")),
        "gov_verified": bool(user.get("gov_verified")),
        "trust_score": float(user.get("trust_score") or 4.2),
        "created_at": iso(now_utc()),
        "whatsapp": user.get("phone") or "+919999900001",
        "upi_id": "merabazaar@upi",
        **body.model_dump(),
    }
    await db_insert_one("listings", doc)
    await supabase_mirror("listings", "insert", doc)
    await audit(user["id"], "listing.create", "listing", {"id": doc["id"]})
    doc.pop("_id", None)
    return doc


@api.get("/seller/listings")
async def my_listings(user: dict = Depends(get_current_user)):
    await require_role(user, ["seller", "admin"])
    docs = await db_find("listings", {"seller_id": user["id"]}, limit=200)
    return docs


@api.get("/activity")
async def activity(user: dict = Depends(get_current_user), limit: int = 50):
    q = {} if user.get("role") == "admin" else {"actor_id": user["id"]}
    docs = await db_find("activity_log", q, limit=limit, sort=("created_at", "desc"))
    return docs


# ---------------------------------------------------------------------------
# Startup / include
# ---------------------------------------------------------------------------
@app.on_event("startup")
async def on_startup():
    if not USE_SUPABASE and db is not None:
        await db.users.create_index("email", unique=True)
        await db.listings.create_index("pincode")
        await db.listings.create_index("category")
        await db.login_attempts.create_index("identifier")
    await seed_users()
    await seed_listings()


@app.on_event("shutdown")
async def on_shutdown():
    if client is not None:
        client.close()


app.include_router(api)

_cors_origins = os.environ.get("CORS_ORIGINS", "*").split(",")
_wildcard = "*" in _cors_origins
app.add_middleware(
    CORSMiddleware,
    allow_credentials=not _wildcard,  # browsers reject credentials with wildcard origins
    allow_origins=_cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("merabazaar")
