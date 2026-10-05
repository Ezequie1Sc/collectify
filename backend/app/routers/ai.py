from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.ai_service import ai_service
from app.supabase import supabase


# =========================================================
# ROUTER
# =========================================================

router = APIRouter(
    prefix="/ai",
    tags=["AI"]
)


# =========================================================
# AI REQUEST
# =========================================================

class AIRequest(BaseModel):

    question: str


# =========================================================
# AI RESPONSE
# =========================================================

class AIResponse(BaseModel):

    question: str

    answer: str


# =========================================================
# SUPPLIER REQUEST
# =========================================================

class SupplierRequest(BaseModel):

    product: str

    category: str | None = None

    location: str | None = None


# =========================================================
# SUPPLIER RESULT
# =========================================================

class SupplierResult(BaseModel):

    name: str

    description: str

    category: str

    location: str

    website: str | None = None

    rating: float = 0

    relevance: float = 0

    verified: bool = False

    tags: list[str] = []


# =========================================================
# SUPPLIER RESPONSE
# =========================================================

class SupplierResponse(BaseModel):

    product: str

    category: str | None = None

    location: str | None = None

    query: str

    total_results: int

    answer: str

    results: list[SupplierResult]


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

        .eq(
            "is_active",
            True
        )

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

        .order(
            "created_at",
            desc=True
        )

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

        str(product["id"]):
            product

        for product in products

    }


    # -----------------------------------------------------
    # SALE MAP
    # -----------------------------------------------------

    sale_map = {

        str(sale["id"]):
            sale

        for sale in sales

    }


    # -----------------------------------------------------
    # SALES FOR AI
    # -----------------------------------------------------

    sales_for_ai = []


    for item in sale_items:

        product = product_map.get(
            str(
                item.get(
                    "product_id"
                )
            )
        )

        sale = sale_map.get(
            str(
                item.get(
                    "sale_id"
                )
            )
        )


        if not product:

            continue


        sales_for_ai.append({

            "product_name":
                product.get(
                    "name"
                ),

            "category":
                product.get(
                    "category"
                ),

            "quantity":
                item.get(
                    "quantity",
                    0
                ),

            "unit_price":
                item.get(
                    "unit_price",
                    0
                ),

            "subtotal":
                item.get(
                    "subtotal",
                    0
                ),

            "sale_id":
                item.get(
                    "sale_id"
                ),

            "ticket_number":
                (
                    sale.get(
                        "ticket_number"
                    )
                    if sale
                    else None
                ),

            "created_at":
                (
                    sale.get(
                        "created_at"
                    )
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
async def analyze(
    request: AIRequest
):

    question = request.question.strip()


    if not question:

        raise HTTPException(

            status_code=400,

            detail=
                "La pregunta no puede estar vacía."

        )


    # -----------------------------------------------------
    # DATABASE
    # -----------------------------------------------------

    try:

        products, sales = \
            build_ai_data()

    except Exception as error:

        print(
            "[AI] Supabase error:",
            repr(error)
        )

        raise HTTPException(

            status_code=500,

            detail=
                "No se pudieron obtener los datos "
                "de Collectify."

        ) from error


    # -----------------------------------------------------
    # CHECK PRODUCTS
    # -----------------------------------------------------

    if not products:

        raise HTTPException(

            status_code=404,

            detail=
                "No hay productos activos disponibles "
                "para realizar el análisis."

        )


    # -----------------------------------------------------
    # PROMPT
    # -----------------------------------------------------

    prompt = ai_service.build_prompt(

        question=
            question,

        products=
            products,

        sales=
            sales

    )


    # -----------------------------------------------------
    # AI
    # -----------------------------------------------------

    try:

        answer = await ai_service.analyze(
            prompt
        )

    except Exception as error:

        print(
            "[AI] OpenRouter error:",
            repr(error)
        )

        raise HTTPException(

            status_code=502,

            detail=
                f"No se pudo obtener respuesta "
                f"de la IA: {error}"

        ) from error


    return {

        "question":
            question,

        "answer":
            answer

    }


# =========================================================
# SEARCH SUPPLIERS
# =========================================================

@router.post(
    "/suppliers",
    response_model=SupplierResponse
)
async def search_suppliers(
    request: SupplierRequest
):

    # -----------------------------------------------------
    # PRODUCT
    # -----------------------------------------------------

    product = request.product.strip()


    if not product:

        raise HTTPException(

            status_code=400,

            detail=
                "El producto es obligatorio."

        )


    # -----------------------------------------------------
    # CATEGORY
    # -----------------------------------------------------

    category = (

        request.category.strip()

        if request.category

        else None

    )


    # -----------------------------------------------------
    # LOCATION
    # -----------------------------------------------------

    location = (

        request.location.strip()

        if request.location

        else "México"

    )


    # -----------------------------------------------------
    # QUERY
    # -----------------------------------------------------

    search_query = (

        f"proveedores de {product}, "

        f"categoría {category or 'general'}, "

        f"ubicación {location}"

    )


    print(
        "\n=================================================="
    )

    print(
        "[SUPPLIERS] Nueva búsqueda"
    )

    print(
        "[SUPPLIERS] Producto:",
        product
    )

    print(
        "[SUPPLIERS] Categoría:",
        category
    )

    print(
        "[SUPPLIERS] Ubicación:",
        location
    )

    print(
        "[SUPPLIERS] Query:",
        search_query
    )

    print(
        "==================================================\n"
    )


    # -----------------------------------------------------
    # AI + WEB SEARCH
    # -----------------------------------------------------

    try:

        result = await ai_service.search_suppliers(

            product=
                product,

            category=
                category,

            location=
                location

        )

    except Exception as error:

        print(
            "\n[SUPPLIERS] ERROR:"
        )

        print(
            repr(error)
        )

        print(
            "==============================\n"
        )


        raise HTTPException(

            status_code=502,

            detail=
                f"No se pudo realizar la búsqueda "
                f"de proveedores: {error}"

        ) from error


    # -----------------------------------------------------
    # RESULTS
    # -----------------------------------------------------

    raw_results = result.get(
        "results",
        []
    )


    results: list[
        SupplierResult
    ] = []


    for item in raw_results:

        try:

            results.append(

                SupplierResult(

                    name=
                        item.get(
                            "name",
                            ""
                        ),

                    description=
                        item.get(
                            "description",
                            ""
                        ),

                    category=
                        item.get(
                            "category",
                            category or "Proveedor"
                        ),

                    location=
                        item.get(
                            "location",
                            location
                        ),

                    website=
                        item.get(
                            "website"
                        ),

                    rating=
                        float(
                            item.get(
                                "rating",
                                0
                            )
                        ),

                    relevance=
                        float(
                            item.get(
                                "relevance",
                                0
                            )
                        ),

                    verified=
                        bool(
                            item.get(
                                "verified",
                                False
                            )
                        ),

                    tags=
                        item.get(
                            "tags",
                            []
                        )

                )

            )

        except Exception as error:

            print(
                "[SUPPLIERS] Resultado inválido:",
                item,

                "ERROR:",
                repr(error)
            )


    # -----------------------------------------------------
    # RESPONSE
    # -----------------------------------------------------

    response = SupplierResponse(

        product=
            product,

        category=
            category,

        location=
            location,

        query=
            search_query,

        total_results=
            len(results),

        answer=
            str(
                result.get(
                    "answer",
                    ""
                )
            ),

        results=
            results

    )


    print(
        "[SUPPLIERS] Resultados:",
        len(results)
    )


    return response
