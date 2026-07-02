from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import re
import uuid
import logging
import bcrypt
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
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

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
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
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
        existing = await db.users.find_one({"email": s["email"]})
        if existing:
            if not verify_password(s["password"], existing.get("password_hash", "")):
                await db.users.update_one(
                    {"email": s["email"]},
                    {"$set": {"password_hash": hash_password(s["password"])}},
                )
            continue
        uid = str(uuid.uuid4())
        await db.users.insert_one({
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
    if await db.listings.count_documents({}) > 0:
        return
    seller = await db.users.find_one({"email": os.environ["SELLER_EMAIL"].lower()})
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
    await db.listings.insert_many(docs)


async def supabase_mirror(collection: str, event: str, doc: dict):
    """MOCKED Supabase mirror — writes to a local audit collection instead."""
    await db.mirror_events.insert_one({
        "id": str(uuid.uuid4()),
        "collection": collection,
        "event": event,
        "payload": {k: v for k, v in doc.items() if k != "password_hash"},
        "created_at": iso(now_utc()),
    })


async def audit(actor_id: Optional[str], action: str, target: str, meta: dict = None):
    await db.activity_log.insert_one({
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
    if await db.users.find_one({"email": email}):
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
    await db.users.insert_one(user_doc)
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

    attempts_doc = await db.login_attempts.find_one({"identifier": ident})
    if attempts_doc and attempts_doc.get("count", 0) >= 5:
        last = attempts_doc.get("last_at")
        if last:
            last_dt = datetime.fromisoformat(last)
            if now_utc() - last_dt < timedelta(minutes=15):
                raise HTTPException(status_code=429, detail="Too many attempts. Try again later.")

    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user.get("password_hash", "")):
        await db.login_attempts.update_one(
            {"identifier": ident},
            {"$inc": {"count": 1}, "$set": {"last_at": iso(now_utc())}},
            upsert=True,
        )
        raise HTTPException(status_code=401, detail="Invalid email or password")

    await db.login_attempts.delete_one({"identifier": ident})
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
    await db.otp_store.update_one(
        {"user_id": user["id"], "purpose": "aadhaar"},
        {"$set": {"aadhaar": body.aadhaar_number, "otp": "123456", "created_at": iso(now_utc())}},
        upsert=True,
    )
    await audit(user["id"], "aadhaar.init", "verification")
    return {"ok": True, "message": "OTP sent (MOCK: use 123456)"}


@api.post("/verify/aadhaar/confirm")
async def aadhaar_confirm(body: AadhaarVerifyBody, user: dict = Depends(get_current_user)):
    doc = await db.otp_store.find_one({"user_id": user["id"], "purpose": "aadhaar"})
    if not doc or doc.get("otp") != body.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"identity_verified": True, "aadhaar_masked": "XXXX-XXXX-" + body.aadhaar_number[-4:]}},
    )
    await db.otp_store.delete_one({"user_id": user["id"], "purpose": "aadhaar"})
    await audit(user["id"], "aadhaar.confirm", "verification")
    await supabase_mirror("users", "update", {"id": user["id"], "identity_verified": True})
    return {"ok": True, "identity_verified": True}


@api.post("/verify/fssai")
async def verify_fssai(body: FssaiBody, user: dict = Depends(get_current_user)):
    # FSSAI numbers are 14 digits
    if not re.fullmatch(r"\d{14}", body.fssai_number):
        raise HTTPException(status_code=400, detail="FSSAI must be 14 digits")
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"gov_verified": True, "fssai_number": body.fssai_number, "fssai_status": "VERIFIED"}},
    )
    await audit(user["id"], "fssai.verify", "verification", {"fssai": body.fssai_number})
    await supabase_mirror("users", "update", {"id": user["id"], "gov_verified": True})
    return {"ok": True, "status": "VERIFIED", "kind": "FSSAI"}


@api.post("/verify/gstin")
async def verify_gstin(body: GstinBody, user: dict = Depends(get_current_user)):
    # GSTIN is 15 chars: 2 digit state + 10 char PAN + 1 digit + Z + 1 char
    if not re.fullmatch(r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9A-Z]{1}Z[0-9A-Z]{1}$", body.gstin.upper()):
        raise HTTPException(status_code=400, detail="Invalid GSTIN format")
    gstin = body.gstin.upper()
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"gov_verified": True, "gstin": gstin, "gstin_status": "VERIFIED"}},
    )
    await audit(user["id"], "gstin.verify", "verification", {"gstin": gstin})
    await supabase_mirror("users", "update", {"id": user["id"], "gov_verified": True})
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
    docs = await db.listings.find(query, {"_id": 0}).limit(limit).to_list(limit)
    return docs


@api.get("/listings/{listing_id}")
async def get_listing(listing_id: str):
    doc = await db.listings.find_one({"id": listing_id}, {"_id": 0})
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
    await db.listings.insert_one(doc)
    await supabase_mirror("listings", "insert", doc)
    await audit(user["id"], "listing.create", "listing", {"id": doc["id"]})
    doc.pop("_id", None)
    return doc


@api.get("/seller/listings")
async def my_listings(user: dict = Depends(get_current_user)):
    await require_role(user, ["seller", "admin"])
    docs = await db.listings.find({"seller_id": user["id"]}, {"_id": 0}).to_list(200)
    return docs


@api.get("/activity")
async def activity(user: dict = Depends(get_current_user), limit: int = 50):
    q = {} if user.get("role") == "admin" else {"actor_id": user["id"]}
    docs = await db.activity_log.find(q, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    return docs


# ---------------------------------------------------------------------------
# Startup / include
# ---------------------------------------------------------------------------
@app.on_event("startup")
async def on_startup():
    await db.users.create_index("email", unique=True)
    await db.listings.create_index("pincode")
    await db.listings.create_index("category")
    await db.login_attempts.create_index("identifier")
    await seed_users()
    await seed_listings()


@app.on_event("shutdown")
async def on_shutdown():
    client.close()


app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("merabazaar")
