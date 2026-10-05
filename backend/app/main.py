from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import (
    ai,
    earnings,
    partners,
    products,
    sales,
    suppliers
)


app = FastAPI(
    title="Collectify API",
    version="0.1.0"
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:4200",
        "http://127.0.0.1:4200",
        "https://collectify-7xcu.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# ROUTERS
# =========================================================

app.include_router(products.router)
app.include_router(sales.router)
app.include_router(earnings.router)
app.include_router(partners.router)
app.include_router(ai.router)
app.include_router(suppliers.router)


# =========================================================
# ROOT
# =========================================================

@app.get(
    "/",
    tags=["Root"]
)
def root():

    return {
        "message": "Collectify API funcionando",
        "version": "0.1.0"
    }


# =========================================================
# HEALTH CHECK
# =========================================================

@app.get(
    "/health",
    tags=["Health"]
)
def health():

    return {
        "status": "healthy",
        "service": "collectify-api",
        "version": "0.1.0"
    }
