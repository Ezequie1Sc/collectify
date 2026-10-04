from fastapi import APIRouter, HTTPException
from app.models import ProductCreate, ProductUpdate
from app.supabase import supabase

router = APIRouter(prefix="/products", tags=["Products"])

@router.get("")
def get_all_products():
    try:
        response = (supabase.table("products").select("*").eq("is_active", True).order("created_at", desc=True).execute())
        return {"data": response.data or []}
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"No se pudieron cargar los productos: {error}") from error

@router.post("")
def create_product(product: ProductCreate):
    data = product.model_dump(mode="json")
    data["is_active"] = True
    try:
        response = supabase.table("products").insert(data).execute()
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"No se pudo crear el producto: {error}") from error
    if not response.data:
        raise HTTPException(status_code=500, detail="No se pudo crear el producto.")
    return {"data": response.data[0]}

@router.patch("/{product_id}")
def update_product(product_id: str, product: ProductUpdate):
    data = product.model_dump(mode="json", exclude_unset=True)
    if not data:
        raise HTTPException(status_code=400, detail="No se proporcionaron datos para actualizar.")
    try:
        response = supabase.table("products").update(data).eq("id", product_id).execute()
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"No se pudo actualizar el producto: {error}") from error
    if not response.data:
        raise HTTPException(status_code=404, detail="Producto no encontrado.")
    return {"data": response.data[0]}

@router.delete("/{product_id}")
def delete_product(product_id: str):
    try:
        response = supabase.table("products").select("*").eq("id", product_id).execute()
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"No se pudo consultar el producto: {error}") from error
    if not response.data:
        raise HTTPException(status_code=404, detail="Producto no encontrado.")
    record = response.data[0]
    if not record.get("is_active", True):
        raise HTTPException(status_code=400, detail="El producto ya está inactivo.")
    try:
        related_response = supabase.table("sale_items").select("id").eq("product_id", product_id).limit(1).execute()
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"No se pudieron comprobar las asociaciones del producto: {error}") from error
    has_related = bool(related_response.data)
    try:
        if has_related:
            response = supabase.table("products").update({"is_active": False}).eq("id", product_id).execute()
        else:
            response = supabase.table("products").delete().eq("id", product_id).execute()
    except Exception as error:
        action = "desactivar" if has_related else "eliminar"
        raise HTTPException(status_code=500, detail=f"No se pudo {action} el producto: {error}") from error
    if not response.data:
        raise HTTPException(status_code=500, detail="No se pudo completar la operación del producto.")
    return {
        "message": "El producto tiene ventas asociadas y fue desactivado para conservar el historial de ventas." if has_related else "Producto eliminado correctamente.",
        "deleted": not has_related,
        "deactivated": has_related,
        "data": response.data[0],
    }

@router.get("/{owner_id}")
def get_products(owner_id: str):
    try:
        response = (supabase.table("products").select("*").eq("owner_id", owner_id).eq("is_active", True).order("created_at", desc=True).execute())
        return {"data": response.data or []}
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"No se pudieron cargar los productos: {error}") from error
