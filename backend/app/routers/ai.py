from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.ai_service import ai_service
from app.supabase import supabase


router = APIRouter(
    prefix="/ai",
    tags=["AI"]
)


# =========================================================
# REQUEST
# =========================================================

class AIRequest(BaseModel):
    question: str


# =========================================================
# RESPONSE
# =========================================================

class AIResponse(BaseModel):
    question: str
    answer: str


# =========================================================
# GET PRODUCTS
# =========================================================

def get_products() -> list[dict[str, Any]]:

    response = (
        supabase
        .table("products")
        .select(
            "id, name, description, category, sku, "
            "price, cost, stock, is_active"
        )
        .eq("is_active", True)
        .execute()
    )

    return response.data or []


# =========================================================
# GET SALES
# =========================================================

def get_sales() -> list[dict[str, Any]]:

    response = (
        supabase
        .table("sales")
        .select(
            "id, ticket_number, seller_id, total, created_at"
        )
        .order("created_at", desc=True)
        .execute()
    )

    return response.data or []


# =========================================================
# GET SALE ITEMS
# =========================================================

def get_sale_items() -> list[dict[str, Any]]:

    response = (
        supabase
        .table("sale_items")
        .select(
            "id, sale_id, product_id, owner_id, "
            "quantity, unit_price, subtotal"
        )
        .execute()
    )

    return response.data or []


# =========================================================
# BUILD AI DATA
# =========================================================

def build_ai_data():

    products = get_products()
    sales = get_sales()
    sale_items = get_sale_items()

    # -----------------------------------------------------
    # PRODUCT MAP
    # -----------------------------------------------------

    product_map = {
        str(product["id"]): product
        for product in products
    }

    # -----------------------------------------------------
    # SALE MAP
    # -----------------------------------------------------

    sale_map = {
        str(sale["id"]): sale
        for sale in sales
    }

    # -----------------------------------------------------
    # SALES FOR AI
    # -----------------------------------------------------

    sales_for_ai = []

    for item in sale_items:

        product = product_map.get(
            str(item.get("product_id"))
        )

        sale = sale_map.get(
            str(item.get("sale_id"))
        )

        if not product:
            continue

        sales_for_ai.append({

            "product_name": product.get("name"),

            "category": product.get("category"),

            "quantity": item.get("quantity", 0),

            "unit_price": item.get("unit_price", 0),

            "subtotal": item.get("subtotal", 0),

            "sale_id": item.get("sale_id"),

            "ticket_number": (
                sale.get("ticket_number")
                if sale
                else None
            ),

            "created_at": (
                sale.get("created_at")
                if sale
                else None
            )

        })

    return products, sales_for_ai


# =========================================================
# ANALYZE
# =========================================================

@router.post(
    "/analyze",
    response_model=AIResponse
)
async def analyze(request: AIRequest):

    # -----------------------------------------------------
    # VALIDATE QUESTION
    # -----------------------------------------------------

    question = request.question.strip()

    if not question:

        raise HTTPException(
            status_code=400,
            detail="La pregunta no puede estar vacía."
        )

    # -----------------------------------------------------
    # GET REAL DATA FROM SUPABASE
    # -----------------------------------------------------

    try:

        products, sales = build_ai_data()

    except Exception as error:

        print(
            "[AI] Supabase error:",
            error
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "No se pudieron obtener los datos "
                f"de Collectify: {error}"
            )
        ) from error

    # -----------------------------------------------------
    # CHECK DATA
    # -----------------------------------------------------

    if not products:

        raise HTTPException(
            status_code=404,
            detail=(
                "No hay productos activos disponibles "
                "para realizar el análisis."
            )
        )

    # -----------------------------------------------------
    # BUILD PROMPT
    # -----------------------------------------------------

    prompt = ai_service.build_prompt(
        question=question,
        products=products,
        sales=sales
    )

    # -----------------------------------------------------
    # ASK AI
    # -----------------------------------------------------

    try:

        answer = await ai_service.analyze(
            prompt
        )

    except Exception as error:

        print(
            "[AI] OpenRouter error:",
            error
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "No se pudo obtener una respuesta "
                f"de la IA: {error}"
            )
        ) from error

    # -----------------------------------------------------
    # RESPONSE
    # -----------------------------------------------------

    return {
        "question": question,
        "answer": answer
    }