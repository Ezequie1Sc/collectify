from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import (
    ai,
    earnings,
    partners,
    products,
    sales
)


app = FastAPI(
    title="Collectify API",
    version="0.1.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:4200",
        "http://127.0.0.1:4200"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(products.router)
app.include_router(sales.router)
app.include_router(earnings.router)
app.include_router(partners.router)
app.include_router(ai.router)


@app.get("/", tags=["Root"])
def root():

    return {
        "message": "Collectify API funcionando",
        "version": "0.1.0"
    }