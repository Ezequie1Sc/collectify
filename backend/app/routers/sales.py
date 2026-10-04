from fastapi import APIRouter, HTTPException
from app.models import SaleCreate
from app.supabase import supabase

router = APIRouter(prefix="/sales", tags=["Sales"])

@router.post("")
def create_sale(sale: SaleCreate):
    total = 0
    total_cost = 0
    sale_items = []
    products_to_update = []
    if not sale.partner_id:
        raise HTTPException(status_code=400, detail="Debes seleccionar un socio.")
    try:
        response = supabase.table("partners").select("*").eq("id", str(sale.partner_id)).eq("is_active", True).execute()
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"No se pudo consultar el socio: {error}") from error
    if not response.data:
        raise HTTPException(status_code=404, detail="Socio no encontrado o inactivo.")
    partner = response.data[0]
    for item in sale.items:
        try:
            response = (supabase.table("products").select("*").eq("id", str(item.product_id)).eq("owner_id", str(item.owner_id)).eq("is_active", True).execute())
        except Exception as error:
            raise HTTPException(status_code=500, detail=f"No se pudo consultar el producto: {error}") from error
        if not response.data:
            raise HTTPException(status_code=404, detail=f"Producto no encontrado o inactivo: {item.product_id}")
        product = response.data[0]
        if product["stock"] < item.quantity:
            raise HTTPException(status_code=400, detail=f"Stock insuficiente para '{product['name']}'. Disponible: {product['stock']}, solicitado: {item.quantity}")
        unit_price = float(product["price"])
        cost = float(product["cost"] or 0)
        subtotal = unit_price * item.quantity
        total += subtotal
        total_cost += cost * item.quantity
        sale_items.append({"product_id": str(product["id"]), "owner_id": str(product["owner_id"]), "quantity": item.quantity, "unit_price": unit_price, "subtotal": subtotal})
        products_to_update.append({"id": str(product["id"]), "new_stock": product["stock"] - item.quantity})
    try:
        response = supabase.table("sales").insert({"seller_id": str(sale.seller_id), "partner_id": str(sale.partner_id), "total": total}).execute()
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"No se pudo crear la venta: {error}") from error
    if not response.data:
        raise HTTPException(status_code=500, detail="No se pudo crear la venta.")
    created_sale = response.data[0]
    for item in sale_items:
        item["sale_id"] = created_sale["id"]
    try:
        items_response = supabase.table("sale_items").insert(sale_items).execute()
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"No se pudieron registrar los productos de la venta: {error}") from error
    for product in products_to_update:
        try:
            supabase.table("products").update({"stock": product["new_stock"]}).eq("id", product["id"]).execute()
        except Exception as error:
            raise HTTPException(status_code=500, detail=f"No se pudo actualizar el stock: {error}") from error
    return {"sale": created_sale, "partner": partner, "items": items_response.data, "summary": {"total": total, "cost": total_cost, "profit": total - total_cost}}
